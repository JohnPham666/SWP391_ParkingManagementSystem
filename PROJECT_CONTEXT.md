# PROJECT_CONTEXT.md — Parking Management System

> **Read this file first at the start of every AI session** to understand the full context of the codebase before making any changes.

---

## 1. Project Overview

**Project Name:** Parking Building Management System  
**Repository:** `JohnPham666/SWP391_ParkingManagementSystem`  
**Local Path:** `C:\Users\khait\OneDrive\Desktop\parkingmanagementsystem`  
**Language:** Java 17 (Spring Boot 3.2.4 backend) + Vanilla HTML/JS/CSS (frontends)  
**Database:** Microsoft SQL Server — database name `ParkingManagementSystem`  
**Base API URL:** `http://localhost:8080/api`  
**Swagger UI:** `http://localhost:8080/swagger-ui.html`

This is a **university group project (SWP391)** for managing multi-floor parking buildings in Vietnam. The system handles vehicle check-in/check-out, slot reservations, dynamic pricing, payments (including VNPay integration), monthly subscriptions, incident reporting, and real-time slot monitoring.

---

## 2. Team & Responsibilities

4-member team:

| Member | GitHub | Responsibility |
|--------|--------|----------------|
| Khải Triệu | (Owner/you) | Auth, User, Security, Pricing Engine, Monthly Subscriptions |
| Phương Minh | — | Building, Floor, Zone, ParkingSlot CRUD, Monitoring Dashboard |
| Đăng Khôi | — | Vehicle, VehicleType, Reservation, Incident Reports, Reports |
| Hồ Hữu Vinh | — | ParkingSession (Check-in/out), Payment, VNPay integration |

> Note: Based on the code, all modules are already **fully implemented**. The task split was from the earlier planning phase.

---

## 3. Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Spring Boot | 3.2.4 | Main framework |
| Spring Data JPA | — | ORM / database access |
| Spring Security | — | Authentication & authorization |
| Spring Validation | — | Input validation |
| JWT (jjwt) | 0.12.5 | Stateless authentication |
| Lombok | — | Boilerplate reduction |
| Springdoc OpenAPI | 2.3.0 | Swagger UI |
| Microsoft SQL Server JDBC | — | DB driver (runtime) |
| Java | 17 | Language version |
| Maven | — | Build tool |

### Frontend — Driver App (`frontend-driver/`)
- Pure HTML + Vanilla JS + TailwindCSS CDN (3.4.17)
- Lucide Icons (local vendor)
- Google Fonts: Be Vietnam Pro
- Single-page app with JS routing (no backend serving; intended to call backend REST APIs)

### Frontend — Staff App (`frontend-staff/parking_management_split/`)
- Pure HTML + Vanilla JS + TailwindCSS
- Large single-page app (`app.js` ~41KB) with staff-facing features
- Separate `embed-helper.js` and `tailwind-config.js`

---

## 4. Project Architecture

### Package Structure
```
com.parking.management
├── ParkingManagementApplication.java       # Spring Boot entry point
├── common/
│   ├── ApiResponse.java                    # Standardized API response wrapper
│   ├── GlobalExceptionHandler.java         # @ControllerAdvice – catches all exceptions
│   └── ResourceNotFoundException.java     # 404 exception class
├── config/
│   ├── SecurityConfig.java                # JWT filter chain, CORS, endpoint permissions
│   ├── SwaggerConfig.java                 # Springdoc configuration
│   └── UploadWebConfig.java               # Static file serving for uploads
├── security/
│   ├── JwtAuthFilter.java                 # JWT request filter
│   ├── JwtUtil.java                       # JWT token generation/validation
│   ├── CustomUserDetailsService.java      # Loads user by email from DB
│   └── SecurityUtils.java                # IDOR check – ensures users own their data
└── module/
    ├── auth/         # Login, Register, JWT response
    ├── building/     # Building CRUD
    ├── floor/        # Floor CRUD
    ├── zone/         # Zone CRUD
    ├── slot/         # ParkingSlot CRUD + status management
    ├── vehicle/      # Vehicle + VehicleType CRUD, image upload
    ├── pricing/      # PricingPolicy CRUD + fee calculation algorithm
    ├── session/      # ParkingSession (check-in/check-out), ParkingCard
    ├── reservation/  # Slot reservation management
    ├── payment/      # Payment records, VNPay integration
    ├── subscription/ # Monthly parking subscriptions
    ├── incident/     # Incident reports (lost ticket, damage, etc.)
    ├── monitoring/   # Real-time dashboard (slot map, occupancy)
    ├── report/       # Revenue reports, occupancy reports, AI predictions
    └── user/         # User + Role CRUD
```

