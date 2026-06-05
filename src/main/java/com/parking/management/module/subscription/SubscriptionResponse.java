package com.parking.management.module.subscription;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO trả dữ liệu vé tháng cho client (Swagger/Frontend).
 * Bao gồm toàn bộ thông tin của vé tháng.
 */
@Data
public class SubscriptionResponse {

    private Integer subscriptionId;

    // Thông tin user
    private Integer userId;
    private String userFullName;

    // Thông tin xe
    private Integer vehicleId;
    private String licensePlate;

    // Thông tin slot và zone (có thể null)
    private Integer slotId;
    private Integer zoneId;

    // Thời hạn vé
    private LocalDate startDate;
    private LocalDate endDate;

    // Phí và trạng thái
    private BigDecimal monthlyFee;
    private String status;

    private LocalDateTime createdAt;
}
