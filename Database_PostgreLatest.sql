-- =========================================================
-- ParkingManagementSystem - PostgreSQL Version (Vietnamese Data)
-- =========================================================

DROP TABLE IF EXISTS ParkingPredictions CASCADE;
DROP TABLE IF EXISTS MonthlySubscriptions CASCADE;
DROP TABLE IF EXISTS IncidentReports CASCADE;
DROP TABLE IF EXISTS PaymentTransactions CASCADE;
DROP TABLE IF EXISTS Payments CASCADE;
DROP TABLE IF EXISTS Reservations CASCADE;
DROP TABLE IF EXISTS ParkingSessions CASCADE;
DROP TABLE IF EXISTS ParkingCards CASCADE;
DROP TABLE IF EXISTS ParkingSlots CASCADE;
DROP TABLE IF EXISTS Vehicles CASCADE;
DROP TABLE IF EXISTS PricingPolicies CASCADE;
DROP TABLE IF EXISTS VehicleTypes CASCADE;
DROP TABLE IF EXISTS Zones CASCADE;
DROP TABLE IF EXISTS Floors CASCADE;
DROP TABLE IF EXISTS Buildings CASCADE;
DROP TABLE IF EXISTS Users CASCADE;
DROP TABLE IF EXISTS Roles CASCADE;

-- =========================================================
-- CẤU TRÚC BẢNG (ĐÃ CHUẨN HÓA RÀNG BUỘC)
-- =========================================================

CREATE TABLE Roles (
    RoleID      SERIAL PRIMARY KEY,
    RoleName    VARCHAR(50) UNIQUE NOT NULL,
    Description VARCHAR(255)
);

