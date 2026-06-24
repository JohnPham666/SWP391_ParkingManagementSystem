package com.parking.management.module.vehicle;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VehicleTypeResponse {
    private Integer vehicleTypeId;
    private String typeName;
    private String description;
    private Boolean isReservable;

    public static VehicleTypeResponse fromEntity(VehicleType vehicleType) {
        return new VehicleTypeResponse(
                vehicleType.getVehicleTypeId(),
                vehicleType.getTypeName(),
                vehicleType.getDescription(),
                vehicleType.getIsReservable()
        );
    }
}