import { Modfile } from "../..";
import { INSTANCE_ID_TAG } from "../../util/constants";
import { INSTANCE_CLASS_MAP, INSTANCE_PROPERTY_MAP, instanceClass } from "../instance_map";
import { Serializer } from "../module";
import { decode_instance_property, encode_instance_property, forceIndex } from "../property/decode_property";
import { InstanceReferenceSerialization } from "../property/InstanceReferenceSerialization";

type whatever = { [index: string]: any };

export const SerializeInstanceDeclaration: Serializer<Modfile.instanceDeclaration> = {
	name: "Instance",
	id: 4,
	write: ({ instance, position }, buffer) => {
		let properties_to_write = INSTANCE_PROPERTY_MAP[instance.ClassName as instanceClass];
		if (!properties_to_write) throw `can't serialize: unsupported instance type: ${instance.ClassName}`;

		// write id
		{
			buffer.writeByte(position.kind === "attachment_root" ? 1 : 0);
			buffer.writeUInt16(position.parent_id);
			buffer.writeUInt16(position.instance_id);
		}

		// write general info
		{
			// optimization: index to the class instead of the class itself
			const index = INSTANCE_CLASS_MAP.findIndex((value) => value === instance.ClassName);
			buffer.writeUInt8(index);

			const use_simple_name = instance.Name === instance.ClassName || instance.Name === "";
			buffer.writeBits(use_simple_name ? 1 : 0);
			if (!use_simple_name) buffer.writeString(instance.Name);
		}

		// write attributes
		{
			let attributes = instance.GetAttributes();
			let attribute_count = 0;

			for (const [key] of attributes) {
				if (key === INSTANCE_ID_TAG) continue;
				attribute_count += 1;
			}

			// cba to support anything other than string
			buffer.writeUInt8(attribute_count);
			for (const [key, value] of attributes) {
				if (key === INSTANCE_ID_TAG) continue;
				buffer.writeString(key);
				buffer.writeString(tostring(value));
			}
		}

		// write properties
		let default_instance = new Instance(instance.ClassName as keyof CreatableInstances);
		let property_count = 0;
		let property_list: string[] = [];

		// optimize: only write properties that are different from the default instance
		for (const [_index] of pairs(properties_to_write)) {
			const index = _index as string;

			if ((instance as whatever)[index] === (default_instance as whatever)[index]) continue;
			property_count += 1;
			property_list.push(index);
		}

		buffer.writeUInt8(property_count);
		for (const [_, index] of pairs(property_list)) {
			encode_instance_property(
				buffer,
				index,
				properties_to_write[index],
				(instance as unknown as forceIndex<string>)[index],
			);
		}

		default_instance.Destroy();

		// write children
		for (const [_, value] of pairs(instance.GetChildren())) {
			buffer.writeUInt8(SerializeInstanceDeclaration.id);
			SerializeInstanceDeclaration.write(
				{
					position: {
						kind: "child",
						parent_id: position.instance_id,
						instance_id: value.GetAttribute(INSTANCE_ID_TAG) as number,
					},
					instance: value,
				},
				buffer,
			);
		}
	},
	decode: (modfile, buffer) => {
		let parent_type = buffer.readByte();
		let parent_id = buffer.readUInt16();
		let instance_id = buffer.readUInt16();
		let class_name_index = buffer.readUInt8();

		let [simple_name] = buffer.readBits(1);
		let name = "unnamed";
		if (!simple_name) name = buffer.readString();

		let attributes: { [index: string]: string } = {};
		let attribute_count = buffer.readUInt8();
		for (let i = 0; i < attribute_count; i++) {
			let key = buffer.readString();
			let value = buffer.readString();
			attributes[key] = value;
		}

		let class_name = INSTANCE_CLASS_MAP[class_name_index];
		let properties_to_write = INSTANCE_PROPERTY_MAP[class_name as instanceClass];
		if (!properties_to_write) throw `can't decode: unsupported instance type index: ${class_name_index}`;

		let instance = new Instance(class_name as keyof CreatableInstances);
		instance.Name = name;

		for (const [key, value] of pairs(attributes)) instance.SetAttribute(key as string, value);

		InstanceReferenceSerialization.add_instance_to_cache(instance, instance_id);

		let property_count = buffer.readUInt8();
		for (let i = 0; i < property_count; i++) decode_instance_property(buffer, instance);

		let position: Modfile.instanceDeclaration["position"] = {
			kind: parent_type ? "attachment_root" : "child",
			instance_id: instance_id,
			parent_id: parent_id,
		};

		instance.SetAttribute("__kind", position.kind);
		instance.SetAttribute("__instance_id", instance_id);
		instance.SetAttribute("__parent_id", parent_id);

		let declaration = {
			position,
			instance,
		};

		modfile.instance_declarations.push(declaration);
		return declaration;
	},
};
