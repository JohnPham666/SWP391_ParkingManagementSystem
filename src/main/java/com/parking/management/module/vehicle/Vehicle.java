package com.parking.management.module.vehicle;

import com.parking.management.module.user.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

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

    @Column(name = "OwnerIdCard", length = 20)
    private String ownerIdCard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID")
    private User user;

    @Column(name = "Brand", length = 50)
    private String brand;

    @Column(name = "VehicleColor", length = 30)
    private String vehicleColor;

    @Column(name = "EngineNumber", unique = true, length = 50)
    private String engineNumber;

    @Column(name = "ChassisNumber", unique = true, length = 50)
    private String chassisNumber;

    @Column(name = "ManufactureYear")
    private Integer manufactureYear;

    @Column(name = "RegistrationNumber", length = 50)
    private String registrationNumber;

    @Column(name = "RegistrationDate")
    private LocalDate registrationDate;

    @Column(name = "RegistrationExpiry")
    private LocalDate registrationExpiry;

    @Column(name = "VehicleImage", length = 255)
    private String vehicleImage;

    @Column(name = "OwnerPortrait", length = 500)
    private String ownerPortrait;

    @Column(name = "RegistrationPhoto", length = 500)
    private String registrationPhoto;

    @Column(name = "IsActive")
    private Boolean isActive = true;
}
