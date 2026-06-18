package com.parking.management.module.pricing;

import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO trả kết quả tính phí gửi xe cho client.
 *
 * Công thức: FinalFee = BasePrice + HourlyFee (capped bởi MaxDailyRate) + OvertimeFee
 */
@Data
public class FeeCalculationResponse {

    // Tên policy được áp dụng
    private String policyName;

    // Phí vào cổng (one-time, thu ngay khi xe vào)
    private BigDecimal baseFee;

    // --- Chi tiết tính phí theo giờ ---

    // Tổng số giờ trong khoảng thời gian bình thường (entryTime -> overtimeStart hoặc exitTime)
    private long totalHours;

    // Số giờ rơi vào khung giờ cao điểm
    private long rushHours;

    // Số giờ rơi vào khung ngoài giờ cao điểm
    private long offPeakHours;

    // Phí giờ cao điểm = rushHours * rushHourPrice
    private BigDecimal rushHourFee;

    // Phí ngoài giờ cao điểm = offPeakHours * offPeakPrice
    private BigDecimal offPeakFee;

    // Tổng phí theo giờ trước khi áp MaxDailyRate
    private BigDecimal totalFeeBeforeCap;

    // Tổng phí theo giờ sau khi áp MaxDailyRate
    private BigDecimal cappedHourlyFee;

    // --- Chi tiết phí quá giờ (overtime) ---

    // Số giờ quá giờ reservation (exitTime - overtimeStart), = 0 nếu không có
    private long overtimeHours;

    // Phí quá giờ = overtimeHours * overtimeFeePerHour
    private BigDecimal overtimeFee;

    // --- Tổng cuối cùng ---

    // FinalFee = baseFee + cappedHourlyFee + overtimeFee
    private BigDecimal finalFee;
}
