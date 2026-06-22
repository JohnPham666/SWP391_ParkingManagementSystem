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
    @Column(name = "vehicleid")
    private Integer vehicleId;

    @Column(name = "licenseplate", unique = true, nullable = false, length = 20)
    private String licensePlate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicletypeid", nullable = false)
    private VehicleType vehicleType;

    @Column(name = "ownername", length = 100)
    private String ownerName;

    @Column(name = "ownerphone", length = 20)
    private String ownerPhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userid")
    private User user;

    @Column(name = "brand", length = 50)
    private String brand;

    @Column(name = "vehiclecolor", length = 30)
    private String vehicleColor;

    @Column(name = "enginenumber", unique = true, length = 50)
    private String engineNumber;

    @Column(name = "chassisnumber", unique = true, length = 50)
    private String chassisNumber;

    @Column(name = "manufactureyear")
    private Integer manufactureYear;

    @Column(name = "registrationnumber", length = 50)
    private String registrationNumber;

    @Column(name = "registrationexpiry")
    private LocalDate registrationExpiry;

    @Column(name = "vehicleimage", length = 255)
    private String vehicleImage;

    @Column(name = "registrationphoto", length = 500)
    private String registrationPhoto;

    @Column(name = "isactive")
    private Boolean isActive = true;
}
