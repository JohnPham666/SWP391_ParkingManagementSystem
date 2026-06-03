package com.parking.management.module.building;

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
