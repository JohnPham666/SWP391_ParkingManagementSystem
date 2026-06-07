package com.parking.management.module.report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OccupancyReportResponse {
    private Integer totalSlots;
    private Integer availableSlots;
    private Integer occupiedSlots;
    private Integer reservedSlots;
    private Double occupancyRate;
}