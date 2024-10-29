import { Deadline, Modfile } from "../..";
import { Serializer } from "../module";
import { SerializeId } from "../types";

export const SerializeMapDeclaration: Serializer<{
	properties: Deadline.gameMapProperties;
	instance_id: number;
}> = {
	name: "Map",
	id: SerializeId.Map,
	write: (declaration, bitbuffer) => {
		bitbuffer.writeString(declaration.properties.name);
		bitbuffer.writeString(declaration.properties.code);
		bitbuffer.writeUInt16(declaration.instance_id);
		bitbuffer.writeString(declaration.properties.description);
		bitbuffer.writeString(declaration.properties.lighting_preset);
		bitbuffer.writeString(declaration.properties.sound_preset);
		bitbuffer.writeUInt16(declaration.properties.lamps.on_time);
		bitbuffer.writeUInt16(declaration.properties.lamps.off_time);
		bitbuffer.writeString(declaration.properties.images.thumbnail_day);
		bitbuffer.writeString(declaration.properties.images.thumbnail_night);
		bitbuffer.writeString(declaration.properties.minimap.image);
		bitbuffer.writeUInt16(declaration.properties.minimap.size);
	},
	decode: (modfile, bitbuffer) => {
		let name = bitbuffer.readString();
		let code = bitbuffer.readString();
		let instance_id = bitbuffer.readUInt16();
		let description = bitbuffer.readString();
		let lighting_preset = bitbuffer.readString();
		let sound_preset = bitbuffer.readString();
		let lamps_on_time = bitbuffer.readUInt16();
		let lamps_off_time = bitbuffer.readUInt16();
		let thumbnail_day = bitbuffer.readString();
		let thumbnail_night = bitbuffer.readString();
		let image = bitbuffer.readString();
		let size = bitbuffer.readUInt16();

		let declaration: Modfile.mapDeclaration = {
			properties: {
				name,
				code,
				description,
				lighting_preset,
				sound_preset,
				lamps: {
					on_time: lamps_on_time,
					off_time: lamps_off_time,
				},
				images: {
					thumbnail_day,
					thumbnail_night,
				},
				minimap: {
					image,
					size,
				},
			},
			instance_id: instance_id,
		};

		modfile.map_declarations.push(declaration);
		return declaration;
	},
};
