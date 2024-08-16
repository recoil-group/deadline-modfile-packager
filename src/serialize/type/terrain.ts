import { HttpService, RunService, Workspace } from "@rbxts/services";
import { Deadline, Modfile } from "../..";
import { Serializer } from "../module";

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

export const SerializeTerrainDeclaration: Serializer<Modfile.scriptDeclaration> = {
	name: "Terrain",
	id: 7,
	write: (declaration, bitbuffer) => {
		print("saving terrain");

		let region = Workspace.Terrain.MaxExtents;

		let last_timeout = os.clock();

		bitbuffer.writeSigned(64, region.Min.X);
		bitbuffer.writeSigned(64, region.Min.Y);
		bitbuffer.writeSigned(64, region.Min.Z);
		bitbuffer.writeSigned(64, region.Max.X);
		bitbuffer.writeSigned(64, region.Max.Y);
		bitbuffer.writeSigned(64, region.Max.Z);
		for (const x of $range(region.Min.X, region.Max.X)) {
			for (const y of $range(region.Min.Y, region.Max.Y)) {
				for (const z of $range(region.Min.Z, region.Max.Z)) {
					if (last_timeout + 0.5 < os.clock()) {
						RunService.Heartbeat.Wait();
						last_timeout = os.clock();
					}

					let region = new Region3(new Vector3(x, y, z), new Vector3(x + 4, y + 4, z + 4));
					let [materials, occupancies] = Workspace.Terrain.ReadVoxels(region, 4);

					let material_int = MATERIAL_TO_INT.get(materials[0][0][0]) ?? 0;
					let occupancy = occupancies[0][0][0];

					bitbuffer.writeUnsigned(8, material_int);
					let value = math.floor((occupancy ?? 1) * 16);
					if (value > 16) print(value);
					bitbuffer.writeUnsigned(5, (occupancy ?? 1) * 16);
				}
			}
		}
	},
	decode: (modfile, buffer) => {
		return modfile;
	},
};
