const RunService = game.GetService("RunService");

let next_yield_time = tick() + 1;
export function wait_on_cooldown(): void {
	if (tick() > next_yield_time) {
		// large mods cause timeout
		next_yield_time = tick() + 1;
		RunService.Heartbeat.Wait();
	}
}
