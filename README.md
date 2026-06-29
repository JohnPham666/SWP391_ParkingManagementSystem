# Parking Building Management System

A comprehensive system for managing multi-floor parking buildings, handling vehicle check-in/out, slot reservations, dynamic pricing, and payments.

## Architecture
- **Backend:** Java 17, Spring Boot 3.2.4, PostgreSQL
- **Frontend:** React 19 (Vite) + Ant Design + Tailwind CSS

## Prerequisites
- **Java 17** & **Maven**
- **PostgreSQL**
- **Node.js** (v18+) & **npm**

## Setup Instructions

### 1. Database Setup
- Execute the `Database_PostgreLatest.sql` script in your local PostgreSQL instance to create the `ParkingManagementSystem` database, tables, and seed initial data.

### 2. Backend Setup
1. **Set Environment Variables** (or update `src/main/resources/application.properties`):
   - `DB_USERNAME`: Your PostgreSQL username (default: `postgres`)
   - `DB_PASSWORD`: Your PostgreSQL password (default: `12345`)
   - `JWT_SECRET`: A secure random string for JWT generation
   - (Optional) VNPay variables: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`
2. **Run the Application**:
   ```bash
   mvn spring-boot:run
   ```
   The backend will be available at `http://localhost:8080`.

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend-react
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## API Access
- **Base API URL:** `http://localhost:8080/api`
- **Swagger UI / API Docs:** `http://localhost:8080/swagger-ui.html`

## Test Accounts (Seeded)
You can use the following seeded accounts to test different role-based views.
- **Admin:** `admin@parking.vn`
- **Manager:** `lan.manager@parking.vn`
- **Staff:** `tuan.staff@parking.vn`
- **Driver:** `phuc@gmail.com`
*(Note: Use `/api/auth/register` to create a new user if you need to know the exact password, as seeded passwords use BCrypt hashes).*

## Team & Contribution
- The `main` branch is for stable releases.
- Create feature branches for development: `feature/<feature-name>`
- Please refer to `GIT_WORKFLOW.md` for detailed branching and commit conventions.
- Additional context can be found in `PROJECT_CONTEXT.md`.
