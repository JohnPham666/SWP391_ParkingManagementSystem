package com.parking.management.module.session;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WalkInRequest {

    private String licensePlate;

    @NotNull(message = "Vehicle type id is required")
    private Integer vehicleTypeId;

    private String entryGate;
    
    private String guestName;

    @NotBlank(message = "Card ID is required")
    private String cardId;
}
