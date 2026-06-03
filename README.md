# Parking Building Management System

## Prerequisites
- Java 17
- Maven
- Microsoft SQL Server

## Setup Instructions

1. **Clone the repository**
2. **Run SQL script**: 
   - Execute the SQL schema script in your local SQL Server instance to create `ParkingManagementSystem` database and tables.
3. **Set Environment Variables**:
   - `DB_USERNAME`: Your SQL Server username (e.g. `sa`)
   - `DB_PASSWORD`: Your SQL Server password
   - `JWT_SECRET`: A secure random string for JWT generation
4. **Run the Application**:
   ```bash
   mvn spring-boot:run
   ```

## API Access
- Base URL: `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

## Team Branching Strategy
- `main` branch is for stable releases.
- Create feature branches for each member: `feature/member1`, `feature/member2`, etc.
- Member 1: Auth, User, Vehicle
- Member 2: Building, Floor, Zone, Slot
- Member 3: Session, Payment, Reservation
- Member 4: Pricing, Incident, Report
