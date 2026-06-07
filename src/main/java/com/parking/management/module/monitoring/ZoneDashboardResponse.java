package com.parking.management.module.monitoring;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ZoneDashboardResponse {
    private Integer zoneId;
    private String zoneName;
    private String description;
    private DashboardSummaryResponse summary;
    private List<SlotMapResponse> slots = new ArrayList<>();
}
