package com.parking.management.module.report;

import com.parking.management.module.report.dto.*;
import java.time.LocalDate;

public interface ReportService {
    RevenueReportResponse getTotalRevenueByDateRange(LocalDate from, LocalDate to);
    OccupancyReportResponse getOccupancyRateByFloor(Integer floorId);
    SessionSummaryResponse getSessionCountByDate(LocalDate date);
    ParkingPredictionResponse generateParkingPrediction();
}