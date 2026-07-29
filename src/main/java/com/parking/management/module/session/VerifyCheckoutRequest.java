package com.parking.management.module.session;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyCheckoutRequest {
    private String licensePlate; // Optional (not available for bicycles or when camera fails)

    @NotBlank(message = "Card ID is required")
    private String cardId; // Required for check-out verification
}
