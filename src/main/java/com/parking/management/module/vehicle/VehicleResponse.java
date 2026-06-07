package com.parking.management.module.vehicle;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VehicleResponse {
    private Integer vehicleId;
    private String licensePlate;
    private Integer vehicleTypeId;
    private String vehicleTypeName;
    private Integer userId;
    private String ownerName;
    private String ownerPhone;
    private String brand;
    private String vehicleColor;
    private String engineNumber;
    private String chassisNumber;
    private Integer manufactureYear;
    private String vehicleImage;

    public static VehicleResponse fromEntity(Vehicle vehicle) {
        return new VehicleResponse(
                vehicle.getVehicleId(),
                vehicle.getLicensePlate(),
                vehicle.getVehicleType() != null ? vehicle.getVehicleType().getVehicleTypeId() : null,
                vehicle.getVehicleType() != null ? vehicle.getVehicleType().getTypeName() : null,
                vehicle.getUser() != null ? vehicle.getUser().getUserId() : null,
                vehicle.getOwnerName(),
                vehicle.getOwnerPhone(),
                vehicle.getBrand(),
                vehicle.getVehicleColor(),
                vehicle.getEngineNumber(),
                vehicle.getChassisNumber(),
                vehicle.getManufactureYear(),
                vehicle.getVehicleImage()
        );
    }
}