### Each module follows a consistent pattern:
```
Module.java          → JPA Entity (@Entity, @Table)
ModuleRepository.java→ Spring Data JPA repository (extends JpaRepository)
ModuleRequest.java   → DTO for incoming requests (with @Valid annotations)
ModuleResponse.java  → DTO for API responses
ModuleService.java   → Business logic
ModuleController.java→ REST controller (@RestController, @RequestMapping)
```

---

## 5. Database Schema (v7 — Current)

**File:** `ParkingManagementSystem_v7.sql` (run this to set up the DB from scratch)

### 17 Tables

| Table | Purpose |
|-------|---------|
| `Roles` | 4 roles: Admin, ParkingManager, ParkingStaff, Driver |
| `Users` | System accounts; v7 adds PhoneNumber UNIQUE, DateOfBirth, Address |
| `Buildings` | Parking buildings with operating hours |
| `Floors` | Floors within buildings |
| `Zones` | Zones within floors (separated by vehicle type) |
| `VehicleTypes` | Motorbike (1), Car (2), Small Truck (3) |
| `Vehicles` | Registered vehicles; Brand, Color, EngineNumber, ChassisNumber, Year, Image |
| `ParkingSlots` | Slots with status: AVAILABLE / OCCUPIED / RESERVED / LOCKED |
| `PricingPolicies` | Per-vehicle-type pricing: BasePrice, RushHourPrice, OffPeakPrice, time window |
| `ParkingCards` | Physical RFID/barcode cards; status: ACTIVE / IN_USE / LOST |
| `ParkingSessions` | Active and historical parking sessions; optionally linked to a ParkingCard |
| `Reservations` | Advance slot reservations; status: PENDING / CONFIRMED / CANCELLED / EXPIRED / COMPLETED |
| `Payments` | Payment records linked to Session OR Reservation |
| `PaymentTransactions` | Gateway transaction details (VNPay, MoMo, ZaloPay, Bank Transfer) |
| `IncidentReports` | Staff-reported incidents: LOST_TICKET, FACILITY_DAMAGE, UNPAID, etc. |
| `MonthlySubscriptions` | Monthly parking passes linked to Slot or Zone |
| `ParkingPredictions` | AI occupancy predictions per floor/vehicle type (stub – not actively integrated) |

### Key Relationships
```
Roles →< Users →< Vehicles
Buildings →< Floors →< Zones →< ParkingSlots
VehicleTypes →< Vehicles, ParkingSlots, PricingPolicies
Vehicles →< ParkingSessions →< Payments →< PaymentTransactions
ParkingSlots →< ParkingSessions, Reservations
Users →< Reservations, Payments (ownership checks)
ParkingCards →< ParkingSessions (optional)
```

### v7 Changes (vs v6)
- `Users`: Added `PhoneNumber UNIQUE`, `DateOfBirth`, `Address`
- `ParkingCards` table added (new in v7)
- `ParkingSessions`: Added `CardID` FK to ParkingCards
- `Payments`: Changed `SessionID` to NULLABLE; added `ReservationID` FK (can pay for session OR reservation)
- `Reservations`: Added `COMPLETED` to Status CHECK constraint

