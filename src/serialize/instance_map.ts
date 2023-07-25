import { supportedEncoderValueType } from "./property/decode_property";

export const INSTANCE_PROPERTY_MAP: {
	[index: string]: { [index: string]: supportedEncoderValueType } | undefined;
} = {
	Base: {
		Name: "string",
	},

	// replacement for MeshParts
	SpecialMesh: {
		TextureId: "string",
		MeshId: "string",
		Scale: "Vector3",
	},

	// MeshPart: {
	// 	TextureID: "string",
	// 	MeshId: "string",
	// },

	Model: {},

	Part: {
		Transparency: "number",
		Reflectance: "number",
		Material: "EnumItem",
		Anchored: "boolean",
		CFrame: "CFrame",
		Size: "Vector3",
	},

	Motor6D: {
		C0: "CFrame",
		C1: "CFrame",
		Part0: "Instance",
		Part1: "Instance",
	},

	SurfaceGui: {
		ZOffset: "number",
		Face: "EnumItem",
	},
	Frame: {
		Position: "UDim2",
		Size: "UDim2",
		AnchorPoint: "Vector2",
		BackgroundColor3: "Color3",
		BackgroundTransparency: "number",
	},
	CanvasGroup: {
		Position: "UDim2",
		Size: "UDim2",
		AnchorPoint: "Vector2",
		BackgroundColor3: "Color3",
		BackgroundTransparency: "number",
	},
	ImageLabel: {
		Position: "UDim2",
		Size: "UDim2",
		AnchorPoint: "Vector2",
		BackgroundColor3: "Color3",
		BackgroundTransparency: "number",
		ImageColor3: "Color3",
		Image: "string",
	},
	UICorner: {},
	WeldConstraint: {
		Part0: "Instance",
		Part1: "Instance",
	},
};
