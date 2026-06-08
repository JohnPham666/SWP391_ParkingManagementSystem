package com.parking.management.module.payment;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Data
public class PaymentRequest {
    @NotNull(message = "Session ID is required")
    private Integer sessionId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;
}