---

## 6. Security & Authorization

- **Authentication:** JWT Bearer tokens (stateless, no sessions)
- **Password hashing:** BCrypt
- **Token expiry:** 24 hours (86400000ms)
- **IDOR protection:** `SecurityUtils.checkDataOwnership()` ensures Drivers can only access their own data (vehicles, payments, sessions)

### Role-Based Access Control (SecurityConfig.java)
| Endpoint | Access |
|----------|--------|
| `/api/auth/**` | Public |
| `/swagger-ui/**`, `/api-docs/**` | Public |
| `/api/payments/vnpay-return` | Public (VNPay callback) |
| `POST /api/incidents` | All authenticated users |
| `GET /api/incidents/**` | Admin, ParkingManager, ParkingStaff, Driver |
| `PUT /api/incidents/**` | Admin, ParkingManager |
| `DELETE /api/incidents/**` | Admin, ParkingManager |
| `/api/reports/**` | Admin, ParkingManager only |
| Everything else | Authenticated |

> **Note:** More granular `@PreAuthorize` annotations may exist on individual controller methods.

---

## 7. Core Business Logic

### Check-In Flow (SessionService)
1. **Reservation-based check-in** (`POST /api/sessions/check-in`): Finds the reservation → verifies CONFIRMED status → slot must be RESERVED → changes slot to OCCUPIED → creates ParkingSession with status PARKING
2. **Walk-in check-in** (`POST /api/sessions/walk-in`): Finds or creates anonymous vehicle by license plate → finds first AVAILABLE slot for vehicle type → optionally assigns a ParkingCard → creates ParkingSession

### Check-Out Flow (SessionService)
1. Receives sessionId → verifies PARKING status
2. Sets ExitTime = now, Status = COMPLETED
3. Calls `PricingService.calculateFee()` to compute FinalFee
4. If a reservation exists for this vehicle/slot, deducts already-paid reservation fee from final fee
5. Frees the ParkingCard (status back to ACTIVE)
6. Changes slot status back to AVAILABLE

### Fee Calculation Algorithm (PricingService)
1. Finds the active PricingPolicy for the vehicle type
2. Rounds total time up to whole hours
3. For each hour, checks if it falls in the `RushHour` window → applies `RushHourPrice` or `OffPeakPrice`
4. Handles overnight rush-hour windows
5. Caps daily fee at `MaxDailyRate` (applied per 24-hour block)

### Payment Flow (PaymentService)
- **Create payment** for a Session or Reservation
- **Cash:** Staff confirms manually via `POST /api/payments/{id}/confirm-cash`
- **VNPay:** Creates payment URL via `POST /api/payments/{id}/vnpay` → user pays on VNPay → return callback to `/api/payments/vnpay-return` → updates payment and reservation status

### VNPay Config (application.properties / env vars)
```
VNPAY_TMN_CODE       = 71R5HK95  (sandbox)
VNPAY_HASH_SECRET    = KXOYQCE7ZWVMHR01RG1LW5GG9CYDF82G (sandbox)
VNPAY_PAY_URL        = https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL     = http://localhost:8080/api/payments/vnpay-return
```

---

## 8. API Endpoints (by module)

