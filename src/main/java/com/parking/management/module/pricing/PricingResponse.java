package com.parking.management.module.pricing;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class PricingResponse {
    /*
     * PricingResponse dùng để trả dữ liệu pricing policy giá cho client
     * sau khi thực hiện các thao tác như create, search, view list hoặc update.
     *
     * Class này có pricingPolicyId vì ID đã được database tự động sinh ra
     * sau khi lưu PricingPolicy thành công.(nghĩa là khi nhận request thì user ko cần nhập ID nhưng khi response thì vẫn sẽ có ID tương ứng vì database đã tạo rồi)
     *
     * Controller sẽ trả PricingResponse ra ngoài thay vì trả trực tiếp Entity,
     * giúp kiểm soát dữ liệu phản hồi và tránh phụ thuộc trực tiếp vào cấu trúc database.
     */
    private Long pricingPolicyId;
    private Long vehicleTypeId;
    private String policyName;

    private BigDecimal basePrice;
    private BigDecimal rushHourPrice;
    private BigDecimal offPeakPrice;

    private LocalTime rushHourStart;
    private LocalTime rushHourEnd;

    private BigDecimal maxDailyRate;
    private BigDecimal lostTicketFee;
    private BigDecimal overtimeFeePerHour;

    private LocalDateTime effectiveFrom;
    private LocalDateTime effectiveTo;

}
