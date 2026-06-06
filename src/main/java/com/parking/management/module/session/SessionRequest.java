package com.parking.management.module.session;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SessionRequest {
    @NotNull(message = "Reservation id is required")
    private Integer reservationId;

    private String entryGate;

    private String exitGate;
}
