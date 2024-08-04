import { HttpService } from "@rbxts/services";
import { Deadline, Modfile } from "../..";
import { Serializer } from "../module";

// serializes the metadata about an attachment declaration
export const SerializeAttachmentDeclaration: Serializer<Modfile.attachmentDeclaration> = {
	name: "Attachment",
	id: 1,
	write: (declaration, bitbuffer) => {
		bitbuffer.writeString(declaration.properties.name);
		bitbuffer.writeString(declaration.parent_class);
		bitbuffer.writeUInt16(declaration.instance_id);

		let properties = HttpService.JSONEncode(declaration.properties);
		let runtime_properties = HttpService.JSONEncode(declaration.runtime_properties);

		bitbuffer.writeString(properties);
		bitbuffer.writeString(runtime_properties);
	},
	decode: ({ class_declarations }, buffer) => {
		let name = buffer.readString();
		let parent = buffer.readString();
		let instance_id = buffer.readUInt16();

		let properties = buffer.readString();
		let runtime_properties = buffer.readString();

		let attachment_declaration: Modfile.attachmentDeclaration = {
			parent_class: parent,
			instance_id,
			properties: HttpService.JSONDecode(properties) as Deadline.attachmentProperties,
			runtime_properties: HttpService.JSONDecode(runtime_properties) as Deadline.runtimeAttachmentProperties,
		};

		let class_declaration = class_declarations.find(({ properties }) => properties.name === parent);

		if (!class_declaration) throw `attachment ${name} has no parent class declared`;

		class_declaration.attachments.push(attachment_declaration);
	},
};
