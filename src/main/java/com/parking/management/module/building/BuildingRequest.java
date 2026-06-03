package com.parking.management.module.building;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class BuildingRequest {
    @NotNull
    private String name; // TODO: Adjust fields
}
