import { HttpService } from "@rbxts/services";
import { Deadline, Modfile } from "../..";
import { Serializer } from "../module";
import { SerializeId } from "../types";

export const SerializeLightingPresetDeclaration: Serializer<{
	data: unknown;
	name: string;
}> = {
	name: "Lighting",
	id: SerializeId.Lighting,
	write: (declaration, bitbuffer) => {
		bitbuffer.writeString(declaration.name);
		bitbuffer.writeString(HttpService.JSONEncode(declaration.data));
	},
	decode: (modfile, bitbuffer) => {
		modfile.lighting_preset_declarations.push({
			name: bitbuffer.readString(),
			data: HttpService.JSONDecode(bitbuffer.readString()),
		});
	},
};
