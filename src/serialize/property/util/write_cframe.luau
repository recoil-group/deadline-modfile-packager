local NORMAL_ID_VECTORS = { -- [Enum.Value] = Vector3.fromNormalId(Enum)
	[0] = Vector3.new(1, 0, 0), -- Enum.NormalId.Right
	[1] = Vector3.new(0, 1, 0), -- Enum.NormalId.Top
	[2] = Vector3.new(0, 0, 1), -- Enum.NormalId.Back
	[3] = Vector3.new(-1, 0, 0), -- Enum.NormalId.Left
	[4] = Vector3.new(0, -1, 0), -- Enum.NormalId.Bottom
	[5] = Vector3.new(0, 0, -1), -- Enum.NormalId.Front
}

local function writeCFrame(buffer, cf: CFrame)
	-- CFrames can be rather lengthy (if stored naively, they would each be 48 bytes long) so some optimization is done here.
	-- Specifically, if a CFrame is axis-aligned (it's only rotated in 90 degree increments), the rotation matrix isn't stored.
	-- Instead, an 'id' for its orientation is generated and that's stored instead of the rotation.
	-- This means that for the most common rotations, only 13 bytes are used.
	-- The downside is that non-axis-aligned CFrames use 49 bytes instead of 48, but that's a small price to pay.

	local upVector = cf.UpVector
	local rightVector = cf.RightVector
	local rightNormal, upNormal
	for i = 0, 5 do
		local v = NORMAL_ID_VECTORS[i]
		if 1 - v:Dot(rightVector) < 0.0001 then
			rightNormal = i
		end
		if 1 - v:Dot(upVector) < 0.0001 then
			upNormal = i
		end
	end

	-- sometimes axisAligned doesn't match up with rightNormal and upNormal
	if rightNormal and upNormal then
		local position = cf.Position
		-- The ID of an orientation is generated through what can best be described as 'hand waving';
		-- This is how Roblox does it and it works, so it was chosen to do it this way too.

		-- The ID generated here is technically off by 1 from what Roblox would store, but that's not important
		-- It just means that 0x02 is actually 0x01 for the purposes of this module's implementation.
		buffer.writeByte(rightNormal * 6 + upNormal)
		buffer.writeFloat32(position.X)
		buffer.writeFloat32(position.Y)
		buffer.writeFloat32(position.Z)
	else
		-- If the CFrame isn't axis-aligned, the entire rotation matrix has to be written...
		buffer.writeByte(0) -- Along with a byte to indicate the matrix was written.
		local x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22 = cf:GetComponents()
		buffer.writeFloat32(x)
		buffer.writeFloat32(y)
		buffer.writeFloat32(z)
		buffer.writeFloat32(r00)
		buffer.writeFloat32(r01)
		buffer.writeFloat32(r02)
		buffer.writeFloat32(r10)
		buffer.writeFloat32(r11)
		buffer.writeFloat32(r12)
		buffer.writeFloat32(r20)
		buffer.writeFloat32(r21)
		buffer.writeFloat32(r22)
	end
end

local function readCFrame(buffer)
	local id = buffer.readByte()

	if id == 0 then

        -- stylua: ignore
        return CFrame.new(
            buffer.readFloat32(), buffer.readFloat32(), buffer.readFloat32(),
            buffer.readFloat32(), buffer.readFloat32(), buffer.readFloat32(),
            buffer.readFloat32(), buffer.readFloat32(), buffer.readFloat32(),
            buffer.readFloat32(), buffer.readFloat32(), buffer.readFloat32()
        )
	else
		local rightVector = NORMAL_ID_VECTORS[math.floor(id / 6)]
		local upVector = NORMAL_ID_VECTORS[id % 6]
		local lookVector = rightVector:Cross(upVector)

        -- CFrame's full-matrix constructor takes right/up/look vectors as columns...
        -- stylua: ignore
        return CFrame.new(
            buffer.readFloat32(), buffer.readFloat32(), buffer.readFloat32(),
            rightVector.X, upVector.X, lookVector.X,
            rightVector.Y, upVector.Y, lookVector.Y,
            rightVector.Z, upVector.Z, lookVector.Z
        )
	end
end

return { write_cframe = { write = writeCFrame, read = readCFrame } }
