package com.parking.management.module.session;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CardID")
    private ParkingCard card;

    @Column(name = "EntryTime", nullable = false)
    private LocalDateTime entryTime = LocalDateTime.now();

    @Column(name = "ExitTime")
    private LocalDateTime exitTime;

    @Column(name = "EntryGate", length = 50)
    private String entryGate;

    @Column(name = "ExitGate", length = 50)
    private String exitGate;

    @Column(name = "EntryImage", length = 500)
    private String entryImage;

    @Column(name = "ExitImage", length = 500)
    private String exitImage;

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
