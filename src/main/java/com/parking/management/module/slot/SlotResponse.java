package com.parking.management.module.slot;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class SlotResponse {
    private Integer slotId;
    private Integer zoneId;
    private String zoneName;
    private Integer floorId;
    private String floorName;
    private Integer buildingId;
    private String buildingName;
    private String slotCode;
    private Integer vehicleTypeId;
    private String vehicleTypeName;
    private BigDecimal area;
    private Integer capacity;
    private Integer currentOccupancy;
    private SlotStatus status;
    private Boolean isActive;
}
