package com.parking.management.module.floor;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FloorRequest {
    @NotNull(message = "Building id is required")
    private Integer buildingId;

    @NotNull(message = "Floor number is required")
    @Min(value = 0, message = "Floor number must be 0 or greater")
    private Integer floorNumber;

    @NotBlank(message = "Floor name is required")
    @Size(max = 50, message = "Floor name must not exceed 50 characters")
    private String floorName;
}
