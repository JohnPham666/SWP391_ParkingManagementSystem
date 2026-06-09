package com.parking.management.module.session;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WalkInRequest {

    @NotBlank(message = "License plate is required")
    private String licensePlate;

    @NotNull(message = "Vehicle type id is required")
    private Integer vehicleTypeId;

    private String entryGate;
    
    private String guestName;
}
