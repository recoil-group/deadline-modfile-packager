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
			const x_occ = declaration.occupancies[x];
			const x_mat = declaration.materials[x];

			for (const y of $range(0, x_occ.size() - 1)) {
				const y_occ = x_occ[y];
				const y_mat = x_mat[y];

				for (const z of $range(0, y_occ.size() - 1)) {
					const occupancy = y_occ[z];
					const material = y_mat[z];

					bitbuffer.writeUInt32(material.Value);
					bitbuffer.writeFloat64(occupancy);
				}
			}
		}
	},
	decode: (modfile, buffer) => {
		const region = buffer.readRegion3();

		const x_size = buffer.readUInt32();
		const y_size = buffer.readUInt32();
		const z_size = buffer.readUInt32();

		const occupancies: Array<Array<Array<number>>> = new Array(x_size);
		const materials: Array<Array<Array<Enum.Material>>> = new Array(x_size);
		for (const x of $range(0, x_size - 1)) {
			const y_occ = new Array<Array<number>>(y_size);
			const y_mat = new Array<Array<Enum.Material>>(y_size);

			occupancies[x] = y_occ;
			materials[x] = y_mat;

			for (const y of $range(0, y_size - 1)) {
				const z_occ = new Array<number>(z_size);
				const z_mat = new Array<Enum.Material>(z_size);

				y_occ[y] = z_occ;
				y_mat[y] = z_mat;

				for (const z of $range(0, z_size - 1)) {
					const material = buffer.readUInt32();
					const occupancy = buffer.readFloat64();

					z_occ[z] = occupancy;
					z_mat[z] = INT_TO_MATERIAL.get(material)!;
				}
			}
		}

		const declaration: Modfile.terrainDeclaration = { region, occupancies, materials };

		modfile.terrain_declarations.push(declaration);

		return declaration;
	},
};
