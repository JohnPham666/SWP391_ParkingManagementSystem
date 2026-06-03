package com.parking.management.module.vehicle;

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
