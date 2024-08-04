import BitBuffer from "@rbxts/bitbuffer";
import { ENCODE_VALUE_IDS, INDEX_IDS } from "./decoding_properties";
import { InstanceReferenceSerialization } from "./InstanceReferenceSerialization";
import { INSTANCE_ID_TAG } from "../../util/constants";
import { write_cframe } from "./util/write_cframe";

export type supportedEncoderValueType =
	| "string"
	| "boolean"
	| "number"
	| "CFrame"
	| "EnumItem"
	| "Vector3"
	| "Instance"
	| "UDim2"
	| "Color3"
	| "Vector2";

export type forceIndex<T> = { [index: string]: T };

const string_is_encode_id = (value: unknown): value is supportedEncoderValueType => {
	return typeIs(value, "string") && ENCODE_VALUE_IDS[value as supportedEncoderValueType] !== undefined;
};

type encodingFunction = [
	integrity_check: (value: unknown) => boolean,
	write: (buffer: BitBuffer, value: unknown) => void,
	read: (buffer: BitBuffer) => unknown,
];

const ENCODING_FUNCTIONS: {
	[index in supportedEncoderValueType]?: encodingFunction;
} = {
	string: [
		(value) => typeIs(value, "string"),
		(buffer, value) => buffer.writeString(value as string),
		(buffer) => buffer.readString(),
	],
	boolean: [
		(value) => typeIs(value, "boolean"),
		(buffer, value) => buffer.writeBits(value ? 1 : 0),
		(buffer) => (buffer.readBits(1)[0] === 1 ? true : false),
	],
	number: [
		(value) => typeIs(value, "number"),
		(buffer, value) => buffer.writeFloat16(value as number),
		(buffer) => buffer.readFloat16(),
	],
	CFrame: [
		(value) => typeIs(value, "CFrame"),
		(buffer, value) => {
			write_cframe.write(buffer, value as CFrame);
		},
		(buffer) => write_cframe.read(buffer),
	],
	UDim2: [
		(value) => typeIs(value, "UDim2"),
		(buffer, value) => buffer.writeUDim2(value as UDim2),
		(buffer) => buffer.readUDim2(),
	],
	EnumItem: [
		(value) => typeIs(value, "EnumItem"),
		(buffer, value) => buffer.writeEnum(value as Enum),
		(buffer) => buffer.readEnum(),
	],
	Vector3: [
		(value) => typeIs(value, "Vector3"),
		(buffer, value) => buffer.writeVector3(value as Vector3),
		(buffer) => buffer.readVector3(),
	],
	Vector2: [
		(value) => typeIs(value, "Vector2"),
		(buffer, value) => buffer.writeVector2(value as Vector2),
		(buffer) => buffer.readVector2(),
	],
	Color3: [
		(value) => typeIs(value, "Color3"),
		(buffer, value) => {
			let color = value as Color3;
			buffer.writeUInt8(math.round(color.R * 255));
			buffer.writeUInt8(math.round(color.G * 255));
			buffer.writeUInt8(math.round(color.B * 255));
		},
		(buffer) => new Color3(buffer.readUInt8() / 255, buffer.readUInt8() / 255, buffer.readUInt8() / 255),
	],
	Instance: [
		(value) => typeIs(value, "Instance"),
		(buffer, value) => {
			let instance = value as Instance;
			let instance_id = instance.GetAttribute(INSTANCE_ID_TAG);

			if (instance_id === undefined) throw "no instance id found when serialziing";
			if (!typeIs(instance_id, "number")) throw "invalid instance id when serializing";

			buffer.writeUInt16(instance_id);
		},
		(buffer) => ({
			__IS_INSTANCE: buffer.readUInt16(),
		}),
		// InstanceReferenceSerialization.schedule_instance_set(instance, index, buffer.readUInt16());
	],
};

export const write_instance_property = (buffer: BitBuffer, value: unknown) => {
	let encode_function: encodingFunction | undefined;
	let encode_id: number | undefined;
	for (const [index, data] of pairs(ENCODING_FUNCTIONS)) {
		if (data[0](value)) {
			encode_function = data;
			encode_id = ENCODE_VALUE_IDS[index];

			break;
		}
	}

	if (!encode_function || encode_id === undefined) {
		warn(`can't encode value '${tostring(value)}' (${typeOf(value)})`);
		return;
	}

	const [test_integrity, write, read] = encode_function;

	buffer.writeUInt8(encode_id);
	write(buffer, value);
};

export const decode_instance_property = (buffer: BitBuffer): unknown => {
	let id = buffer.readUInt8();
	let value_id: string = "";

	for (const [index, value] of pairs(ENCODE_VALUE_IDS)) {
		if (value !== id) continue;

		value_id = index;
		break;
	}

	if (!value_id) throw `invalid property ID ${id}, buffer is out of order`;
	if (!string_is_encode_id(value_id)) throw `invalid property ID ${id} (${value_id}), buffer is out of order`;

	const encode_function = ENCODING_FUNCTIONS[value_id];
	if (!encode_function) throw `can't decode value of type ${value_id}, buffer is out of order`;

	return encode_function[2](buffer);
};
