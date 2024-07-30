import BitBuffer from "@rbxts/bitbuffer";
import { ENCODE_VALUE_IDS, INDEX_IDS } from "./decoding_properties";
import { InstanceReferenceSerialization } from "./InstanceReferenceSerialization";
import { INSTANCE_ID_TAG } from "../../util/constants";

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

// BitBuffer implementation of this is buggy
function write_cframe(buffer: BitBuffer, value: CFrame) {
	const [x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22] = value.GetComponents();

	buffer.writeByte(0);
	buffer.writeFloat32(x);
	buffer.writeFloat32(y);
	buffer.writeFloat32(z);
	buffer.writeFloat32(r00);
	buffer.writeFloat32(r01);
	buffer.writeFloat32(r02);
	buffer.writeFloat32(r10);
	buffer.writeFloat32(r11);
	buffer.writeFloat32(r12);
	buffer.writeFloat32(r20);
	buffer.writeFloat32(r21);
	buffer.writeFloat32(r22);
}

const string_is_encode_id = (value: unknown): value is supportedEncoderValueType => {
	return typeIs(value, "string") && ENCODE_VALUE_IDS[value as supportedEncoderValueType] !== undefined;
};

const ENCODING_FUNCTIONS: {
	[index in supportedEncoderValueType]?: [
		integrity_check: (value: unknown) => boolean,
		write: (buffer: BitBuffer, value: unknown) => void,
		read: (buffer: BitBuffer, index: string, instance: Instance & forceIndex<any>) => void,
	];
} = {
	string: [
		(value) => typeIs(value, "string"),
		(buffer, value) => buffer.writeString(value as string),
		(buffer, index, instance) => (instance[index] = buffer.readString()),
	],
	boolean: [
		(value) => typeIs(value, "boolean"),
		(buffer, value) => buffer.writeBits(value ? 1 : 0),
		(buffer, index, instance) => (instance[index] = buffer.readBits(1)[0] === 1 ? true : false),
	],
	number: [
		(value) => typeIs(value, "number"),
		(buffer, value) => buffer.writeFloat32(value as number),
		(buffer, index, instance) => (instance[index] = buffer.readFloat32()),
	],
	CFrame: [
		(value) => typeIs(value, "CFrame"),
		(buffer, value) => {
			// Sometimes writing the CFrame breaks somehow on the first byte written.
			// This is a problem with the bitbuffer implementation, but from what I've seen
			// each one has quirks and my homemade one doesn't serialize CFrames
			// Instead try to do it in the conservative way and if it fails just do it in the naive way

			let [success] = pcall(() => {
				buffer.writeCFrame(value as CFrame);
			});

			if (!success) {
				warn("failed to write CFrame with axis aligned flag, writing without it");
				write_cframe(buffer, value as CFrame);
			}
		},
		(buffer, index, instance) => (instance[index] = buffer.readCFrame()),
	],
	UDim2: [
		(value) => typeIs(value, "UDim2"),
		(buffer, value) => buffer.writeUDim2(value as UDim2),
		(buffer, index, instance) => (instance[index] = buffer.readUDim2()),
	],
	EnumItem: [
		(value) => typeIs(value, "EnumItem"),
		(buffer, value) => buffer.writeEnum(value as Enum),
		(buffer, index, instance) => (instance[index] = buffer.readEnum()),
	],
	Vector3: [
		(value) => typeIs(value, "Vector3"),
		(buffer, value) => buffer.writeVector3(value as Vector3),
		(buffer, index, instance) => (instance[index] = buffer.readVector3()),
	],
	Vector2: [
		(value) => typeIs(value, "Vector2"),
		(buffer, value) => buffer.writeVector2(value as Vector2),
		(buffer, index, instance) => (instance[index] = buffer.readVector2()),
	],
	Color3: [
		(value) => typeIs(value, "Color3"),
		(buffer, value) => {
			let color = value as Color3;
			buffer.writeUInt8(math.round(color.R * 255));
			buffer.writeUInt8(math.round(color.G * 255));
			buffer.writeUInt8(math.round(color.B * 255));
		},
		(buffer, index, instance) =>
			(instance[index] = new Color3(
				buffer.readUInt8() / 255,
				buffer.readUInt8() / 255,
				buffer.readUInt8() / 255,
			)),
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
		(buffer, index, instance) => {
			InstanceReferenceSerialization.schedule_instance_set(instance, index, buffer.readUInt16());
		},
	],
};

export const encode_instance_property = (
	buffer: BitBuffer,
	index: string,
	value_type: supportedEncoderValueType,
	value: unknown,
) => {
	let shortcut_index = INDEX_IDS[index];
	buffer.writeUInt16(ENCODE_VALUE_IDS[value_type]);
	buffer.writeString(shortcut_index ? tostring(shortcut_index) : index);

	const encode_function = ENCODING_FUNCTIONS[value_type];

	if (!encode_function) {
		warn(`can't encode value of type ${value_type}`);
	} else if (!encode_function[0](value)) {
		warn(`type mismatch for Instance.${index}: ${tostring(value)} is not ${value_type}`);
	} else {
		encode_function[1](buffer, value);
	}
};

export const decode_instance_property = (buffer: BitBuffer, instance: Instance) => {
	let id = buffer.readUInt16();
	let index = buffer.readString();
	let actual_index = index;
	for (const [index, value] of pairs(INDEX_IDS)) {
		if (tostring(value) === actual_index) {
			actual_index = index as unknown as string;
			break;
		}
	}

	let value_id: string = "";

	for (const [index, value] of pairs(ENCODE_VALUE_IDS)) {
		if (value === id) {
			value_id = index;
			break;
		}
	}

	if (!value_id) throw `invalid property ID ${id}, buffer is out of order`;
	if (!string_is_encode_id(value_id)) throw `invalid property ID ${id} (${value_id}), buffer is out of order`;

	const encode_function = ENCODING_FUNCTIONS[value_id];
	if (!encode_function) throw `can't decode value of type ${value_id}, buffer is out of order`;

	encode_function[2](buffer, actual_index, instance);
};
