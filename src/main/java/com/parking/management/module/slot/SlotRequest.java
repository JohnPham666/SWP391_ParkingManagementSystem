package com.parking.management.module.slot;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SlotRequest {
    @NotNull(message = "Zone id is required")
    private Integer zoneId;

    @NotBlank(message = "Slot code is required")
    @Size(max = 20, message = "Slot code must not exceed 20 characters")
    private String slotCode;

    @NotNull(message = "Vehicle type id is required")
    private Integer vehicleTypeId;

    @PositiveOrZero(message = "Area must be greater than or equal to 0")
    private BigDecimal area;

    @NotNull(message = "Capacity is required")
    @Positive(message = "Capacity must be greater than 0")
    private Integer capacity;

    @NotNull(message = "Current occupancy is required")
    @Min(value = 0, message = "Current occupancy must be greater than or equal to 0")
    private Integer currentOccupancy;

    private SlotStatus status;

    private Boolean isActive;
}
