import { Modfile } from "../..";
import { INSTANCE_ID_TAG } from "../../util/constants";
import { INSTANCE_PROPERTY_MAP } from "../instance_map";
import { Serializer } from "../module";
import { decode_instance_property, encode_instance_property, forceIndex } from "../property/decode_property";
import { InstanceReferenceSerialization } from "../property/InstanceReferenceSerialization";

export const SerializeInstanceDeclaration: Serializer<Modfile.instanceDeclaration> = {
	name: "Instance",
	id: 5,
	write: ({ instance, position }, buffer) => {
		print("serializing", instance.GetFullName());

		let properties_to_write = INSTANCE_PROPERTY_MAP[instance.ClassName];
		if (!properties_to_write) throw `can't serialize: unsupported instance type: ${instance.ClassName}`;

		// write id
		{
			print(`writing instance id ${position.instance_id}`);
			buffer.writeUnsigned(1, position.kind === "attachment_root" ? 1 : 0);
			buffer.writeUInt16(position.parent_id);
			buffer.writeUInt16(position.instance_id);
		}

		// write general info
		{
			buffer.writeString(instance.ClassName);
			buffer.writeString(instance.Name);
		}

		// write properties
		let property_count = 0;
		for (const [] of pairs(properties_to_write)) property_count += 1;

		buffer.writeUInt8(property_count);
		for (const [index, value] of pairs(properties_to_write)) {
			encode_instance_property(
				buffer,
				index as string,
				value,
				(instance as unknown as forceIndex<string>)[index],
			);
		}

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
		let parent_type = buffer.readUnsigned(1);
		let parent_id = buffer.readUInt16();
		let instance_id = buffer.readUInt16();

		let class_name = buffer.readString();
		let name = buffer.readString();

		let properties_to_write = INSTANCE_PROPERTY_MAP[class_name];
		if (!properties_to_write) throw `can't decode: unsupported instance type: ${class_name}`;

		let instance = new Instance(class_name as keyof CreatableInstances);
		instance.Name = name;

		InstanceReferenceSerialization.add_instance_to_cache(instance, instance_id);

		let property_count = buffer.readUInt8();
		print(`decoding ${class_name} ${name} ID ${instance_id} with ${property_count} properties`);
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
