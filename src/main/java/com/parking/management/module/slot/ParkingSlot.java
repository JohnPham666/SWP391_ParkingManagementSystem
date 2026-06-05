package com.parking.management.module.slot;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 20)
    private SlotStatus status = SlotStatus.AVAILABLE;

    @Column(name = "IsActive")
    private Boolean isActive = true;
}
