package com.parking.management.module.monitoring;

import com.parking.management.module.slot.SlotStatus;
import lombok.Data;

@Data
public class SlotMapResponse {
    private Integer slotId;
    private String slotCode;
    private Integer vehicleTypeId;
    private String vehicleTypeName;
    private Integer capacity;
    private Integer currentOccupancy;
    private Integer availableCapacity;
    private SlotStatus status;
    private Boolean isActive;
}
