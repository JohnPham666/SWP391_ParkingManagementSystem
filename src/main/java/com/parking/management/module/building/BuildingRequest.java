package com.parking.management.module.building;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;

@Data
public class BuildingRequest {
    @NotBlank(message = "Building name is required")
    @Size(max = 100, message = "Building name must not exceed 100 characters")
    private String buildingName;

    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;

    @NotNull(message = "Total floors is required")
    @Min(value = 1, message = "Total floors must be at least 1")
    private Integer totalFloors;

    private LocalTime operatingStartTime;

    private LocalTime operatingEndTime;
}
