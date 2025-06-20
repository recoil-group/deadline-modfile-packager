import { HttpService, RunService, Workspace } from "@rbxts/services";
import { Deadline, Modfile } from "../..";
import { Serializer } from "../module";
import { SerializeId } from "../types";

const MATERIAL_TO_INT = new Map<Enum.Material, number>([
	[Enum.Material.Air, 0],
	[Enum.Material.Asphalt, 1],
	[Enum.Material.Basalt, 2],
	[Enum.Material.Brick, 3],
	[Enum.Material.Cobblestone, 4],
	[Enum.Material.Concrete, 5],
	[Enum.Material.CrackedLava, 6],
	[Enum.Material.Glacier, 7],
	[Enum.Material.Grass, 8],
	[Enum.Material.Ground, 9],
	[Enum.Material.Ice, 10],
	[Enum.Material.LeafyGrass, 11],
	[Enum.Material.Limestone, 12],
	[Enum.Material.Mud, 13],
	[Enum.Material.Pavement, 14],
	[Enum.Material.Rock, 15],
	[Enum.Material.Salt, 16],
	[Enum.Material.Sand, 17],
	[Enum.Material.Sandstone, 18],
	[Enum.Material.Slate, 19],
	[Enum.Material.Snow, 20],
	[Enum.Material.Water, 21],
	[Enum.Material.WoodPlanks, 22],
]);

export const SerializeTerrainDeclaration: Serializer<Modfile.terrainDeclaration> = {
	name: "Terrain",
	id: SerializeId.Terrain,
	write: (declaration, bitbuffer) => {
		let last_timeout = os.clock();

		bitbuffer.writeSigned(64, declaration.min.X);
		bitbuffer.writeSigned(64, declaration.min.Y);
		bitbuffer.writeSigned(64, declaration.min.Z);
		bitbuffer.writeSigned(64, declaration.max.X);
		bitbuffer.writeSigned(64, declaration.max.Y);
		bitbuffer.writeSigned(64, declaration.max.Z);

		for (let x = declaration.min.X; x <= declaration.max.X; x++) {
			for (let y = declaration.min.Y; y <= declaration.max.Y; y++) {
				for (let z = declaration.min.Z; z <= declaration.max.Z; z++) {
					if (last_timeout + 0.5 < os.clock()) {
						RunService.Heartbeat.Wait();
						last_timeout = os.clock();
					}

					const key = `${x},${y},${z}`;
					const voxel = declaration.data.get(key);

					const materialInt = MATERIAL_TO_INT.get(voxel?.material ?? Enum.Material.Air) ?? 0;
					const occupancy = voxel?.occupancy ?? 1;
					const occupancyBits = math.floor(occupancy * 16);

					bitbuffer.writeUnsigned(8, materialInt);
					bitbuffer.writeUnsigned(5, occupancyBits);
				}
			}
		}
	},
	decode: (modfile, buffer) => {
		const INT_TO_MATERIAL = new Map<number, Enum.Material>();
		for (const [material, int] of MATERIAL_TO_INT) {
			INT_TO_MATERIAL.set(int, material);
		}

		const minX = buffer.readSigned(64);
		const minY = buffer.readSigned(64);
		const minZ = buffer.readSigned(64);
		const maxX = buffer.readSigned(64);
		const maxY = buffer.readSigned(64);
		const maxZ = buffer.readSigned(64);

		const terrainData = new Map<string, { material: Enum.Material; occupancy: number }>();

		for (let x = minX; x <= maxX; x++) {
			for (let y = minY; y <= maxY; y++) {
				for (let z = minZ; z <= maxZ; z++) {
					const materialInt = buffer.readUnsigned(8);
					const occupancyBits = buffer.readUnsigned(5);

					const material = INT_TO_MATERIAL.get(materialInt) ?? Enum.Material.Air;
					const occupancy = occupancyBits / 16;

					const key = `${x},${y},${z}`;
					terrainData.set(key, { material, occupancy });
				}
			}
		}

		modfile.terrain_declarations.push({
			min: new Vector3(minX, minY, minZ),
			max: new Vector3(maxX, maxY, maxZ),
			data: terrainData,
		});

		return modfile;
	},
};
