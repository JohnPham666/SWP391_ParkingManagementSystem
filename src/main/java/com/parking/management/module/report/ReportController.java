package com.parking.management.module.report;

import com.parking.management.common.ApiResponse;
import com.parking.management.module.report.dto.OccupancyReportResponse;
import com.parking.management.module.report.dto.RevenueReportResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Report", description = "APIs for revenue reports, occupancy reports and parking predictions")
public class ReportController {

    private final ReportService reportService;

    @Operation(summary = "Get revenue report", description = "Get total revenue within a specific date range")
    @GetMapping("/revenue")
    public ApiResponse<RevenueReportResponse> getRevenueReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        return ApiResponse.success("Fetched revenue report successfully",
                reportService.getTotalRevenueByDateRange(fromDate, toDate));
    }

    @Operation(summary = "Get occupancy report", description = "Get occupancy rate for the whole building or a specific floor")
    @GetMapping("/occupancy")
    public ApiResponse<OccupancyReportResponse> getOccupancyReport(
            @RequestParam(required = false) Integer floorId) {

        return ApiResponse.success("Fetched occupancy report successfully",
                reportService.getOccupancyRateByFloor(floorId));
    }

    @Operation(summary = "Generate parking prediction", description = "Generate parking prediction using machine learning or heuristics")
    @GetMapping("/predictions/parking")
    public ApiResponse<?> generateParkingPrediction() {
        return ApiResponse.success("Generated parking prediction successfully",
                reportService.generateParkingPrediction());
    }
}