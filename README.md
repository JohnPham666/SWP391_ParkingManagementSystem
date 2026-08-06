<div align="center">

# 🅿️ Parking Management System

**A full-stack, production-grade parking management platform**  
built for multi-building, multi-floor parking operations with real-time session tracking, smart reservations, and integrated digital payments.

[![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.4-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![JWT](https://img.shields.io/badge/Auth-JWT-black?logo=jsonwebtokens)](https://jwt.io/)
[![AWS S3](https://img.shields.io/badge/Storage-AWS%20S3-FF9900?logo=amazons3)](https://aws.amazon.com/s3/)
[![VNPay](https://img.shields.io/badge/Payment-VNPay-blue)](https://vnpay.vn/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Security Design](#-security-design)
- [API Documentation](#-api-documentation)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Test Accounts](#-test-accounts)
- [Team](#-team)

---

## 🚀 Overview

The **Parking Management System** is a comprehensive, full-stack platform designed to digitize and automate the operation of multi-building parking facilities. The system supports the complete lifecycle of a parking event — from slot reservation or walk-in check-in, through real-time session monitoring, to automated fee calculation and online payment — all managed through role-specific dashboards.

This project was developed as a semester capstone (SWP391) by a team of 4 developers under an agile workflow.

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- **JWT-based Stateless Authentication** with custom `JwtAuthFilter`
- **Role-Based Access Control (RBAC)** across 4 roles: `ADMIN`, `MANAGER`, `STAFF`, `DRIVER`
- **Google OAuth2** social login integration
- Secure **Forgot Password** flow via email OTP
- **BCrypt** password hashing

### 🏗️ Parking Infrastructure Management
- Hierarchical structure: **Building → Floor → Zone → Slot**
- Slot status management (AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE)
- Real-time slot availability map

### 🚗 Parking Session Engine
- **Walk-in Check-in / Check-out** for unregistered vehicles (via Staff)
- **Parking Card** management for subscribed users
- Automated session duration tracking
- **Checkout verification** workflow with fee preview before payment
- ALPR (Automatic License Plate Recognition) integration for automated vehicle identification

### 📅 Reservation System
- Advance slot reservations with time-window booking
- Automated reservation expiry via **Spring Scheduler**
- Conflict detection to prevent double-booking

### 💰 Dynamic Pricing & Payments
- Configurable pricing rules per zone/vehicle type/time-of-day
- **VNPay payment gateway** integration with HMAC-SHA512 digital signature verification for transaction integrity
- Mock payment mode for development/testing
- Full **payment transaction history** and status tracking

### 📊 Reporting & Monitoring
- Revenue reports by date range, building, zone
- Real-time occupancy monitoring dashboard
- Incident reporting and management

### ☁️ Cloud Storage
- **AWS S3** integration for storing vehicle images, incident photos, and generated reports

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│              React 19 (Vite) + Ant Design SPA                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS / REST API
┌─────────────────────────▼───────────────────────────────────────┐
│                      API Gateway Layer                           │
│            Spring Security (JWT Filter Chain)                    │
│               OpenAPI / Swagger Documentation                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                     Business Logic Layer                         │
│   ┌────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│   │  Auth      │  │  Session     │  │  Reservation          │  │
│   │  Service   │  │  Service     │  │  Service + Scheduler  │  │
│   └────────────┘  └──────────────┘  └───────────────────────┘  │
│   ┌────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│   │  Payment   │  │  Pricing     │  │  Report / Monitoring  │  │
│   │  Service   │  │  Service     │  │  Service              │  │
│   └────────────┘  └──────────────┘  └───────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    Data & Integration Layer                       │
│   ┌──────────────────┐   ┌──────────┐   ┌────────────────────┐ │
│   │  PostgreSQL 16   │   │  AWS S3  │   │  VNPay Gateway     │ │
│   │  (Spring JPA)    │   │  (Media) │   │  (HMAC-SHA512)     │ │
│   └──────────────────┘   └──────────┘   └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 17 | Core language |
| Spring Boot | 3.2.4 | Application framework |
| Spring Security | 6.x | Authentication & Authorization |
| Spring Data JPA / Hibernate | 6.x | ORM & database access |
| JJWT | 0.12.5 | JWT generation & validation |
| PostgreSQL | 16 | Primary relational database |
| Lombok | latest | Boilerplate reduction |
| SpringDoc OpenAPI | 2.3.0 | API documentation (Swagger UI) |
| Spring Mail | 3.2.x | Email notifications (OTP, receipts) |
| AWS SDK S3 | 2.20.162 | Cloud file storage |
| Google API Client | 2.2.0 | Google OAuth2 login |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | latest | Build tool & dev server |
| Ant Design | latest | UI component library |
| React Router | latest | Client-side routing |
| Axios | latest | HTTP client |

---

## 📁 Project Structure

```
SWP391_ParkingManagementSystem/
├── src/main/java/com/parking/management/
│   ├── ParkingManagementApplication.java
│   ├── common/                         # Shared utilities, base classes
│   ├── config/                         # Spring Bean configurations
│   ├── security/                       # JWT filter, UserDetailsService
│   │   ├── JwtUtil.java
│   │   ├── JwtAuthFilter.java
│   │   ├── CustomUserDetailsService.java
│   │   └── SecurityUtils.java
│   └── module/                         # Feature modules (layered architecture)
│       ├── auth/                       # Login, Register, OAuth2, OTP
│       ├── user/                       # User & Role management
│       ├── building/                   # Building management
│       ├── floor/                      # Floor management
│       ├── zone/                       # Zone management
│       ├── slot/                       # Slot availability
│       ├── vehicle/                    # Vehicle registration
│       ├── session/                    # Parking sessions, Check-in/out
│       ├── reservation/                # Advance booking + Scheduler
│       ├── pricing/                    # Dynamic pricing rules
│       ├── payment/                    # VNPay integration, transactions
│       ├── subscription/               # Parking card subscriptions
│       ├── alpr/                       # License plate recognition
│       ├── incident/                   # Incident reporting
│       ├── monitoring/                 # Real-time occupancy
│       ├── report/                     # Revenue & usage reports
│       └── config/                     # System configuration
├── frontend-react/
│   ├── src/
│   │   ├── modules/driver/             # Driver-facing pages
│   │   ├── components/                 # Reusable UI components
│   │   ├── contexts/                   # React Context (Auth, etc.)
│   │   ├── services/                   # Axios API service layer
│   │   └── utils/                      # Helpers & formatters
│   ├── package.json
│   └── vite.config.js
├── Database_PostgreLatest.sql          # Full database schema + seed data
├── Dockerfile
└── pom.xml
```

---

## 🗄️ Database Schema

The database is designed with a **normalized relational schema** across 15+ tables, reflecting real-world parking facility hierarchy:

```
roles ──────────────────────── users
                                  │
                    ┌─────────────┼──────────────┐
                    │             │               │
               vehicles     parking_cards   reservations
                    │             │               │
               parking_sessions ──┴───────────────┘
                    │
               payments ──── payment_transactions
                    │
           ┌────────┴────────┐
      buildings           pricing_rules
           │
        floors
           │
        zones
           │
        slots
```

**Key design decisions:**
- Slot status is always derived from active session/reservation state to prevent data inconsistency
- `pricing_rules` are configurable per vehicle type and time window
- `payment_transactions` is separated from `payments` to maintain an immutable audit trail of all gateway calls

---

## 🔐 Security Design

Authentication follows a **stateless JWT flow**:

```
Client                   Server
  │                         │
  ├──POST /api/auth/login───►│
  │                         │ 1. Validate credentials
  │                         │ 2. Load user via CustomUserDetailsService
  │                         │ 3. Generate signed JWT (HMAC-SHA256)
  │◄──{ accessToken }───────┤
  │                         │
  ├──GET /api/... ──────────►│
  │   Authorization:        │ 4. JwtAuthFilter intercepts
  │   Bearer <token>        │ 5. Validate signature & expiry
  │                         │ 6. Set SecurityContext with role
  │◄──{ response }──────────┤
```

**Role permissions matrix:**

| Endpoint | ADMIN | MANAGER | STAFF | DRIVER |
|---|:---:|:---:|:---:|:---:|
| Manage buildings/floors/zones | ✅ | ✅ | ❌ | ❌ |
| Check-in / Check-out vehicles | ✅ | ✅ | ✅ | ❌ |
| Make reservations | ✅ | ✅ | ✅ | ✅ |
| View own session history | ✅ | ✅ | ✅ | ✅ |
| Access revenue reports | ✅ | ✅ | ❌ | ❌ |
| User management | ✅ | ❌ | ❌ | ❌ |

---

## 📖 API Documentation

Once the backend is running, the full interactive Swagger UI is available at:

**`http://localhost:8080/swagger-ui.html`**

Key API groups:
- `POST /api/auth/login` — Authenticate and receive JWT
- `POST /api/auth/register` — Register a new driver account
- `POST /api/auth/google` — Google OAuth2 login
- `GET  /api/sessions` — List parking sessions
- `POST /api/sessions/check-in` — Check in a vehicle
- `POST /api/sessions/check-out` — Check out and calculate fee
- `POST /api/reservations` — Create a reservation
- `POST /api/payments/vnpay/create` — Initiate VNPay payment
- `GET  /api/reports/revenue` — Revenue report by date range
- `GET  /api/monitoring/occupancy` — Real-time slot occupancy

---

## 🚀 Getting Started

### Prerequisites

- **Java 17** (JDK)
- **Maven 3.8+**
- **PostgreSQL 14+**
- **Node.js 18+** & **npm**

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/SWP391_ParkingManagementSystem.git
cd SWP391_ParkingManagementSystem
```

### 2. Database Setup

Create a PostgreSQL database and run the provided script:

```sql
-- In psql or pgAdmin:
CREATE DATABASE ParkingManagementSystem;
```

```bash
psql -U postgres -d ParkingManagementSystem -f Database_PostgreLatest.sql
```

### 3. Backend Setup

Configure environment variables (see [Environment Variables](#-environment-variables)), then run:

```bash
./mvnw spring-boot:run
```

The API will be available at **`http://localhost:8080`**.

### 4. Frontend Setup

```bash
cd frontend-react
npm install
npm run dev
```

The frontend will be available at **`http://localhost:5173`**.

---

## ⚙️ Environment Variables

Configure the following variables (via OS environment or `src/main/resources/application.properties`):

| Variable | Description | Default |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/ParkingManagementSystem` |
| `DB_USERNAME` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | *(required)* |
| `JWT_SECRET` | Secret key for signing JWT tokens (min 256-bit) | *(required)* |
| `JWT_EXPIRATION_MS` | Token expiry in milliseconds | `86400000` (24h) |
| `MAIL_USERNAME` | Gmail address for sending OTP emails | *(required)* |
| `MAIL_PASSWORD` | Gmail app password | *(required)* |
| `VNPAY_TMN_CODE` | VNPay merchant terminal code | *(required for payments)* |
| `VNPAY_HASH_SECRET` | VNPay HMAC-SHA512 secret key | *(required for payments)* |
| `VNPAY_RETURN_URL` | VNPay callback URL after payment | `http://localhost:8080/api/vnpay/return` |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | *(optional)* |
| `AWS_SECRET_ACCESS_KEY` | AWS secret for S3 | *(optional)* |
| `AWS_S3_BUCKET` | S3 bucket name | *(optional)* |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID | *(optional)* |

---

## 👤 Test Accounts

The database seed script creates the following accounts for testing:

| Role | Email | Notes |
|---|---|---|
| **Admin** | `admin@parking.vn` | Full system access |
| **Manager** | `lan.manager@parking.vn` | Building operations |
| **Staff** | `tuan.staff@parking.vn` | Check-in/out operations |
| **Driver** | `phuc@gmail.com` | End-user (parking customer) |

> **Note:** Use `/api/auth/login` with the credentials. Passwords are BCrypt-hashed in the seed file.

---

## 👥 Team

| Member | Role | Responsibilities |
|---|---|---|
| **Khải Triệu** | Team Lead / Back-end Dev | System architecture, Security (JWT + RBAC), Payment integration (VNPay), Session engine, ALPR, Database design |
| Hồ Hữu Vinh | Back-end Dev | Reservation module, Pricing engine, Reporting |
| Phạm Phương Minh| Front-end Dev | Driver dashboard, Reservation & Payment UI |
| Nguyễn Đăng Khôi | Front-end Dev | Admin/Staff dashboard, Monitoring UI |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ as part of SWP391 — Semester Project, FPT University</sub>
</div>
