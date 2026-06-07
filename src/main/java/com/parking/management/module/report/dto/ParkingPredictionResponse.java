package com.parking.management.module.report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ParkingPredictionResponse {
    private Double currentOccupancyRate;
    private Double predictedOccupancyRate;
    private String predictionLevel;
    private String message;
    private LocalDateTime generatedAt;
}