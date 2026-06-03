package com.parking.management.module.vehicle;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class VehicleRequest {
    @NotNull
    private String name; // TODO: Adjust fields
}
