package com.parking.management.module.session;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class SessionResponse {

    //====
    private Integer sessionId;

    private Integer vehicleId;
    private String licensePlate;

    private Integer slotId;
    private String slotCode;

    private LocalDateTime entryTime;
    private LocalDateTime exitTime;

    private String entryGate;
    private String exitGate;

    private String entryImage;
    private String exitImage;

    private String status;

    private BigDecimal estimatedFee;
    private BigDecimal finalFee;

    private Integer vehicleTypeId;
    private String vehicleTypeName;
    
    private String customerName;
    private String customerPhone;

    /**
     * true nếu xe có vé tháng đang còn hiệu lực.
     * Khi có vé tháng, phí gửi xe sẽ = 0 đồng lúc check-out.
     */
    private Boolean hasActiveSubscription;
    //====
}
