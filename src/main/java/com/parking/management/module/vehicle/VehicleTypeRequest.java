package com.parking.management.module.vehicle;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VehicleTypeRequest {
    @NotBlank(message = "Type name is required")
    private String typeName;

    private String description;
}