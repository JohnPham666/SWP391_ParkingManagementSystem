package com.parking.management.module.session;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class SessionResponse {
    private Integer sessionId;

    private Integer vehicleId;
    private String licensePlate;

    private Integer slotId;
    private String slotCode;

    private LocalDateTime entryTime;
    private LocalDateTime exitTime;

    private String entryGate;
    private String exitGate;

    private String status;

    private BigDecimal estimatedFee;
    private BigDecimal finalFee;
}
