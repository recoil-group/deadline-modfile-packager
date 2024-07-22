import { supportedEncoderValueType } from "./property/decode_property";

type propertyData = { [index: string]: supportedEncoderValueType } | undefined;

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

export const INSTANCE_CLASS_MAP = [
	"Base",
	"SpecialMesh",
	"Model",
	"Folder",
	"Part",
	"WedgePart",
	"Motor6D",
	"SurfaceGui",
	"Frame",
	"CanvasGroup",
	"ImageLabel",
	"TextLabel",
	"Texture",
	"Attachment",
	"UICorner",
	"WeldConstraint",
] as const;

export type instanceClass = (typeof INSTANCE_CLASS_MAP)[number];

export const INSTANCE_PROPERTY_MAP: { [index in instanceClass]: propertyData } = {
	Base: {
		Name: "string",
	},

	// replacement for MeshParts
	SpecialMesh: {
		TextureId: "string",
		MeshId: "string",
		Scale: "Vector3",
	},

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
	Attachment: {},
	UICorner: {},
	WeldConstraint: {
		Part0: "Instance",
		Part1: "Instance",
	},
};
