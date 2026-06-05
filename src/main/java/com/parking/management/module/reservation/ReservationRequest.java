package com.parking.management.module.reservation;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReservationRequest {
    @NotNull(message = "User id is required")
    private Integer userId;

    @NotNull(message = "Vehicle id is required")
    private Integer vehicleId;

    @NotNull(message = "Vehicle type id is required")
    private Integer vehicleTypeId;

    @NotNull(message = "Slot id is required")
    private Integer slotId;

    @NotNull(message = "Reservation start is required")
    private LocalDateTime reservationStart;

    @NotNull(message = "Reservation end is required")
    private LocalDateTime reservationEnd;

    private String guestName;
}