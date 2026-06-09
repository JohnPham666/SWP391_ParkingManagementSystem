package com.parking.management.module.reservation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    private Integer slotId;

    @NotNull(message = "Reservation start is required")
    private LocalDateTime reservationStart;

    @NotNull(message = "Reservation end is required")
    private LocalDateTime reservationEnd;

    @Size(max = 100, message = "Guest's name must not exceed 100 characters")
    private String guestName;
}
