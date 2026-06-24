package com.parking.management.module.vehicle;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

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
    private String registrationNumber;
    private LocalDate registrationExpiry;
    private String vehicleImage;
    private String registrationPhoto;

    public static VehicleResponse fromEntity(Vehicle vehicle) {
        VehicleResponse res = new VehicleResponse();
        res.setVehicleId(vehicle.getVehicleId());
        res.setLicensePlate(vehicle.getLicensePlate());
        res.setVehicleTypeId(vehicle.getVehicleType() != null ? vehicle.getVehicleType().getVehicleTypeId() : null);
        res.setVehicleTypeName(vehicle.getVehicleType() != null ? vehicle.getVehicleType().getTypeName() : null);
        res.setUserId(vehicle.getUser() != null ? vehicle.getUser().getUserId() : null);
        res.setOwnerName(vehicle.getOwnerName());
        res.setOwnerPhone(vehicle.getOwnerPhone());
        res.setBrand(vehicle.getBrand());
        res.setVehicleColor(vehicle.getVehicleColor());
        res.setEngineNumber(vehicle.getEngineNumber());
        res.setChassisNumber(vehicle.getChassisNumber());
        res.setManufactureYear(vehicle.getManufactureYear());
        res.setRegistrationNumber(vehicle.getRegistrationNumber());
        res.setRegistrationExpiry(vehicle.getRegistrationExpiry());
        res.setVehicleImage(vehicle.getVehicleImage());
        res.setRegistrationPhoto(vehicle.getRegistrationPhoto());
        return res;
    }
}