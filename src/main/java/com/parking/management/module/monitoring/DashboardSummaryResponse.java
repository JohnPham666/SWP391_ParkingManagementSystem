package com.parking.management.module.monitoring;

import lombok.Data;

@Data
public class DashboardSummaryResponse {
    private Integer totalSlots;
    private Integer activeSlots;
    private Integer availableSlots;
    private Integer occupiedSlots;
    private Integer reservedSlots;
    private Integer lockedSlots;
    private Integer totalCapacity;
    private Integer currentOccupancy;
    private Integer availableCapacity;
    private Double occupancyRate;
}
