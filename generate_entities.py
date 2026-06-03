import os

base_path = "src/main/java/com/parking/management/module/"

entities = {
    "user/Role.java": """package com.parking.management.module.user;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RoleID")
    private Integer roleId;

    @Column(name = "RoleName", unique = true, nullable = false, length = 50)
    private String roleName;

    @Column(name = "Description", length = 255)
    private String description;
}
""",
    "user/User.java": """package com.parking.management.module.user;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserID")
    private Integer userId;

    @Column(name = "FullName", nullable = false, length = 100)
    private String fullName;

    @Column(name = "Email", unique = true, nullable = false, length = 100)
    private String email;

    @Column(name = "PhoneNumber", length = 20)
    private String phoneNumber;

    @Column(name = "PasswordHash", nullable = false, length = 255)
    private String passwordHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RoleID", nullable = false)
    private Role role;

    @Column(name = "IsActive")
    private Boolean isActive = true;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt = LocalDateTime.now();
}
""",
    "building/Building.java": """package com.parking.management.module.building;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Buildings")
public class Building {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BuildingID")
    private Integer buildingId;

    @Column(name = "BuildingName", nullable = false, length = 100)
    private String buildingName;

    @Column(name = "Address", length = 255)
    private String address;

    @Column(name = "TotalFloors")
    private Integer totalFloors;

    @Column(name = "OperatingStartTime")
    private LocalTime operatingStartTime;

    @Column(name = "OperatingEndTime")
    private LocalTime operatingEndTime;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt = LocalDateTime.now();
}
""",
    "floor/Floor.java": """package com.parking.management.module.floor;

import com.parking.management.module.building.Building;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Floors", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"BuildingID", "FloorNumber"})
})
public class Floor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "FloorID")
    private Integer floorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BuildingID", nullable = false)
    private Building building;

    @Column(name = "FloorNumber", nullable = false)
    private Integer floorNumber;

    @Column(name = "FloorName", length = 50)
    private String floorName;
}
""",
    "zone/Zone.java": """package com.parking.management.module.zone;

import com.parking.management.module.floor.Floor;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Zones", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"FloorID", "ZoneName"})
})
public class Zone {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ZoneID")
    private Integer zoneId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "FloorID", nullable = false)
    private Floor floor;

    @Column(name = "ZoneName", nullable = false, length = 50)
    private String zoneName;

    @Column(name = "Description", length = 255)
    private String description;
}
""",
    "vehicle/VehicleType.java": """package com.parking.management.module.vehicle;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "VehicleTypes")
public class VehicleType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VehicleTypeID")
    private Integer vehicleTypeId;

    @Column(name = "TypeName", unique = true, nullable = false, length = 50)
    private String typeName;

    @Column(name = "Description", length = 255)
    private String description;
}
""",
    "vehicle/Vehicle.java": """package com.parking.management.module.vehicle;

import com.parking.management.module.user.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Vehicles")
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VehicleID")
    private Integer vehicleId;

    @Column(name = "LicensePlate", unique = true, nullable = false, length = 20)
    private String licensePlate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleTypeID", nullable = false)
    private VehicleType vehicleType;

    @Column(name = "OwnerName", length = 100)
    private String ownerName;

    @Column(name = "OwnerPhone", length = 20)
    private String ownerPhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID")
    private User user;

    @Column(name = "Brand", length = 50)
    private String brand;

    @Column(name = "VehicleColor", length = 30)
    private String vehicleColor;

    @Column(name = "EngineNumber", length = 50)
    private String engineNumber;

    @Column(name = "ChassisNumber", length = 50)
    private String chassisNumber;

    @Column(name = "ManufactureYear")
    private Integer manufactureYear;

    @Column(name = "VehicleImage", length = 255)
    private String vehicleImage;
}
""",
    "slot/ParkingSlot.java": """package com.parking.management.module.slot;

import com.parking.management.module.vehicle.VehicleType;
import com.parking.management.module.zone.Zone;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ParkingSlots")
public class ParkingSlot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SlotID")
    private Integer slotId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ZoneID", nullable = false)
    private Zone zone;

    @Column(name = "SlotCode", unique = true, nullable = false, length = 20)
    private String slotCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleTypeID", nullable = false)
    private VehicleType vehicleType;

    @Column(name = "Area", precision = 10, scale = 2)
    private BigDecimal area;

    @Column(name = "Capacity", nullable = false)
    private Integer capacity = 1;

    @Column(name = "CurrentOccupancy", nullable = false)
    private Integer currentOccupancy = 0;

    @Column(name = "Status", nullable = false, length = 20)
    private String status;

    @Column(name = "IsActive")
    private Boolean isActive = true;
}
""",
    "pricing/PricingPolicy.java": """package com.parking.management.module.pricing;

import com.parking.management.module.vehicle.VehicleType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "PricingPolicies")
public class PricingPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PricingPolicyID")
    private Integer pricingPolicyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleTypeID", nullable = false)
    private VehicleType vehicleType;

    @Column(name = "PolicyName", length = 100)
    private String policyName;

    @Column(name = "BasePrice", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "RushHourPrice", nullable = false, precision = 10, scale = 2)
    private BigDecimal rushHourPrice;

    @Column(name = "OffPeakPrice", nullable = false, precision = 10, scale = 2)
    private BigDecimal offPeakPrice;

    @Column(name = "RushHourStart", nullable = false)
    private LocalTime rushHourStart;

    @Column(name = "RushHourEnd", nullable = false)
    private LocalTime rushHourEnd;

    @Column(name = "MaxDailyRate", precision = 10, scale = 2)
    private BigDecimal maxDailyRate;

    @Column(name = "LostTicketFee", precision = 10, scale = 2)
    private BigDecimal lostTicketFee;

    @Column(name = "OvertimeFeePerHour", precision = 10, scale = 2)
    private BigDecimal overtimeFeePerHour;

    @Column(name = "EffectiveFrom", nullable = false)
    private LocalDateTime effectiveFrom;

    @Column(name = "EffectiveTo")
    private LocalDateTime effectiveTo;
}
""",
    "session/ParkingSession.java": """package com.parking.management.module.session;

import com.parking.management.module.slot.ParkingSlot;
import com.parking.management.module.user.User;
import com.parking.management.module.vehicle.Vehicle;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ParkingSessions")
public class ParkingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SessionID")
    private Integer sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleID", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SlotID", nullable = false)
    private ParkingSlot slot;

    @Column(name = "EntryTime", nullable = false)
    private LocalDateTime entryTime = LocalDateTime.now();

    @Column(name = "ExitTime")
    private LocalDateTime exitTime;

    @Column(name = "EntryGate", length = 50)
    private String entryGate;

    @Column(name = "ExitGate", length = 50)
    private String exitGate;

    @Column(name = "Status", nullable = false, length = 20)
    private String status;

    @Column(name = "EstimatedFee", precision = 10, scale = 2)
    private BigDecimal estimatedFee;

    @Column(name = "FinalFee", precision = 10, scale = 2)
    private BigDecimal finalFee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CreatedBy")
    private User createdBy;
}
""",
    "reservation/Reservation.java": """package com.parking.management.module.reservation;

import com.parking.management.module.slot.ParkingSlot;
import com.parking.management.module.user.User;
import com.parking.management.module.vehicle.Vehicle;
import com.parking.management.module.vehicle.VehicleType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Reservations")
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ReservationID")
    private Integer reservationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleID", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleTypeID", nullable = false)
    private VehicleType vehicleType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SlotID", nullable = false)
    private ParkingSlot slot;

    @Column(name = "ReservationStart", nullable = false)
    private LocalDateTime reservationStart;

    @Column(name = "ReservationEnd", nullable = false)
    private LocalDateTime reservationEnd;

    @Column(name = "Status", length = 20)
    private String status;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "GuestName", length = 100)
    private String guestName;
}
""",
    "payment/Payment.java": """package com.parking.management.module.payment;

import com.parking.management.module.session.ParkingSession;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PaymentID")
    private Integer paymentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SessionID", nullable = false)
    private ParkingSession session;

    @Column(name = "Amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "PaymentMethod", length = 30)
    private String paymentMethod;

    @Column(name = "PaymentStatus", length = 20)
    private String paymentStatus;

    @Column(name = "PaidAt")
    private LocalDateTime paidAt;
}
""",
    "incident/IncidentReport.java": """package com.parking.management.module.incident;

import com.parking.management.module.session.ParkingSession;
import com.parking.management.module.user.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "IncidentReports")
public class IncidentReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IncidentID")
    private Integer incidentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SessionID")
    private ParkingSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ReportedBy", nullable = false)
    private User reportedBy;

    @Column(name = "IncidentType", length = 50)
    private String incidentType;

    @Column(name = "Description", length = 500)
    private String description;

    @Column(name = "Status", length = 20)
    private String status;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "IncidentImage", length = 255)
    private String incidentImage;
}
""",
    "subscription/MonthlySubscription.java": """package com.parking.management.module.subscription;

import com.parking.management.module.slot.ParkingSlot;
import com.parking.management.module.user.User;
import com.parking.management.module.vehicle.Vehicle;
import com.parking.management.module.zone.Zone;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "MonthlySubscriptions")
public class MonthlySubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SubscriptionID")
    private Integer subscriptionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleID", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SlotID")
    private ParkingSlot slot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ZoneID")
    private Zone zone;

    @Column(name = "StartDate", nullable = false)
    private LocalDate startDate;

    @Column(name = "EndDate", nullable = false)
    private LocalDate endDate;

    @Column(name = "MonthlyFee", nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyFee;

    @Column(name = "Status", nullable = false, length = 20)
    private String status;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt = LocalDateTime.now();
}
""",
    "report/ParkingPrediction.java": """package com.parking.management.module.report;

import com.parking.management.module.floor.Floor;
import com.parking.management.module.vehicle.VehicleType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ParkingPredictions")
public class ParkingPrediction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PredictionID")
    private Integer predictionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleTypeID")
    private VehicleType vehicleType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "FloorID")
    private Floor floor;

    @Column(name = "PredictedOccupancyRate", precision = 5, scale = 2)
    private BigDecimal predictedOccupancyRate;

    @Column(name = "PredictedPeakHour")
    private Integer predictedPeakHour;

    @Column(name = "PredictionDate")
    private LocalDate predictionDate;

    @Column(name = "GeneratedAt")
    private LocalDateTime generatedAt = LocalDateTime.now();
}
"""
}

for rel_path, content in entities.items():
    full_path = os.path.join(base_path, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Created 15 entities.")
