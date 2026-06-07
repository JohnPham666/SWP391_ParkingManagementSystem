package com.parking.management.module.report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RevenueReportResponse {
    private LocalDate fromDate;
    private LocalDate toDate;
    private BigDecimal totalRevenue;
    private Long totalPayments;
}