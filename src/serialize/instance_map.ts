import { supportedEncoderValueType } from "./property/decode_property";

type propertyData = { [index: string]: supportedEncoderValueType } | undefined;

// MASSIVE TODO
// This map was made originally because I didn't want to include additional dependencies
// and to have control over what gets exported for security
// but it's getting kind of annoying
// https://pastebin.com/raw/TFSU2s5e todo

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
	CastShadow: "boolean",
};

const LIGHT: propertyData = {
	Brightness: "number",
	Color: "Color3",
	Range: "number",
};

export const INSTANCE_CLASS_MAP = [
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
	"PointLight",
	"SpotLight",
	"SurfaceLight",
	"ParticleEmitter",
	"Trail",
	"Beam",
	"Fire",
	"Decal",
	"BlockMesh",
	"Sound",
	"StringValue",
	"IntValue",
	"BoolValue",
] as const;

export type instanceClass = (typeof INSTANCE_CLASS_MAP)[number];

export const INSTANCE_PROPERTY_MAP: { [index in instanceClass]: propertyData } = {
	// replacement for MeshParts
	SpecialMesh: {
		TextureId: "string",
		MeshId: "string",
		MeshType: "EnumItem",
		Offset: "Vector3",
		Scale: "Vector3",
		VertexColor: "Color3",
	},

	BlockMesh: {
		VertexColor: "Color3",
		Offset: "Vector3",
		Scale: "Vector3",
	},

	Model: {},
	Folder: {},

	Part: {
		...BASEPART,
		Shape: "EnumItem",
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

	StringValue: {
		Value: "string",
	},

	BoolValue: {
		Value: "boolean",
	},

	IntValue: {
		Value: "number",
	},

	SurfaceGui: {
		ZOffset: "number",
		Face: "EnumItem",
		PixelsPerStud: "number",
		LightInfluence: "number",
		SizingMode: "EnumItem",
		AlwaysOnTop: "boolean",
		Active: "boolean",
		Adornee: "Instance",
		Enabled: "boolean",
		MaxDistance: "number",
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
		TextScaled: "boolean",
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
		Face: "EnumItem",
	},
	PointLight: {
		...LIGHT,
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
		Face: "EnumItem",
		Transparency: "number",
		ZIndex: "number",
	},
	Attachment: {
		Visible: "boolean",
		CFrame: "CFrame",
	},
	UICorner: {},
	WeldConstraint: {
		Part0: "Instance",
		Part1: "Instance",
	},
	Beam: {},
	Fire: {},
	ParticleEmitter: {
		Brightness: "number",
		FlipbookFramerate: "NumberRange",
		FlipbookMode: "EnumItem",
		FlipbookStartRandom: "boolean",
		Color: "ColorSequence",
		LightEmission: "number",
		LightInfluence: "number",
		Orientation: "EnumItem",
		Size: "NumberSequence",
		Squash: "NumberSequence",
		Texture: "string",
		Transparency: "NumberSequence",
		ZOffset: "number",

		EmissionDirection: "EnumItem",
		Enabled: "boolean",
		Lifetime: "NumberSequence",
		Rate: "number",
		Rotation: "NumberRange",
		RotSpeed: "NumberRange",
		Speed: "NumberRange",
		SpreadAngle: "NumberRange",

		Shape: "EnumItem",
		ShapeInOut: "EnumItem",
		ShapeStyle: "EnumItem",

		FlipbookLayout: "EnumItem",
		Acceleration: "Vector3",
		Drag: "number",
		LockedToPart: "boolean",
		TimeScale: "number",
		VelocityInheritance: "number",
		WindAffectsDrag: "boolean",
	},
	Trail: {
		Color: "ColorSequence",
		LightEmission: "number",
		LightInfluence: "number",
		Texture: "string",
		TextureLength: "number",
		TextureMode: "EnumItem",
		ZOffset: "number",

		Enabled: "boolean",
		Lifetime: "NumberRange",
		MinLength: "number",
		MaxLength: "number",
		WidthScale: "NumberSequence",
		VelocityScale: "number",
	},
	Sound: {
		SoundId: "string",
		RollOffMaxDistance: "number",
		RollOffMinDistance: "number",
		RollOffMode: "EnumItem",
		Looped: "boolean",
		PlaybackRegionsEnabled: "boolean",
		PlaybackSpeed: "number",
		Playing: "boolean",
		TimePosition: "number",
		Volume: "number",
	},
};
