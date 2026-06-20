-- =========================================================
-- ParkingManagementSystem - PostgreSQL Version
-- Converted from SQL Server (v8)
-- =========================================================

-- Xóa tables nếu đã tồn tại (theo thứ tự dependency)
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
-- ROLE & USER MANAGEMENT
-- =========================================================
CREATE TABLE Roles (
    RoleID      SERIAL PRIMARY KEY,
    RoleName    VARCHAR(50)  UNIQUE NOT NULL,
    Description VARCHAR(255)
);

CREATE TABLE Users (
    UserID       SERIAL PRIMARY KEY,
    FullName     VARCHAR(100) NOT NULL,
    Email        VARCHAR(100) UNIQUE NOT NULL,
    PhoneNumber  VARCHAR(20)  UNIQUE NOT NULL,
    DateOfBirth  DATE,
    Address      VARCHAR(255),
    PasswordHash VARCHAR(255) NOT NULL,
    RoleID       INT NOT NULL,
    IsActive     BOOLEAN DEFAULT TRUE,
    CreatedAt    TIMESTAMP DEFAULT NOW(),
    CONSTRAINT FK_Users_Roles
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

-- =========================================================
-- BUILDING MANAGEMENT
-- =========================================================
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
    CONSTRAINT FK_Floors_Buildings
        FOREIGN KEY (BuildingID) REFERENCES Buildings(BuildingID),
    CONSTRAINT UQ_Building_Floor UNIQUE (BuildingID, FloorNumber)
);

CREATE TABLE Zones (
    ZoneID      SERIAL PRIMARY KEY,
    FloorID     INT NOT NULL,
    ZoneName    VARCHAR(50) NOT NULL,
    Description VARCHAR(255),
    CONSTRAINT FK_Zones_Floors
        FOREIGN KEY (FloorID) REFERENCES Floors(FloorID),
    CONSTRAINT UQ_Floor_Zone UNIQUE (FloorID, ZoneName)
);

-- =========================================================
-- VEHICLE TYPES
-- =========================================================
CREATE TABLE VehicleTypes (
    VehicleTypeID SERIAL PRIMARY KEY,
    TypeName      VARCHAR(50) NOT NULL UNIQUE,
    Description   VARCHAR(255)
);

-- =========================================================
-- VEHICLES
-- =========================================================
CREATE TABLE Vehicles (
    VehicleID       SERIAL PRIMARY KEY,
    LicensePlate    VARCHAR(20)  NOT NULL UNIQUE,
    VehicleTypeID   INT NOT NULL,
    OwnerName       VARCHAR(100) NULL,
    OwnerPhone      VARCHAR(20)  NULL,
    UserID          INT          NULL,
    Brand           VARCHAR(50)  NULL,
    VehicleColor    VARCHAR(30)  NULL,
    EngineNumber    VARCHAR(50)  NULL,
    ChassisNumber   VARCHAR(50)  NULL,
    ManufactureYear INT          NULL,
    VehicleImage    VARCHAR(255) NULL,
    IsActive        BOOLEAN DEFAULT TRUE,
    CONSTRAINT FK_Vehicles_VehicleTypes
        FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT FK_Vehicles_Users
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE UNIQUE INDEX UQ_Vehicles_EngineNumber
    ON Vehicles (EngineNumber)
    WHERE EngineNumber IS NOT NULL;

CREATE UNIQUE INDEX UQ_Vehicles_ChassisNumber
    ON Vehicles (ChassisNumber)
    WHERE ChassisNumber IS NOT NULL;

-- =========================================================
-- PARKING SLOT MANAGEMENT
-- =========================================================
CREATE TABLE ParkingSlots (
    SlotID           SERIAL PRIMARY KEY,
    ZoneID           INT NOT NULL,
    SlotCode         VARCHAR(20) NOT NULL UNIQUE,
    VehicleTypeID    INT NOT NULL,
    Area             DECIMAL(10,2) NULL,
    Capacity         INT NOT NULL DEFAULT 1,
    CurrentOccupancy INT NOT NULL DEFAULT 0,
    Status           VARCHAR(20) NOT NULL
        CHECK (Status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'LOCKED')),
    IsActive         BOOLEAN DEFAULT TRUE,
    CONSTRAINT FK_ParkingSlots_Zones
        FOREIGN KEY (ZoneID) REFERENCES Zones(ZoneID),
    CONSTRAINT FK_ParkingSlots_VehicleTypes
        FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT CHK_Occupancy_Not_Exceed_Capacity
        CHECK (CurrentOccupancy <= Capacity),
    CONSTRAINT CHK_Occupancy_Not_Negative
        CHECK (CurrentOccupancy >= 0)
);

