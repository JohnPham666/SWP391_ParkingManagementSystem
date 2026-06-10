package com.parking.management.module.session;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ParkingCardRequest {
    @NotBlank(message = "Card ID is required")
    private String cardId;

    private String status;
}
