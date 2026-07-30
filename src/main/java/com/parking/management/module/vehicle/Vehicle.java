package com.parking.management.module.vehicle;

import com.parking.management.module.user.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

// Entity JPA mapping trực tiếp với bảng "Vehicles" trong PostgreSQL
// Đại diện cho 1 phương tiện (xe) trong hệ thống quản lý bãi đỗ xe
// Trạng thái: PENDING → APPROVED / REJECTED (do Manager/Admin duyệt)
// isActive: dùng cho soft delete (false = đã bị xóa mềm)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Vehicles")
public class Vehicle {
    // ===== Khóa chính =====
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vehicleid")
    private Integer vehicleId;    // Auto-increment PK trong PostgreSQL

    // ===== Thông tin cơ bản =====
    @Column(name = "licenseplate", unique = true, nullable = false, length = 20)
    private String licensePlate;   // Biển số xe (duy nhất, bắt buộc)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicletypeid", nullable = false)
    private VehicleType vehicleType;  // FK → bảng VehicleTypes (Car, Motorbike, Bicycle)

    @Column(name = "ownername", length = 100)
    private String ownerName;      // Tên chủ sở hữu xe (theo cà vẹt)

    @Column(name = "ownerphone", length = 20)
    private String ownerPhone;     // Số điện thoại chủ xe

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userid")
    private User user;             // FK → bảng Users (tài khoản đăng ký xe, có thể null)

    @Column(name = "brand", length = 50)
    private String brand;          // Hãng xe (Honda, Toyota, Yamaha...)

    @Column(name = "vehiclecolor", length = 30)
    private String vehicleColor;   // Màu xe

    // ===== Thông tin kỹ thuật =====
    @Column(name = "enginenumber", unique = true, length = 50)
    private String engineNumber;   // Số máy (unique nếu không null)

    @Column(name = "chassisnumber", unique = true, length = 50)
    private String chassisNumber;  // Số khung (unique nếu không null)

    @Column(name = "manufactureyear")
    private Integer manufactureYear; // Năm sản xuất

    @Column(name = "registrationnumber", length = 50)
    private String registrationNumber; // Số đăng ký trên cà vẹt xe

    @Column(name = "registrationdate")
    private LocalDate registrationDate;

    @Column(name = "registrationexpiry")
    private LocalDate registrationExpiry; // Ngày hết hạn đăng kiểm

    // ===== Ảnh giấy tờ (URL S3) =====
    @Column(name = "vehicleimage", length = 255)
    private String vehicleImage;           // URL ảnh xe (lưu trên AWS S3)

    @Column(name = "ownerportrait", length = 500)
    private String ownerPortrait;           // URL ảnh chân dung chủ xe

    @Column(name = "registrationphotofront", length = 500)
    private String registrationPhotoFront;  // URL ảnh cà vẹt mặt trước

    @Column(name = "registrationphotoback", length = 500)
    private String registrationPhotoBack;   // URL ảnh cà vẹt mặt sau

    @Column(name = "idcardfront", length = 500)
    private String idCardFront;             // URL ảnh CCCD mặt trước

    @Column(name = "idcardback", length = 500)
    private String idCardBack;              // URL ảnh CCCD mặt sau

    // ===== Trạng thái =====
    @Column(name = "isactive")
    private Boolean isActive = true;        // true = hoạt động, false = đã soft delete

    @Column(name = "status", length = 20)
    private String status = "PENDING";      // PENDING → APPROVED / REJECTED (Manager duyệt)

    @PrePersist
    protected void onCreate() {
        if (registrationDate == null) {
            registrationDate = LocalDate.now();
        }
    }
}
