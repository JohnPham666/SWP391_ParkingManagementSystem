package com.parking.management.module.zone;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ZoneRequest {
    @NotNull(message = "Floor id is required")
    private Integer floorId;

    @NotBlank(message = "Zone name is required")
    @Size(max = 50, message = "Zone name must not exceed 50 characters")
    private String zoneName;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;
}
