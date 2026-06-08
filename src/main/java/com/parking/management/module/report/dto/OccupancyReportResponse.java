package com.parking.management.module.report.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class OccupancyReportResponse {

    private Integer floorId;
    private Long totalSlots;
    private Long availableSlots;
    private Long occupiedSlots;
    private Long reservedSlots;
    private Double occupancyRate;

    public OccupancyReportResponse(Integer floorId,
                                   Long totalSlots,
                                   Long availableSlots,
                                   Long occupiedSlots,
                                   Long reservedSlots,
                                   Double occupancyRate) {
        this.floorId = floorId;
        this.totalSlots = totalSlots;
        this.availableSlots = availableSlots;
        this.occupiedSlots = occupiedSlots;
        this.reservedSlots = reservedSlots;
        this.occupancyRate = occupancyRate;
    }
}