-- =========================================================
-- PRICING POLICY
-- =========================================================
CREATE TABLE PricingPolicies (
    PricingPolicyID    SERIAL PRIMARY KEY,
    VehicleTypeID      INT NOT NULL,
    PolicyName         VARCHAR(100),
    BasePrice          DECIMAL(10,2) NOT NULL,
    RushHourPrice      DECIMAL(10,2) NOT NULL,
    OffPeakPrice       DECIMAL(10,2) NOT NULL,
    RushHourStart      TIME          NOT NULL,
    RushHourEnd        TIME          NOT NULL,
    MaxDailyRate       DECIMAL(10,2),
    LostTicketFee      DECIMAL(10,2),
    OvertimeFeePerHour DECIMAL(10,2),
    EffectiveFrom      TIMESTAMP NOT NULL,
    EffectiveTo        TIMESTAMP,
    CONSTRAINT FK_PricingPolicies_VehicleTypes
        FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT CHK_RushHour_Time
        CHECK (RushHourStart < RushHourEnd),
    CONSTRAINT CHK_PricingPolicies_NonNegative
        CHECK (
            BasePrice >= 0
            AND RushHourPrice >= 0
            AND OffPeakPrice >= 0
            AND (MaxDailyRate IS NULL OR MaxDailyRate >= 0)
            AND (LostTicketFee IS NULL OR LostTicketFee >= 0)
            AND (OvertimeFeePerHour IS NULL OR OvertimeFeePerHour >= 0)
        ),
    CONSTRAINT CHK_PricingPolicies_Effective_Time
        CHECK (EffectiveTo IS NULL OR EffectiveTo > EffectiveFrom)
);

-- =========================================================
-- PARKING CARDS
-- =========================================================
CREATE TABLE ParkingCards (
    CardID    VARCHAR(50) PRIMARY KEY,
    Status    VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (Status IN ('ACTIVE', 'IN_USE', 'LOST')),
    CreatedAt TIMESTAMP DEFAULT NOW()
);

-- =========================================================
-- PARKING SESSION
-- =========================================================
CREATE TABLE ParkingSessions (
    SessionID    SERIAL PRIMARY KEY,
    VehicleID    INT NOT NULL,
    SlotID       INT NOT NULL,
    CardID       VARCHAR(50) NULL,
    EntryTime    TIMESTAMP NOT NULL DEFAULT NOW(),
    ExitTime     TIMESTAMP NULL,
    EntryGate    VARCHAR(50),
    ExitGate     VARCHAR(50),
    Status       VARCHAR(20) NOT NULL
        CHECK (Status IN ('PARKING', 'COMPLETED', 'LOST_TICKET', 'UNPAID', 'VIOLATION')),
    EstimatedFee DECIMAL(10,2),
    FinalFee     DECIMAL(10,2),
    CreatedBy    INT,
    CONSTRAINT FK_ParkingSessions_Vehicles
        FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    CONSTRAINT FK_ParkingSessions_Slots
        FOREIGN KEY (SlotID)    REFERENCES ParkingSlots(SlotID),
    CONSTRAINT FK_ParkingSessions_Cards
        FOREIGN KEY (CardID)    REFERENCES ParkingCards(CardID),
    CONSTRAINT FK_ParkingSessions_Users
        FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    CONSTRAINT CHK_Session_Time
        CHECK (ExitTime IS NULL OR ExitTime >= EntryTime),
    CONSTRAINT CHK_ParkingSessions_Fee_NonNegative
        CHECK (
            (EstimatedFee IS NULL OR EstimatedFee >= 0)
            AND (FinalFee IS NULL OR FinalFee >= 0)
        )
);

CREATE UNIQUE INDEX UQ_ParkingSessions_ActiveParkingVehicle
    ON ParkingSessions (VehicleID)
    WHERE Status = 'PARKING';

