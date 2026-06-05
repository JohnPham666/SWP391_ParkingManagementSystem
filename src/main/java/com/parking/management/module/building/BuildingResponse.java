package com.parking.management.module.building;

import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class BuildingResponse {
    private Integer buildingId;
    private String buildingName;
    private String address;
    private Integer totalFloors;
    private LocalTime operatingStartTime;
    private LocalTime operatingEndTime;
    private LocalDateTime createdAt;
}
