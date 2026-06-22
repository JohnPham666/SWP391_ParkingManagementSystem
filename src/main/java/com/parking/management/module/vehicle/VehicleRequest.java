package com.parking.management.module.vehicle;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VehicleRequest {
    @NotBlank(message = "License plate is required")
    private String licensePlate;

    @NotNull(message = "Vehicle type id is required")
    private Integer vehicleTypeId;

    private String ownerName;
    private String ownerPhone;
    private Integer userId;
    private String brand;
    private String vehicleColor;
    private String engineNumber;
    private String chassisNumber;
    private Integer manufactureYear;
    private String registrationNumber;   // Số đăng ký (trên cà vẹt xe)
    private String registrationExpiry;   // Ngày hết hạn đăng kiểm (yyyy-MM-dd)
    private String vehicleImage;
    private String registrationPhoto;    // Ảnh cà vẹt xe
}