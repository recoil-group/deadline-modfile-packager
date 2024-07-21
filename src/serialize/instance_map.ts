import { supportedEncoderValueType } from "./property/decode_property";

type propertyData = { [index: string]: supportedEncoderValueType } | undefined;

// TODO do this procedurally
const GUI_OBJECT: propertyData = {
	Position: "UDim2",
	Size: "UDim2",
	AnchorPoint: "Vector2",
	BackgroundColor3: "Color3",
	BackgroundTransparency: "number",
};

const BASEPART: propertyData = {
	Transparency: "number",
	Reflectance: "number",
	Material: "EnumItem",
	Anchored: "boolean",
	CFrame: "CFrame",
	Color: "Color3",
	CollisionGroup: "string",
	CanQuery: "boolean",
	CanTouch: "boolean",
	CanCollide: "boolean",
	Locked: "boolean",
	Size: "Vector3",
};

const LIGHT: propertyData = {
	Brightness: "number",
	Color: "Color3",
	Range: "number",
};

export const INSTANCE_PROPERTY_MAP: { [index: string]: propertyData } = {
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
	Folder: {},

	Part: {
		...BASEPART,
	},
	WedgePart: {
		...BASEPART,
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
		...GUI_OBJECT,
	},
	CanvasGroup: {
		...GUI_OBJECT,
	},
	ImageLabel: {
		...GUI_OBJECT,
		ImageColor3: "Color3",
		Image: "string",
	},
	TextLabel: {
		...GUI_OBJECT,
		TextColor3: "Color3",
		Text: "string",
		TextSize: "number",
		TextWrapped: "boolean",
	},
	Texture: {
		Color3: "Color3",
		OffsetStudsU: "number",
		OffsetStudsV: "number",
		StudsPerTileU: "number",
		StudsPerTileV: "number",
		Texture: "string",
		Transparency: "number",
		ZIndex: "number",
	},
	PointLight: {
		...LIGHT,
		Face: "EnumItem",
	},
	SpotLight: {
		...LIGHT,
		Face: "EnumItem",
		Angle: "number",
	},
	SurfaceLight: {
		...LIGHT,
		Face: "EnumItem",
		Angle: "number",
	},
	Decal: {
		Color3: "Color3",
		Texture: "string",
		Transparency : "number",
		ZIndex: "number",
	},
	Attachment: {},
	UICorner: {},
	WeldConstraint: {
		Part0: "Instance",
		Part1: "Instance",
	},

};
