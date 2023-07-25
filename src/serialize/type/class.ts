import { Modfile } from "../..";
import { Serializer } from "../module";

export const SerializeClassDeclaration: Serializer<Modfile.classDeclaration> = {
	name: "Class",
	id: 2,
	write: (declaration, bitbuffer) => {
		bitbuffer.writeString(declaration.properties.name);
	},
	decode: (modfile, buffer) => {
		let name = buffer.readString();

		let declaration: Modfile.classDeclaration = {
			attachments: [],
			properties: {
				name: name,
			},
		};

		modfile.class_declarations.push(declaration);
		return declaration;
	},
};
