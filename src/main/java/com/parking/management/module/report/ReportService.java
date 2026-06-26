package com.parking.management.module.report;

import com.parking.management.module.report.dto.*;
import java.time.LocalDate;

public interface ReportService {
    RevenueReportResponse getTotalRevenueByDateRange(LocalDate from, LocalDate to);
    java.util.List<DailyRevenueDto> getDailyRevenueTrend(LocalDate from, LocalDate to);
    OccupancyReportResponse getOccupancyRateByFloor(Integer floorId);
    java.util.List<ZoneOccupancyDto> getOccupancyBreakdown();
    java.util.List<ZoneOccupancyDto> getFloorOccupancyBreakdown();
    SessionSummaryResponse getSessionCountByDate(LocalDate date);
    ParkingPredictionResponse generateParkingPrediction();
}