| Module | Base Path | Key Endpoints |
|--------|-----------|---------------|
| Auth | `/api/auth` | `POST /login`, `POST /register` |
| User | `/api/users` | CRUD + `/me` |
| Role | `/api/roles` | CRUD |
| Building | `/api/buildings` | CRUD |
| Floor | `/api/floors` | CRUD + `GET /building/{id}` |
| Zone | `/api/zones` | CRUD + `GET /floor/{id}` |
| Slot | `/api/slots` | CRUD + status update + available slots by type |
| VehicleType | `/api/vehicle-types` | CRUD |
| Vehicle | `/api/vehicles` | CRUD + image upload + `GET /my-vehicles` |
| Pricing | `/api/pricing` | CRUD + `GET /calculate-fee` |
| Session | `/api/sessions` | `POST /check-in`, `POST /walk-in`, `POST /{id}/check-out`, `GET /active/{licensePlate}` |
| ParkingCard | `/api/parking-cards` | CRUD |
| Reservation | `/api/reservations` | CRUD |
| Payment | `/api/payments` | CRUD + `POST /{id}/confirm-cash` + `POST /{id}/vnpay` |
| Subscription | `/api/subscriptions` | CRUD |
| Incident | `/api/incidents` | CRUD |
| Monitoring | `/api/monitoring` | `GET /dashboard`, `GET /slot-map/{floorId}` |
| Report | `/api/reports` | `GET /revenue`, `GET /occupancy`, `GET /predictions` |

---

## 9. Configuration

### application.properties
```properties
server.port=8080
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=ParkingManagementSystem;encrypt=false
spring.datasource.username=${DB_USERNAME:sa}
spring.datasource.password=${DB_PASSWORD:12345}
spring.jpa.hibernate.ddl-auto=none          # DB already created from SQL script
spring.jpa.properties.hibernate.format_sql=true
jwt.secret=${JWT_SECRET:very_secret_key_needs_to_be_long_enough_for_hs256_at_least_32_bytes_long}
jwt.expiration=86400000
file.upload-dir=uploads/vehicles
```

