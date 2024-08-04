import BitBuffer from "@rbxts/bitbuffer";

export const write_cframe: {
	write: (this: void, source: BitBuffer, cf: CFrame) => void;
	read: (this: void, source: BitBuffer) => CFrame;
};
