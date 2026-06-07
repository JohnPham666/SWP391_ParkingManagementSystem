package com.parking.management.module.monitoring;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class BuildingDashboardResponse {
    private Integer buildingId;
    private String buildingName;
    private String address;
    private DashboardSummaryResponse summary;
    private List<FloorDashboardResponse> floors = new ArrayList<>();
}
