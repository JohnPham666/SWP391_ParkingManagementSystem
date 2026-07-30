package com.parking.management.module.subscription;

import com.parking.management.module.slot.ParkingSlot;
import com.parking.management.module.user.User;
import com.parking.management.module.vehicle.Vehicle;
import com.parking.management.module.zone.Zone;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

// Entity đại diện cho Vé Tháng (Monthly Subscription) trong hệ thống
// Khi user đăng ký vé tháng cho xe, một record sẽ được tạo ở bảng này
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "MonthlySubscriptions")
public class MonthlySubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SubscriptionID")
    private Integer subscriptionId; // Khóa chính của vé tháng

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user; // Khách hàng sở hữu vé tháng này

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleID", nullable = false)
    private Vehicle vehicle; // Xe được đăng ký vé tháng (Xe này phải được duyệt trước)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SlotID")
    private ParkingSlot slot; // (Tùy chọn) Chỗ đậu xe cố định dành riêng cho vé tháng này

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ZoneID")
    private Zone zone; // (Tùy chọn) Khu vực đỗ xe cố định (VD: Khu dành cho cư dân)

    @Column(name = "StartDate", nullable = false)
    private LocalDate startDate; // Ngày bắt đầu hiệu lực của vé tháng

    @Column(name = "EndDate", nullable = false)
    private LocalDate endDate; // Ngày hết hạn (Thường được hệ thống tự tính = StartDate + 30 ngày)

    @Column(name = "MonthlyFee", nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyFee; // Mức phí phải đóng mỗi tháng (lấy từ PricingPolicy lúc tạo vé)

    // Trạng thái vé tháng:
    // PENDING: Vừa tạo, chưa thanh toán xong
    // ACTIVE: Đã thanh toán, đang có hiệu lực sử dụng
    // EXPIRED: Đã quá hạn (do Cron Job cập nhật)
    // CANCELLED: Bị hủy (do user tự hủy hoặc quản trị viên hủy)
    @Column(name = "Status", nullable = false, length = 20)
    private String status;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt = LocalDateTime.now(); // Thời điểm tạo record này
}
