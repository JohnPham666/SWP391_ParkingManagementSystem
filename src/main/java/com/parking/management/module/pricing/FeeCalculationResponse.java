package com.parking.management.module.pricing;

import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO trả kết quả tính phí gửi xe cho client.
 * Bao gồm chi tiết: số giờ cao điểm, ngoài giờ, phí từng loại, tổng phí.
 */
@Data
public class FeeCalculationResponse {

    // Tổng số giờ gửi xe
    private long totalHours;

    // Số giờ rơi vào khung giờ cao điểm (rush hour)
    private long rushHours;

    // Số giờ rơi vào khung ngoài giờ cao điểm (off-peak)
    private long offPeakHours;

    // Tổng phí giờ cao điểm = rushHours * rushHourPrice
    private BigDecimal rushHourFee;

    // Tổng phí ngoài giờ cao điểm = offPeakHours * offPeakPrice
    private BigDecimal offPeakFee;

    // Tổng phí trước khi áp maxDailyRate = rushHourFee + offPeakFee
    private BigDecimal totalFeeBeforeCap;

    // Phí cuối cùng (đã áp maxDailyRate nếu có)
    private BigDecimal finalFee;

    // Tên policy được sử dụng để tính
    private String policyName;
}
