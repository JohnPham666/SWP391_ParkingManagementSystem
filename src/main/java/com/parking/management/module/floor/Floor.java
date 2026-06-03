package com.parking.management.module.floor;

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
