type base64 = {
	decode(this: void, q: buffer): buffer;
	encode(this: void, q: buffer): buffer;
};

declare const base64: base64;
export = base64;
