import BitBuffer from "@rbxts/bitbuffer";
import { Deadline } from "..";
import { WRITE_MODULE } from "../serialize/module";
import { SerializeAttachmentDeclaration } from "../serialize/type/attachment";
import { SerializeClassDeclaration } from "../serialize/type/class";
import { SerializeInstanceDeclaration } from "../serialize/type/instance";
import { SerializeMapDeclaration } from "../serialize/type/map";
import { INSTANCE_ID_TAG } from "../util/constants";
import { require_script_as } from "../util/require_script_as";
import { InstanceId } from "./InstanceId";
import { SerializeLightingPresetDeclaration } from "../serialize/type/lighting_preset";
import { SerializeTerrainDeclaration } from "../serialize/type/terrain";
import { Workspace } from "@rbxts/services";

function isAxisAligned(part: BasePart): boolean {
	if (part.Orientation.X % 90 !== 0) return false;
	if (part.Orientation.Y % 90 !== 0) return false;
	if (part.Orientation.Z % 90 !== 0) return false;

	return true;
}

export namespace Encode {
	export function attachments(attachments: Instance, buffer: BitBuffer): void {
		const attachment_classes = attachments.GetChildren();

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
				const model = attachment.FindFirstChild("model");
				if (!model) throw `${attachment.Name} is missing a model`;

				const properties = require_script_as<Deadline.attachmentProperties>(attachment, "properties");
				const runtime_properties = require_script_as<Deadline.runtimeAttachmentProperties>(
					attachment,
					"runtime_properties",
				);

				// autofilled by the game
				properties.name = attachment.Name;

				InstanceId.mark_instance(model);
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
						parent_id: InstanceId.get_next(),
					},
					instance: model,
				});

				InstanceId.advance();
			});
		});
	}

	export function maps(maps: Instance, buffer: BitBuffer): void {
		const map_data = maps.GetChildren();

		map_data.forEach((folder) => {
			print(`maps/${folder.Name}`);

			const data = folder.FindFirstChild("data");
			if (!data) throw `${folder.Name} is missing a data model`;

			InstanceId.mark_instance(folder);
			const data_id = data.GetAttribute(INSTANCE_ID_TAG) as number;

			WRITE_MODULE(SerializeMapDeclaration, buffer, {
				attachments: [],
				instance_id: data_id,
				properties: require_script_as<Deadline.gameMapProperties>(folder, "properties"),
				instance: data,
			});

			WRITE_MODULE(SerializeInstanceDeclaration, buffer, {
				position: {
					kind: "attachment_root",
					instance_id: data_id,
					parent_id: InstanceId.get_next(),
				},
				instance: data,
			});

			const terrainZones = folder.FindFirstChild("terrain");
			if (terrainZones !== undefined) {
				const terrainRegion = terrainZones.FindFirstChildWhichIsA("BasePart");
				if (terrainRegion !== undefined) {
					if (!isAxisAligned(terrainRegion)) {
						warn(
							`Terrain region ${terrainRegion.GetFullName()} is not aligned to the X, Y and Z axes! This will be skipped for terrain reading!`,
						);
					} else {
						const voxelRegion = new Region3(
							(terrainRegion.Position = terrainRegion.Size.div(2)),
							terrainRegion.Position.add(terrainRegion.Size.div(2)),
						).ExpandToGrid(4);

						const [materials, occupancies] = Workspace.Terrain.ReadVoxels(voxelRegion, 4);

						WRITE_MODULE(SerializeTerrainDeclaration, buffer, {
							region: voxelRegion,
							materials,
							occupancies,
						});
					}
				}
			}
		});
	}

	export function lighting_presets(lighting: Instance, buffer: BitBuffer): void {
		const preset_data = lighting.GetChildren();
		preset_data.forEach((module) => {
			print(`lighting/presets/${module.Name}`);

			if (!module.IsA("ModuleScript")) throw `${module.Name} is not a ModuleScript`;

			const data = require_script_as<unknown>(lighting, module.Name);

			WRITE_MODULE(SerializeLightingPresetDeclaration, buffer, { name: module.Name, data });
		});
	}
}
