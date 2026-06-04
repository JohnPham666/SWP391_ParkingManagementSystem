package com.parking.management.module.pricing;

import com.parking.management.module.vehicle.VehicleType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "PricingPolicies")
public class PricingPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PricingPolicyID")
    private Long pricingPolicyId;

    @Column(name = "VehicleTypeID", nullable = false)
    private Long vehicleTypeId;

    @Column(name = "PolicyName", length = 100)
    private String policyName;

    @Column(name = "BasePrice", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "RushHourPrice", nullable = false, precision = 10, scale = 2)
    private BigDecimal rushHourPrice;

    @Column(name = "OffPeakPrice", nullable = false, precision = 10, scale = 2)
    private BigDecimal offPeakPrice;

    @Column(name = "RushHourStart", nullable = false)
    private LocalTime rushHourStart;

    @Column(name = "RushHourEnd", nullable = false)
    private LocalTime rushHourEnd;

    @Column(name = "MaxDailyRate", precision = 10, scale = 2)
    private BigDecimal maxDailyRate;

    @Column(name = "LostTicketFee", precision = 10, scale = 2)
    private BigDecimal lostTicketFee;

    @Column(name = "OvertimeFeePerHour", precision = 10, scale = 2)
    private BigDecimal overtimeFeePerHour;

    @Column(name = "EffectiveFrom", nullable = false)
    private LocalDateTime effectiveFrom;

    @Column(name = "EffectiveTo")
    private LocalDateTime effectiveTo;
}
