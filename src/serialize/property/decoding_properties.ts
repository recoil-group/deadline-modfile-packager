import { supportedEncoderValueType } from "./decode_property";

export const ENCODE_VALUE_IDS: { [index in supportedEncoderValueType]: number } = {
	string: 0,
	boolean: 1,
	number: 2,
	CFrame: 3,
	EnumItem: 4,
	Vector3: 5,
	Instance: 6,
	Color3: 7,
	UDim2: 8,
	Vector2: 9,
};

export const INDEX_IDS: { [index: string]: number | undefined } = {
	TextureID: 0,
	MeshId: 1,
	Scale: 2,
	Transparency: 3,
	Reflectance: 4,
	Material: 5,
	Anchored: 6,
	CFrame: 7,
	Size: 8,
	Color3: 9,
};
