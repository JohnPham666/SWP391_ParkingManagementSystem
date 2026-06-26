package com.parking.management.module.report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZoneOccupancyDto {
    private String name;
    private Long value;
}
