package com.parking.management.module.slot;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SlotStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private SlotStatus status;

    @Min(value = 0, message = "Current occupancy must be greater than or equal to 0")
    private Integer currentOccupancy;
}
