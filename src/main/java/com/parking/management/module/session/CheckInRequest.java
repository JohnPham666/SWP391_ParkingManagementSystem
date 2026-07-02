package com.parking.management.module.session;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckInRequest {

    @NotNull(message = "Reservation id is required")
    private Integer reservationId;

    private String entryGate;

    /**
     * Thẻ từ (optional) – Staff scan thẻ khi khách check-in bằng reservation.
     * Nếu có, session sẽ được gán card để có thể checkout bằng thẻ sau này.
     */
    private String cardId;
}