-- =========================================================
-- RESERVATION SYSTEM
-- =========================================================
CREATE TABLE Reservations (
    ReservationID    SERIAL PRIMARY KEY,
    UserID           INT NOT NULL,
    VehicleID        INT NOT NULL,
    VehicleTypeID    INT NOT NULL,
    SlotID           INT NOT NULL,
    ReservationStart TIMESTAMP NOT NULL,
    ReservationEnd   TIMESTAMP NOT NULL,
    Status           VARCHAR(20)
        CHECK (Status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED')),
    CreatedAt        TIMESTAMP DEFAULT NOW(),
    GuestName        VARCHAR(100) NULL,
    CONSTRAINT FK_Reservations_Users
        FOREIGN KEY (UserID)        REFERENCES Users(UserID),
    CONSTRAINT FK_Reservations_Vehicles
        FOREIGN KEY (VehicleID)     REFERENCES Vehicles(VehicleID),
    CONSTRAINT FK_Reservations_VehicleTypes
        FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT FK_Reservations_Slots
        FOREIGN KEY (SlotID)        REFERENCES ParkingSlots(SlotID),
    CONSTRAINT CHK_Reservation_Time
        CHECK (ReservationEnd > ReservationStart)
);

-- =========================================================
-- PAYMENT MANAGEMENT
-- =========================================================
CREATE TABLE Payments (
    PaymentID     SERIAL PRIMARY KEY,
    SessionID     INT NULL,
    ReservationID INT NULL,
    Amount        DECIMAL(10,2) NOT NULL,
    PaymentMethod VARCHAR(30)
        CHECK (PaymentMethod IN ('CASH', 'BANK_TRANSFER', 'E_WALLET', 'CREDIT_CARD')),
    PaymentStatus VARCHAR(20)
        CHECK (PaymentStatus IN ('PENDING', 'PAID', 'FAILED')),
    PaidAt        TIMESTAMP,
    CONSTRAINT FK_Payments_Sessions
        FOREIGN KEY (SessionID) REFERENCES ParkingSessions(SessionID),
    CONSTRAINT FK_Payments_Reservations
        FOREIGN KEY (ReservationID) REFERENCES Reservations(ReservationID),
    CONSTRAINT CHK_Payments_Amount_NonNegative
        CHECK (Amount >= 0),
    CONSTRAINT CHK_Payments_SessionOrReservation
        CHECK (
            (SessionID IS NOT NULL AND ReservationID IS NULL)
            OR
            (SessionID IS NULL AND ReservationID IS NOT NULL)
        )
);

CREATE UNIQUE INDEX UQ_Payments_Session
    ON Payments (SessionID)
    WHERE SessionID IS NOT NULL;

CREATE UNIQUE INDEX UQ_Payments_Reservation
    ON Payments (ReservationID)
    WHERE ReservationID IS NOT NULL;

-- =========================================================
-- PAYMENT TRANSACTION
-- =========================================================
CREATE TABLE PaymentTransactions (
    TransactionID     SERIAL PRIMARY KEY,
    PaymentID         INT NOT NULL,
    Gateway           VARCHAR(30) NOT NULL
        CHECK (Gateway IN ('VNPAY', 'MOMO', 'ZALOPAY', 'BANK_TRANSFER')),
    TransactionRef    VARCHAR(100) NOT NULL UNIQUE,
    Amount            DECIMAL(10,2) NOT NULL,
    TransactionStatus VARCHAR(20) NOT NULL
        CHECK (TransactionStatus IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED')),
    PaymentUrl        VARCHAR(1000) NULL,
    ResponseCode      VARCHAR(20) NULL,
    ResponseMessage   VARCHAR(255) NULL,
    CreatedAt         TIMESTAMP NOT NULL DEFAULT NOW(),
    PaidAt            TIMESTAMP NULL,
    CONSTRAINT FK_PaymentTransactions_Payments
        FOREIGN KEY (PaymentID) REFERENCES Payments(PaymentID),
    CONSTRAINT CHK_PaymentTransactions_Amount_NonNegative
        CHECK (Amount >= 0)
);

-- =========================================================
-- INCIDENT MANAGEMENT
-- =========================================================
CREATE TABLE IncidentReports (
    IncidentID   SERIAL PRIMARY KEY,
    SessionID    INT NULL,
    ReportedBy   INT NOT NULL,
    IncidentType VARCHAR(50)
        CHECK (IncidentType IN (
            'LOST_TICKET',
            'WRONG_LICENSE_PLATE',
            'OVERTIME',
            'WRONG_ZONE',
            'UNPAID',
            'SLOT_OCCUPIED',
            'FACILITY_DAMAGE',
            'OTHER'
        )),
    Description   VARCHAR(500),
    Status        VARCHAR(20)
        CHECK (Status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    CreatedAt     TIMESTAMP DEFAULT NOW(),
    IncidentImage VARCHAR(255) NULL,
    CONSTRAINT FK_IncidentReports_Sessions
        FOREIGN KEY (SessionID)  REFERENCES ParkingSessions(SessionID),
    CONSTRAINT FK_IncidentReports_Users
        FOREIGN KEY (ReportedBy) REFERENCES Users(UserID)
);

-- =========================================================
-- MONTHLY SUBSCRIPTION
-- =========================================================
CREATE TABLE MonthlySubscriptions (
    SubscriptionID SERIAL PRIMARY KEY,
    UserID         INT NOT NULL,
    VehicleID      INT NOT NULL,
    SlotID         INT NULL,
    ZoneID         INT NULL,
    StartDate      DATE NOT NULL,
    EndDate        DATE NOT NULL,
    MonthlyFee     DECIMAL(10,2) NOT NULL,
    Status         VARCHAR(20) NOT NULL
        CHECK (Status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    CreatedAt      TIMESTAMP DEFAULT NOW(),
    CONSTRAINT CHK_Slot_Or_Zone
        CHECK (SlotID IS NOT NULL OR ZoneID IS NOT NULL),
    CONSTRAINT CHK_Subscription_Time
        CHECK (EndDate >= StartDate),
    CONSTRAINT CHK_MonthlySubscriptions_Fee_NonNegative
        CHECK (MonthlyFee >= 0),
    CONSTRAINT FK_Subscriptions_Users
        FOREIGN KEY (UserID)    REFERENCES Users(UserID),
    CONSTRAINT FK_Subscriptions_Vehicles
        FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    CONSTRAINT FK_Subscriptions_Slots
        FOREIGN KEY (SlotID)    REFERENCES ParkingSlots(SlotID),
    CONSTRAINT FK_Subscriptions_Zones
        FOREIGN KEY (ZoneID)    REFERENCES Zones(ZoneID)
);

CREATE UNIQUE INDEX UQ_MonthlySubscriptions_ActiveVehicle
    ON MonthlySubscriptions (VehicleID)
    WHERE Status = 'ACTIVE';

-- =========================================================
-- AI OPTIMIZATION SUPPORT
-- =========================================================
CREATE TABLE ParkingPredictions (
    PredictionID           SERIAL PRIMARY KEY,
    VehicleTypeID          INT,
    FloorID                INT,
    PredictedOccupancyRate DECIMAL(5,2),
    PredictedPeakHour      INT,
    PredictionDate         DATE,
    GeneratedAt            TIMESTAMP DEFAULT NOW(),
    CONSTRAINT FK_ParkingPredictions_VehicleTypes
        FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT FK_ParkingPredictions_Floors
        FOREIGN KEY (FloorID) REFERENCES Floors(FloorID)
);


-- =========================================================
-- SEED DATA
-- =========================================================

INSERT INTO Roles (RoleID, RoleName, Description) OVERRIDING SYSTEM VALUE VALUES
(1, 'Admin',           'Quan tri he thong'),
(2, 'ParkingManager',  'Quan ly bai xe'),
(3, 'ParkingStaff',    'Nhan vien truc cong'),
(4, 'Driver',          'Nguoi dung gui xe');
SELECT setval('roles_roleid_seq', (SELECT MAX(RoleID) FROM Roles));

INSERT INTO Users (UserID, FullName, Email, PhoneNumber, PasswordHash, RoleID, IsActive) OVERRIDING SYSTEM VALUE VALUES
(1, 'Nguyen Van Admin',  'admin@parking.vn',        '0901000001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 1, TRUE),
(2, 'Tran Thi Lan',      'lan.manager@parking.vn',  '0901000002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 2, TRUE),
(3, 'Le Minh Tuan',      'tuan.staff@parking.vn',   '0901000003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 3, TRUE),
(4, 'Pham Thi Hoa',      'hoa.staff@parking.vn',    '0901000004', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 3, TRUE),
(5, 'Nguyen Hoang Phuc', 'phuc@gmail.com',          '0912345001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 4, TRUE),
(6, 'Vo Thi Mai',        'mai@gmail.com',           '0912345002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 4, TRUE),
(7, 'Dang Quoc Hung',    'hung@gmail.com',          '0912345003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 4, TRUE);
SELECT setval('users_userid_seq', (SELECT MAX(UserID) FROM Users));

INSERT INTO Buildings (BuildingID, BuildingName, Address, TotalFloors, OperatingStartTime, OperatingEndTime) OVERRIDING SYSTEM VALUE VALUES
(1, 'Toa nha gui xe Quan 1', '120 Le Loi, Q.1, TP.HCM',        4, '06:00', '23:00'),
(2, 'Toa nha gui xe Quan 7', '88 Nguyen Thi Thap, Q.7, TP.HCM', 3, '05:30', '23:30');
SELECT setval('buildings_buildingid_seq', (SELECT MAX(BuildingID) FROM Buildings));

INSERT INTO Floors (FloorID, BuildingID, FloorNumber, FloorName) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 'Tang 1 - Tret'),
(2, 1, 2, 'Tang 2'),
(3, 1, 3, 'Tang 3'),
(4, 1, 4, 'Tang 4 - Mai'),
(5, 2, 1, 'Tang 1 - Tret'),
(6, 2, 2, 'Tang 2'),
(7, 2, 3, 'Tang 3 - Mai');
SELECT setval('floors_floorid_seq', (SELECT MAX(FloorID) FROM Floors));

INSERT INTO Zones (ZoneID, FloorID, ZoneName, Description) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'Zone A', 'Khu vuc xe may tang 1'),
(2, 1, 'Zone B', 'Khu vuc o to tang 1'),
(3, 2, 'Zone A', 'Khu vuc xe may tang 2'),
(4, 2, 'Zone B', 'Khu vuc o to tang 2'),
(5, 3, 'Zone A', 'Khu vuc xe may tang 3'),
(6, 4, 'Zone A', 'Khu vuc xe tai tang 4');
SELECT setval('zones_zoneid_seq', (SELECT MAX(ZoneID) FROM Zones));

INSERT INTO VehicleTypes (VehicleTypeID, TypeName, Description) OVERRIDING SYSTEM VALUE VALUES
(1, 'Xe may',     'Xe may, xe tay ga duoi 175cc'),
(2, 'O to',       'Xe o to con duoi 7 cho'),
(3, 'Xe tai nho', 'Xe tai duoi 2 tan');
SELECT setval('vehicletypes_vehicletypeid_seq', (SELECT MAX(VehicleTypeID) FROM VehicleTypes));

INSERT INTO PricingPolicies
    (PricingPolicyID, VehicleTypeID, PolicyName, BasePrice,
     RushHourPrice, OffPeakPrice, RushHourStart, RushHourEnd,
     MaxDailyRate, LostTicketFee, OvertimeFeePerHour, EffectiveFrom) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'Gia xe may 2024',   5000,   6000,  5000, '07:00', '09:00',  50000,  50000,   NULL, '2024-01-01'),
(2, 2, 'Gia o to 2024',    10000,  20000, 15000, '07:00', '09:00', 150000, 200000, 25000, '2024-01-01'),
(3, 3, 'Gia xe tai 2024',  15000,  25000, 20000, '07:00', '09:00', 200000, 300000, 30000, '2024-01-01');
SELECT setval('pricingpolicies_pricingpolicyid_seq', (SELECT MAX(PricingPolicyID) FROM PricingPolicies));

INSERT INTO ParkingSlots (SlotID, ZoneID, SlotCode, VehicleTypeID, Area, Capacity, CurrentOccupancy, Status, IsActive) OVERRIDING SYSTEM VALUE VALUES
(1,  1, 'A1',      1, 50.00, 20, 12, 'AVAILABLE', TRUE),
(2,  1, 'A2',      1, 40.00, 15,  8, 'AVAILABLE', TRUE),
(3,  1, 'A3',      1, 30.00, 10, 10, 'OCCUPIED',  TRUE),
(4,  2, 'B-01',    2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(5,  2, 'B-02',    2, 15.00,  1,  1, 'OCCUPIED',  TRUE),
(6,  2, 'B-03',    2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(7,  2, 'B-04',    2, 15.00,  1,  0, 'RESERVED',  TRUE),
(8,  2, 'B-05',    2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(9,  2, 'B-06',    2, 15.00,  1,  0, 'LOCKED',    TRUE),
(10, 3, 'A1-T2',   1, 60.00, 25, 10, 'AVAILABLE', TRUE),
(11, 3, 'A2-T2',   1, 50.00, 20,  5, 'AVAILABLE', TRUE),
(12, 4, 'B-T2-01', 2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(13, 4, 'B-T2-02', 2, 15.00,  1,  1, 'OCCUPIED',  TRUE),
(14, 4, 'B-T2-03', 2, 15.00,  1,  0, 'AVAILABLE', TRUE),
(15, 5, 'A1-T3',   1, 70.00, 30,  0, 'AVAILABLE', TRUE),
(16, 5, 'A2-T3',   1, 70.00, 30,  0, 'AVAILABLE', TRUE),
(17, 6, 'E-01',    3, 30.00,  1,  1, 'OCCUPIED',  TRUE),
(18, 6, 'E-02',    3, 30.00,  1,  0, 'AVAILABLE', TRUE),
(19, 6, 'E-03',    3, 30.00,  1,  0, 'AVAILABLE', TRUE);
SELECT setval('parkingslots_slotid_seq', (SELECT MAX(SlotID) FROM ParkingSlots));

INSERT INTO Vehicles (VehicleID, LicensePlate, VehicleTypeID, OwnerName, OwnerPhone, UserID,
                      Brand, VehicleColor, EngineNumber, ChassisNumber, ManufactureYear) OVERRIDING SYSTEM VALUE VALUES
(1, '51A-12345', 2, 'Nguyen Hoang Phuc', '0912345001', 5, 'Toyota', 'Trang', 'ENG001', 'CHS001', 2020),
(2, '59B-67890', 2, 'Vo Thi Mai',        '0912345002', 6, 'Honda',  'Den',   'ENG002', 'CHS002', 2019),
(3, '50L-11111', 1, 'Dang Quoc Hung',    '0912345003', 7, 'Yamaha', 'Do',    'ENG003', 'CHS003', 2021),
(4, '29A-99999', 1, 'Tran Van Binh',     '0912345004', NULL, NULL,  NULL,    NULL,     NULL,     NULL),
(5, '51F-55555', 3, 'Cong ty ABC',       '0281234567', NULL, NULL,  NULL,    NULL,     NULL,     NULL),
(6, '51K-22222', 1, NULL,                NULL,         NULL, NULL,  NULL,    NULL,     NULL,     NULL),
(7, '51H-33333', 2, 'Ly Thi Cam',        '0912345005', NULL, NULL,  NULL,    NULL,     NULL,     NULL),
(8, '51G-44444', 1, 'Phan Van Duc',      '0912345006', NULL, NULL,  NULL,    NULL,     NULL,     NULL);
SELECT setval('vehicles_vehicleid_seq', (SELECT MAX(VehicleID) FROM Vehicles));

INSERT INTO ParkingCards (CardID, Status) VALUES
('CARD-001', 'ACTIVE'),
('CARD-002', 'ACTIVE'),
('CARD-003', 'ACTIVE'),
('CARD-004', 'ACTIVE'),
('CARD-005', 'ACTIVE');

INSERT INTO ParkingSessions
    (SessionID, VehicleID, SlotID, CardID, EntryTime, ExitTime, EntryGate, ExitGate,
     Status, EstimatedFee, FinalFee, CreatedBy) OVERRIDING SYSTEM VALUE VALUES
(1,  1,  5,  NULL, NOW() - INTERVAL '2 hours',  NULL, 'Gate-A', NULL, 'PARKING',   30000, NULL,   3),
(2,  2,  13, NULL, NOW() - INTERVAL '1 hour',   NULL, 'Gate-A', NULL, 'PARKING',   15000, NULL,   3),
(3,  3,  1,  NULL, NOW() - INTERVAL '3 hours',  NULL, 'Gate-B', NULL, 'PARKING',   15000, NULL,   4),
(4,  4,  1,  NULL, NOW() - INTERVAL '2 hours',  NULL, 'Gate-B', NULL, 'PARKING',   10000, NULL,   4),
(5,  5,  17, NULL, NOW() - INTERVAL '5 hours',  NULL, 'Gate-C', NULL, 'PARKING',  100000, NULL,   3),
(6,  6,  4,  NULL, NOW() - INTERVAL '4 hours',  NOW() - INTERVAL '1 hour',  'Gate-B','Gate-B','COMPLETED', 15000, 15000, 3),
(7,  7,  6,  NULL, NOW() - INTERVAL '6 hours',  NOW() - INTERVAL '2 hours', 'Gate-A','Gate-A','COMPLETED', 60000, 60000, 4),
(8,  8,  2,  NULL, NOW() - INTERVAL '3 hours',  NOW() - INTERVAL '30 minutes', 'Gate-B','Gate-B','COMPLETED', 10000, 10000, 3),
(9,  1,  8,  NULL, NOW() - INTERVAL '1 day' + INTERVAL '8 hours', NOW() - INTERVAL '1 day' + INTERVAL '18 hours', 'Gate-A','Gate-A','COMPLETED',150000,150000,3),
(10, 2,  12, NULL, NOW() - INTERVAL '1 day' + INTERVAL '7 hours', NOW() - INTERVAL '1 day' + INTERVAL '12 hours', 'Gate-A','Gate-A','COMPLETED', 75000, 75000,4),
(11, 3,  2,  NULL, NOW() - INTERVAL '8 hours',  NULL, 'Gate-B', NULL, 'LOST_TICKET', 40000, NULL,   4),
(12, 6,  14, NULL, NOW() - INTERVAL '2 days' + INTERVAL '10 hours', NOW() - INTERVAL '2 days' + INTERVAL '22 hours', 'Gate-B','Gate-B','UNPAID', 60000, 60000, 3);
SELECT setval('parkingsessions_sessionid_seq', (SELECT MAX(SessionID) FROM ParkingSessions));

INSERT INTO Reservations
    (ReservationID, UserID, VehicleID, VehicleTypeID, SlotID, ReservationStart, ReservationEnd, Status, GuestName) OVERRIDING SYSTEM VALUE VALUES
(1, 5, 1, 2, 7,  NOW() + INTERVAL '1 hour', NOW() + INTERVAL '5 hours', 'CONFIRMED', NULL),
(2, 6, 2, 2, 8,  NOW() + INTERVAL '3 hours', NOW() + INTERVAL '7 hours', 'PENDING', NULL),
(3, 7, 7, 2, 12, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '4 hours', 'CANCELLED', NULL);
SELECT setval('reservations_reservationid_seq', (SELECT MAX(ReservationID) FROM Reservations));

INSERT INTO Payments (PaymentID, SessionID, ReservationID, Amount, PaymentMethod, PaymentStatus, PaidAt) OVERRIDING SYSTEM VALUE VALUES
(1, 6,  NULL, 15000,  'CASH',          'PAID',    NOW() - INTERVAL '1 hour'),
(2, 7,  NULL, 60000,  'E_WALLET',      'PAID',    NOW() - INTERVAL '2 hours'),
(3, 8,  NULL, 10000,  'CASH',          'PAID',    NOW() - INTERVAL '30 minutes'),
(4, 9,  NULL, 150000, 'BANK_TRANSFER', 'PAID',    NOW() - INTERVAL '1 day' + INTERVAL '18 hours'),
(5, 10, NULL, 75000,  'CASH',          'PAID',    NOW() - INTERVAL '1 day' + INTERVAL '12 hours'),
(6, 12, NULL, 60000,  'CASH',          'PENDING', NULL),
(7, NULL, 1,  50000,  'E_WALLET',      'PAID',    NOW() - INTERVAL '15 minutes'),
(8, NULL, 2,  50000,  'E_WALLET',      'PENDING', NULL);
SELECT setval('payments_paymentid_seq', (SELECT MAX(PaymentID) FROM Payments));

INSERT INTO PaymentTransactions
    (TransactionID, PaymentID, Gateway, TransactionRef, Amount,
     TransactionStatus, PaymentUrl, ResponseCode, ResponseMessage, CreatedAt, PaidAt) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'VNPAY', 'PAY1-DEMO-001', 15000,  'PAID',    NULL, '00', 'VNPay payment successful',             NOW() - INTERVAL '1 hour',       NOW() - INTERVAL '1 hour'),
(2, 2, 'VNPAY', 'PAY2-DEMO-002', 60000,  'PAID',    NULL, '00', 'VNPay payment successful',             NOW() - INTERVAL '2 hours',      NOW() - INTERVAL '2 hours'),
(3, 3, 'VNPAY', 'PAY3-DEMO-003', 10000,  'PAID',    NULL, '00', 'VNPay payment successful',             NOW() - INTERVAL '30 minutes',   NOW() - INTERVAL '30 minutes'),
(4, 4, 'BANK_TRANSFER', 'PAY4-DEMO-004', 150000, 'PAID', NULL, '00', 'Bank transfer successful',        NOW() - INTERVAL '1 day' + INTERVAL '18 hours', NOW() - INTERVAL '1 day' + INTERVAL '18 hours'),
(5, 5, 'VNPAY', 'PAY5-DEMO-005', 75000,  'PAID',    NULL, '00', 'VNPay payment successful',             NOW() - INTERVAL '1 day' + INTERVAL '12 hours', NOW() - INTERVAL '1 day' + INTERVAL '12 hours'),
(6, 6, 'VNPAY', 'PAY6-DEMO-006', 60000,  'PENDING', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?demo=PAY6', NULL, 'Waiting for VNPay payment', NOW(), NULL),
(7, 7, 'VNPAY', 'PAY7-RES-001',  50000,  'PAID',    NULL, '00', 'VNPay reservation payment successful', NOW() - INTERVAL '15 minutes',   NOW() - INTERVAL '15 minutes'),
(8, 8, 'VNPAY', 'PAY8-RES-002',  50000,  'PENDING', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?demo=PAY8', NULL, 'Waiting for VNPay payment', NOW(), NULL);
SELECT setval('paymenttransactions_transactionid_seq', (SELECT MAX(TransactionID) FROM PaymentTransactions));

INSERT INTO IncidentReports (IncidentID, SessionID, ReportedBy, IncidentType, Description, Status) OVERRIDING SYSTEM VALUE VALUES
(1, 11, 4, 'LOST_TICKET',     'Khach mat ve xe may, xac minh qua camera, ap phi mat ve 50.000d.', 'RESOLVED'),
(2, 12, 3, 'UNPAID',          'Xe o to ra khoi bai luc 22h chua thanh toan 60.000d.', 'IN_PROGRESS'),
(3, NULL, 4, 'SLOT_OCCUPIED', 'Slot B-04 bi xe khac do du da RESERVED.', 'OPEN'),
(4, NULL, 3, 'FACILITY_DAMAGE', 'Barrier cong Gate-C bi hong, can sua chua gap.', 'OPEN');
SELECT setval('incidentreports_incidentid_seq', (SELECT MAX(IncidentID) FROM IncidentReports));

INSERT INTO MonthlySubscriptions
    (SubscriptionID, UserID, VehicleID, SlotID, ZoneID, StartDate, EndDate, MonthlyFee, Status) OVERRIDING SYSTEM VALUE VALUES
(1, 5, 1, 7,    NULL, '2026-05-01', '2026-05-31', 1500000, 'ACTIVE'),
(2, 7, 3, NULL, 1,    '2026-05-01', '2026-05-31',  500000, 'ACTIVE'),
(3, 6, 2, 8,    NULL, '2026-04-01', '2026-04-30', 1500000, 'EXPIRED');
SELECT setval('monthlysubscriptions_subscriptionid_seq', (SELECT MAX(SubscriptionID) FROM MonthlySubscriptions));

INSERT INTO ParkingPredictions (PredictionID, VehicleTypeID, FloorID, PredictedOccupancyRate, PredictedPeakHour, PredictionDate) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 85.00, 8,  CURRENT_DATE),
(2, 1, 1, 92.00, 17, CURRENT_DATE),
(3, 2, 1, 70.00, 9,  CURRENT_DATE),
(4, 2, 1, 80.00, 18, CURRENT_DATE),
(5, 1, 2, 60.00, 8,  CURRENT_DATE + 1),
(6, 2, 2, 55.00, 10, CURRENT_DATE + 1);
SELECT setval('parkingpredictions_predictionid_seq', (SELECT MAX(PredictionID) FROM ParkingPredictions));

-- Verify
SELECT 'Roles'                AS table_name, COUNT(*) AS rows FROM Roles                UNION ALL
SELECT 'Users',                COUNT(*) FROM Users                                      UNION ALL
SELECT 'Buildings',            COUNT(*) FROM Buildings                                  UNION ALL
SELECT 'Floors',               COUNT(*) FROM Floors                                     UNION ALL
SELECT 'Zones',                COUNT(*) FROM Zones                                      UNION ALL
SELECT 'VehicleTypes',         COUNT(*) FROM VehicleTypes                               UNION ALL
SELECT 'Vehicles',             COUNT(*) FROM Vehicles                                   UNION ALL
SELECT 'ParkingSlots',         COUNT(*) FROM ParkingSlots                               UNION ALL
SELECT 'PricingPolicies',      COUNT(*) FROM PricingPolicies                            UNION ALL
SELECT 'ParkingCards',         COUNT(*) FROM ParkingCards                               UNION ALL
SELECT 'ParkingSessions',      COUNT(*) FROM ParkingSessions                            UNION ALL
SELECT 'Reservations',         COUNT(*) FROM Reservations                               UNION ALL
SELECT 'Payments',             COUNT(*) FROM Payments                                   UNION ALL
SELECT 'PaymentTransactions',  COUNT(*) FROM PaymentTransactions                        UNION ALL
SELECT 'IncidentReports',      COUNT(*) FROM IncidentReports                            UNION ALL
SELECT 'MonthlySubscriptions', COUNT(*) FROM MonthlySubscriptions                       UNION ALL
SELECT 'ParkingPredictions',   COUNT(*) FROM ParkingPredictions;
