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
    private String ownerIdCard;
    private String brand;
    private String vehicleColor;
    private String engineNumber;
    private String chassisNumber;
    private Integer manufactureYear;
    private String registrationNumber;
    private LocalDate registrationDate;
    private LocalDate registrationExpiry;
    private String vehicleImage;
    private String ownerPortrait;
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
        res.setOwnerIdCard(vehicle.getOwnerIdCard());
        res.setBrand(vehicle.getBrand());
        res.setVehicleColor(vehicle.getVehicleColor());
        res.setEngineNumber(vehicle.getEngineNumber());
        res.setChassisNumber(vehicle.getChassisNumber());
        res.setManufactureYear(vehicle.getManufactureYear());
        res.setRegistrationNumber(vehicle.getRegistrationNumber());
        res.setRegistrationDate(vehicle.getRegistrationDate());
        res.setRegistrationExpiry(vehicle.getRegistrationExpiry());
        res.setVehicleImage(vehicle.getVehicleImage());
        res.setOwnerPortrait(vehicle.getOwnerPortrait());
        res.setRegistrationPhoto(vehicle.getRegistrationPhoto());
        return res;
    }
}