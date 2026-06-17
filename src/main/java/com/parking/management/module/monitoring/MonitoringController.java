package com.parking.management.module.monitoring;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
@RequestMapping("/api/monitoring")
@RequiredArgsConstructor
@Tag(name = "Monitoring", description = "Real-time parking dashboard APIs")
public class MonitoringController {
    private final MonitoringService monitoringService;

    @Operation(
            summary = "Get real-time parking dashboard",
            description = "View the parking map grouped by building, floor and zone, including available capacity at each level")
    @GetMapping("/dashboard")
    public ApiResponse<MonitoringDashboardResponse> getDashboard(
            @RequestParam(required = false) Integer buildingId,
            @RequestParam(required = false) Integer floorId,
            @RequestParam(required = false) Integer zoneId,
            @RequestParam(required = false) Integer vehicleTypeId) {
        return ApiResponse.success("Fetched monitoring dashboard successfully",
                monitoringService.getParkingDashboard(buildingId, floorId, zoneId, vehicleTypeId));
    }
}
