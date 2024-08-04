import { Modfile } from "../..";
import { INSTANCE_ID_TAG } from "../../util/constants";
import { INSTANCE_CLASS_MAP, INSTANCE_PROPERTY_MAP, instanceClass } from "../instance_map";
import { Serializer } from "../module";
import { decode_instance_property, write_instance_property } from "../property/decode_property";
import { InstanceReferenceSerialization } from "../property/InstanceReferenceSerialization";

type whatever = { [index: string]: any };

type serializeWritableData = {
	saved_property_values: Map<number, unknown>;
	instances: Array<{ declaration: Modfile.instanceDeclaration; property_map: Map<string, number> }>;
};

function find_in_map(map: Map<number, unknown>, value: unknown) {
	for (const [index, map_value] of map) {
		if (map_value === value) return index;
	}

	return undefined;
}

function add_instance(data_to_write: serializeWritableData, declaration: Modfile.instanceDeclaration) {
	const property_map = new Map<string, number>();
	const instance = declaration.instance;
	const class_name = instance.ClassName as instanceClass;

	let properties_to_write = { Name: "string", ...INSTANCE_PROPERTY_MAP[class_name] };
	if (!properties_to_write) throw `can't serialize: unsupported instance type: ${instance.ClassName}`;

	let default_instance = new Instance(class_name as keyof CreatableInstances);

	// optimize: only write properties that are different from the default instance
	for (const [___index] of pairs(properties_to_write)) {
		const index = ___index as string;

		const value_to_save = (instance as whatever)[index] as never;
		if (value_to_save === (default_instance as whatever)[index]) continue;

		const existing_cached_value = find_in_map(data_to_write.saved_property_values, value_to_save);
		if (existing_cached_value !== undefined) {
			property_map.set(index, existing_cached_value);
		} else {
			let new_cached_index = data_to_write.saved_property_values.size();
			data_to_write.saved_property_values.set(new_cached_index, value_to_save);
			property_map.set(index, new_cached_index);
		}
	}

	default_instance.Destroy();
	data_to_write.instances.push({ declaration, property_map });

	for (const [_, value] of pairs(instance.GetChildren())) {
		add_instance(data_to_write, {
			position: {
				kind: "child",
				parent_id: declaration.position.instance_id,
				instance_id: value.GetAttribute(INSTANCE_ID_TAG) as number,
			},
			instance: value,
		});
	}
}

export const SerializeInstanceDeclaration: Serializer<Modfile.instanceDeclaration> = {
	name: "Instance",
	id: 4,
	write: (start_declaration, buffer) => {
		// optimization: write everything to a reference list to save space on duplicate data
		const data_to_write: serializeWritableData = {
			saved_property_values: new Map(),
			instances: [],
		};

		add_instance(data_to_write, start_declaration);

		buffer.writeUInt32(data_to_write.saved_property_values.size());
		for (let i = 0; i < data_to_write.saved_property_values.size(); i++) {
			write_instance_property(buffer, data_to_write.saved_property_values.get(i));
		}

		buffer.writeUInt32(data_to_write.instances.size());
		for (const [_, { declaration, property_map }] of pairs(data_to_write.instances)) {
			const { instance, position } = declaration;

			// write id
			buffer.writeBits(position.kind === "attachment_root" ? 1 : 0);
			buffer.writeUInt16(position.parent_id);
			buffer.writeUInt16(position.instance_id);

			// optimization: index to the class instead of the class itself
			buffer.writeUInt8(INSTANCE_CLASS_MAP.findIndex((value) => value === instance.ClassName));

			// write attributes
			let attributes = instance.GetAttributes();
			let attribute_count = 0;

			for (const [key] of attributes) {
				if (key === INSTANCE_ID_TAG) continue;
				attribute_count += 1;
			}

			// cba to support anything other than string
			buffer.writeUnsigned(5, attribute_count);
			for (const [key, value] of attributes) {
				if (key === INSTANCE_ID_TAG) continue;
				buffer.writeString(key);
				buffer.writeString(tostring(value));
			}

			// write tags
			let tags = instance.GetTags() as string[];

			// cba to support anything other than string
			buffer.writeUnsigned(5, tags.size());
			for (const tag of tags) buffer.writeString(tag);

			buffer.writeUnsigned(5, property_map.size());
			for (const [key, value] of pairs(property_map)) {
				buffer.writeString(key);
				buffer.writeUInt16(value);
			}
		}
	},
	decode: (modfile, buffer) => {
		const data_to_read: serializeWritableData = {
			saved_property_values: new Map(),
			instances: [],
		};

		const saved_size = buffer.readUInt32();
		for (let i = 0; i < saved_size; i++) {
			let value = decode_instance_property(buffer);
			print(i, value);
			data_to_read.saved_property_values.set(i, value);
		}

		const size = buffer.readUInt32();
		for (let i = 0; i < size; i++) {
			// read id
			let [parent_type] = buffer.readBits(1);
			let parent_id = buffer.readUInt16();
			let instance_id = buffer.readUInt16();

			// read class
			let class_name_index = buffer.readUInt8();
			let class_name = INSTANCE_CLASS_MAP[class_name_index];

			// read attributes
			let attribute_count = buffer.readUnsigned(5);
			let attributes: { [index: string]: string } = {};

			for (let i = 0; i < attribute_count; i++) {
				let key = buffer.readString();
				let value = buffer.readString();
				attributes[key] = value;
			}

			// read tags
			let tags: string[] = [];
			let tag_count = buffer.readUnsigned(5);

			for (let i = 0; i < tag_count; i++) {
				tags.push(buffer.readString());
			}

			// read properties
			let property_map = new Map<string, number>();
			let property_count = buffer.readUnsigned(5);

			for (let i = 0; i < property_count; i++) {
				let key = buffer.readString();
				let value = buffer.readUInt16();
				property_map.set(key, value);
			}

			const instance = new Instance(class_name as keyof CreatableInstances);

			for (const [key, value] of pairs(attributes)) instance.SetAttribute(key as string, value);
			for (const [_, value] of pairs(tags)) instance.AddTag(value);
			for (const [index, value] of pairs(property_map)) {
				let saved_value = data_to_read.saved_property_values.get(value);

				if (typeIs(saved_value, "table") && ((saved_value as whatever).__IS_INSTANCE as number)) {
					InstanceReferenceSerialization.schedule_instance_set(
						instance,
						index,
						(saved_value as whatever).__IS_INSTANCE,
					);
				} else {
					(instance as whatever)[index] = saved_value;
				}
			}

			InstanceReferenceSerialization.add_instance_to_cache(instance, instance_id);

			const position: Modfile.instanceDeclaration["position"] = {
				instance_id,
				parent_id,
				kind: parent_type ? "attachment_root" : "child",
			};

			instance.SetAttribute("__kind", position.parent_id);
			instance.SetAttribute("__instance_id", position.instance_id);
			instance.SetAttribute("__parent_id", position.parent_id);

			modfile.instance_declarations.push({
				instance,
				position,
			});
		}
	},
};
