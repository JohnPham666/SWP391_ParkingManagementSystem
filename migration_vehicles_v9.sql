-- =========================================================
-- Migration: Thêm thông tin giấy tờ xe (cà vẹt) vào bảng Vehicles
-- Chạy script này trên database hiện tại để thêm các cột mới
-- Không cần drop/recreate bảng
-- =========================================================

-- 1. Số CCCD/CMND chủ xe
ALTER TABLE Vehicles ADD COLUMN IF NOT EXISTS OwnerIdCard VARCHAR(20) NULL;

-- 2. Số đăng ký trên cà vẹt xe (Giấy đăng ký xe - mục "Số đăng ký")
ALTER TABLE Vehicles ADD COLUMN IF NOT EXISTS RegistrationNumber VARCHAR(50) NULL;

-- 3. Ngày đăng ký (trên cà vẹt xe - mục "Ngày đăng ký")  
ALTER TABLE Vehicles ADD COLUMN IF NOT EXISTS RegistrationDate DATE NULL;

-- 4. Ngày hết hạn đăng kiểm (Giấy chứng nhận kiểm định)
ALTER TABLE Vehicles ADD COLUMN IF NOT EXISTS RegistrationExpiry DATE NULL;

-- 5. Ảnh chân dung người đăng ký
ALTER TABLE Vehicles ADD COLUMN IF NOT EXISTS OwnerPortrait VARCHAR(500) NULL;

-- 6. Ảnh cà vẹt xe (ảnh giấy đăng ký xe)
ALTER TABLE Vehicles ADD COLUMN IF NOT EXISTS RegistrationPhoto VARCHAR(500) NULL;

-- Verify
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;
