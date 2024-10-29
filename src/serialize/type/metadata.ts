import { Modfile } from "../..";
import { Serializer } from "../module";
import { SerializeId } from "../types";

export const SerializeMetadataDeclaration: Serializer<Modfile.metadataDeclaration> = {
	name: "Metadata",
	id: SerializeId.Metadata,
	write: (declaration, buffer) => {
		buffer.writeString(declaration.name);
		buffer.writeString(declaration.description);
		buffer.writeString(declaration.author);
		buffer.writeString(declaration.image);
	},
	decode: (modfile, buffer) => {
		let declaration: Modfile.metadataDeclaration = {
			name: buffer.readString(),
			description: buffer.readString(),
			author: buffer.readString(),
			image: buffer.readString(),
		};

		modfile.info = declaration;
		return declaration;
	},
};
