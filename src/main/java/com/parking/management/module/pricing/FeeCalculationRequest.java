package com.parking.management.module.pricing;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO dùng để nhận yêu cầu tính phí gửi xe từ client (Swagger/Frontend).
 * Client gửi lên: loại xe + thời gian vào + thời gian ra.
 * Hệ thống sẽ tự tìm PricingPolicy phù hợp và tính phí.
 */
@Data
public class FeeCalculationRequest {

    // ID loại xe (VD: 1 = Xe máy, 2 = Ô tô)
    @NotNull(message = "Vehicle type id is required")
    private Long vehicleTypeId;

    // Thời gian xe vào bãi
    @NotNull(message = "Entry time is required")
    private LocalDateTime entryTime;

    // Thời gian xe ra bãi
    @NotNull(message = "Exit time is required")
    private LocalDateTime exitTime;
}
