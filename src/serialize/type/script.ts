import { HttpService } from "@rbxts/services";
import { Deadline, Modfile } from "../..";
import { Serializer } from "../module";
import { SerializeId } from "../types";

// serializes the metadata about an attachment declaration
export const SerializeScriptDeclaration: Serializer<Modfile.scriptDeclaration> = {
	name: "AutorunScript",
	id: SerializeId.Script,
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
