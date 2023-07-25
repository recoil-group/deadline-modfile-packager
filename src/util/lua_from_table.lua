local index_order = {

	-- caliber data?
	damage = -9,

	-- properties
	stats = -11,

	name = -10,
	new_format = -9.9,
	display = -8,

	attach_type = -7,

	-- recoil
	x = 1,
	y = 2,
	z = 3,

	burst_start = 2,
	burst_end = 3,
}

local render_table
local function str_value(value, indent)
	if type(value) == "string" then
		return string.format('"%s"', value:gsub('"', [[\"]]))
	elseif type(value) == "table" then
		if value.__marker then
			return string.format(
				'stat("%s", %s, %s, %s, %s)',
				value.tied_to,
				value.min_value,
				value.max_value,
				value.min_stat,
				value.max_stat
			)
		else
			return render_table(value, indent)
		end
	else
		return tostring(value)
	end
end

local escape_chars = {
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"0",
	"-",
	[[/]],
	[[\]],
	" ",
	"hk416", -- the slash doesn't work so this better should
}

render_table = function(input, indent)
	local skin_order = game:GetService("HttpService")
		:JSONDecode(game.ServerScriptService["ext-util"]["order-manifest"].Source)
	local empty = true

	for _ in pairs(input) do
		empty = false
		break
	end

	if empty then
		return "{}"
	end

	if input.attributes and input.attributes.camo then
		table.sort(input.attributes.camo, function(a, b)
			if not skin_order[a.name] then
				warn("lua_from_table: no order for " .. a.name)
				skin_order[a.name] = 20
			end

			if not skin_order[b.name] then
				warn("lua_from_table: no order for " .. b.name)
				skin_order[b.name] = 20
			end

			return skin_order[a.name] < skin_order[b.name]
		end)
	end

	local str = "{\n"
	indent = indent or 0
	indent += 1

	local sorted = {}

	for i, v in pairs(input) do
		table.insert(sorted, { index = i, value = v })
	end

	table.sort(sorted, function(a, b)
		return (index_order[a.index] or 0) < (index_order[b.index] or 0)
	end)

	for _, v in pairs(sorted) do
		if type(v.index) == "number" then
			str ..= string.format("%s%s,\n", string.rep("\t", indent), str_value(v.value, indent))
		else
			local index = function()
				for _, char in pairs(escape_chars) do
					if v.index:find(char) then
						return string.format('["%s"]', tostring(v.index))
					end
				end

				return tostring(v.index)
			end

			if typeof(v.value) == "Color3" then
				str ..= string.format(
					"%s%s = %s,\n",
					string.rep("\t", indent),
					index(),
					string.format("Color3.fromRGB(%i, %i, %i)", v.value.R, v.value.G, v.value.B)
				)
			else
				str ..= string.format("%s%s = %s,\n", string.rep("\t", indent), index(), str_value(v.value, indent))
			end
		end
	end

	return str .. string.rep("\t", indent - 1) .. "}"
end

return {
	render_table = render_table,
}
