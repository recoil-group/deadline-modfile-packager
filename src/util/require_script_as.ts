export function require_script_as<T>(root: Instance, name: string): T {
	let module = root.FindFirstChild(name);

	if (!module) throw `Error while requiring ${name} inside ${root.GetFullName()} (it doesn't exist)`;

	if (!module.IsA("ModuleScript"))
		throw `Error while requiring ${name} inside ${root.GetFullName()} (it's not a modulescript)`;

	return require(module) as T;
}
