package com.parking.management.module.pricing;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class PricingRequest {
    /*
     * PricingRequest được sử dụng để nhận dữ liệu pricing policy từ các request
     * của client như Swagger, Postman hoặc Frontend.
     *
     * Lớp này không chứa pricingPolicyId vì ID sẽ được database tự động
     * tạo ra khi một chính sách giá mới được thêm vào.
     *
     * Dữ liệu trong request này sẽ được kiểm tra hợp lệ trước, sau đó được chuyển
     * sang entity PricingPolicy ở tầng service trước khi lưu vào cơ sở dữ liệu.
     */
    //Vehicel type id
    @NotNull(message = "Vehicle type id is required")
    private Long vehicleTypeId;

    //policy Name
    @Size(max = 100, message = "Policy name must not exceed 100 characters")
    private String policyName;

    // Base Price
    @NotNull(message = "Base price is required")
    @PositiveOrZero(message = "Base price must be greater than or equal to 0")
    private BigDecimal basePrice;

    //Rust hour price
    @NotNull(message = "Rush hour price is required")
    @PositiveOrZero(message = "Rush hour price must be greater than or equal to 0")
    private BigDecimal rushHourPrice;

    //Off-peak price
    @NotNull(message = "Off-peak price is required")
    @PositiveOrZero(message = "Off-peak price must be greater than or equal to 0")
    private BigDecimal offPeakPrice;

    //Rush hour start
    @NotNull(message = "Rush hour start is required")
    private LocalTime rushHourStart;

    //Rush hour end
    @NotNull(message = "Rush hour end is required")
    private LocalTime rushHourEnd;

    //Max daily rate
    @PositiveOrZero(message = "Max daily rate must be greater than or equal to 0")
    private BigDecimal maxDailyRate;

    //Max daily rate
    @PositiveOrZero(message = "Lost ticket fee must be greater than or equal to 0")
    private BigDecimal lostTicketFee;

    //Over time fee per hour
    @PositiveOrZero(message = "Over time fee per hour must be greater than or equal to 0")
    private BigDecimal overtimeFeePerHour;

    //Effective from
    @NotNull(message = "Effective from is required")
    private LocalDateTime effectiveFrom;

    //Effective to
    private LocalDateTime effectiveTo;
}
