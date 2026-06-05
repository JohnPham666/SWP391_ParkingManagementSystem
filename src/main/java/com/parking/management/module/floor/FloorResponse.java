package com.parking.management.module.floor;

import lombok.Data;

@Data
public class FloorResponse {
    private Integer floorId;
    private Integer buildingId;
    private String buildingName;
    private Integer floorNumber;
    private String floorName;
}
