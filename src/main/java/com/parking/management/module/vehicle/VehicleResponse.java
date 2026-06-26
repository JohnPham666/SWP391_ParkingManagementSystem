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
    private String ownerPortrait;
    private String registrationPhotoFront;
    private String registrationPhotoBack;
    private String idCardFront;
    private String idCardBack;
    private String status;

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
        res.setOwnerPortrait(vehicle.getOwnerPortrait());
        res.setRegistrationPhotoFront(vehicle.getRegistrationPhotoFront());
        res.setRegistrationPhotoBack(vehicle.getRegistrationPhotoBack());
        res.setIdCardFront(vehicle.getIdCardFront());
        res.setIdCardBack(vehicle.getIdCardBack());
        res.setStatus(vehicle.getStatus());
        return res;
    }
}