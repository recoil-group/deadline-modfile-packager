import BitBuffer from "@rbxts/bitbuffer";
import { Modfile } from "..";
import { SerializeAttachmentDeclaration } from "./type/attachment";
import { SerializeClassDeclaration } from "./type/class";
import { SerializeInstanceDeclaration } from "./type/instance";
import { SerializeMetadataDeclaration } from "./type/metadata";

export type Serializer<T> = {
	write: (arg: T, buffer: BitBuffer) => void;
	decode: (data: Modfile.file, buffer: BitBuffer) => void;
	name: string;
	id: number; // must be unique
};

let serializers = [
	SerializeAttachmentDeclaration,
	SerializeClassDeclaration,
	SerializeMetadataDeclaration,
	SerializeInstanceDeclaration,
];

export function WRITE_MODULE<T>(module: Serializer<T>, buffer: BitBuffer, data: T) {
	buffer.writeUInt8(module.id);
	module.write(data, buffer);
}

export function DECODE_MODULE<T>(file: Modfile.file, buffer: BitBuffer): boolean | undefined {
	let id = buffer.readUInt8();

	if (id) {
		let serializer = serializers.find((value) => value.id === id);
		if (!serializer) throw `invalid module ID ${id}`;

		print("parsing", serializer.name);
		serializer.decode(file, buffer);

		return true;
	}
}
