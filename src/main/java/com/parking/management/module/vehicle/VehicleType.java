package com.parking.management.module.vehicle;

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
