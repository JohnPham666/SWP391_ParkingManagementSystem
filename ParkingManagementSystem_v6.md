# ParkingManagementSystem — Database Schema & Seed Data (v6)

> **Database:** `ParkingManagementSystem` · **Platform:** Microsoft SQL Server  
> **Package:** `com.group2.parkingmanagement`  
> **Tables:** 16 · **Total seed rows:** see Verify section

---

## Table of Contents

1. [Entity Overview](#1-entity-overview)
2. [Schema — Table Definitions](#2-schema--table-definitions)
   - [Roles](#roles)
   - [Users](#users)
   - [Buildings](#buildings)
   - [Floors](#floors)
   - [Zones](#zones)
   - [VehicleTypes](#vehicletypes)
   - [Vehicles](#vehicles)
   - [ParkingSlots](#parkingslots)
   - [PricingPolicies](#pricingpolicies)
   - [ParkingSessions](#parkingsessions)
   - [Reservations](#reservations)
   - [Payments](#payments)
   - [PaymentTransactions](#paymenttransactions)
   - [IncidentReports](#incidentreports)
   - [MonthlySubscriptions](#monthlysubscriptions)
   - [ParkingPredictions](#parkingpredictions)
3. [Relationships & Foreign Keys](#3-relationships--foreign-keys)
4. [Seed Data](#4-seed-data)
5. [Design Notes & v6 Changes](#5-design-notes--v6-changes)

---

## 1. Entity Overview

| # | Table | Purpose |
|---|-------|---------|
| 1 | `Roles` | User role definitions (Admin, ParkingManager, ParkingStaff, Driver) |
| 2 | `Users` | System accounts for all roles |
| 3 | `Buildings` | Parking buildings with operating hours |
| 4 | `Floors` | Floors within each building |
| 5 | `Zones` | Zones within each floor (separated by vehicle type) |
| 6 | `VehicleTypes` | Motorbike, Car, Small Truck |
| 7 | `Vehicles` | Registered vehicles with owner info and optional details |
| 8 | `ParkingSlots` | Individual or area-based parking slots with occupancy tracking |
| 9 | `PricingPolicies` | Per-vehicle-type pricing with rush-hour / off-peak split |
| 10 | `ParkingSessions` | Active and historical parking sessions |
| 11 | `Reservations` | Slot reservations (cars only, `SlotID NOT NULL`) |
| 12 | `Payments` | Payment records linked to sessions |
| 13 | `PaymentTransactions` | Payment gateway transaction details (VNPay, MoMo, etc.) |
| 14 | `IncidentReports` | Incident logging (lost ticket, damage, unpaid, etc.) |
| 15 | `MonthlySubscriptions` | Monthly parking subscriptions by slot or zone |
| 16 | `ParkingPredictions` | AI-generated occupancy predictions per floor/vehicle type |

---

## 2. Schema — Table Definitions

### Roles

```sql
RoleID      INT  PK IDENTITY
RoleName    NVARCHAR(50)   UNIQUE NOT NULL
Description NVARCHAR(255)
```

**Seed values:** Admin (1), ParkingManager (2), ParkingStaff (3), Driver (4)

---

### Users

```sql
UserID       INT  PK IDENTITY
FullName     NVARCHAR(100) NOT NULL
Email        NVARCHAR(100) UNIQUE NOT NULL
PhoneNumber  NVARCHAR(20)
PasswordHash NVARCHAR(255) NOT NULL
RoleID       INT  NOT NULL  → Roles(RoleID)
IsActive     BIT  DEFAULT 1
CreatedAt    DATETIME DEFAULT GETDATE()
```

---

### Buildings

```sql
BuildingID         INT  PK IDENTITY
BuildingName       NVARCHAR(100) NOT NULL
Address            NVARCHAR(255)
TotalFloors        INT
OperatingStartTime TIME
OperatingEndTime   TIME
CreatedAt          DATETIME DEFAULT GETDATE()
```

---

### Floors

```sql
FloorID     INT  PK IDENTITY
BuildingID  INT  NOT NULL  → Buildings(BuildingID)
FloorNumber INT  NOT NULL
FloorName   NVARCHAR(50)

UNIQUE (BuildingID, FloorNumber)
```

---

### Zones

```sql
ZoneID      INT  PK IDENTITY
FloorID     INT  NOT NULL  → Floors(FloorID)
ZoneName    NVARCHAR(50)  NOT NULL
Description NVARCHAR(255)

UNIQUE (FloorID, ZoneName)
```

---

### VehicleTypes

```sql
VehicleTypeID INT  PK IDENTITY
TypeName      NVARCHAR(50) NOT NULL UNIQUE
Description   NVARCHAR(255)
```

**Seed values:** Xe máy (1), Ô tô (2), Xe tải nhỏ (3)

---

### Vehicles

> **v6 additions:** `Brand`, `VehicleColor`, `EngineNumber`, `ChassisNumber`, `ManufactureYear`, `VehicleImage`

```sql
VehicleID     INT  PK IDENTITY
LicensePlate  NVARCHAR(20)  NOT NULL UNIQUE
VehicleTypeID INT  NOT NULL  → VehicleTypes(VehicleTypeID)
OwnerName     NVARCHAR(100) NULL
OwnerPhone    NVARCHAR(20)  NULL
UserID        INT           NULL  → Users(UserID)

-- v6 new columns
Brand           NVARCHAR(50)  NULL
VehicleColor    NVARCHAR(30)  NULL
EngineNumber    NVARCHAR(50)  NULL   -- filtered UNIQUE index (non-NULL only)
ChassisNumber   NVARCHAR(50)  NULL   -- filtered UNIQUE index (non-NULL only)
ManufactureYear INT           NULL
VehicleImage    NVARCHAR(255) NULL

IsActive BIT DEFAULT 1
```

**Unique indexes (filtered):**
```sql
CREATE UNIQUE INDEX UQ_Vehicles_EngineNumber  ON Vehicles (EngineNumber)  WHERE EngineNumber  IS NOT NULL;
CREATE UNIQUE INDEX UQ_Vehicles_ChassisNumber ON Vehicles (ChassisNumber) WHERE ChassisNumber IS NOT NULL;
```
*Allows multiple NULLs but enforces uniqueness when a value exists.*

---

### ParkingSlots

> Motorbike slots: large area, high capacity (e.g. `A1`, `A2`).  
> Car slots: ~15 m², capacity = 1 (e.g. `B-01`, `B-02`).

```sql
SlotID           INT  PK IDENTITY
ZoneID           INT  NOT NULL  → Zones(ZoneID)
SlotCode         NVARCHAR(20) NOT NULL UNIQUE
VehicleTypeID    INT  NOT NULL  → VehicleTypes(VehicleTypeID)
Area             DECIMAL(10,2) NULL
Capacity         INT  NOT NULL DEFAULT 1
CurrentOccupancy INT  NOT NULL DEFAULT 0
Status           NVARCHAR(20) NOT NULL
                 CHECK: AVAILABLE | OCCUPIED | RESERVED | LOCKED
IsActive         BIT  DEFAULT 1

CHECK (CurrentOccupancy <= Capacity)
CHECK (CurrentOccupancy >= 0)
```

---

### PricingPolicies

> **v6 change:** `PricePerHour` removed; replaced by `RushHourPrice` + `OffPeakPrice` + time window.

```sql
PricingPolicyID    INT  PK IDENTITY
VehicleTypeID      INT  NOT NULL  → VehicleTypes(VehicleTypeID)
PolicyName         NVARCHAR(100)
BasePrice          DECIMAL(10,2) NOT NULL
RushHourPrice      DECIMAL(10,2) NOT NULL   -- price during peak hours
OffPeakPrice       DECIMAL(10,2) NOT NULL   -- price outside peak hours
RushHourStart      TIME  NOT NULL           -- e.g. 07:00
RushHourEnd        TIME  NOT NULL           -- e.g. 09:00
MaxDailyRate       DECIMAL(10,2)
LostTicketFee      DECIMAL(10,2)
OvertimeFeePerHour DECIMAL(10,2)
EffectiveFrom      DATETIME NOT NULL
EffectiveTo        DATETIME NULL

CHECK (RushHourStart < RushHourEnd)
```

---

### ParkingSessions

```sql
SessionID    INT  PK IDENTITY
VehicleID    INT  NOT NULL  → Vehicles(VehicleID)
SlotID       INT  NOT NULL  → ParkingSlots(SlotID)
EntryTime    DATETIME NOT NULL DEFAULT GETDATE()
ExitTime     DATETIME NULL
EntryGate    NVARCHAR(50)
ExitGate     NVARCHAR(50)
Status       NVARCHAR(20) NOT NULL
             CHECK: PARKING | COMPLETED | LOST_TICKET | UNPAID | VIOLATION
EstimatedFee DECIMAL(10,2)
FinalFee     DECIMAL(10,2)
CreatedBy    INT  → Users(UserID)
```

---

### Reservations

> Cars only (`SlotID NOT NULL`).  
> **v6 addition:** `GuestName`

```sql
ReservationID    INT  PK IDENTITY
UserID           INT  NOT NULL  → Users(UserID)
VehicleID        INT  NOT NULL  → Vehicles(VehicleID)
VehicleTypeID    INT  NOT NULL  → VehicleTypes(VehicleTypeID)
SlotID           INT  NOT NULL  → ParkingSlots(SlotID)
ReservationStart DATETIME NOT NULL
ReservationEnd   DATETIME NOT NULL
Status           NVARCHAR(20)
                 CHECK: PENDING | CONFIRMED | CANCELLED | EXPIRED
CreatedAt        DATETIME DEFAULT GETDATE()
GuestName        NVARCHAR(100) NULL   -- v6
```

---

### Payments

```sql
PaymentID     INT  PK IDENTITY
SessionID     INT  NOT NULL  → ParkingSessions(SessionID)
Amount        DECIMAL(10,2) NOT NULL
PaymentMethod NVARCHAR(30)
              CHECK: CASH | BANK_TRANSFER | E_WALLET | CREDIT_CARD
PaymentStatus NVARCHAR(20)
              CHECK: PENDING | PAID | FAILED
PaidAt        DATETIME
```

---

### PaymentTransactions

```sql
TransactionID     INT  PK IDENTITY
PaymentID         INT  NOT NULL  → Payments(PaymentID)
Gateway           NVARCHAR(30) NOT NULL
                  CHECK: VNPAY | MOMO | ZALOPAY | BANK_TRANSFER
TransactionRef    NVARCHAR(100) NOT NULL UNIQUE
Amount            DECIMAL(10,2) NOT NULL
TransactionStatus NVARCHAR(20) NOT NULL
                  CHECK: PENDING | PAID | FAILED | CANCELLED
PaymentUrl        NVARCHAR(1000) NULL
ResponseCode      NVARCHAR(20)   NULL
ResponseMessage   NVARCHAR(255)  NULL
CreatedAt         DATETIME NOT NULL DEFAULT GETDATE()
PaidAt            DATETIME NULL
```

---

### IncidentReports

> **v6 additions:** `IncidentImage`, `FACILITY_DAMAGE` type

```sql
IncidentID   INT  PK IDENTITY
SessionID    INT  NULL  → ParkingSessions(SessionID)
ReportedBy   INT  NOT NULL  → Users(UserID)
IncidentType NVARCHAR(50)
             CHECK: LOST_TICKET | WRONG_LICENSE_PLATE | OVERTIME |
                    WRONG_ZONE  | UNPAID | SLOT_OCCUPIED |
                    FACILITY_DAMAGE (v6) | OTHER
Description   NVARCHAR(500)
Status        NVARCHAR(20)
              CHECK: OPEN | IN_PROGRESS | RESOLVED | CLOSED
CreatedAt     DATETIME DEFAULT GETDATE()
IncidentImage NVARCHAR(255) NULL   -- v6
```

---

### MonthlySubscriptions

```sql
SubscriptionID INT  PK IDENTITY
UserID         INT  NOT NULL  → Users(UserID)
VehicleID      INT  NOT NULL  → Vehicles(VehicleID)
SlotID         INT  NULL  → ParkingSlots(SlotID)
ZoneID         INT  NULL  → Zones(ZoneID)
StartDate      DATE NOT NULL
EndDate        DATE NOT NULL
MonthlyFee     DECIMAL(10,2) NOT NULL
Status         NVARCHAR(20) NOT NULL
               CHECK: ACTIVE | EXPIRED | CANCELLED
CreatedAt      DATETIME DEFAULT GETDATE()

UNIQUE (UserID, Status)                        -- one active subscription per user
CHECK  (SlotID IS NOT NULL OR ZoneID IS NOT NULL)  -- must be bound to slot OR zone
```

---

### ParkingPredictions

```sql
PredictionID           INT  PK IDENTITY
VehicleTypeID          INT  → VehicleTypes(VehicleTypeID)
FloorID                INT  → Floors(FloorID)
PredictedOccupancyRate DECIMAL(5,2)
PredictedPeakHour      INT
PredictionDate         DATE
GeneratedAt            DATETIME DEFAULT GETDATE()
```

---

## 3. Relationships & Foreign Keys

```
Roles ──< Users
Buildings ──< Floors ──< Zones ──< ParkingSlots
VehicleTypes ──< Vehicles
VehicleTypes ──< ParkingSlots
VehicleTypes ──< PricingPolicies
VehicleTypes ──< ParkingPredictions
Users ──< Vehicles (optional, registered owner)
Vehicles ──< ParkingSessions ──< Payments ──< PaymentTransactions
ParkingSlots ──< ParkingSessions
Users ──< ParkingSessions (CreatedBy = staff)
Users ──< Reservations
Vehicles ──< Reservations
VehicleTypes ──< Reservations
ParkingSlots ──< Reservations
ParkingSessions ──< IncidentReports (nullable)
Users ──< IncidentReports (ReportedBy)
Users ──< MonthlySubscriptions
Vehicles ──< MonthlySubscriptions
ParkingSlots ──< MonthlySubscriptions (optional)
Zones ──< MonthlySubscriptions (optional)
Floors ──< ParkingPredictions
```

---

## 4. Seed Data

### Roles (4 rows)

| RoleID | RoleName | Description |
|--------|----------|-------------|
| 1 | Admin | Quản trị hệ thống |
| 2 | ParkingManager | Quản lý bãi xe |
| 3 | ParkingStaff | Nhân viên trực cổng |
| 4 | Driver | Người dùng gửi xe |

### Users (7 rows)

| UserID | FullName | Email | Role |
|--------|----------|-------|------|
| 1 | Nguyễn Văn Admin | admin@parking.vn | Admin |
| 2 | Trần Thị Lan | lan.manager@parking.vn | ParkingManager |
| 3 | Lê Minh Tuấn | tuan.staff@parking.vn | ParkingStaff |
| 4 | Phạm Thị Hoa | hoa.staff@parking.vn | ParkingStaff |
| 5 | Nguyễn Hoàng Phúc | phuc@gmail.com | Driver |
| 6 | Võ Thị Mai | mai@gmail.com | Driver |
| 7 | Đặng Quốc Hùng | hung@gmail.com | Driver |

### Buildings (2 rows)

| BuildingID | Name | Address | Floors | Hours |
|------------|------|---------|--------|-------|
| 1 | Tòa nhà gửi xe Quận 1 | 120 Lê Lợi, Q.1, TP.HCM | 4 | 06:00–23:00 |
| 2 | Tòa nhà gửi xe Quận 7 | 88 Nguyễn Thị Thập, Q.7, TP.HCM | 3 | 05:30–23:30 |

### Floors (7 rows)

| FloorID | BuildingID | FloorNumber | FloorName |
|---------|------------|-------------|-----------|
| 1 | 1 | 1 | Tầng 1 - Trệt |
| 2 | 1 | 2 | Tầng 2 |
| 3 | 1 | 3 | Tầng 3 |
| 4 | 1 | 4 | Tầng 4 - Mái |
| 5 | 2 | 1 | Tầng 1 - Trệt |
| 6 | 2 | 2 | Tầng 2 |
| 7 | 2 | 3 | Tầng 3 - Mái |

### Zones (6 rows)

| ZoneID | FloorID | ZoneName | Description |
|--------|---------|----------|-------------|
| 1 | 1 | Zone A | Khu vực xe máy tầng 1 |
| 2 | 1 | Zone B | Khu vực ô tô tầng 1 |
| 3 | 2 | Zone A | Khu vực xe máy tầng 2 |
| 4 | 2 | Zone B | Khu vực ô tô tầng 2 |
| 5 | 3 | Zone A | Khu vực xe máy tầng 3 |
| 6 | 4 | Zone A | Khu vực xe tải tầng 4 |

### VehicleTypes (3 rows)

| VehicleTypeID | TypeName | Description |
|---------------|----------|-------------|
| 1 | Xe máy | Xe máy, xe tay ga dưới 175cc |
| 2 | Ô tô | Xe ô tô con dưới 7 chỗ |
| 3 | Xe tải nhỏ | Xe tải dưới 2 tấn |

### PricingPolicies (3 rows)

| PolicyID | VehicleType | BasePrice | RushHourPrice | OffPeakPrice | RushHour | MaxDaily | LostTicketFee |
|----------|-------------|-----------|---------------|--------------|----------|----------|---------------|
| 1 | Xe máy | 5,000 | 6,000 | 5,000 | 07:00–09:00 | 50,000 | 50,000 |
| 2 | Ô tô | 10,000 | 20,000 | 15,000 | 07:00–09:00 | 150,000 | 200,000 |
| 3 | Xe tải nhỏ | 15,000 | 25,000 | 20,000 | 07:00–09:00 | 200,000 | 300,000 |

*(All amounts in VND)*

### ParkingSlots (19 rows)

| SlotID | Zone | SlotCode | Type | Capacity | Occupancy | Status |
|--------|------|----------|------|----------|-----------|--------|
| 1 | 1 | A1 | Xe máy | 20 | 12 | AVAILABLE |
| 2 | 1 | A2 | Xe máy | 15 | 8 | AVAILABLE |
| 3 | 1 | A3 | Xe máy | 10 | 10 | OCCUPIED |
| 4 | 2 | B-01 | Ô tô | 1 | 0 | AVAILABLE |
| 5 | 2 | B-02 | Ô tô | 1 | 1 | OCCUPIED |
| 6 | 2 | B-03 | Ô tô | 1 | 0 | AVAILABLE |
| 7 | 2 | B-04 | Ô tô | 1 | 0 | RESERVED |
| 8 | 2 | B-05 | Ô tô | 1 | 0 | AVAILABLE |
| 9 | 2 | B-06 | Ô tô | 1 | 0 | LOCKED |
| 10 | 3 | A1-T2 | Xe máy | 25 | 10 | AVAILABLE |
| 11 | 3 | A2-T2 | Xe máy | 20 | 5 | AVAILABLE |
| 12 | 4 | B-T2-01 | Ô tô | 1 | 0 | AVAILABLE |
| 13 | 4 | B-T2-02 | Ô tô | 1 | 1 | OCCUPIED |
| 14 | 4 | B-T2-03 | Ô tô | 1 | 0 | AVAILABLE |
| 15 | 5 | A1-T3 | Xe máy | 30 | 0 | AVAILABLE |
| 16 | 5 | A2-T3 | Xe máy | 30 | 0 | AVAILABLE |
| 17 | 6 | E-01 | Xe tải | 1 | 1 | OCCUPIED |
| 18 | 6 | E-02 | Xe tải | 1 | 0 | AVAILABLE |
| 19 | 6 | E-03 | Xe tải | 1 | 0 | AVAILABLE |

### Vehicles (8 rows)

| VehicleID | LicensePlate | Type | OwnerName | UserID | Brand | Color | Year |
|-----------|-------------|------|-----------|--------|-------|-------|------|
| 1 | 51A-12345 | Ô tô | Nguyễn Hoàng Phúc | 5 | Toyota | Trắng | 2020 |
| 2 | 59B-67890 | Ô tô | Võ Thị Mai | 6 | Honda | Đen | 2019 |
| 3 | 50L-11111 | Xe máy | Đặng Quốc Hùng | 7 | Yamaha | Đỏ | 2021 |
| 4 | 29A-99999 | Xe máy | Trần Văn Bình | NULL | — | — | — |
| 5 | 51F-55555 | Xe tải | Công ty ABC | NULL | — | — | — |
| 6 | 51K-22222 | Xe máy | — | NULL | — | — | — |
| 7 | 51H-33333 | Ô tô | Lý Thị Cẩm | NULL | — | — | — |
| 8 | 51G-44444 | Xe máy | Phan Văn Đức | NULL | — | — | — |

### ParkingSessions (12 rows)

| SessionID | Vehicle | Slot | EntryTime | ExitTime | Status | FinalFee |
|-----------|---------|------|-----------|----------|--------|----------|
| 1 | 1 (51A-12345) | B-02 | NOW-2h | — | PARKING | — |
| 2 | 2 (59B-67890) | B-T2-02 | NOW-1h | — | PARKING | — |
| 3 | 3 (50L-11111) | A1 | NOW-3h | — | PARKING | — |
| 4 | 4 (29A-99999) | A1 | NOW-2h | — | PARKING | — |
| 5 | 5 (51F-55555) | E-01 | NOW-5h | — | PARKING | — |
| 6 | 6 (51K-22222) | B-01 | NOW-4h | NOW-1h | COMPLETED | 15,000 |
| 7 | 7 (51H-33333) | B-03 | NOW-6h | NOW-2h | COMPLETED | 60,000 |
| 8 | 8 (51G-44444) | A2 | NOW-3h | NOW-30m | COMPLETED | 10,000 |
| 9 | 1 | B-05 | Yesterday 8h | Yesterday 18h | COMPLETED | 150,000 |
| 10 | 2 | B-T2-01 | Yesterday 7h | Yesterday 12h | COMPLETED | 75,000 |
| 11 | 3 | A2 | NOW-8h | — | LOST_TICKET | — |
| 12 | 6 | B-T2-03 | 2 days ago 10h | 2 days ago 22h | UNPAID | 60,000 |

### Reservations (3 rows)

| ReservationID | User | Vehicle | Slot | Start | End | Status |
|---------------|------|---------|------|-------|-----|--------|
| 1 | 5 | 1 (51A-12345) | B-04 | NOW+1h | NOW+5h | CONFIRMED |
| 2 | 6 | 2 (59B-67890) | B-05 | NOW+3h | NOW+7h | PENDING |
| 3 | 7 | 7 (51H-33333) | B-T2-01 | Yesterday | Yesterday+4h | CANCELLED |

### Payments (6 rows)

| PaymentID | SessionID | Amount | Method | Status |
|-----------|-----------|--------|--------|--------|
| 1 | 6 | 15,000 | CASH | PAID |
| 2 | 7 | 60,000 | E_WALLET | PAID |
| 3 | 8 | 10,000 | CASH | PAID |
| 4 | 9 | 150,000 | BANK_TRANSFER | PAID |
| 5 | 10 | 75,000 | CASH | PAID |
| 6 | 12 | 60,000 | CASH | PENDING |

### PaymentTransactions (6 rows)

| TxnID | PaymentID | Gateway | TransactionRef | Amount | Status |
|-------|-----------|---------|----------------|--------|--------|
| 1 | 1 | VNPAY | PAY1-DEMO-001 | 15,000 | PAID |
| 2 | 2 | VNPAY | PAY2-DEMO-002 | 60,000 | PAID |
| 3 | 3 | VNPAY | PAY3-DEMO-003 | 10,000 | PAID |
| 4 | 4 | BANK_TRANSFER | PAY4-DEMO-004 | 150,000 | PAID |
| 5 | 5 | VNPAY | PAY5-DEMO-005 | 75,000 | PAID |
| 6 | 6 | VNPAY | PAY6-DEMO-006 | 60,000 | PENDING |

### IncidentReports (4 rows)

| IncidentID | SessionID | ReportedBy | Type | Status |
|------------|-----------|------------|------|--------|
| 1 | 11 | Staff 4 | LOST_TICKET | RESOLVED |
| 2 | 12 | Staff 3 | UNPAID | IN_PROGRESS |
| 3 | — | Staff 4 | SLOT_OCCUPIED | OPEN |
| 4 | — | Staff 3 | FACILITY_DAMAGE | OPEN |

### MonthlySubscriptions (3 rows)

| SubID | User | Vehicle | Slot/Zone | Period | Fee | Status |
|-------|------|---------|-----------|--------|-----|--------|
| 1 | 5 | 1 | Slot 7 (B-04) | 2026-05-01 → 05-31 | 1,500,000 | ACTIVE |
| 2 | 7 | 3 | Zone 1 | 2026-05-01 → 05-31 | 500,000 | ACTIVE |
| 3 | 6 | 2 | Slot 8 (B-05) | 2026-04-01 → 04-30 | 1,500,000 | EXPIRED |

### ParkingPredictions (6 rows)

| PredictionID | VehicleType | Floor | OccupancyRate | PeakHour | Date |
|--------------|-------------|-------|---------------|----------|------|
| 1 | Xe máy | 1 | 85% | 08:00 | Today |
| 2 | Xe máy | 1 | 92% | 17:00 | Today |
| 3 | Ô tô | 1 | 70% | 09:00 | Today |
| 4 | Ô tô | 1 | 80% | 18:00 | Today |
| 5 | Xe máy | 2 | 60% | 08:00 | Tomorrow |
| 6 | Ô tô | 2 | 55% | 10:00 | Tomorrow |

---

## 5. Design Notes & v6 Changes

### v6 Schema Changes

| Table | Change |
|-------|--------|
| `Vehicles` | Added `Brand`, `VehicleColor`, `EngineNumber` (filtered UNIQUE), `ChassisNumber` (filtered UNIQUE), `ManufactureYear`, `VehicleImage` |
| `PricingPolicies` | Removed `PricePerHour`; added `RushHourPrice`, `OffPeakPrice`, `RushHourStart`, `RushHourEnd` |
| `Reservations` | Added `GuestName NVARCHAR(100) NULL` |
| `IncidentReports` | Added `IncidentImage NVARCHAR(255) NULL`; added `FACILITY_DAMAGE` to `IncidentType` CHECK constraint |

### Constraint Highlights

- `ParkingSlots`: `CurrentOccupancy` is bounded by `[0, Capacity]` via two CHECK constraints.
- `MonthlySubscriptions`: `UNIQUE(UserID, Status)` limits one active subscription per user; `CHECK(SlotID IS NOT NULL OR ZoneID IS NOT NULL)` requires at least one binding.
- `PricingPolicies`: `CHECK(RushHourStart < RushHourEnd)` prevents invalid time windows.
- `Vehicles.EngineNumber` / `ChassisNumber`: Filtered UNIQUE indexes allow `NULL` for unregistered/guest vehicles while preventing duplicate values when present.

### Slot Naming Convention

- **Motorbike area slots:** `A1`, `A2`, `A1-T2`, etc. — area-based, high capacity
- **Car individual slots:** `B-01`, `B-02`, `B-T2-01`, etc. — 15 m², capacity = 1
- **Truck slots:** `E-01`, `E-02`, etc. — 30 m², capacity = 1

### Out-of-Scope (not in v6)

- AI optimization module — `ParkingPredictions` table exists but no active integration
- Subscription module is implemented but listed as scoped-out in team task split

---

*Generated from `ParkingManagementSystem_v6.sql`*