CREATE TABLE Users (
    UserID       SERIAL PRIMARY KEY,
    FullName     VARCHAR(100) NOT NULL,
    Email        VARCHAR(100) UNIQUE NOT NULL,
    PhoneNumber  VARCHAR(20) UNIQUE NOT NULL,
    DateOfBirth  DATE,
    Address      VARCHAR(255),
    PasswordHash VARCHAR(255) NOT NULL,
    RoleID       INT NOT NULL,
    IsActive     BOOLEAN DEFAULT TRUE,
    CreatedAt    TIMESTAMP DEFAULT NOW(),
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

CREATE TABLE Buildings (
    BuildingID         SERIAL PRIMARY KEY,
    BuildingName       VARCHAR(100) NOT NULL,
    Address            VARCHAR(255),
    TotalFloors        INT,
    OperatingStartTime TIME,
    OperatingEndTime   TIME,
    CreatedAt          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE Floors (
    FloorID     SERIAL PRIMARY KEY,
    BuildingID  INT NOT NULL,
    FloorNumber INT NOT NULL,
    FloorName   VARCHAR(50),
    CONSTRAINT FK_Floors_Buildings FOREIGN KEY (BuildingID) REFERENCES Buildings(BuildingID),
    CONSTRAINT UQ_Building_Floor UNIQUE (BuildingID, FloorNumber)
);

CREATE TABLE Zones (
    ZoneID      SERIAL PRIMARY KEY,
    FloorID     INT NOT NULL,
    ZoneName    VARCHAR(50) NOT NULL,
    Description VARCHAR(255),
    CONSTRAINT FK_Zones_Floors FOREIGN KEY (FloorID) REFERENCES Floors(FloorID),
    CONSTRAINT UQ_Floor_Zone UNIQUE (FloorID, ZoneName)
);

CREATE TABLE VehicleTypes (
    VehicleTypeID SERIAL PRIMARY KEY,
    TypeName      VARCHAR(50) NOT NULL UNIQUE,
    Description   VARCHAR(255),
    IsReservable  BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE Vehicles (
    VehicleID           SERIAL PRIMARY KEY,
    LicensePlate        VARCHAR(20) NOT NULL UNIQUE,
    VehicleTypeID       INT NOT NULL,
    OwnerName           VARCHAR(100) NULL,
    OwnerPhone          VARCHAR(20) NULL,
    OwnerIdCard         VARCHAR(20) NULL,
    UserID              INT NULL,
    Brand               VARCHAR(50) NULL,
    VehicleColor        VARCHAR(30) NULL,
    EngineNumber        VARCHAR(50) NULL,
    ChassisNumber       VARCHAR(50) NULL,
    ManufactureYear     INT NULL,
    RegistrationNumber  VARCHAR(50) NULL,
    RegistrationDate    DATE NULL,
    RegistrationExpiry  DATE NULL,
    VehicleImage        VARCHAR(255) NULL,
    OwnerPortrait       VARCHAR(500) NULL,
    RegistrationPhotoFront VARCHAR(500) NULL,
    RegistrationPhotoBack  VARCHAR(500) NULL,
    IdCardFront         VARCHAR(500) NULL,
    IdCardBack          VARCHAR(500) NULL,
    Status              VARCHAR(20) DEFAULT 'PENDING' CHECK (Status IN ('PENDING', 'APPROVED', 'REJECTED')),
    IsActive            BOOLEAN DEFAULT TRUE,
    CONSTRAINT FK_Vehicles_VehicleTypes FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT FK_Vehicles_Users FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE UNIQUE INDEX UQ_Vehicles_EngineNumber ON Vehicles (EngineNumber) WHERE EngineNumber IS NOT NULL;
CREATE UNIQUE INDEX UQ_Vehicles_ChassisNumber ON Vehicles (ChassisNumber) WHERE ChassisNumber IS NOT NULL;

CREATE TABLE ParkingSlots (
    SlotID           SERIAL PRIMARY KEY,
    ZoneID           INT NOT NULL,
    SlotCode         VARCHAR(20) NOT NULL UNIQUE,
    VehicleTypeID    INT NOT NULL,
    Area             DECIMAL(10,2) NULL,
    Capacity         INT NOT NULL DEFAULT 1,
    CurrentOccupancy INT NOT NULL DEFAULT 0,
    Status           VARCHAR(20) NOT NULL CHECK (Status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'LOCKED')),
    IsActive         BOOLEAN DEFAULT TRUE,
    CONSTRAINT FK_ParkingSlots_Zones FOREIGN KEY (ZoneID) REFERENCES Zones(ZoneID),
    CONSTRAINT FK_ParkingSlots_VehicleTypes FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT CHK_Occupancy_Not_Exceed_Capacity CHECK (CurrentOccupancy <= Capacity),
    CONSTRAINT CHK_Occupancy_Not_Negative CHECK (CurrentOccupancy >= 0)
);

CREATE TABLE PricingPolicies (
    PricingPolicyID    SERIAL PRIMARY KEY,
    VehicleTypeID      INT NOT NULL,
    PolicyName         VARCHAR(100),
    BasePrice          DECIMAL(10,2) NOT NULL,
    RushHourPrice      DECIMAL(10,2) NOT NULL,
    OffPeakPrice       DECIMAL(10,2) NOT NULL,
    RushHourStart      TIME NOT NULL,
    RushHourEnd        TIME NOT NULL,
    MaxDailyRate       DECIMAL(10,2),
    LostTicketFee      DECIMAL(10,2),
    OvertimeFeePerHour DECIMAL(10,2),
    EffectiveFrom      TIMESTAMP NOT NULL,
    EffectiveTo        TIMESTAMP,
    CONSTRAINT FK_PricingPolicies_VehicleTypes FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT CHK_RushHour_Time CHECK (RushHourStart < RushHourEnd),
    CONSTRAINT CHK_PricingPolicies_NonNegative CHECK (
        BasePrice >= 0 AND RushHourPrice >= 0 AND OffPeakPrice >= 0
        AND (MaxDailyRate IS NULL OR MaxDailyRate >= 0)
        AND (LostTicketFee IS NULL OR LostTicketFee >= 0)
        AND (OvertimeFeePerHour IS NULL OR OvertimeFeePerHour >= 0)
    ),
    CONSTRAINT CHK_PricingPolicies_Effective_Time CHECK (EffectiveTo IS NULL OR EffectiveTo > EffectiveFrom)
);

CREATE TABLE ParkingCards (
    CardID    VARCHAR(50) PRIMARY KEY,
    Status    VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (Status IN ('ACTIVE', 'IN_USE', 'LOST')),
    CreatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ParkingSessions (
    SessionID    SERIAL PRIMARY KEY,
    VehicleID    INT NOT NULL,
    SlotID       INT NOT NULL,
    CardID       VARCHAR(50) NULL,
    EntryTime    TIMESTAMP NOT NULL DEFAULT NOW(),
    ExitTime     TIMESTAMP NULL,
    EntryGate    VARCHAR(50),
    ExitGate     VARCHAR(50),
    EntryImage   VARCHAR(500) NULL,
    ExitImage    VARCHAR(500) NULL,
    Status       VARCHAR(20) NOT NULL CHECK (Status IN ('PARKING', 'PENDING_PAYMENT', 'COMPLETED', 'LOST_TICKET', 'UNPAID', 'VIOLATION')),
    EstimatedFee DECIMAL(10,2),
    FinalFee     DECIMAL(10,2),
    CreatedBy    INT,
    CONSTRAINT FK_ParkingSessions_Vehicles FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    CONSTRAINT FK_ParkingSessions_Slots FOREIGN KEY (SlotID) REFERENCES ParkingSlots(SlotID),
    CONSTRAINT FK_ParkingSessions_Cards FOREIGN KEY (CardID) REFERENCES ParkingCards(CardID),
    CONSTRAINT FK_ParkingSessions_Users FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    CONSTRAINT CHK_Session_Time CHECK (ExitTime IS NULL OR ExitTime >= EntryTime),
    CONSTRAINT CHK_ParkingSessions_Fee_NonNegative CHECK (
        (EstimatedFee IS NULL OR EstimatedFee >= 0) AND (FinalFee IS NULL OR FinalFee >= 0)
    )
);

CREATE UNIQUE INDEX UQ_ParkingSessions_ActiveParkingVehicle ON ParkingSessions (VehicleID) WHERE Status = 'PARKING';

CREATE TABLE Reservations (
    ReservationID    SERIAL PRIMARY KEY,
    UserID           INT NOT NULL,
    VehicleID        INT NOT NULL,
    VehicleTypeID    INT NOT NULL,
    SlotID           INT NOT NULL,
    ReservationStart TIMESTAMP NOT NULL,
    ReservationEnd   TIMESTAMP NOT NULL,
    Status           VARCHAR(20) CHECK (Status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED')),
    CreatedAt        TIMESTAMP DEFAULT NOW(),
    GuestName        VARCHAR(100) NULL,
    CONSTRAINT FK_Reservations_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_Reservations_Vehicles FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    CONSTRAINT FK_Reservations_VehicleTypes FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT FK_Reservations_Slots FOREIGN KEY (SlotID) REFERENCES ParkingSlots(SlotID),
    CONSTRAINT CHK_Reservation_Time CHECK (ReservationEnd > ReservationStart)
);

CREATE TABLE Payments (
    PaymentID     SERIAL PRIMARY KEY,
    SessionID     INT NULL,
    ReservationID INT NULL,
    Amount        DECIMAL(10,2) NOT NULL,
    PaymentMethod VARCHAR(30) CHECK (PaymentMethod IN ('CASH', 'BANK_TRANSFER', 'E_WALLET', 'CREDIT_CARD', 'VNPAY')),
    PaymentStatus VARCHAR(20) CHECK (PaymentStatus IN ('PENDING', 'PAID', 'FAILED')),
    PaidAt        TIMESTAMP,
    CONSTRAINT FK_Payments_Sessions FOREIGN KEY (SessionID) REFERENCES ParkingSessions(SessionID),
    CONSTRAINT FK_Payments_Reservations FOREIGN KEY (ReservationID) REFERENCES Reservations(ReservationID),
    CONSTRAINT CHK_Payments_Amount_NonNegative CHECK (Amount >= 0),
    CONSTRAINT CHK_Payments_SessionOrReservation CHECK (
        (SessionID IS NOT NULL AND ReservationID IS NULL) OR (SessionID IS NULL AND ReservationID IS NOT NULL)
    )
);

CREATE UNIQUE INDEX UQ_Payments_Session ON Payments (SessionID) WHERE SessionID IS NOT NULL;
CREATE UNIQUE INDEX UQ_Payments_Reservation ON Payments (ReservationID) WHERE ReservationID IS NOT NULL;

CREATE TABLE PaymentTransactions (
    TransactionID     SERIAL PRIMARY KEY,
    PaymentID         INT NOT NULL,
    Gateway           VARCHAR(30) NOT NULL CHECK (Gateway IN ('VNPAY', 'MOMO', 'ZALOPAY', 'BANK_TRANSFER', 'CASH')),
    TransactionRef    VARCHAR(100) NOT NULL UNIQUE,
    Amount            DECIMAL(10,2) NOT NULL,
    TransactionStatus VARCHAR(20) NOT NULL CHECK (TransactionStatus IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED')),
    PaymentUrl        VARCHAR(1000) NULL,
    ResponseCode      VARCHAR(20) NULL,
    ResponseMessage   VARCHAR(255) NULL,
    CreatedAt         TIMESTAMP NOT NULL DEFAULT NOW(),
    PaidAt            TIMESTAMP NULL,
    CONSTRAINT FK_PaymentTransactions_Payments FOREIGN KEY (PaymentID) REFERENCES Payments(PaymentID),
    CONSTRAINT CHK_PaymentTransactions_Amount_NonNegative CHECK (Amount >= 0)
);

CREATE TABLE IncidentReports (
    IncidentID    SERIAL PRIMARY KEY,
    SessionID     INT NULL,
    ReportedBy    INT NOT NULL,
    IncidentType  VARCHAR(50) CHECK (IncidentType IN ('LOST_TICKET', 'WRONG_LICENSE_PLATE', 'OVERTIME', 'WRONG_ZONE', 'UNPAID', 'SLOT_OCCUPIED', 'FACILITY_DAMAGE', 'OTHER')),
    Description   VARCHAR(500),
    Status        VARCHAR(20) CHECK (Status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    CreatedAt     TIMESTAMP DEFAULT NOW(),
    IncidentImage VARCHAR(255) NULL,
    CONSTRAINT FK_IncidentReports_Sessions FOREIGN KEY (SessionID) REFERENCES ParkingSessions(SessionID),
    CONSTRAINT FK_IncidentReports_Users FOREIGN KEY (ReportedBy) REFERENCES Users(UserID)
);

CREATE TABLE MonthlySubscriptions (
    SubscriptionID SERIAL PRIMARY KEY,
    UserID         INT NOT NULL,
    VehicleID      INT NOT NULL,
    SlotID         INT NULL,
    ZoneID         INT NULL,
    StartDate      DATE NOT NULL,
    EndDate        DATE NOT NULL,
    MonthlyFee     DECIMAL(10,2) NOT NULL,
    Status         VARCHAR(20) NOT NULL CHECK (Status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    CreatedAt      TIMESTAMP DEFAULT NOW(),
    CONSTRAINT CHK_Slot_Or_Zone CHECK (SlotID IS NOT NULL OR ZoneID IS NOT NULL),
    CONSTRAINT CHK_Subscription_Time CHECK (EndDate >= StartDate),
    CONSTRAINT CHK_MonthlySubscriptions_Fee_NonNegative CHECK (MonthlyFee >= 0),
    CONSTRAINT FK_Subscriptions_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_Subscriptions_Vehicles FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    CONSTRAINT FK_Subscriptions_Slots FOREIGN KEY (SlotID) REFERENCES ParkingSlots(SlotID),
    CONSTRAINT FK_Subscriptions_Zones FOREIGN KEY (ZoneID) REFERENCES Zones(ZoneID)
);

CREATE UNIQUE INDEX UQ_MonthlySubscriptions_ActiveVehicle ON MonthlySubscriptions (VehicleID) WHERE Status = 'ACTIVE';

CREATE TABLE ParkingPredictions (
    PredictionID           SERIAL PRIMARY KEY,
    VehicleTypeID          INT,
    FloorID                INT,
    PredictedOccupancyRate DECIMAL(5,2),
    PredictedPeakHour      INT,
    PredictionDate         DATE,
    GeneratedAt            TIMESTAMP DEFAULT NOW(),
    CONSTRAINT FK_ParkingPredictions_VehicleTypes FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT FK_ParkingPredictions_Floors FOREIGN KEY (FloorID) REFERENCES Floors(FloorID)
);

-- =========================================================
-- SEED DATA TIẾNG VIỆT CÓ DẤU CHUẨN
-- =========================================================

-- 1. ROLES
INSERT INTO Roles (RoleID, RoleName, Description) OVERRIDING SYSTEM VALUE VALUES
(1, 'Admin', 'Quản trị hệ thống toàn quyền'),
(2, 'ParkingManager', 'Quản lý bãi xe, phân quyền nhân viên, xem báo cáo'),
(3, 'ParkingStaff', 'Nhân viên trực cổng, xử lý phiên gửi xe'),
(4, 'Driver', 'Khách hàng gửi xe, đặt chỗ trước, nạp tiền');
SELECT setval('roles_roleid_seq', (SELECT MAX(RoleID) FROM Roles));

-- 2. USERS
INSERT INTO Users (UserID, FullName, Email, PhoneNumber, DateOfBirth, Address, PasswordHash, RoleID, IsActive) OVERRIDING SYSTEM VALUE VALUES
(1,  'Nguyễn Văn Admin',     'admin@parking.vn',           '0901000001', '1985-03-15', '10 Nguyễn Huệ, Quận 1, TP.HCM',      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 1, TRUE),
(2,  'Trần Thị Lan',         'lan.manager@parking.vn',     '0901000002', '1990-07-20', '55 Lê Duẩn, Quận 1, TP.HCM',          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 2, TRUE),
(3,  'Hoàng Minh Đức',       'duc.manager@parking.vn',     '0901000003', '1988-11-05', '22 Trần Hưng Đạo, Quận 5, TP.HCM',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 2, TRUE),
(4,  'Lê Minh Tuấn',         'tuan.staff@parking.vn',      '0901000004', '1995-04-12', '78 Điện Biên Phủ, Quận 3, TP.HCM',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 3, TRUE),
(5,  'Phạm Thị Hoa',         'hoa.staff@parking.vn',       '0901000005', '1997-08-30', '30 Lý Thường Kiệt, Quận 10, TP.HCM',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 3, TRUE),
(6,  'Bùi Văn Khánh',        'khanh.staff@parking.vn',     '0901000006', '1996-01-25', '45 Nguyễn Văn Linh, Quận 7, TP.HCM',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 3, TRUE),
(7,  'Nguyễn Thị Thu',       'thu.staff@parking.vn',       '0901000007', '1999-06-18', '12 Phạm Văn Đồng, Quận 7, TP.HCM',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 3, TRUE),
(8,  'Võ Minh Quân',         'quan.staff.old@parking.vn',  '0901000008', '1993-09-14', '99 Hà Huy Giáp, Quận 12, TP.HCM',     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 3, FALSE),
(9,  'Nguyễn Hoàng Phúc',    'phuc@gmail.com',             '0912345001', '1992-02-10', '88 Nguyễn Thị Minh Khai, Q.3, TP.HCM','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 4, TRUE),
(10, 'Võ Thị Mai',           'mai@gmail.com',              '0912345002', '1994-05-22', '15 Trần Phú, Quận 5, TP.HCM',          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 4, TRUE),
(11, 'Đặng Quốc Hùng',       'hung@gmail.com',             '0912345003', '1989-12-03', '66 Cách Mạng Tháng 8, Q.3, TP.HCM',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 4, TRUE),
(12, 'Lý Thị Cẩm',           'cam@gmail.com',              '0912345004', '1998-07-15', '200 Hoàng Văn Thụ, Q.Tân Bình, TP.HCM','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 4, TRUE),
(13, 'Trần Minh Khoa',       'khoa@gmail.com',             '0912345005', '1991-03-28', '33 Nguyễn Đình Chiểu, Q.3, TP.HCM',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 4, TRUE),
(14, 'Phan Thị Lan Anh',     'lananh@gmail.com',           '0912345006', '1996-10-07', '10 Lê Văn Sỹ, Quận 3, TP.HCM',         '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 4, TRUE),
(15, 'Đỗ Đức Thành',         'thanh@gmail.com',            '0912345007', '1987-06-19', '77 Đoàn Văn Bơ, Quận 4, TP.HCM',       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 4, TRUE),
(16, 'Nguyễn Văn Cường',     'cuong.inactive@gmail.com',   '0912345008', '1990-01-01', '5 Âu Cơ, Quận Tân Bình, TP.HCM',       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 4, FALSE);
SELECT setval('users_userid_seq', (SELECT MAX(UserID) FROM Users));

-- 3. BUILDINGS
INSERT INTO Buildings (BuildingID, BuildingName, Address, TotalFloors, OperatingStartTime, OperatingEndTime) OVERRIDING SYSTEM VALUE VALUES
(1, 'Tòa nhà gửi xe Quận 1',  '120 Lê Lợi, Quận 1, TP.HCM',          4, '06:00', '23:00'),
(2, 'Tòa nhà gửi xe Quận 7',  '88 Nguyễn Thị Thập, Quận 7, TP.HCM',  3, '05:30', '23:30');
SELECT setval('buildings_buildingid_seq', (SELECT MAX(BuildingID) FROM Buildings));

-- 4. FLOORS
INSERT INTO Floors (FloorID, BuildingID, FloorNumber, FloorName) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 'Tầng 1 - Trệt'),
(2, 1, 2, 'Tầng 2'),
(3, 1, 3, 'Tầng 3'),
(4, 1, 4, 'Tầng 4 - Mái'),
(5, 2, 1, 'Tầng 1 - Trệt'),
(6, 2, 2, 'Tầng 2'),
(7, 2, 3, 'Tầng 3 - Mái');
SELECT setval('floors_floorid_seq', (SELECT MAX(FloorID) FROM Floors));

-- 5. ZONES
INSERT INTO Zones (ZoneID, FloorID, ZoneName, Description) OVERRIDING SYSTEM VALUE VALUES
(1,  1, 'Khu A', 'Khu xe máy tầng 1 - gần thang máy'),
(2,  1, 'Khu B', 'Khu ô tô tầng 1 - lối vào chính'),
(3,  2, 'Khu A', 'Khu xe máy tầng 2'),
(4,  2, 'Khu B', 'Khu ô tô tầng 2'),
(5,  3, 'Khu A', 'Khu xe máy tầng 3'),
(6,  3, 'Khu B', 'Khu ô tô tầng 3 - VIP'),
(7,  4, 'Khu A', 'Khu xe máy tầng 4'),
(8,  4, 'Khu C', 'Khu xe tải tầng 4 - thông thoáng'),
(9,  5, 'Khu A', 'Khu xe máy tòa nhà Q7 - tầng 1'),
(10, 5, 'Khu B', 'Khu ô tô tòa nhà Q7 - tầng 1'),
(11, 6, 'Khu A', 'Khu xe máy tòa nhà Q7 - tầng 2'),
(12, 7, 'Khu A', 'Khu xe máy tòa nhà Q7 - tầng 3 - mái'),
(13, 7, 'Khu C', 'Khu xe tải tòa nhà Q7 - tầng 3');
SELECT setval('zones_zoneid_seq', (SELECT MAX(ZoneID) FROM Zones));

-- 6. VEHICLE TYPES
INSERT INTO VehicleTypes (VehicleTypeID, TypeName, Description, IsReservable) OVERRIDING SYSTEM VALUE VALUES
(1, 'Xe máy',     'Xe máy, xe tay ga dưới 175cc',  TRUE),
(2, 'Ô tô',       'Xe ô tô con dưới 7 chỗ',         TRUE),
(3, 'Xe tải nhỏ', 'Xe tải dưới 2 tấn',              FALSE);
SELECT setval('vehicletypes_vehicletypeid_seq', (SELECT MAX(VehicleTypeID) FROM VehicleTypes));

-- 7. PRICING POLICIES
INSERT INTO PricingPolicies (PricingPolicyID, VehicleTypeID, PolicyName, BasePrice, RushHourPrice, OffPeakPrice, RushHourStart, RushHourEnd, MaxDailyRate, LostTicketFee, OvertimeFeePerHour, EffectiveFrom, EffectiveTo) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'Xe máy 2024',   4000,  5000, 3500, '07:00', '09:00',  40000,  40000,  NULL, '2024-01-01', '2024-12-31 23:59:59'),
(2, 2, 'Ô tô 2024',     8000, 15000,10000, '07:00', '09:00', 120000, 150000, 20000, '2024-01-01', '2024-12-31 23:59:59'),
(3, 3, 'Xe tải 2024',  12000, 20000,15000, '07:00', '09:00', 180000, 250000, 25000, '2024-01-01', '2024-12-31 23:59:59'),
(4, 1, 'Xe máy 2025',   5000,  6000, 4000, '07:00', '09:00',  50000,  50000,  NULL, '2025-01-01', NULL),
(5, 2, 'Ô tô 2025',    10000, 20000,15000, '07:00', '09:00', 150000, 200000, 25000, '2025-01-01', NULL),
(6, 3, 'Xe tải 2025',  15000, 25000,20000, '07:00', '09:00', 200000, 300000, 30000, '2025-01-01', NULL);
SELECT setval('pricingpolicies_pricingpolicyid_seq', (SELECT MAX(PricingPolicyID) FROM PricingPolicies));

-- 8. PARKING SLOTS
INSERT INTO ParkingSlots (SlotID, ZoneID, SlotCode, VehicleTypeID, Area, Capacity, CurrentOccupancy, Status, IsActive) OVERRIDING SYSTEM VALUE VALUES
(1,  1, 'A1-01',    1,  8.00, 20, 14, 'AVAILABLE', TRUE),
(2,  1, 'A1-02',    1,  8.00, 20, 10, 'AVAILABLE', TRUE),
(3,  1, 'A1-03',    1,  8.00, 20, 20, 'OCCUPIED',  TRUE),
(4,  1, 'A1-04',    1,  8.00, 20,  5, 'AVAILABLE', TRUE),
(5,  1, 'A1-VIP',   1, 10.00,  5,  2, 'AVAILABLE', TRUE),
(6,  2, 'B1-01',    2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(7,  2, 'B1-02',    2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(8,  2, 'B1-03',    2, 15.00,  1,  1, 'OCCUPIED',  TRUE),
(9,  2, 'B1-04',    2, 15.00,  1,  0, 'RESERVED',  TRUE),
(10, 2, 'B1-05',    2, 15.00,  1,  1, 'OCCUPIED',  TRUE),
(11, 2, 'B1-06',    2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(12, 2, 'B1-07',    2, 15.00,  1,  0, 'LOCKED',    TRUE),
(13, 2, 'B1-08',    2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(14, 2, 'B1-09',    2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(15, 2, 'B1-10',    2, 15.00,  1,  0, 'RESERVED',  TRUE),
(16, 3, 'A2-01',    1,  8.00, 25, 16, 'AVAILABLE', TRUE),
(17, 3, 'A2-02',    1,  8.00, 25,  8, 'AVAILABLE', TRUE),
(18, 3, 'A2-03',    1,  8.00, 25, 25, 'OCCUPIED',  TRUE),
(19, 4, 'B2-01',    2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(20, 4, 'B2-02',    2, 15.00,  1,  1, 'OCCUPIED',  TRUE),
(21, 4, 'B2-03',    2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(22, 4, 'B2-04',    2, 15.00,  1,  0, 'LOCKED',    FALSE),
(23, 4, 'B2-05',    2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(24, 5, 'A3-01',    1,  8.00, 30,  0, 'AVAILABLE', TRUE),
(25, 5, 'A3-02',    1,  8.00, 30,  0, 'AVAILABLE', TRUE),
(26, 6, 'B3-VIP-01',2, 18.00,  1,  0, 'AVAILABLE', TRUE),
(27, 6, 'B3-VIP-02',2, 18.00,  1,  1, 'OCCUPIED',  TRUE),
(28, 6, 'B3-VIP-03',2, 18.00,  1,  0, 'AVAILABLE', TRUE),
(29, 7, 'A4-01',    1,  8.00, 30,  3, 'AVAILABLE', TRUE),
(30, 8, 'C4-01',    3, 30.00,  1,  1, 'OCCUPIED',  TRUE),
(31, 8, 'C4-02',    3, 30.00,  1,  0, 'AVAILABLE', TRUE),
(32, 8, 'C4-03',    3, 30.00,  1,  0, 'AVAILABLE', TRUE),
(33, 9,  'Q7-A1-01', 1,  8.00, 20, 12, 'AVAILABLE', TRUE),
(34, 9,  'Q7-A1-02', 1,  8.00, 20,  7, 'AVAILABLE', TRUE),
(35, 10, 'Q7-B1-01', 2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(36, 10, 'Q7-B1-02', 2, 15.00,  1,  1, 'OCCUPIED',  TRUE),
(37, 10, 'Q7-B1-03', 2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(38, 10, 'Q7-B1-04', 2, 15.00,  1,  0, 'RESERVED',  TRUE),
(39, 11, 'Q7-A2-01', 1,  8.00, 20,  5, 'AVAILABLE', TRUE),
(40, 11, 'Q7-A2-02', 1,  8.00, 20,  0, 'AVAILABLE', TRUE),
(41, 12, 'Q7-A3-01', 1,  8.00, 30,  0, 'AVAILABLE', TRUE),
(42, 13, 'Q7-C3-01', 3, 30.00,  1,  0, 'AVAILABLE', TRUE),
(43, 13, 'Q7-C3-02', 3, 30.00,  1,  1, 'OCCUPIED',  TRUE);
SELECT setval('parkingslots_slotid_seq', (SELECT MAX(SlotID) FROM ParkingSlots));

-- 9. VEHICLES
INSERT INTO Vehicles (VehicleID, LicensePlate, VehicleTypeID, OwnerName, OwnerPhone, OwnerIdCard, UserID, Brand, VehicleColor, EngineNumber, ChassisNumber, ManufactureYear, RegistrationNumber, RegistrationDate, RegistrationExpiry, Status, IsActive) OVERRIDING SYSTEM VALUE VALUES
(1,  '51A-12345', 2, 'Nguyễn Hoàng Phúc', '0912345001', '079092001234',  9,  'Toyota',   'Trắng bạc', 'ENG-TOY-001', 'CHS-TOY-001', 2020, 'REG-001', '2020-06-01', '2026-06-01', 'APPROVED', TRUE),
(2,  '59B-67890', 2, 'Võ Thị Mai',        '0912345002', '074094002345', 10,  'Honda',    'Đen bóng',  'ENG-HON-002', 'CHS-HON-002', 2019, 'REG-002', '2019-09-15', '2025-09-15', 'APPROVED', TRUE),
(3,  '51C-11122', 2, 'Đặng Quốc Hùng',    '0912345003', '079089003456', 11,  'Mazda',    'Xanh dương','ENG-MAZ-003', 'CHS-MAZ-003', 2022, 'REG-003', '2022-03-20', '2028-03-20', 'APPROVED', TRUE),
(4,  '51D-33344', 2, 'Lý Thị Cẩm',        '0912345004', '079098004567', 12,  'Ford',     'Đỏ đô',     'ENG-FOR-004', 'CHS-FOR-004', 2021, 'REG-004', '2021-07-10', '2027-07-10', 'APPROVED', TRUE),
(5,  '51E-55566', 2, 'Trần Minh Khoa',    '0912345005', '079091005678', 13,  'KIA',      'Trắng ngọc','ENG-KIA-005', 'CHS-KIA-005', 2023, 'REG-005', '2023-01-05', '2029-01-05', 'APPROVED', TRUE),
(6,  '50L-11111', 1, 'Đặng Quốc Hùng',    '0912345003', '079089003456', 11,  'Yamaha',   'Đỏ',        'ENG-YAM-006', 'CHS-YAM-006', 2021, 'REG-006', '2021-05-01', '2027-05-01', 'APPROVED', TRUE),
(7,  '59K-22222', 1, 'Phan Thị Lan Anh',  '0912345006', '079096006789', 14,  'Honda',    'Trắng',     'ENG-HON-007', 'CHS-HON-007', 2022, 'REG-007', '2022-11-20', '2028-11-20', 'APPROVED', TRUE),
(8,  '51H-33333', 1, 'Đỗ Đức Thành',      '0912345007', '079087007890', 15,  'SYM',      'Đen',       'ENG-SYM-008', 'CHS-SYM-008', 2020, 'REG-008', '2020-04-15', '2026-04-15', 'APPROVED', TRUE),
(9,  '51F-99999', 3, 'Công ty Vận Tải ABC','0281234567', '031200112233', NULL,'Hino',     'Xanh lá',   'ENG-HIN-009', 'CHS-HIN-009', 2019, 'REG-009', '2019-08-01', '2025-08-01', 'APPROVED', TRUE),
(10, '51G-88888', 3, 'Công ty TNHH XYZ',  '0289876543', '031200445566', NULL,'Isuzu',    'Trắng',     'ENG-ISU-010', 'CHS-ISU-010', 2021, 'REG-010', '2021-02-10', '2027-02-10', 'APPROVED', TRUE),
(11, '29A-44444', 1, 'Trần Văn Bình',      '0912345008', NULL,           NULL, NULL,      NULL,         NULL,          NULL,          NULL,          NULL,  NULL,          NULL,          'APPROVED', TRUE),
(12, '43B-55555', 1, NULL,                 NULL,         NULL,           NULL, NULL,      NULL,         NULL,          NULL,          NULL,          NULL,  NULL,          NULL,          'PENDING', TRUE),
(13, '51P-66666', 2, 'Nguyễn Thị Thanh',   '0912345009', NULL,           NULL, NULL,      NULL,         NULL,          NULL,          NULL,          NULL,  NULL,          NULL,          'APPROVED', TRUE),
(14, '51Q-77777', 1, 'Nguyễn Văn Cường',   '0912345010', '079090008910', 16,  'Honda',    'Xám bạc',    'ENG-HON-014', 'CHS-HON-014', 2018, 'REG-014', '2018-06-01', '2024-06-01', 'APPROVED', TRUE),
(15, '51R-12399', 2, 'Lý Thị Cẩm',         '0912345004', '079098004567', 12,  'Mercedes', 'Đen',        'ENG-MER-015', 'CHS-MER-015', 2023, 'REG-015', '2023-05-01', '2029-05-01', 'APPROVED', TRUE);
SELECT setval('vehicles_vehicleid_seq', (SELECT MAX(VehicleID) FROM Vehicles));

-- 10. PARKING CARDS
INSERT INTO ParkingCards (CardID, Status) VALUES
('CARD-001', 'ACTIVE'),
('CARD-002', 'ACTIVE'),
('CARD-003', 'ACTIVE'),
('CARD-004', 'ACTIVE'),
('CARD-005', 'ACTIVE'),
('CARD-006', 'ACTIVE'),
('CARD-007', 'ACTIVE'),
('CARD-008', 'IN_USE'),
('CARD-009', 'IN_USE'),
('CARD-010', 'IN_USE'),
('CARD-LOST-01', 'LOST'),
('CARD-LOST-02', 'LOST');

-- 11. PARKING SESSIONS
INSERT INTO ParkingSessions (SessionID, VehicleID, SlotID, CardID, EntryTime, ExitTime, EntryGate, ExitGate, EntryImage, ExitImage, Status, EstimatedFee, FinalFee, CreatedBy) OVERRIDING SYSTEM VALUE VALUES
(1,  1,  8,  'CARD-008', NOW() - INTERVAL '2 hours',  NULL, 'Cổng-A', NULL, '/uploads/sessions/entry_1.jpg', NULL, 'PARKING',   20000, NULL,  4),
(2,  2,  10, 'CARD-009', NOW() - INTERVAL '30 minutes', NULL,'Cổng-A', NULL, '/uploads/sessions/entry_2.jpg', NULL, 'PARKING',   20000, NULL,  4),
(3,  6,  1,  'CARD-010', NOW() - INTERVAL '5 hours',  NULL, 'Cổng-B', NULL, '/uploads/sessions/entry_3.jpg', NULL, 'PARKING',   25000, NULL,  5),
(4,  11, 2,  NULL,       NOW() - INTERVAL '1 hour',   NULL, 'Cổng-B', NULL, '/uploads/sessions/entry_4.jpg', NULL, 'PARKING',    5000, NULL,  5),
(5,  9,  30, NULL,       NOW() - INTERVAL '7 hours',  NULL, 'Cổng-C', NULL, '/uploads/sessions/entry_5.jpg', NULL, 'PARKING',  105000, NULL,  4),
(6,  15, 36, NULL,       NOW() - INTERVAL '3 hours',  NULL, 'Cổng-Q7-A', NULL, '/uploads/sessions/entry_6.jpg', NULL, 'PARKING', 30000, NULL,  6),
(7,  7,  33, NULL,       NOW() - INTERVAL '4 hours',  NULL, 'Cổng-Q7-B', NULL, '/uploads/sessions/entry_7.jpg', NULL, 'PARKING', 20000, NULL,  7),
(8,  3,  6,  NULL, NOW() - INTERVAL '6 hours',  NOW() - INTERVAL '4 hours', 'Cổng-A','Cổng-A', '/uploads/sessions/entry_8.jpg', '/uploads/sessions/exit_8.jpg', 'COMPLETED', 20000, 20000, 4),
(9,  4,  7,  NULL, NOW() - INTERVAL '4 hours',  NOW() - INTERVAL '2 hours', 'Cổng-A','Cổng-A', '/uploads/sessions/entry_9.jpg', '/uploads/sessions/exit_9.jpg', 'COMPLETED', 20000, 20000, 4),
(10, 5,  13, NULL, NOW() - INTERVAL '3 hours',  NOW() - INTERVAL '1 hour',  'Cổng-A','Cổng-A', '/uploads/sessions/entry_10.jpg', '/uploads/sessions/exit_10.jpg', 'COMPLETED', 20000, 20000, 5),
(11, 7,  19, NULL, NOW() - INTERVAL '5 hours',  NOW() - INTERVAL '1 hour',  'Cổng-B','Cổng-B', '/uploads/sessions/entry_11.jpg', '/uploads/sessions/exit_11.jpg', 'COMPLETED', 20000, 20000, 5),
(12, 1,  23, NULL, NOW() - INTERVAL '8 hours',  NOW() - INTERVAL '6 hours', 'Cổng-A','Cổng-A', '/uploads/sessions/entry_12.jpg', '/uploads/sessions/exit_12.jpg', 'COMPLETED', 40000, 40000, 4),
(13, 6,  16, NULL, NOW() - INTERVAL '7 hours',  NOW() - INTERVAL '5 hours', 'Cổng-B','Cổng-B', '/uploads/sessions/entry_13.jpg', '/uploads/sessions/exit_13.jpg', 'COMPLETED', 10000, 10000, 4),
(14, 8,  17, NULL, NOW() - INTERVAL '4 hours',  NOW() - INTERVAL '2 hours', 'Cổng-B','Cổng-B', '/uploads/sessions/entry_14.jpg', '/uploads/sessions/exit_14.jpg', 'COMPLETED',  5000,  5000, 5),
(15, 10, 31, NULL, NOW() - INTERVAL '6 hours',  NOW() - INTERVAL '2 hours', 'Cổng-C','Cổng-C', '/uploads/sessions/entry_15.jpg', '/uploads/sessions/exit_15.jpg', 'COMPLETED', 60000, 60000, 4),
(16, 2,  21, NULL, NOW() - INTERVAL '1 day' + INTERVAL '8 hours',  NOW() - INTERVAL '1 day' + INTERVAL '18 hours', 'Cổng-A','Cổng-A', '/uploads/sessions/entry_16.jpg', '/uploads/sessions/exit_16.jpg', 'COMPLETED',150000,150000,4),
(17, 3,  11, NULL, NOW() - INTERVAL '1 day' + INTERVAL '7 hours',  NOW() - INTERVAL '1 day' + INTERVAL '12 hours', 'Cổng-A','Cổng-A', '/uploads/sessions/entry_17.jpg', '/uploads/sessions/exit_17.jpg', 'COMPLETED', 75000, 75000,5),
(18, 5,  26, NULL, NOW() - INTERVAL '1 day' + INTERVAL '9 hours',  NOW() - INTERVAL '1 day' + INTERVAL '20 hours', 'Cổng-A','Cổng-A', '/uploads/sessions/entry_18.jpg', '/uploads/sessions/exit_18.jpg', 'COMPLETED',200000,200000,4),
(19, 6,  4,  NULL, NOW() - INTERVAL '1 day' + INTERVAL '6 hours',  NOW() - INTERVAL '1 day' + INTERVAL '10 hours', 'Cổng-B','Cổng-B', '/uploads/sessions/entry_19.jpg', '/uploads/sessions/exit_19.jpg', 'COMPLETED', 20000, 20000,5),
(20, 7,  39, NULL, NOW() - INTERVAL '1 day' + INTERVAL '10 hours', NOW() - INTERVAL '1 day' + INTERVAL '15 hours', 'Cổng-Q7-B','Cổng-Q7-B', '/uploads/sessions/entry_20.jpg', '/uploads/sessions/exit_20.jpg', 'COMPLETED',25000, 25000,6),
(21, 1,  14, NULL, NOW() - INTERVAL '2 days' + INTERVAL '7 hours',  NOW() - INTERVAL '2 days' + INTERVAL '19 hours','Cổng-A','Cổng-A', '/uploads/sessions/entry_21.jpg', '/uploads/sessions/exit_21.jpg', 'COMPLETED',150000,150000,4),
(22, 4,  25, NULL, NOW() - INTERVAL '2 days' + INTERVAL '8 hours',  NOW() - INTERVAL '2 days' + INTERVAL '11 hours','Cổng-B','Cổng-B', '/uploads/sessions/entry_22.jpg', '/uploads/sessions/exit_22.jpg', 'COMPLETED', 15000, 15000,5),
(23, 8,  29, NULL, NOW() - INTERVAL '2 days' + INTERVAL '6 hours',  NOW() - INTERVAL '2 days' + INTERVAL '9 hours', 'Cổng-B','Cổng-B', '/uploads/sessions/entry_23.jpg', '/uploads/sessions/exit_23.jpg', 'COMPLETED', 15000, 15000,5),
(24, 11, 3,  NULL, NOW() - INTERVAL '10 hours', NULL, 'Cổng-B', NULL, '/uploads/sessions/entry_24.jpg', NULL, 'LOST_TICKET', 50000, NULL, 5),
(25, 13, 20, NULL, NOW() - INTERVAL '6 hours',  NULL, 'Cổng-A', NULL, '/uploads/sessions/entry_25.jpg', NULL, 'LOST_TICKET', 200000, NULL, 4),
(26, 12, 2,  NULL, NOW() - INTERVAL '2 days' + INTERVAL '22 hours', NOW() - INTERVAL '2 days' + INTERVAL '23 hours', 'Cổng-B','Cổng-B', '/uploads/sessions/entry_26.jpg', '/uploads/sessions/exit_26.jpg', 'UNPAID', 10000, 10000, 5),
(27, 14, 18, NULL, NOW() - INTERVAL '3 days' + INTERVAL '14 hours', NOW() - INTERVAL '3 days' + INTERVAL '15 hours', 'Cổng-B','Cổng-B', '/uploads/sessions/entry_27.jpg', '/uploads/sessions/exit_27.jpg', 'UNPAID',  5000,  5000, 4),
(28, 6,  4,  NULL, NOW() - INTERVAL '1 day' + INTERVAL '13 hours', NOW() - INTERVAL '1 day' + INTERVAL '14 hours', 'Cổng-A','Cổng-A', '/uploads/sessions/entry_28.jpg', '/uploads/sessions/exit_28.jpg', 'VIOLATION', 5000, 20000, 4),
(29, 9,  32, NULL, NOW() - INTERVAL '3 days' + INTERVAL '9 hours', NOW() - INTERVAL '3 days' + INTERVAL '11 hours', 'Cổng-C','Cổng-C', '/uploads/sessions/entry_29.jpg', '/uploads/sessions/exit_29.jpg', 'VIOLATION',30000, 60000, 5);
SELECT setval('parkingsessions_sessionid_seq', (SELECT MAX(SessionID) FROM ParkingSessions));

-- 12. RESERVATIONS
INSERT INTO Reservations (ReservationID, UserID, VehicleID, VehicleTypeID, SlotID, ReservationStart, ReservationEnd, Status, GuestName) OVERRIDING SYSTEM VALUE VALUES
(1,  9,  1,  2, 9,   NOW() + INTERVAL '1 hour',   NOW() + INTERVAL '5 hours',  'CONFIRMED', NULL),
(2,  10, 2,  2, 15,  NOW() + INTERVAL '30 minutes',NOW() + INTERVAL '4 hours', 'CONFIRMED', NULL),
(3,  12, 15, 2, 38,  NOW() + INTERVAL '2 hours',  NOW() + INTERVAL '6 hours',  'CONFIRMED', NULL),
(4,  11, 3,  2, 6,   NOW() + INTERVAL '3 hours',  NOW() + INTERVAL '7 hours',  'PENDING',   NULL),
(5,  13, 5,  2, 7,   NOW() + INTERVAL '5 hours',  NOW() + INTERVAL '9 hours',  'PENDING',   NULL),
(6,  14, 7,  1, 4,   NOW() + INTERVAL '1 hour',   NOW() + INTERVAL '3 hours',  'CONFIRMED', 'Nguyễn Văn Khách'),
(7,  9,  1,  2, 11,  NOW() - INTERVAL '1 day',    NOW() - INTERVAL '1 day' + INTERVAL '4 hours', 'CANCELLED', NULL),
(8,  10, 2,  2, 13,  NOW() - INTERVAL '2 days',   NOW() - INTERVAL '2 days' + INTERVAL '3 hours','CANCELLED', NULL),
(9,  11, 6,  1, 5,   NOW() - INTERVAL '3 hours',  NOW() - INTERVAL '1 hour',   'EXPIRED',   NULL),
(10, 12, 4,  2, 19,  NOW() - INTERVAL '5 hours',  NOW() - INTERVAL '3 hours',  'EXPIRED',   NULL),
(11, 9,  1,  2, 14,  NOW() - INTERVAL '1 day' + INTERVAL '7 hours',  NOW() - INTERVAL '1 day' + INTERVAL '11 hours', 'COMPLETED', NULL),
(12, 10, 2,  2, 11,  NOW() - INTERVAL '2 days' + INTERVAL '9 hours', NOW() - INTERVAL '2 days' + INTERVAL '13 hours','COMPLETED', NULL);
SELECT setval('reservations_reservationid_seq', (SELECT MAX(ReservationID) FROM Reservations));

-- 13. PAYMENTS
INSERT INTO Payments (PaymentID, SessionID, ReservationID, Amount, PaymentMethod, PaymentStatus, PaidAt) OVERRIDING SYSTEM VALUE VALUES
(1,  8,  NULL, 20000,  'CASH',           'PAID',     NOW() - INTERVAL '4 hours'),
(2,  9,  NULL, 20000,  'E_WALLET',       'PAID',     NOW() - INTERVAL '2 hours'),
(3,  10, NULL, 20000,  'BANK_TRANSFER', 'PAID',     NOW() - INTERVAL '1 hour'),
(4,  11, NULL, 20000,  'CREDIT_CARD',   'PAID',     NOW() - INTERVAL '1 hour'),
(5,  12, NULL, 40000,  'CASH',           'PAID',     NOW() - INTERVAL '6 hours'),
(6,  13, NULL, 10000,  'E_WALLET',       'PAID',     NOW() - INTERVAL '5 hours'),
(7,  14, NULL,  5000,  'CASH',           'PAID',     NOW() - INTERVAL '2 hours'),
(8,  15, NULL, 60000,  'BANK_TRANSFER', 'PAID',     NOW() - INTERVAL '2 hours'),
(9,  16, NULL,150000,  'BANK_TRANSFER', 'PAID',     NOW() - INTERVAL '1 day' + INTERVAL '18 hours'),
(10, 17, NULL, 75000,  'E_WALLET',       'PAID',     NOW() - INTERVAL '1 day' + INTERVAL '12 hours'),
(11, 18, NULL,200000,  'CREDIT_CARD',   'PAID',     NOW() - INTERVAL '1 day' + INTERVAL '20 hours'),
(12, 19, NULL, 20000,  'CASH',           'PAID',     NOW() - INTERVAL '1 day' + INTERVAL '10 hours'),
(13, 20, NULL, 25000,  'E_WALLET',       'PAID',     NOW() - INTERVAL '1 day' + INTERVAL '15 hours'),
(14, 21, NULL,150000,  'BANK_TRANSFER', 'PAID',     NOW() - INTERVAL '2 days' + INTERVAL '19 hours'),
(15, 22, NULL, 15000,  'CASH',           'PAID',     NOW() - INTERVAL '2 days' + INTERVAL '11 hours'),
(16, 23, NULL, 15000,  'CASH',           'PAID',     NOW() - INTERVAL '2 days' + INTERVAL '9 hours'),
(17, 26, NULL, 10000,  'CASH',           'PENDING', NULL),
(18, 27, NULL,  5000,  'CASH',           'PENDING', NULL),
(19, 28, NULL, 20000,  'CASH',           'PAID',     NOW() - INTERVAL '1 day' + INTERVAL '14 hours'),
(20, 29, NULL, 60000,  'CASH',           'PAID',     NOW() - INTERVAL '3 days' + INTERVAL '11 hours'),
(21, NULL, 11, 50000,  'E_WALLET',       'PAID',     NOW() - INTERVAL '1 day' + INTERVAL '7 hours'),
(22, NULL, 12, 50000,  'E_WALLET',       'PAID',     NOW() - INTERVAL '2 days' + INTERVAL '9 hours'),
(23, NULL, 1,  50000,  'E_WALLET',       'PENDING', NULL),
(24, NULL, 2,  50000,  'E_WALLET',       'PENDING', NULL),
(25, NULL, 3,  50000,  'E_WALLET',       'PENDING', NULL),
(26, NULL, 4,  50000,  'E_WALLET',       'FAILED',  NULL);
SELECT setval('payments_paymentid_seq', (SELECT MAX(PaymentID) FROM Payments));

-- 14. PAYMENT TRANSACTIONS
INSERT INTO PaymentTransactions (TransactionID, PaymentID, Gateway, TransactionRef, Amount, TransactionStatus, PaymentUrl, ResponseCode, ResponseMessage, CreatedAt, PaidAt) OVERRIDING SYSTEM VALUE VALUES
(1,  1,  'BANK_TRANSFER', 'VNPAY-S08-001',  20000, 'PAID',    NULL,'00','Thành toán thành công qua VNPAY',          NOW()-INTERVAL '4 hours',   NOW()-INTERVAL '4 hours'),
(2,  2,  'MOMO',           'MOMO-S09-002',   20000, 'PAID',    NULL,'00','Thành toán qua MoMo thành công',           NOW()-INTERVAL '2 hours',   NOW()-INTERVAL '2 hours'),
(3,  3,  'BANK_TRANSFER', 'BTF-S10-003',    20000, 'PAID',    NULL,'00','Chuyển khoản bưu điện thành công',         NOW()-INTERVAL '1 hour',    NOW()-INTERVAL '1 hour'),
(4,  4,  'ZALOPAY',        'ZALO-S11-004',   20000, 'PAID',    NULL,'00','Thành toán ví ZaloPay thành công',         NOW()-INTERVAL '1 hour',    NOW()-INTERVAL '1 hour'),
(5,  5,  'CASH',           'CASH-S12-005',   40000, 'PAID',    NULL,'00','Đã thu tiền mặt trực tiếp',                NOW()-INTERVAL '6 hours',   NOW()-INTERVAL '6 hours'),
(6,  6,  'MOMO',           'MOMO-S13-006',   10000, 'PAID',    NULL,'00','Thành toán MoMo thành công',               NOW()-INTERVAL '5 hours',   NOW()-INTERVAL '5 hours'),
(7,  7,  'CASH',           'CASH-S14-007',    5000, 'PAID',    NULL,'00','Đã thu tiền mặt tại bốt trực',             NOW()-INTERVAL '2 hours',   NOW()-INTERVAL '2 hours'),
(8,  8,  'BANK_TRANSFER', 'BTF-S15-008',    60000, 'PAID',    NULL,'00','Chuyển khoản thành công',                  NOW()-INTERVAL '2 hours',   NOW()-INTERVAL '2 hours'),
(9,  9,  'BANK_TRANSFER', 'BTF-S16-009',   150000, 'PAID',    NULL,'00','Chuyển khoản ngân hàng thành công',        NOW()-INTERVAL '1 day'+INTERVAL '18 hours', NOW()-INTERVAL '1 day'+INTERVAL '18 hours'),
(10, 10, 'BANK_TRANSFER', 'VNPAY-S17-010',  75000, 'PAID',    NULL,'00','Cổng thanh toán VNPAY duyệt thành công',   NOW()-INTERVAL '1 day'+INTERVAL '12 hours', NOW()-INTERVAL '1 day'+INTERVAL '12 hours'),
(11, 11, 'ZALOPAY',        'ZALO-S18-011',  200000, 'PAID',    NULL,'00','Thành toán qua bốt quét mã QR ZaloPay',    NOW()-INTERVAL '1 day'+INTERVAL '20 hours', NOW()-INTERVAL '1 day'+INTERVAL '20 hours'),
(12, 12, 'CASH',           'CASH-S19-012',   20000, 'PAID',    NULL,'00','Đã thu tiền mặt hoàn thành',               NOW()-INTERVAL '1 day'+INTERVAL '10 hours', NOW()-INTERVAL '1 day'+INTERVAL '10 hours'),
(13, 13, 'MOMO',           'MOMO-S20-013',   25000, 'PAID',    NULL,'00','Khách hàng thanh toán qua MoMo',          NOW()-INTERVAL '1 day'+INTERVAL '15 hours', NOW()-INTERVAL '1 day'+INTERVAL '15 hours'),
(14, 14, 'BANK_TRANSFER', 'BTF-S21-014',   150000, 'PAID',    NULL,'00','Nhận chuyển khoản ngân hàng',              NOW()-INTERVAL '2 days'+INTERVAL '19 hours',NOW()-INTERVAL '2 days'+INTERVAL '19 hours'),
(15, 15, 'CASH',           'CASH-S22-015',   15000, 'PAID',    NULL,'00','Thu tiền mặt kiểm vé',                     NOW()-INTERVAL '2 days'+INTERVAL '11 hours',NOW()-INTERVAL '2 days'+INTERVAL '11 hours'),
(16, 16, 'CASH',           'CASH-S23-016',   15000, 'PAID',    NULL,'00','Thu tiền mặt trực tiếp bốt cổng',          NOW()-INTERVAL '2 days'+INTERVAL '9 hours', NOW()-INTERVAL '2 days'+INTERVAL '9 hours'),
(17, 19, 'CASH',           'CASH-VIO-017',   20000, 'PAID',    NULL,'00','Thu phí phạt vi phạm bãi đỗ',              NOW()-INTERVAL '1 day'+INTERVAL '14 hours', NOW()-INTERVAL '1 day'+INTERVAL '14 hours'),
(18, 20, 'CASH',           'CASH-VIO-018',   60000, 'PAID',    NULL,'00','Thu phí vi phạm đỗ sai vị trí quy định',   NOW()-INTERVAL '3 days'+INTERVAL '11 hours',NOW()-INTERVAL '3 days'+INTERVAL '11 hours'),
(19, 21, 'MOMO',           'MOMO-RES-019',   50000, 'PAID',    NULL,'00','Đặt chỗ trực tuyến thành công qua app',    NOW()-INTERVAL '1 day'+INTERVAL '7 hours',  NOW()-INTERVAL '1 day'+INTERVAL '7 hours'),
(20, 22, 'BANK_TRANSFER', 'VNPAY-RES-020',  50000, 'PAID',    NULL,'00','Đặt chỗ bãi xe thành công',                NOW()-INTERVAL '2 days'+INTERVAL '9 hours', NOW()-INTERVAL '2 days'+INTERVAL '9 hours'),
(21, 23, 'BANK_TRANSFER', 'VNPAY-RES-021',  50000, 'PENDING', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?ref=VNPAY-RES-021', NULL,'Cho thanh toan VNPAY', NOW(), NULL),
(22, 24, 'MOMO',           'MOMO-RES-022',   50000, 'PENDING', 'https://test-payment.momo.vn/pay/MOMO-RES-022',                        NULL,'Cho thanh toan MoMo',  NOW(), NULL),
(23, 25, 'ZALOPAY',        'ZALO-RES-023',   50000, 'PENDING', 'https://sbgateway.zalopay.vn/openinapp?ZALO-RES-023',                  NULL,'Cho thanh toan ZaloPay',NOW(), NULL),
(24, 26, 'MOMO',           'MOMO-FAIL-024',  50000, 'FAILED',  NULL,'99','Giao dịch thất bại, tài khoản không đủ số dư',NOW()-INTERVAL '1 hour',   NULL),
(25, 17, 'BANK_TRANSFER', 'VNPAY-UNP-025',  10000, 'CANCELLED',NULL,'24','Khách chủ động hủy giao dịch thanh toán',  NOW()-INTERVAL '2 days',   NULL);
SELECT setval('paymenttransactions_transactionid_seq', (SELECT MAX(TransactionID) FROM PaymentTransactions));

-- 15. INCIDENT REPORTS
INSERT INTO IncidentReports (IncidentID, SessionID, ReportedBy, IncidentType, Description, Status) OVERRIDING SYSTEM VALUE VALUES
(1,  24, 5, 'LOST_TICKET',        'Khách báo mất vé xe máy. Xác minh qua camera Cổng-B lúc 8h30. Áp dụng phí mất vé 50.000đ.', 'RESOLVED'),
(2,  25, 4, 'LOST_TICKET',        'Ô tô làm mất thẻ từ phát hành. Khách tự xưng tên Nguyễn Thị Thanh. Đang chờ đối chiếu căn cước.', 'IN_PROGRESS'),
(3,  10, 5, 'WRONG_LICENSE_PLATE','Xe vào khai biển số 51E-55566 nhưng camera AI quét nhận diện là 51E-55560. Cần kiểm tra lại.', 'OPEN'),
(4,  18, 4, 'WRONG_LICENSE_PLATE','Biển số xe đăng ký bị mờ bùn nên hệ thống không đọc rõ. Đã xử lý thủ công bằng thẻ.', 'CLOSED'),
(5,  5,  4, 'OVERTIME',           'Xe tải đỗ tại C4-01 đã gửi quá 8 tiếng, vượt giới hạn 7 tiếng theo quy định nội bộ bãi.', 'IN_PROGRESS'),
(6,  1,  5, 'OVERTIME',           'Xe tại ô B1-03 quá giờ đóng cửa tòa nhà dự kiến. Khách phản hồi xin ra muộn một chút.', 'RESOLVED'),
(7,  28, 4, 'WRONG_ZONE',          'Xe máy 50L-11111 đỗ nhầm vào vị trí khu vực dành riêng cho ô tô tầng 1. Đã nhắc nhở di dời.', 'CLOSED'),
(8,  29, 5, 'WRONG_ZONE',          'Xe tải 51F-99999 cố tình đỗ tại khu vực xe máy tầng 1. Vi phạm nghiêm trọng, tiến hành lập biên bản phạt.', 'RESOLVED'),
(9,  26, 5, 'UNPAID',              'Xe 43B-55555 thoát khỏi bãi trong lúc ca trực nhân viên bận đổi ca chưa kịp thu phí 10.000đ.', 'IN_PROGRESS'),
(10, 27, 4, 'UNPAID',              'Xe 51Q-77777 của khách hàng đã bị khóa tài khoản cố tình không đóng tiền bãi cũ.', 'OPEN'),
(11, NULL, 5, 'SLOT_OCCUPIED',    'Vị trí ô B1-04 đã được ĐẶT TRƯỚC cho khách hẹn, nhưng có xe vãng lai khác đỗ đè vào.', 'OPEN'),
(12, NULL, 4, 'SLOT_OCCUPIED',    'Ô đỗ B1-07 đang khóa để bảo trì kỹ thuật nhưng có xe khác lùi vào đỗ. Đã cho bảo vệ xử lý.', 'RESOLVED'),
(13, NULL, 4, 'FACILITY_DAMAGE',  'Thanh chắn Barrier tại Cổng-C bị xe húc lệch trục, không hạ xuống được. Đã báo kỹ thuật sửa.', 'IN_PROGRESS'),
(14, NULL, 6, 'FACILITY_DAMAGE',  'Camera giám sát góc Q7-B1 bị lỏng giá đỡ khiến lệch hướng, không quan sát hết các góc ô đỗ.', 'OPEN'),
(15, NULL, 5, 'FACILITY_DAMAGE',  'Hệ thống đèn chiếu sáng hành lang tầng 3 khu B bị chập nguồn gây tối cục bộ. Đã sửa xong.', 'CLOSED'),
(16, NULL, 4, 'OTHER',            'Khách hàng phản ánh vị trí tầng mái che không phủ kín, xe bị ướt khi trời mưa giông.', 'OPEN'),
(17, NULL, 6, 'OTHER',            'Khách để quên một chiếc ba lô vải màu đen tại ô Q7-B1-02. Đã cất vào kho đồ thất lạc chờ nhận.', 'RESOLVED');
SELECT setval('incidentreports_incidentid_seq', (SELECT MAX(IncidentID) FROM IncidentReports));

-- 16. MONTHLY SUBSCRIPTIONS
INSERT INTO MonthlySubscriptions (SubscriptionID, UserID, VehicleID, SlotID, ZoneID, StartDate, EndDate, MonthlyFee, Status) OVERRIDING SYSTEM VALUE VALUES
(1,  9,  1,  9,    NULL, '2026-06-01', '2026-06-30', 1500000, 'ACTIVE'),
(2,  10, 2,  15,   NULL, '2026-06-01', '2026-06-30', 1500000, 'ACTIVE'),
(3,  11, 6,  NULL, 1,    '2026-06-01', '2026-06-30',  500000, 'ACTIVE'),
(4,  12, 15, 38,   NULL, '2026-06-01', '2026-06-30', 1500000, 'ACTIVE'),
(5,  13, 5,  NULL, 4,    '2026-06-01', '2026-06-30', 1200000, 'ACTIVE'),
(6,  9,  1,  9,    NULL, '2026-05-01', '2026-05-31', 1500000, 'EXPIRED'),
(7,  11, 6,  NULL, 1,    '2026-05-01', '2026-05-31',  500000, 'EXPIRED'),
(8,  14, 7,  NULL, 3,    '2026-05-01', '2026-05-31',  500000, 'EXPIRED'),
(9,  10, 2,  11,   NULL, '2026-04-01', '2026-04-30', 1500000, 'EXPIRED'),
(10, 12, 4,  NULL, 6,    '2026-05-01', '2026-05-31', 1200000, 'CANCELLED'),
(11, 15, 8,  NULL, 1,    '2026-04-01', '2026-04-30',  500000, 'CANCELLED');
SELECT setval('monthlysubscriptions_subscriptionid_seq', (SELECT MAX(SubscriptionID) FROM MonthlySubscriptions));

-- 17. PARKING PREDICTIONS
INSERT INTO ParkingPredictions (PredictionID, VehicleTypeID, FloorID, PredictedOccupancyRate, PredictedPeakHour, PredictionDate) OVERRIDING SYSTEM VALUE VALUES
(1,  1, 1, 87.00, 8,  CURRENT_DATE),
(2,  1, 1, 95.00, 17, CURRENT_DATE),
(3,  2, 1, 72.00, 9,  CURRENT_DATE),
(4,  2, 1, 81.00, 18, CURRENT_DATE),
(5,  1, 2, 60.00, 8,  CURRENT_DATE),
(6,  2, 2, 55.00, 9,  CURRENT_DATE),
(7,  3, 4, 50.00, 7,  CURRENT_DATE),
(8,  1, 5, 75.00, 8,  CURRENT_DATE),
(9,  2, 5, 65.00, 9,  CURRENT_DATE),
(10, 1, 1, 82.00, 8,  CURRENT_DATE + 1),
(11, 1, 1, 91.00, 17, CURRENT_DATE + 1),
(12, 2, 1, 68.00, 9,  CURRENT_DATE + 1),
(13, 2, 1, 78.00, 18, CURRENT_DATE + 1),
(14, 1, 2, 55.00, 8,  CURRENT_DATE + 1),
(15, 1, 5, 70.00, 8,  CURRENT_DATE + 1),
(16, 2, 5, 58.00, 10, CURRENT_DATE + 1),
(17, 1, 1, 90.00, 8,  CURRENT_DATE - 1),
(18, 1, 1, 97.00, 17, CURRENT_DATE - 1),
(19, 2, 1, 75.00, 9,  CURRENT_DATE - 1),
(20, 1, 5, 78.00, 8,  CURRENT_DATE - 1);
SELECT setval('parkingpredictions_predictionid_seq', (SELECT MAX(PredictionID) FROM ParkingPredictions));

-- Kiểm tra số lượng dòng sau khi chèn thành công
SELECT 'Roles' AS table_name, COUNT(*) AS rows FROM Roles UNION ALL
SELECT 'Users', COUNT(*) FROM Users UNION ALL
SELECT 'Buildings', COUNT(*) FROM Buildings UNION ALL
SELECT 'Floors', COUNT(*) FROM Floors UNION ALL
SELECT 'Zones', COUNT(*) FROM Zones UNION ALL
SELECT 'VehicleTypes', COUNT(*) FROM VehicleTypes UNION ALL
SELECT 'Vehicles', COUNT(*) FROM Vehicles UNION ALL
SELECT 'ParkingSlots', COUNT(*) FROM ParkingSlots UNION ALL
SELECT 'PricingPolicies', COUNT(*) FROM PricingPolicies UNION ALL
SELECT 'ParkingCards', COUNT(*) FROM ParkingCards UNION ALL
SELECT 'ParkingSessions', COUNT(*) FROM ParkingSessions UNION ALL
SELECT 'Reservations', COUNT(*) FROM Reservations UNION ALL
SELECT 'Payments', COUNT(*) FROM Payments UNION ALL
SELECT 'PaymentTransactions', COUNT(*) FROM PaymentTransactions UNION ALL
SELECT 'IncidentReports', COUNT(*) FROM IncidentReports UNION ALL
SELECT 'MonthlySubscriptions', COUNT(*) FROM MonthlySubscriptions UNION ALL
SELECT 'ParkingPredictions', COUNT(*) FROM ParkingPredictions
ORDER BY 1;