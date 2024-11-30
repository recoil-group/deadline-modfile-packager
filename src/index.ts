import BitBuffer from "@rbxts/bitbuffer";
import { DECODE_MODULE, WRITE_MODULE } from "./serialize/module";
import { SerializeMetadataDeclaration } from "./serialize/type/metadata";
import { InstanceReferenceSerialization } from "./namespace/InstanceReferenceSerialization";
import { Zlib } from "@rbxts/zlib";
import { SerializeScriptDeclaration } from "./serialize/type/script";
import { require_script_as } from "./util/require_script_as";
import { InstanceId } from "./namespace/InstanceId";
import { Encode } from "./namespace/Encode";
import { wait_on_cooldown } from "./util/cooldown";

// declared by the game itself
// incomplete types

export namespace Deadline {
	export type attachmentClassData = {
		name: string;
	};

	export type attachmentProperties = {
		name: string;
		// may be anything
	};

	export type runtimeAttachmentProperties = {
		name: string;
		// may be anything
	};

	export type gameMapProperties = {
		description: string;
		images: {
			thumbnail_day: string;
			thumbnail_night: string;
		};

		lamps: {
			off_time: number;
			on_time: number;
		};
		lighting_preset: string;

		minimap: {
			image: string;
			size: number;
		};

		name: string;
		code: string;

		sound_preset: string;
	};
}

// modfile format spec
export namespace Modfile {
	export type properties = { [index: string]: string };

	export type file = {
		info?: Modfile.metadataDeclaration;
		version: string;
		map_declarations: Modfile.mapDeclaration[];
		class_declarations: Modfile.classDeclaration[];
		instance_declarations: Modfile.instanceDeclaration[];
		script_declarations: Modfile.scriptDeclaration[];
		lighting_preset_declarations: Modfile.lightingPreset[];
	};

	export type lightingPreset = {
		name: string;
		data: unknown; // who cares
	};

	export type metadataDeclaration = {
		name: string;
		description: string;
		author: string;
		image: string;
	};

	export type classDeclaration = {
		properties: Deadline.attachmentClassData;
		attachments: Modfile.attachmentDeclaration[];
	};

	export type instanceDeclaration = {
		position:
			| { kind: "attachment_root"; parent_id: number; instance_id: number }
			| { kind: "child"; parent_id: number; instance_id: number };
		instance: Instance;
	};

	export type attachmentDeclaration = {
		instance_id: number; // ID of the root model instance
		parent_class: string;
		properties: Deadline.attachmentProperties;
		runtime_properties: Deadline.runtimeAttachmentProperties;
	};

	export type scriptDeclaration = {
		source: string;
	};

	export type terrainDeclaration = {};

	export type mapDeclaration = {
		instance_id: number; // ID of the root model instance
		properties: Deadline.gameMapProperties;
	};

	// TODO distinction between ingame classes and modded classes
	export type compiledClass = {
		name: string;
	};
}

export namespace ModfilePackager {
	// modifying binary data to change the version may have side effects, reexport your mods with the new version instead
	// TODO: split actual packager version from this so that the version can change without breaking all the mods
	export const PACKAGER_VERSION = "0.23.0-dev-3";

	export function encode(model: Instance): string {
		InstanceId.reset();

		let encode_buffer = BitBuffer("");
		encode_buffer.writeString(PACKAGER_VERSION);

		let properties = require_script_as<Modfile.properties>(model, "info");
		WRITE_MODULE(SerializeMetadataDeclaration, encode_buffer, {
			name: properties.name || "No name",
			description: properties.description || "No description",
			author: properties.author || "No author",
			image: properties.image || "No image",
		});

		let attachments = model.FindFirstChild("attachments");
		if (attachments) Encode.attachments(attachments, encode_buffer);

		let maps = model.FindFirstChild("maps");
		if (maps) Encode.maps(maps, encode_buffer);

		let presets = model.FindFirstChild("lighting_presets");
		if (presets) Encode.lighting_presets(presets, encode_buffer);

		let autorun = model.FindFirstChild("autorun") as ModuleScript | undefined;
		if (autorun) {
			// wtf
			WRITE_MODULE(SerializeScriptDeclaration, encode_buffer, {
				source: (autorun as unknown as { Source: string }).Source,
			});
		}

		const compressed = Zlib.Compress(encode_buffer.dumpString(), {
			level: 9,
		});

		const export_buffer = BitBuffer(compressed);

		return export_buffer.dumpBase64();
	}

	export function decode_to_modfile(input: string): string | Modfile.file {
		const import_buffer = BitBuffer();
		import_buffer.writeBase64(input);

		const contents = Zlib.Decompress(import_buffer.dumpString());
		const decode_buffer = BitBuffer(contents);

		let file: Modfile.file = {
			version: decode_buffer.readString(),
			class_declarations: [],
			instance_declarations: [],
			map_declarations: [],
			script_declarations: [],
			lighting_preset_declarations: [],
		};

		if (file.version !== PACKAGER_VERSION)
			return `invalid package version. imported mod is version ${file.version}, but packager uses ${PACKAGER_VERSION}. The mod you're using is likely too outdated to be used in deadline as-is. Look for a newer version.`;

		InstanceReferenceSerialization.reset_instance_cache();

		while (DECODE_MODULE(file, decode_buffer) && decode_buffer.getLength() - decode_buffer.getPointer() > 8) {
			wait_on_cooldown();
		}

		set_instance_parents(file);
		InstanceReferenceSerialization.set_instance_ids();

		return file;
	}

	function set_instance_parents(modfile: Modfile.file): void {
		let { instance_declarations } = modfile;

		// instance, children
		let target_parents = new Map<number, Instance>();
		for (const [_, parent] of pairs(instance_declarations)) {
			target_parents.set(parent.position.instance_id, parent.instance);
		}

		for (const [_, child] of pairs(instance_declarations)) {
			if (child.position.kind === "attachment_root") continue;

			wait_on_cooldown();

			const instance = target_parents.get(child.position.parent_id);
			if (instance && instance !== child.instance) child.instance.Parent = instance;
		}
	}
}

export namespace ModfileProvider {
	export const LOADED_MODS: string[] = []; // compiled buffer data

	export const load_file = (file: string) => {
		LOADED_MODS.push(file);
	};
}

/*
    specification info for deadline mods
    for details on reading types, see @rbxts/bitbuffer implementation

    Mods start with a string
*/
