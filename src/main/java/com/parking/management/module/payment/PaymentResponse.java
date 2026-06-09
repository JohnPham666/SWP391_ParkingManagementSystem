package com.parking.management.module.payment;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentResponse {

    private Integer paymentId;
    private Integer sessionId;
    private Integer reservationId;

    private BigDecimal amount;

    private String paymentMethod;
    private String paymentStatus;

    private LocalDateTime paidAt;

    private String paymentInstruction;
    private String qrContent;
    private String paymentUrl;
}
