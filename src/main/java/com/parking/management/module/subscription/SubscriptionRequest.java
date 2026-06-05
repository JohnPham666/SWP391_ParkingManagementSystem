package com.parking.management.module.subscription;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO nhận dữ liệu tạo/cập nhật vé tháng từ client.
 *
 * Client chỉ cần gửi: userId, vehicleId, startDate, monthlyFee.
 * - endDate sẽ được hệ thống tự tính = startDate + 1 tháng.
 * - status sẽ được hệ thống tự set = ACTIVE khi tạo mới.
 */
@Data
public class SubscriptionRequest {

    // ID người dùng đăng ký vé tháng
    @NotNull(message = "User ID is required")
    private Integer userId;

    // ID xe đăng ký vé tháng
    @NotNull(message = "Vehicle ID is required")
    private Integer vehicleId;

    // ID slot cố định (không bắt buộc - chỉ dùng nếu muốn giữ chỗ cụ thể)
    private Integer slotId;

    // ID zone (không bắt buộc - chỉ dùng nếu muốn gửi ở zone cố định)
    private Integer zoneId;

    // Ngày bắt đầu vé tháng
    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    // Phí hàng tháng
    @NotNull(message = "Monthly fee is required")
    @PositiveOrZero(message = "Monthly fee must be >= 0")
    private BigDecimal monthlyFee;
}
