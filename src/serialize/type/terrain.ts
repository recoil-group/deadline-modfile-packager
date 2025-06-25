import { HttpService, RunService, Workspace } from "@rbxts/services";
import { Deadline, Modfile } from "../..";
import { Serializer } from "../module";
import { SerializeId } from "../types";

const MATERIAL_TO_INT = new Map<Enum.Material, number>(
	Enum.Material.GetEnumItems().map((material) => [material, material.Value]),
);

const INT_TO_MATERIAL = new Map<number, Enum.Material>(
	Enum.Material.GetEnumItems().map((material) => [material.Value, material]),
);

export const SerializeTerrainDeclaration: Serializer<{
	region: Region3;
	occupancies: ReadVoxelsArray<number>;
	materials: ReadVoxelsArray<Enum.Material>;
}> = {
	name: "Terrain",
	id: SerializeId.Terrain,
	write: (declaration, bitbuffer) => {
		bitbuffer.writeRegion3(declaration.region);

		bitbuffer.writeUInt32(declaration.occupancies.size());
		bitbuffer.writeUInt32(declaration.occupancies[0]?.size() ?? 0);
		bitbuffer.writeUInt32(declaration.occupancies[0]?.[0]?.size() ?? 0);

		for (const x of $range(0, declaration.occupancies.size() - 1)) {
			const xOcc = declaration.occupancies[x];
			const xMat = declaration.materials[x];

			for (const y of $range(0, xOcc.size() - 1)) {
				const yOcc = xOcc[y];
				const yMat = xMat[y];

				for (const z of $range(0, yOcc.size() - 1)) {
					const occupancy = yOcc[z];
					const material = yMat[z];

					bitbuffer.writeUInt32(material.Value);
					bitbuffer.writeFloat64(occupancy);
				}
			}
		}
	},
	decode: (modfile, buffer) => {
		const region = buffer.readRegion3();

		const xSize = buffer.readUInt32();
		const ySize = buffer.readUInt32();
		const zSize = buffer.readUInt32();

		const occupancies: Array<Array<Array<number>>> = new Array(xSize);
		const materials: Array<Array<Array<Enum.Material>>> = new Array(xSize);
		for (const x of $range(0, xSize - 1)) {
			const yOcc = new Array<Array<number>>(ySize);
			const yMat = new Array<Array<Enum.Material>>(ySize);

			occupancies[x] = yOcc;
			materials[x] = yMat;

			for (const y of $range(0, ySize - 1)) {
				const zOcc = new Array<number>(zSize);
				const zMat = new Array<Enum.Material>(zSize);

				yOcc[y] = zOcc;
				yMat[y] = zMat;

				for (const z of $range(0, zSize - 1)) {
					const material = buffer.readUInt32();
					const occupancy = buffer.readFloat64();

					zOcc[z] = occupancy;
					zMat[z] = INT_TO_MATERIAL.get(material)!;
				}
			}
		}

		const declaration: Modfile.terrainDeclaration = { region, occupancies, materials };

		Workspace.Terrain.WriteVoxels(region, 4, materials, occupancies);

		modfile.terrain_declarations.push(declaration);

		return declaration;
	},
};