### Environment Variables (set before running)
| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_USERNAME` | `sa` | SQL Server username |
| `DB_PASSWORD` | `12345` | SQL Server password |
| `JWT_SECRET` | (hardcoded fallback) | JWT signing key |
| `VNPAY_TMN_CODE` | `71R5HK95` | VNPay merchant code (sandbox) |
| `VNPAY_HASH_SECRET` | (hardcoded) | VNPay HMAC secret (sandbox) |

### Run the application
```bash
mvn spring-boot:run
```

### Setup DB from scratch
Execute `ParkingManagementSystem_v7.sql` on your local SQL Server instance.

---

## 10. Frontend Applications

### `frontend-driver/` — Driver-facing app
- Single HTML file + assets
- Vanilla JS SPA with client-side routing
- Features: View parking lots, Book a slot, Add vehicle info, Wallet (UI only), Profile, Settings
- Language: Vietnamese (UI)
- Status: UI is implemented; backend API integration may be partial

### `frontend-staff/parking_management_split/` — Staff-facing app
- Single HTML + large `app.js` (~41KB)
- Features: Check-in/check-out management, Slot monitoring, Incident reporting, Reports
- Language: Vietnamese (UI)
- Status: UI is implemented

---

## 11. Seed Data (from v7 SQL)

### Users (password hashes are placeholders — use `/api/auth/register` to create real accounts)
| UserID | Name | Email | Role |
|--------|------|-------|------|
| 1 | Nguyễn Văn Admin | admin@parking.vn | Admin |
| 2 | Trần Thị Lan | lan.manager@parking.vn | ParkingManager |
| 3 | Lê Minh Tuấn | tuan.staff@parking.vn | ParkingStaff |
| 4 | Phạm Thị Hoa | hoa.staff@parking.vn | ParkingStaff |
| 5 | Nguyễn Hoàng Phúc | phuc@gmail.com | Driver |
| 6 | Võ Thị Mai | mai@gmail.com | Driver |
| 7 | Đặng Quốc Hùng | hung@gmail.com | Driver |

### Vehicle Types
| ID | Name |
|----|------|
| 1 | Xe máy (Motorbike) |
| 2 | Ô tô (Car) |
| 3 | Xe tải nhỏ (Small Truck) |

### PricingPolicies (VND)
| Type | Base | Rush Hour | Off-Peak | Max Daily | Rush Window |
|------|------|-----------|----------|-----------|-------------|
| Xe máy | 5,000 | 6,000 | 5,000 | 50,000 | 07:00–09:00 |
| Ô tô | 10,000 | 20,000 | 15,000 | 150,000 | 07:00–09:00 |
| Xe tải nhỏ | 15,000 | 25,000 | 20,000 | 200,000 | 07:00–09:00 |

### ParkingCards
5 pre-seeded cards: CARD-001 to CARD-005, all status ACTIVE.

---

## 12. Key Files Reference

| File | Purpose |
|------|---------|
| [`pom.xml`](pom.xml) | Maven dependencies and build config |
| [`application.properties`](src/main/resources/application.properties) | All app configuration |
| [`ParkingManagementSystem_v7.sql`](ParkingManagementSystem_v7.sql) | **Current** DB schema + seed data (run to reset DB) |
| [`SecurityConfig.java`](src/main/java/com/parking/management/config/SecurityConfig.java) | JWT filter chain, CORS, URL access rules |
| [`SecurityUtils.java`](src/main/java/com/parking/management/security/SecurityUtils.java) | IDOR protection helper |
| [`SessionService.java`](src/main/java/com/parking/management/module/session/SessionService.java) | Check-in / check-out logic |
| [`PricingService.java`](src/main/java/com/parking/management/module/pricing/PricingService.java) | Fee calculation algorithm |
| [`PaymentService.java`](src/main/java/com/parking/management/module/payment/PaymentService.java) | Payment creation + VNPay callback handling |
| [`GlobalExceptionHandler.java`](src/main/java/com/parking/management/common/GlobalExceptionHandler.java) | Unified error response format |
| [`frontend-driver/index.html`](frontend-driver/index.html) | Driver SPA |
| [`frontend-staff/parking_management_split/index.html`](frontend-staff/parking_management_split/index.html) | Staff SPA |

---

## 13. Documentation Files in Repo

| File | Description |
|------|-------------|
| `README.md` | Quick setup instructions |
| `PROJECT_CONTEXT.md` | **This file** — full AI context document |
| `ParkingManagementSystem_v7.sql` | Latest DB schema + seed data |
| `ParkingManagementSystem_v6.md` | Older DB schema doc (v6, kept for history) |
| `TEAM_TASKS.md` | Original team task split and phase planning |
| `GIT_WORKFLOW.md` | Git branching and commit conventions |
| `SECURITY_TEST_GUIDE.md` | How to test authentication, RBAC, and IDOR prevention |

---

## 14. Known Scope / TODOs

- **ParkingPredictions**: Table exists and seeded, but the AI prediction logic is a stub (`ReportServiceImpl` has `generatePredictions()` but no actual ML integration).
- **VNPay refund**: If a reservation payment succeeds but no slots are available, the code logs a critical error but does NOT automatically refund (marked with `// TODO: Xử lý hoàn tiền`).
- **Frontend API integration**: Both frontend apps have UI components but may not fully wire to the backend REST APIs.
- **Subscription check during check-in**: Monthly subscriptions are managed but the check-in flow does not currently check if a driver has an active subscription (would change pricing/flow).
- **`COMPLETED` reservation status**: Added to DB constraint in v7 but some service code may still use the v6 status set.

---

## 15. Naming & Conventions

- **Branches:** `feature/<feature-name>` or `<member>/<feature-name>` — PR into `main`
- **Commits:** `feat:`, `fix:`, `refactor:`, `docs:` prefixes
- **Slot codes:** Motorbikes = `A1, A2, A1-T2` (area, high capacity); Cars = `B-01, B-T2-01` (individual, capacity=1); Trucks = `E-01, E-02`
- **Currency:** All amounts in VND (Vietnamese Dong)
- **Enum strings stored as NVARCHAR** in DB (not DB ENUMs), matched by string equals in service layer
- **Hibernate naming:** Physical naming strategy `PhysicalNamingStrategyStandardImpl` — JPA entity field names must exactly match DB column names (PascalCase per SQL Server convention)

---

*Last updated: 2026-06-14 by AI agent scan*
