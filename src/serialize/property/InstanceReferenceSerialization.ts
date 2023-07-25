import { forceIndex } from "./decode_property";

type instancePropertyData = {
	id: number;
	index: string;
	instance: Instance;
};

const scheduled_instance_property_changes: instancePropertyData[] = [];
const instance_map: Map<number, Instance> = new Map();

export namespace InstanceReferenceSerialization {
	export const reset_instance_cache = () => {
		scheduled_instance_property_changes.clear();
		instance_map.clear();
	};

	export const add_instance_to_cache = (instance: Instance, id: number) => instance_map.set(id, instance);

	export const schedule_instance_set = (instance: Instance, index: string, id: number) => {
		print(`scheduling instance.${index} to instance id ${id}`);
		scheduled_instance_property_changes.push({
			id,
			index,
			instance,
		});
	};

	export const set_instance_ids = () => {
		print(scheduled_instance_property_changes);
		for (const [_, value] of pairs(scheduled_instance_property_changes)) {
			let target_instance = instance_map.get(value.id);
			if (!target_instance) throw `failed to set instance.${value.index} to instance id ${value.id}`;

			(value.instance as unknown as forceIndex<Instance>)[value.index] = target_instance;
		}
	};
}
