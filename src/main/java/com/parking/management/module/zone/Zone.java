package com.parking.management.module.zone;

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
