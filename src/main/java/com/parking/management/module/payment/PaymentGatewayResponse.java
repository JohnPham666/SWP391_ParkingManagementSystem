package com.parking.management.module.payment;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentGatewayResponse {

    private Integer paymentId;
    private Integer transactionId;

    private String transactionRef;
    private BigDecimal amount;

    private String gateway;
    private String paymentStatus;
    private String transactionStatus;

    private String responseCode;
    private String responseMessage;

    private String paymentUrl;
}