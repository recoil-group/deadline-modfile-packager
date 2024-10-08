import BitBuffer from "@rbxts/bitbuffer";
import { DECODE_MODULE, WRITE_MODULE } from "./serialize/module";
import { SerializeAttachmentDeclaration } from "./serialize/type/attachment";
import { SerializeClassDeclaration } from "./serialize/type/class";
import { SerializeInstanceDeclaration } from "./serialize/type/instance";
import { SerializeMetadataDeclaration } from "./serialize/type/metadata";
import { InstanceReferenceSerialization } from "./serialize/property/InstanceReferenceSerialization";
import { INSTANCE_ID_TAG } from "./util/constants";
import { SerializeMapDeclaration } from "./serialize/type/map";
import { Zlib } from "@rbxts/zlib";
import { SerializeScriptDeclaration } from "./serialize/type/script";
import { SerializeTerrainDeclaration } from "./serialize/type/terrain";

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

let next_instance_id = 0;
export namespace ModfilePackager {
	// modifying binary data to change the version may have side effects, reexport your mods with the new version instead
	// TODO: split actual packager version from this so that the version can change without breaking all the mods
	export const PACKAGER_VERSION = "0.23.0-dev-3";

	export function req_script_as<T>(root: Instance, name: string): T {
		let module = root.FindFirstChild(name);

		if (!module) throw `Error while requiring ${name} inside ${root.GetFullName()} (it doesn't exist)`;

		if (!module.IsA("ModuleScript"))
			throw `Error while requiring ${name} inside ${root.GetFullName()} (it's not a modulescript)`;

		return require(module) as T;
	}

	export function encode(model: Instance): string {
		next_instance_id = 0;

		let encode_buffer = BitBuffer("");
		encode_buffer.writeString(PACKAGER_VERSION);

		let properties = req_script_as<Modfile.properties>(model, "info");
		WRITE_MODULE(SerializeMetadataDeclaration, encode_buffer, {
			name: properties.name || "No name",
			description: properties.description || "No description",
			author: properties.author || "No author",
			image: properties.image || "No image",
		});

		let attachments = model.FindFirstChild("attachments");
		if (attachments) encode_attachments(attachments, encode_buffer);

		let maps = model.FindFirstChild("maps");
		if (maps) encode_maps(maps, encode_buffer);

		let autorun = model.FindFirstChild("autorun") as ModuleScript | undefined;
		if (autorun) {
			// wtf
			WRITE_MODULE(SerializeScriptDeclaration, encode_buffer, {
				source: (autorun as unknown as { Source: string }).Source,
			});
		}

		// WRITE_MODULE(SerializeTerrainDeclaration, encode_buffer, {
		// 	source: "",
		// });

		const compressed = Zlib.Compress(encode_buffer.dumpString(), {
			level: 9,
		});

		const export_buffer = BitBuffer(compressed);

		return export_buffer.dumpBase64();
	}

	export function decode_to_modfile(input: string): string | Modfile.file {
		const start_time = tick();

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
		};

		if (file.version !== PACKAGER_VERSION)
			return `invalid package version. imported mod is version ${file.version}, but packager uses ${PACKAGER_VERSION}. The mod you're using is likely too outdated to be used in deadline as-is. Look for a newer version.`;

		InstanceReferenceSerialization.reset_instance_cache();
		while (DECODE_MODULE(file, decode_buffer) && decode_buffer.getLength() - decode_buffer.getPointer() > 8) {}
		set_instance_parents(file);
		InstanceReferenceSerialization.set_instance_ids();

		print((tick() - start_time) * 1000, "ms to decode modfile");

		return file;
	}

	function mark_instance_ids(model: Instance): void {
		model.SetAttribute(INSTANCE_ID_TAG, next_instance_id);
		model.GetDescendants().forEach((element) => {
			next_instance_id += 1;
			element.SetAttribute(INSTANCE_ID_TAG, next_instance_id);
		});
	}

	function encode_maps(maps: Instance, buffer: BitBuffer): void {
		let map_data = maps.GetChildren();

		map_data.forEach((folder) => {
			print(`maps/${folder.Name}`);

			let data = folder.FindFirstChild("data");
			if (!data) throw `${folder.Name} is missing a data model`;

			mark_instance_ids(folder);
			const data_id = data.GetAttribute(INSTANCE_ID_TAG) as number;

			WRITE_MODULE(SerializeMapDeclaration, buffer, {
				attachments: [],
				instance_id: data_id,
				properties: req_script_as<Deadline.gameMapProperties>(folder, "properties"),
				instance: data,
			});

			WRITE_MODULE(SerializeInstanceDeclaration, buffer, {
				position: {
					kind: "attachment_root",
					instance_id: data_id,
					parent_id: next_instance_id,
				},
				instance: data,
			});
		});
	}

	function encode_attachments(attachments: Instance, buffer: BitBuffer): void {
		let attachment_classes = attachments.GetChildren();

		attachment_classes.forEach((folder) => {
			print(`attachments/${folder.Name}`);
			WRITE_MODULE(SerializeClassDeclaration, buffer, {
				attachments: [],
				properties: {
					name: folder.Name,
				},
			});

			folder.GetChildren().forEach((attachment) => {
				print(`attachments/${folder.Name}/${attachment.Name}`);
				let model = attachment.FindFirstChild("model");
				if (!model) throw `${attachment.Name} is missing a model`;

				let properties = req_script_as<Deadline.attachmentProperties>(attachment, "properties");
				let runtime_properties = req_script_as<Deadline.runtimeAttachmentProperties>(
					attachment,
					"runtime_properties",
				);

				mark_instance_ids(model);
				const instance_id = model.GetAttribute(INSTANCE_ID_TAG) as number;

				WRITE_MODULE(SerializeAttachmentDeclaration, buffer, {
					instance_id: instance_id,
					parent_class: folder.Name,
					properties: properties,
					runtime_properties: runtime_properties,
				});

				WRITE_MODULE(SerializeInstanceDeclaration, buffer, {
					position: {
						kind: "attachment_root",
						instance_id: instance_id,
						parent_id: next_instance_id,
					},
					instance: model,
				});

				next_instance_id += 1;
			});
		});
	}

	function set_instance_parents(modfile: Modfile.file): void {
		let { instance_declarations } = modfile;

		for (const [_, child] of pairs(instance_declarations)) {
			if (child.position.kind !== "child") continue;
			for (const [_, parent] of pairs(instance_declarations)) {
				if (parent === child) continue;
				if (child.position.parent_id === parent.position.instance_id) child.instance.Parent = parent.instance;
			}
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
