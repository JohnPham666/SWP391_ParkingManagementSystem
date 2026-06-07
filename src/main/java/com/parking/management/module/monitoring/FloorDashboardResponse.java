package com.parking.management.module.monitoring;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class FloorDashboardResponse {
    private Integer floorId;
    private Integer floorNumber;
    private String floorName;
    private DashboardSummaryResponse summary;
    private List<ZoneDashboardResponse> zones = new ArrayList<>();
}
