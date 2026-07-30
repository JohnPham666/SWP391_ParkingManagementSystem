package com.parking.management.module.vehicle;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

// DTO trả dữ liệu xe về frontend (JSON response)
// Được tạo từ entity Vehicle qua static method fromEntity()
// Chứa tất cả thông tin xe bao gồm cả URL ảnh S3
@Data
@AllArgsConstructor
@NoArgsConstructor
public class VehicleResponse {
    private Integer vehicleId;          // ID xe (PK)
    private String licensePlate;        // Biển số xe
    private Integer vehicleTypeId;      // ID loại xe
    private String vehicleTypeName;     // Tên loại xe (join từ VehicleType entity)
    private Integer userId;             // ID user đăng ký
    private String ownerName;           // Tên chủ xe
    private String ownerPhone;          // SĐT chủ xe
    private String brand;               // Hãng xe
    private String vehicleColor;        // Màu xe
    private String engineNumber;        // Số máy
    private String chassisNumber;       // Số khung
    private Integer manufactureYear;    // Năm sản xuất
    private String registrationNumber;  // Số đăng ký cà vẹt
    private LocalDate registrationDate; // Ngày đăng ký
    private LocalDate registrationExpiry; // Ngày hết hạn đăng kiểm
    private String vehicleImage;            // URL ảnh xe (S3)
    private String ownerPortrait;           // URL ảnh chân dung (S3)
    private String registrationPhotoFront;  // URL ảnh cà vẹt trước (S3)
    private String registrationPhotoBack;   // URL ảnh cà vẹt sau (S3)
    private String idCardFront;             // URL ảnh CCCD trước (S3)
    private String idCardBack;              // URL ảnh CCCD sau (S3)
    private String status;              // PENDING / APPROVED / REJECTED

    // Chuyển đổi Entity → DTO Response
    // Được gọi sau mỗi thao tác CRUD để trả kết quả cho frontend
    // Flatten quan hệ: vehicleType → vehicleTypeId + vehicleTypeName
    //                    user → userId
    public static VehicleResponse fromEntity(Vehicle vehicle) {
        VehicleResponse res = new VehicleResponse();
        res.setVehicleId(vehicle.getVehicleId());
        res.setLicensePlate(vehicle.getLicensePlate());
        // Lấy thông tin loại xe từ quan hệ ManyToOne
        res.setVehicleTypeId(vehicle.getVehicleType() != null ? vehicle.getVehicleType().getVehicleTypeId() : null);
        res.setVehicleTypeName(vehicle.getVehicleType() != null ? vehicle.getVehicleType().getTypeName() : null);
        // Lấy userId từ quan hệ ManyToOne
        res.setUserId(vehicle.getUser() != null ? vehicle.getUser().getUserId() : null);
        res.setOwnerName(vehicle.getOwnerName());
        res.setOwnerPhone(vehicle.getOwnerPhone());
        res.setBrand(vehicle.getBrand());
        res.setVehicleColor(vehicle.getVehicleColor());
        res.setEngineNumber(vehicle.getEngineNumber());
        res.setChassisNumber(vehicle.getChassisNumber());
        res.setManufactureYear(vehicle.getManufactureYear());
        res.setRegistrationNumber(vehicle.getRegistrationNumber());
        res.setRegistrationDate(vehicle.getRegistrationDate() != null ? vehicle.getRegistrationDate() : LocalDate.now());
        res.setRegistrationExpiry(vehicle.getRegistrationExpiry());
        // Các URL ảnh S3 — frontend sẽ dùng để render <img src={url}>
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