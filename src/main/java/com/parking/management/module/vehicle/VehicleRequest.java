package com.parking.management.module.vehicle;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

// DTO (Data Transfer Object) nhận dữ liệu từ frontend khi tạo/cập nhật xe
// @Valid trong Controller sẽ kiểm tra @NotBlank, @NotNull trước khi vào Service
// Lưu ý: Các trường ảnh (vehicleImage, ownerPortrait,...) hiện KHÔNG dùng trong request JSON
//         mà được upload riêng qua endpoint /image (multipart/form-data)
@Data
public class VehicleRequest {
    @NotBlank(message = "License plate is required")
    private String licensePlate;        // Biển số xe (bắt buộc, phải không rỗng)

    @NotNull(message = "Vehicle type id is required")
    private Integer vehicleTypeId;      // ID loại xe (bắt buộc, FK → VehicleTypes)

    private String ownerName;           // Tên chủ xe (theo cà vẹt)
    private String ownerPhone;          // SĐT chủ xe
    private Integer userId;             // ID tài khoản đăng ký (tự gán từ JWT cho Driver)
    private String brand;               // Hãng xe
    private String vehicleColor;        // Màu xe
    private String engineNumber;        // Số máy (nullable, frontend gửi null nếu rỗng)
    private String chassisNumber;       // Số khung (nullable, frontend gửi null nếu rỗng)
    private Integer manufactureYear;    // Năm sản xuất
    private String registrationNumber;  // Số đăng ký (trên cà vẹt xe)
    private String registrationDate;    // Ngày đăng ký (yyyy-MM-dd)
    private String registrationExpiry;  // Ngày hết hạn đăng kiểm (yyyy-MM-dd)
    // Các trường ảnh dưới đây chỉ dùng khi tạo xe từ Admin (set URL trực tiếp)
    // Driver upload ảnh qua endpoint riêng POST /vehicles/me/{id}/image
    private String vehicleImage;            // URL ảnh xe
    private String ownerPortrait;           // URL ảnh chân dung chủ xe
    private String registrationPhotoFront;  // URL ảnh cà vẹt mặt trước
    private String registrationPhotoBack;   // URL ảnh cà vẹt mặt sau
    private String idCardFront;             // URL ảnh CCCD mặt trước
    private String idCardBack;              // URL ảnh CCCD mặt sau
}