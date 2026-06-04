package com.parking.management.module.reservation;

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
