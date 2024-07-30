import BitBuffer from "@rbxts/bitbuffer";
import { Modfile } from "..";
import { SerializeAttachmentDeclaration } from "./type/attachment";
import { SerializeClassDeclaration } from "./type/class";
import { SerializeInstanceDeclaration } from "./type/instance";
import { SerializeMetadataDeclaration } from "./type/metadata";
import { SerializeMapDeclaration } from "./type/map";

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
	SerializeMapDeclaration,
];

export function WRITE_MODULE<T>(module: Serializer<T>, buffer: BitBuffer, data: T) {
	buffer.writeUnsigned(4, module.id);
	module.write(data, buffer);
}

export function DECODE_MODULE<T>(file: Modfile.file, buffer: BitBuffer): boolean | undefined {
	let id = buffer.readUnsigned(4);

	if (!id) return;

	let serializer = serializers.find((value) => value.id === id);
	if (!serializer) throw `invalid module ID ${id}`;

	serializer.decode(file, buffer);

	return true;
}
