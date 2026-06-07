package com.parking.management.module.monitoring;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class MonitoringDashboardResponse {
    private LocalDateTime generatedAt;
    private DashboardSummaryResponse summary;
    private List<BuildingDashboardResponse> buildings = new ArrayList<>();
}
