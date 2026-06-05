package com.parking.management.module.zone;

import lombok.Data;

@Data
public class ZoneResponse {
    private Integer zoneId;
    private Integer floorId;
    private String floorName;
    private Integer buildingId;
    private String buildingName;
    private String zoneName;
    private String description;
}
