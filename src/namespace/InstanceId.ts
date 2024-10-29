import { INSTANCE_ID_TAG } from "../util/constants";

export namespace InstanceId {
	let next_instance_id = 0;

	export function reset(): void {
		next_instance_id = 0;
	}

	export function mark_instance(model: Instance): void {
		model.SetAttribute(INSTANCE_ID_TAG, next_instance_id);
		model.GetDescendants().forEach((element) => {
			next_instance_id += 1;
			element.SetAttribute(INSTANCE_ID_TAG, next_instance_id);
		});
	}

	export function advance(): void {
		next_instance_id += 1;
	}

	export function get_next(): number {
		return next_instance_id;
	}
}
