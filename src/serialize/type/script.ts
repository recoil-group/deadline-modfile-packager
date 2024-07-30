import { HttpService } from "@rbxts/services";
import { Deadline, Modfile } from "../..";
import { Serializer } from "../module";

// serializes the metadata about an attachment declaration
export const SerializeScriptDeclaration: Serializer<Modfile.scriptDeclaration> = {
	name: "AutorunScript",
	id: 6,
	write: (declaration, bitbuffer) => {
		bitbuffer.writeString(declaration.source);
	},
	decode: (modfile, buffer) => {
		modfile.script_declarations.push({
			source: buffer.readString(),
		});

		return modfile;
	},
};
