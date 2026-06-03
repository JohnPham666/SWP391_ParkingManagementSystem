package com.parking.management.module.report;

import com.parking.management.module.floor.Floor;
import com.parking.management.module.vehicle.VehicleType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ParkingPredictions")
public class ParkingPrediction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PredictionID")
    private Integer predictionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleTypeID")
    private VehicleType vehicleType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "FloorID")
    private Floor floor;

    @Column(name = "PredictedOccupancyRate", precision = 5, scale = 2)
    private BigDecimal predictedOccupancyRate;

    @Column(name = "PredictedPeakHour")
    private Integer predictedPeakHour;

    @Column(name = "PredictionDate")
    private LocalDate predictionDate;

    @Column(name = "GeneratedAt")
    private LocalDateTime generatedAt = LocalDateTime.now();
}
