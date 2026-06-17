USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'ParkingManagementSystem')
BEGIN
    ALTER DATABASE ParkingManagementSystem SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ParkingManagementSystem;
END
GO

CREATE DATABASE ParkingManagementSystem;
GO

USE ParkingManagementSystem;
GO

/* =========================================================
   ROLE & USER MANAGEMENT
========================================================= */
CREATE TABLE Roles (
    RoleID      INT PRIMARY KEY IDENTITY(1,1),
    RoleName    NVARCHAR(50)  UNIQUE NOT NULL,
    Description NVARCHAR(255)
);

CREATE TABLE Users (
    UserID       INT PRIMARY KEY IDENTITY(1,1),
    FullName     NVARCHAR(100) NOT NULL,
    Email        NVARCHAR(100) UNIQUE NOT NULL,
    PhoneNumber  NVARCHAR(20)  UNIQUE NOT NULL,
    DateOfBirth  DATE,
    Address      NVARCHAR(255),
    PasswordHash NVARCHAR(255) NOT NULL,
    RoleID       INT NOT NULL,
    IsActive     BIT DEFAULT 1,
    CreatedAt    DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Users_Roles
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

/* =========================================================
   BUILDING MANAGEMENT
========================================================= */
CREATE TABLE Buildings (
    BuildingID         INT PRIMARY KEY IDENTITY(1,1),
    BuildingName       NVARCHAR(100) NOT NULL,
    Address            NVARCHAR(255),
    TotalFloors        INT,
    OperatingStartTime TIME,
    OperatingEndTime   TIME,
    CreatedAt          DATETIME DEFAULT GETDATE()
);

CREATE TABLE Floors (
    FloorID     INT PRIMARY KEY IDENTITY(1,1),
    BuildingID  INT NOT NULL,
    FloorNumber INT NOT NULL,
    FloorName   NVARCHAR(50),
    CONSTRAINT FK_Floors_Buildings
        FOREIGN KEY (BuildingID) REFERENCES Buildings(BuildingID),
    CONSTRAINT UQ_Building_Floor UNIQUE (BuildingID, FloorNumber)
);

CREATE TABLE Zones (
    ZoneID      INT PRIMARY KEY IDENTITY(1,1),
    FloorID     INT NOT NULL,
    ZoneName    NVARCHAR(50) NOT NULL,
    Description NVARCHAR(255),
    CONSTRAINT FK_Zones_Floors
        FOREIGN KEY (FloorID) REFERENCES Floors(FloorID),
    CONSTRAINT UQ_Floor_Zone UNIQUE (FloorID, ZoneName)
);

/* =========================================================
   VEHICLE TYPES
========================================================= */
CREATE TABLE VehicleTypes (
    VehicleTypeID INT PRIMARY KEY IDENTITY(1,1),
    TypeName      NVARCHAR(50) NOT NULL UNIQUE,
    Description   NVARCHAR(255)
);

/* =========================================================
   VEHICLES
========================================================= */
CREATE TABLE Vehicles (
    VehicleID     INT PRIMARY KEY IDENTITY(1,1),
    LicensePlate  NVARCHAR(20)  NOT NULL UNIQUE,
    VehicleTypeID INT NOT NULL,
    OwnerName     NVARCHAR(100) NULL,
    OwnerPhone    NVARCHAR(20)  NULL,
    UserID        INT           NULL,
    Brand           NVARCHAR(50)  NULL,
    VehicleColor    NVARCHAR(30)  NULL,
    EngineNumber    NVARCHAR(50)  NULL,
    ChassisNumber   NVARCHAR(50)  NULL,
    ManufactureYear INT           NULL,
    VehicleImage    NVARCHAR(255) NULL,
    IsActive BIT DEFAULT 1,
    CONSTRAINT FK_Vehicles_VehicleTypes
        FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT FK_Vehicles_Users
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

CREATE UNIQUE INDEX UQ_Vehicles_EngineNumber
    ON Vehicles (EngineNumber)
    WHERE EngineNumber IS NOT NULL;

CREATE UNIQUE INDEX UQ_Vehicles_ChassisNumber
    ON Vehicles (ChassisNumber)
    WHERE ChassisNumber IS NOT NULL;
GO

/* =========================================================
   PARKING SLOT MANAGEMENT
========================================================= */
CREATE TABLE ParkingSlots (
    SlotID           INT PRIMARY KEY IDENTITY(1,1),
    ZoneID           INT NOT NULL,
    SlotCode         NVARCHAR(20) NOT NULL UNIQUE,
    VehicleTypeID    INT NOT NULL,
    Area             DECIMAL(10,2) NULL,
    Capacity         INT NOT NULL DEFAULT 1,
    CurrentOccupancy INT NOT NULL DEFAULT 0,
    Status           NVARCHAR(20) NOT NULL
        CHECK (Status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'LOCKED')),
    IsActive         BIT DEFAULT 1,
    CONSTRAINT FK_ParkingSlots_Zones
        FOREIGN KEY (ZoneID) REFERENCES Zones(ZoneID),
    CONSTRAINT FK_ParkingSlots_VehicleTypes
        FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT CHK_Occupancy_Not_Exceed_Capacity
        CHECK (CurrentOccupancy <= Capacity),
    CONSTRAINT CHK_Occupancy_Not_Negative
        CHECK (CurrentOccupancy >= 0)
);

/* =========================================================
   PRICING POLICY
========================================================= */
CREATE TABLE PricingPolicies (
    PricingPolicyID    INT PRIMARY KEY IDENTITY(1,1),
    VehicleTypeID      INT NOT NULL,
    PolicyName         NVARCHAR(100),
    BasePrice          DECIMAL(10,2) NOT NULL,
    RushHourPrice      DECIMAL(10,2) NOT NULL,
    OffPeakPrice       DECIMAL(10,2) NOT NULL,
    RushHourStart      TIME          NOT NULL,
    RushHourEnd        TIME          NOT NULL,
    MaxDailyRate       DECIMAL(10,2),
    LostTicketFee      DECIMAL(10,2),
    OvertimeFeePerHour DECIMAL(10,2),
    EffectiveFrom      DATETIME NOT NULL,
    EffectiveTo        DATETIME,
    CONSTRAINT FK_PricingPolicies_VehicleTypes
        FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT CHK_RushHour_Time
        CHECK (RushHourStart < RushHourEnd),

    -- [SỬA #6] Chặn giá trị tiền âm trong bảng PricingPolicies.
    -- Lý do: tránh trường hợp nhập BasePrice/RushHourPrice/OffPeakPrice hoặc phí phát sinh bị âm.
    CONSTRAINT CHK_PricingPolicies_NonNegative
        CHECK (
            BasePrice >= 0
            AND RushHourPrice >= 0
            AND OffPeakPrice >= 0
            AND (MaxDailyRate IS NULL OR MaxDailyRate >= 0)
            AND (LostTicketFee IS NULL OR LostTicketFee >= 0)
            AND (OvertimeFeePerHour IS NULL OR OvertimeFeePerHour >= 0)
        ),

    -- [SỬA BỔ SUNG] Chặn thời gian hiệu lực bị ngược.
    -- Nếu EffectiveTo có giá trị thì phải lớn hơn EffectiveFrom.
    CONSTRAINT CHK_PricingPolicies_Effective_Time
        CHECK (EffectiveTo IS NULL OR EffectiveTo > EffectiveFrom)
);

/* =========================================================
   PARKING CARDS
========================================================= */
CREATE TABLE ParkingCards (
    CardID    NVARCHAR(50) PRIMARY KEY,
    Status    NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (Status IN ('ACTIVE', 'IN_USE', 'LOST')),
    CreatedAt DATETIME DEFAULT GETDATE()
);

/* =========================================================
   PARKING SESSION
========================================================= */
CREATE TABLE ParkingSessions (
    SessionID    INT PRIMARY KEY IDENTITY(1,1),
    VehicleID    INT NOT NULL,
    SlotID       INT NOT NULL,
    CardID       NVARCHAR(50) NULL,
    EntryTime    DATETIME NOT NULL DEFAULT GETDATE(),
    ExitTime     DATETIME NULL,
    EntryGate    NVARCHAR(50),
    ExitGate     NVARCHAR(50),
    Status       NVARCHAR(20) NOT NULL
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

    -- [SỬA #2] Chặn ExitTime nhỏ hơn EntryTime.
    -- Lý do: tránh thời lượng gửi xe âm và tránh tính phí sai.
    CONSTRAINT CHK_Session_Time
        CHECK (ExitTime IS NULL OR ExitTime >= EntryTime),
    -- [SỬA #6] Chặn phí dự kiến/phí cuối bị âm.
    CONSTRAINT CHK_ParkingSessions_Fee_NonNegative
        CHECK (
            (EstimatedFee IS NULL OR EstimatedFee >= 0)
            AND (FinalFee IS NULL OR FinalFee >= 0)
        )
);

GO

-- [SỬA #5] Chặn một xe có nhiều phiên gửi xe đang PARKING cùng lúc.
-- Ghi chú: bản báo cáo có nhắc status đang hoạt động rộng hơn, nhưng seed hiện tại có xe vừa PARKING vừa LOST_TICKET.
-- Vì vậy dùng Status = 'PARKING' để an toàn cho demo/API hiện tại.
CREATE UNIQUE INDEX UQ_ParkingSessions_ActiveParkingVehicle
    ON ParkingSessions (VehicleID)
    WHERE Status = 'PARKING';
GO

/* =========================================================
   RESERVATION SYSTEM
========================================================= */
CREATE TABLE Reservations (
    ReservationID    INT PRIMARY KEY IDENTITY(1,1),
    UserID           INT NOT NULL,
    VehicleID        INT NOT NULL,
    VehicleTypeID    INT NOT NULL,
    SlotID           INT NOT NULL,
    ReservationStart DATETIME NOT NULL,
    ReservationEnd   DATETIME NOT NULL,
    Status           NVARCHAR(20)
        CHECK (Status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED')),
    CreatedAt        DATETIME DEFAULT GETDATE(),
    GuestName        NVARCHAR(100) NULL,
    CONSTRAINT FK_Reservations_Users
        FOREIGN KEY (UserID)        REFERENCES Users(UserID),
    CONSTRAINT FK_Reservations_Vehicles
        FOREIGN KEY (VehicleID)     REFERENCES Vehicles(VehicleID),
    CONSTRAINT FK_Reservations_VehicleTypes
        FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT FK_Reservations_Slots
        FOREIGN KEY (SlotID)        REFERENCES ParkingSlots(SlotID),

    -- [SỬA #1] Chặn thời gian đặt chỗ sai.
    -- ReservationEnd phải lớn hơn ReservationStart.
    CONSTRAINT CHK_Reservation_Time
        CHECK (ReservationEnd > ReservationStart)
);

/* =========================================================
   PAYMENT MANAGEMENT (UPDATED FOR RESERVATIONS)
========================================================= */
CREATE TABLE Payments (
    PaymentID     INT PRIMARY KEY IDENTITY(1,1),
    SessionID     INT NULL,
    ReservationID INT NULL,
    Amount        DECIMAL(10,2) NOT NULL,
    PaymentMethod NVARCHAR(30)
        CHECK (PaymentMethod IN ('CASH', 'BANK_TRANSFER', 'E_WALLET', 'CREDIT_CARD')),
    PaymentStatus NVARCHAR(20)
        CHECK (PaymentStatus IN ('PENDING', 'PAID', 'FAILED')),
    PaidAt        DATETIME,
    CONSTRAINT FK_Payments_Sessions
        FOREIGN KEY (SessionID) REFERENCES ParkingSessions(SessionID),
    CONSTRAINT FK_Payments_Reservations
        FOREIGN KEY (ReservationID) REFERENCES Reservations(ReservationID),

    -- [SỬA #6] Chặn số tiền thanh toán âm.
    CONSTRAINT CHK_Payments_Amount_NonNegative
        CHECK (Amount >= 0),

    -- [SỬA #3] Payment chỉ được gắn đúng một nguồn:
    -- hoặc SessionID, hoặc ReservationID. Không được cả hai cùng có giá trị, cũng không được cả hai cùng NULL.
    CONSTRAINT CHK_Payments_SessionOrReservation
        CHECK (
            (SessionID IS NOT NULL AND ReservationID IS NULL)
            OR
            (SessionID IS NULL AND ReservationID IS NOT NULL)
        )
);

GO

-- [SỬA #4] Chặn một ParkingSession tạo nhiều Payment chính.
-- Nếu thanh toán thất bại/retry qua cổng thanh toán thì lưu nhiều lần ở PaymentTransactions, không tạo nhiều dòng Payments.
CREATE UNIQUE INDEX UQ_Payments_Session
    ON Payments (SessionID)
    WHERE SessionID IS NOT NULL;
GO

-- [SỬA #4] Chặn một Reservation tạo nhiều Payment chính.
CREATE UNIQUE INDEX UQ_Payments_Reservation
    ON Payments (ReservationID)
    WHERE ReservationID IS NOT NULL;
GO

/* =========================================================
   PAYMENT TRANSACTION
========================================================= */
CREATE TABLE PaymentTransactions (
    TransactionID     INT PRIMARY KEY IDENTITY(1,1),
    PaymentID         INT NOT NULL,
    Gateway           NVARCHAR(30) NOT NULL
        CHECK (Gateway IN ('VNPAY', 'MOMO', 'ZALOPAY', 'BANK_TRANSFER')),
    TransactionRef    NVARCHAR(100) NOT NULL UNIQUE,
    Amount            DECIMAL(10,2) NOT NULL,
    TransactionStatus NVARCHAR(20) NOT NULL
        CHECK (TransactionStatus IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED')),
    PaymentUrl        NVARCHAR(1000) NULL,
    ResponseCode      NVARCHAR(20) NULL,
    ResponseMessage   NVARCHAR(255) NULL,
    CreatedAt         DATETIME NOT NULL DEFAULT GETDATE(),
    PaidAt            DATETIME NULL,

    CONSTRAINT FK_PaymentTransactions_Payments
        FOREIGN KEY (PaymentID) REFERENCES Payments(PaymentID),

    -- [SỬA #6] Chặn số tiền giao dịch âm.
    CONSTRAINT CHK_PaymentTransactions_Amount_NonNegative
        CHECK (Amount >= 0)
);

/* =========================================================
   INCIDENT MANAGEMENT
========================================================= */
CREATE TABLE IncidentReports (
    IncidentID   INT PRIMARY KEY IDENTITY(1,1),
    SessionID    INT NULL,
    ReportedBy   INT NOT NULL,
    IncidentType NVARCHAR(50)
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
    Description   NVARCHAR(500),
    Status        NVARCHAR(20)
        CHECK (Status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    CreatedAt     DATETIME DEFAULT GETDATE(),
    IncidentImage NVARCHAR(255) NULL,
    CONSTRAINT FK_IncidentReports_Sessions
        FOREIGN KEY (SessionID)  REFERENCES ParkingSessions(SessionID),
    CONSTRAINT FK_IncidentReports_Users
        FOREIGN KEY (ReportedBy) REFERENCES Users(UserID)
);

/* =========================================================
   MONTHLY SUBSCRIPTION
========================================================= */
CREATE TABLE MonthlySubscriptions (
    SubscriptionID INT PRIMARY KEY IDENTITY(1,1),
    UserID         INT NOT NULL,
    VehicleID      INT NOT NULL,
    SlotID         INT NULL,
    ZoneID         INT NULL,
    StartDate      DATE NOT NULL,
    EndDate        DATE NOT NULL,
    MonthlyFee     DECIMAL(10,2) NOT NULL,
    Status         NVARCHAR(20) NOT NULL
        CHECK (Status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    CreatedAt      DATETIME DEFAULT GETDATE(),

    -- [SỬA #8] Bỏ UNIQUE(UserID, Status) vì constraint đó quá cứng:
    -- một user có thể có nhiều lịch sử EXPIRED/CANCELLED.
    -- Index ACTIVE theo VehicleID được tạo phía dưới sau khi CREATE TABLE.

    CONSTRAINT CHK_Slot_Or_Zone
        CHECK (SlotID IS NOT NULL OR ZoneID IS NOT NULL),

    -- [SỬA BỔ SUNG] Chặn ngày kết thúc nhỏ hơn ngày bắt đầu.
    CONSTRAINT CHK_Subscription_Time
        CHECK (EndDate >= StartDate),

    -- [SỬA #6] Chặn phí tháng âm.
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

GO

-- [SỬA #8] Chỉ chặn một xe có nhiều vé tháng ACTIVE cùng lúc.
-- Vẫn cho phép lưu nhiều dòng EXPIRED/CANCELLED để giữ lịch sử.
CREATE UNIQUE INDEX UQ_MonthlySubscriptions_ActiveVehicle
    ON MonthlySubscriptions (VehicleID)
    WHERE Status = 'ACTIVE';
GO

/* =========================================================
   AI OPTIMIZATION SUPPORT
========================================================= */
CREATE TABLE ParkingPredictions (
    PredictionID           INT PRIMARY KEY IDENTITY(1,1),
    VehicleTypeID          INT,
    FloorID                INT,
    PredictedOccupancyRate DECIMAL(5,2),
    PredictedPeakHour      INT,
    PredictionDate         DATE,
    GeneratedAt            DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_ParkingPredictions_VehicleTypes
        FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT FK_ParkingPredictions_Floors
        FOREIGN KEY (FloorID) REFERENCES Floors(FloorID)
);
GO

/* =========================================================
   SEED DATA
========================================================= */
DELETE FROM ParkingPredictions;
DELETE FROM MonthlySubscriptions;
DELETE FROM IncidentReports;
DELETE FROM PaymentTransactions;
DELETE FROM Payments;
DELETE FROM Reservations;
DELETE FROM ParkingSessions;
DELETE FROM ParkingCards;
DELETE FROM ParkingSlots;
DELETE FROM Vehicles;
DELETE FROM PricingPolicies;
DELETE FROM VehicleTypes;
DELETE FROM Zones;
DELETE FROM Floors;
DELETE FROM Buildings;
DELETE FROM Users;
DELETE FROM Roles;
GO

SET IDENTITY_INSERT Roles ON;
INSERT INTO Roles (RoleID, RoleName, Description) VALUES
(1, 'Admin',           N'Quản trị hệ thống'),
(2, 'ParkingManager',  N'Quản lý bãi xe'),
(3, 'ParkingStaff',    N'Nhân viên trực cổng'),
(4, 'Driver',          N'Người dùng gửi xe');
SET IDENTITY_INSERT Roles OFF;
GO

SET IDENTITY_INSERT Users ON;
INSERT INTO Users (UserID, FullName, Email, PhoneNumber, PasswordHash, RoleID, IsActive) VALUES
(1, N'Nguyễn Văn Admin',  'admin@parking.vn',        '0901000001', 'hash_admin',  1, 1),
(2, N'Trần Thị Lan',      'lan.manager@parking.vn',  '0901000002', 'hash_mgr',    2, 1),
(3, N'Lê Minh Tuấn',      'tuan.staff@parking.vn',   '0901000003', 'hash_staff1', 3, 1),
(4, N'Phạm Thị Hoa',      'hoa.staff@parking.vn',    '0901000004', 'hash_staff2', 3, 1),
(5, N'Nguyễn Hoàng Phúc', 'phuc@gmail.com',          '0912345001', 'hash_drv1',   4, 1),
(6, N'Võ Thị Mai',        'mai@gmail.com',           '0912345002', 'hash_drv2',   4, 1),
(7, N'Đặng Quốc Hùng',    'hung@gmail.com',          '0912345003', 'hash_drv3',   4, 1);
SET IDENTITY_INSERT Users OFF;
GO

SET IDENTITY_INSERT Buildings ON;
INSERT INTO Buildings (BuildingID, BuildingName, Address, TotalFloors, OperatingStartTime, OperatingEndTime) VALUES
(1, N'Tòa nhà gửi xe Quận 1', N'120 Lê Lợi, Q.1, TP.HCM',        4, '06:00', '23:00'),
(2, N'Tòa nhà gửi xe Quận 7', N'88 Nguyễn Thị Thập, Q.7, TP.HCM', 3, '05:30', '23:30');
SET IDENTITY_INSERT Buildings OFF;
GO

SET IDENTITY_INSERT Floors ON;
INSERT INTO Floors (FloorID, BuildingID, FloorNumber, FloorName) VALUES
(1, 1, 1, N'Tầng 1 - Trệt'),
(2, 1, 2, N'Tầng 2'),
(3, 1, 3, N'Tầng 3'),
(4, 1, 4, N'Tầng 4 - Mái'),
(5, 2, 1, N'Tầng 1 - Trệt'),
(6, 2, 2, N'Tầng 2'),
(7, 2, 3, N'Tầng 3 - Mái');
SET IDENTITY_INSERT Floors OFF;
GO

SET IDENTITY_INSERT Zones ON;
INSERT INTO Zones (ZoneID, FloorID, ZoneName, Description) VALUES
(1, 1, N'Zone A', N'Khu vực xe máy tầng 1'),
(2, 1, N'Zone B', N'Khu vực ô tô tầng 1'),
(3, 2, N'Zone A', N'Khu vực xe máy tầng 2'),
(4, 2, N'Zone B', N'Khu vực ô tô tầng 2'),
(5, 3, N'Zone A', N'Khu vực xe máy tầng 3'),
(6, 4, N'Zone A', N'Khu vực xe tải tầng 4');
SET IDENTITY_INSERT Zones OFF;
GO

SET IDENTITY_INSERT VehicleTypes ON;
INSERT INTO VehicleTypes (VehicleTypeID, TypeName, Description) VALUES
(1, N'Xe máy',     N'Xe máy, xe tay ga dưới 175cc'),
(2, N'Ô tô',       N'Xe ô tô con dưới 7 chỗ'),
(3, N'Xe tải nhỏ', N'Xe tải dưới 2 tấn');
SET IDENTITY_INSERT VehicleTypes OFF;
GO

SET IDENTITY_INSERT PricingPolicies ON;
INSERT INTO PricingPolicies
    (PricingPolicyID, VehicleTypeID, PolicyName, BasePrice,
     RushHourPrice, OffPeakPrice, RushHourStart, RushHourEnd,
     MaxDailyRate, LostTicketFee, OvertimeFeePerHour, EffectiveFrom) VALUES
(1, 1, N'Giá xe máy 2024',   5000,   6000,  5000, '07:00', '09:00',  50000,  50000,   NULL, '2024-01-01'),
(2, 2, N'Giá ô tô 2024',    10000,  20000, 15000, '07:00', '09:00', 150000, 200000, 25000, '2024-01-01'),
(3, 3, N'Giá xe tải 2024',  15000,  25000, 20000, '07:00', '09:00', 200000, 300000, 30000, '2024-01-01');
SET IDENTITY_INSERT PricingPolicies OFF;
GO

SET IDENTITY_INSERT ParkingSlots ON;
INSERT INTO ParkingSlots (SlotID, ZoneID, SlotCode, VehicleTypeID, Area, Capacity, CurrentOccupancy, Status, IsActive) VALUES
(1, 1, 'A1',     1, 50.00, 20, 12, 'AVAILABLE', 1),
(2, 1, 'A2',     1, 40.00, 15,  8, 'AVAILABLE', 1),
(3, 1, 'A3',     1, 30.00, 10, 10, 'OCCUPIED',  1),
(4, 2, 'B-01',   2, 15.00, 1, 0, 'AVAILABLE', 1),
(5, 2, 'B-02',   2, 15.00, 1, 1, 'OCCUPIED',  1),
(6, 2, 'B-03',   2, 15.00, 1, 0, 'AVAILABLE', 1),
(7, 2, 'B-04',   2, 15.00, 1, 0, 'RESERVED',  1),
(8, 2, 'B-05',   2, 15.00, 1, 0, 'AVAILABLE', 1),
(9, 2, 'B-06',   2, 15.00, 1, 0, 'LOCKED',    1),
(10, 3, 'A1-T2', 1, 60.00, 25, 10, 'AVAILABLE', 1),
(11, 3, 'A2-T2', 1, 50.00, 20,  5, 'AVAILABLE', 1),
(12, 4, 'B-T2-01', 2, 15.00, 1, 0, 'AVAILABLE', 1),
(13, 4, 'B-T2-02', 2, 15.00, 1, 1, 'OCCUPIED',  1),
(14, 4, 'B-T2-03', 2, 15.00, 1, 0, 'AVAILABLE', 1),
(15, 5, 'A1-T3', 1, 70.00, 30, 0, 'AVAILABLE', 1),
(16, 5, 'A2-T3', 1, 70.00, 30, 0, 'AVAILABLE', 1),
(17, 6, 'E-01', 3, 30.00, 1, 1, 'OCCUPIED',  1),
(18, 6, 'E-02', 3, 30.00, 1, 0, 'AVAILABLE', 1),
(19, 6, 'E-03', 3, 30.00, 1, 0, 'AVAILABLE', 1);
SET IDENTITY_INSERT ParkingSlots OFF;
GO

SET IDENTITY_INSERT Vehicles ON;
INSERT INTO Vehicles (VehicleID, LicensePlate, VehicleTypeID, OwnerName, OwnerPhone, UserID,
                      Brand, VehicleColor, EngineNumber, ChassisNumber, ManufactureYear, VehicleImage) VALUES
(1, '51A-12345', 2, N'Nguyễn Hoàng Phúc', '0912345001', 5,    N'Toyota', N'Trắng', 'ENG001', 'CHS001', 2020, NULL),
(2, '59B-67890', 2, N'Võ Thị Mai',        '0912345002', 6,    N'Honda',  N'Đen',   'ENG002', 'CHS002', 2019, NULL),
(3, '50L-11111', 1, N'Đặng Quốc Hùng',    '0912345003', 7,    N'Yamaha', N'Đỏ',    'ENG003', 'CHS003', 2021, NULL),
(4, '29A-99999', 1, N'Trần Văn Bình',     '0912345004', NULL, NULL,      NULL,     NULL,     NULL,     NULL, NULL),
(5, '51F-55555', 3, N'Công ty ABC',       '0281234567', NULL, NULL,      NULL,     NULL,     NULL,     NULL, NULL),
(6, '51K-22222', 1, NULL,                 NULL,         NULL, NULL,      NULL,     NULL,     NULL,     NULL, NULL),
(7, '51H-33333', 2, N'Lý Thị Cẩm',        '0912345005', NULL, NULL,      NULL,     NULL,     NULL,     NULL, NULL),
(8, '51G-44444', 1, N'Phan Văn Đức',      '0912345006', NULL, NULL,      NULL,     NULL,     NULL,     NULL, NULL);
SET IDENTITY_INSERT Vehicles OFF;
GO

INSERT INTO ParkingCards (CardID, Status) VALUES
('CARD-001', 'ACTIVE'),
('CARD-002', 'ACTIVE'),
('CARD-003', 'ACTIVE'),
('CARD-004', 'ACTIVE'),
('CARD-005', 'ACTIVE');
GO

SET IDENTITY_INSERT ParkingSessions ON;
INSERT INTO ParkingSessions
    (SessionID, VehicleID, SlotID, CardID, EntryTime, ExitTime, EntryGate, ExitGate,
     Status, EstimatedFee, FinalFee, CreatedBy)
VALUES
(1,  1,  5,  NULL, DATEADD(HOUR,-2,GETDATE()), NULL, 'Gate-A', NULL, 'PARKING',  30000, NULL, 3),
(2,  2,  13, NULL, DATEADD(HOUR,-1,GETDATE()), NULL, 'Gate-A', NULL, 'PARKING',  15000, NULL, 3),
(3,  3,  1,  NULL, DATEADD(HOUR,-3,GETDATE()), NULL, 'Gate-B', NULL, 'PARKING',  15000, NULL, 4),
(4,  4,  1,  NULL, DATEADD(HOUR,-2,GETDATE()), NULL, 'Gate-B', NULL, 'PARKING',  10000, NULL, 4),
(5,  5,  17, NULL, DATEADD(HOUR,-5,GETDATE()), NULL, 'Gate-C', NULL, 'PARKING', 100000, NULL, 3),
(6,  6,  4,  NULL, DATEADD(HOUR,-4,GETDATE()), DATEADD(HOUR,-1,GETDATE()), 'Gate-B','Gate-B','COMPLETED', 15000, 15000, 3),
(7,  7,  6,  NULL, DATEADD(HOUR,-6,GETDATE()), DATEADD(HOUR,-2,GETDATE()), 'Gate-A','Gate-A','COMPLETED', 60000, 60000, 4),
(8,  8,  2,  NULL, DATEADD(HOUR,-3,GETDATE()), DATEADD(MINUTE,-30,GETDATE()), 'Gate-B','Gate-B','COMPLETED', 10000, 10000, 3),
(9,  1,  8,  NULL, DATEADD(DAY,-1,DATEADD(HOUR,8,GETDATE())), DATEADD(DAY,-1,DATEADD(HOUR,18,GETDATE())), 'Gate-A','Gate-A','COMPLETED',150000,150000,3),
(10, 2,  12, NULL, DATEADD(DAY,-1,DATEADD(HOUR,7,GETDATE())), DATEADD(DAY,-1,DATEADD(HOUR,12,GETDATE())), 'Gate-A','Gate-A','COMPLETED',75000,75000,4),
(11, 3,  2,  NULL, DATEADD(HOUR,-8,GETDATE()), NULL, 'Gate-B', NULL, 'LOST_TICKET', 40000, NULL, 4),
(12, 6,  14, NULL, DATEADD(DAY,-2,DATEADD(HOUR,10,GETDATE())), DATEADD(DAY,-2,DATEADD(HOUR,22,GETDATE())), 'Gate-B','Gate-B','UNPAID', 60000, 60000, 3);
SET IDENTITY_INSERT ParkingSessions OFF;
GO

SET IDENTITY_INSERT Reservations ON;
INSERT INTO Reservations
    (ReservationID, UserID, VehicleID, VehicleTypeID, SlotID, ReservationStart, ReservationEnd, Status, GuestName)
VALUES
(1, 5, 1, 2, 7,  DATEADD(HOUR,1,GETDATE()), DATEADD(HOUR,5,GETDATE()), 'CONFIRMED', NULL),
(2, 6, 2, 2, 8,  DATEADD(HOUR,3,GETDATE()), DATEADD(HOUR,7,GETDATE()), 'PENDING', NULL),
(3, 7, 7, 2, 12, DATEADD(DAY,-1,GETDATE()), DATEADD(DAY,-1,DATEADD(HOUR,4,GETDATE())), 'CANCELLED', NULL);
SET IDENTITY_INSERT Reservations OFF;
GO

SET IDENTITY_INSERT Payments ON;
INSERT INTO Payments (PaymentID, SessionID, ReservationID, Amount, PaymentMethod, PaymentStatus, PaidAt) VALUES
(1, 6,  NULL, 15000, 'CASH',          'PAID',    DATEADD(HOUR,-1,GETDATE())),
(2, 7,  NULL, 60000, 'E_WALLET',      'PAID',    DATEADD(HOUR,-2,GETDATE())),
(3, 8,  NULL, 10000, 'CASH',          'PAID',    DATEADD(MINUTE,-30,GETDATE())),
(4, 9,  NULL, 150000, 'BANK_TRANSFER', 'PAID',    DATEADD(DAY,-1,DATEADD(HOUR,18,GETDATE()))),
(5, 10, NULL, 75000, 'CASH',          'PAID',    DATEADD(DAY,-1,DATEADD(HOUR,12,GETDATE()))),
(6, 12, NULL, 60000, 'CASH',          'PENDING', NULL),
-- Seed data mẫu cho thanh toán Đặt chỗ (Reservation Payment)
(7, NULL, 1,  50000, 'E_WALLET',         'PAID',    DATEADD(MINUTE,-15,GETDATE())),
(8, NULL, 2,  50000, 'E_WALLET',         'PENDING', NULL);
SET IDENTITY_INSERT Payments OFF;
GO

SET IDENTITY_INSERT PaymentTransactions ON;
INSERT INTO PaymentTransactions
    (TransactionID, PaymentID, Gateway, TransactionRef, Amount,
     TransactionStatus, PaymentUrl, ResponseCode, ResponseMessage, CreatedAt, PaidAt)
VALUES
(1, 1, 'VNPAY', 'PAY1-DEMO-001', 15000, 'PAID',
 NULL, '00', N'VNPay payment successful', DATEADD(HOUR,-1,GETDATE()), DATEADD(HOUR,-1,GETDATE())),

(2, 2, 'VNPAY', 'PAY2-DEMO-002', 60000, 'PAID',
 NULL, '00', N'VNPay payment successful', DATEADD(HOUR,-2,GETDATE()), DATEADD(HOUR,-2,GETDATE())),

(3, 3, 'VNPAY', 'PAY3-DEMO-003', 10000, 'PAID',
 NULL, '00', N'VNPay payment successful', DATEADD(MINUTE,-30,GETDATE()), DATEADD(MINUTE,-30,GETDATE())),

(4, 4, 'BANK_TRANSFER', 'PAY4-DEMO-004', 150000, 'PAID',
 NULL, '00', N'Bank transfer successful', DATEADD(DAY,-1,DATEADD(HOUR,18,GETDATE())), DATEADD(DAY,-1,DATEADD(HOUR,18,GETDATE()))),

(5, 5, 'VNPAY', 'PAY5-DEMO-005', 75000, 'PAID',
 NULL, '00', N'VNPay payment successful', DATEADD(DAY,-1,DATEADD(HOUR,12,GETDATE())), DATEADD(DAY,-1,DATEADD(HOUR,12,GETDATE()))),

(6, 6, 'VNPAY', 'PAY6-DEMO-006', 60000, 'PENDING',
 N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?demo=PAY6-DEMO-006',
 NULL, N'Waiting for VNPay payment', GETDATE(), NULL),
 
(7, 7, 'VNPAY', 'PAY7-RES-001', 50000, 'PAID',
 NULL, '00', N'VNPay reservation payment successful', DATEADD(MINUTE,-15,GETDATE()), DATEADD(MINUTE,-15,GETDATE())),
 
(8, 8, 'VNPAY', 'PAY8-RES-002', 50000, 'PENDING',
 N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?demo=PAY8-RES-002',
 NULL, N'Waiting for VNPay payment', GETDATE(), NULL);
SET IDENTITY_INSERT PaymentTransactions OFF;
GO

SET IDENTITY_INSERT IncidentReports ON;
INSERT INTO IncidentReports (IncidentID, SessionID, ReportedBy, IncidentType, Description, Status, IncidentImage) VALUES
(1, 11, 4, 'LOST_TICKET',     N'Khách mất vé xe máy, xác minh qua camera, áp phí mất vé 50.000đ.', 'RESOLVED', NULL),
(2, 12, 3, 'UNPAID',          N'Xe ô tô ra khỏi bãi lúc 22h chưa thanh toán 60.000đ.', 'IN_PROGRESS', NULL),
(3, NULL, 4, 'SLOT_OCCUPIED', N'Slot B-04 bị xe khác đỗ dù đã RESERVED.', 'OPEN', NULL),
(4, NULL, 3, 'FACILITY_DAMAGE', N'Barrier cổng Gate-C bị hỏng, cần sửa chữa gấp.', 'OPEN', NULL);
SET IDENTITY_INSERT IncidentReports OFF;
GO

SET IDENTITY_INSERT MonthlySubscriptions ON;
INSERT INTO MonthlySubscriptions
    (SubscriptionID, UserID, VehicleID, SlotID, ZoneID, StartDate, EndDate, MonthlyFee, Status)
VALUES
(1, 5, 1, 7,    NULL, '2026-05-01', '2026-05-31', 1500000, 'ACTIVE'),
(2, 7, 3, NULL, 1,    '2026-05-01', '2026-05-31',  500000, 'ACTIVE'),
(3, 6, 2, 8,    NULL, '2026-04-01', '2026-04-30', 1500000, 'EXPIRED');
SET IDENTITY_INSERT MonthlySubscriptions OFF;
GO

SET IDENTITY_INSERT ParkingPredictions ON;
INSERT INTO ParkingPredictions (PredictionID, VehicleTypeID, FloorID, PredictedOccupancyRate, PredictedPeakHour, PredictionDate) VALUES
(1, 1, 1, 85.00, 8,  CAST(GETDATE() AS DATE)),
(2, 1, 1, 92.00, 17, CAST(GETDATE() AS DATE)),
(3, 2, 1, 70.00, 9,  CAST(GETDATE() AS DATE)),
(4, 2, 1, 80.00, 18, CAST(GETDATE() AS DATE)),
(5, 1, 2, 60.00, 8,  CAST(DATEADD(DAY,1,GETDATE()) AS DATE)),
(6, 2, 2, 55.00, 10, CAST(DATEADD(DAY,1,GETDATE()) AS DATE));
SET IDENTITY_INSERT ParkingPredictions OFF;
GO

SELECT 'Roles'                AS [Table], COUNT(*) AS [Rows] FROM Roles                UNION ALL
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
GO