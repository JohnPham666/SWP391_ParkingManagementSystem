package com.parking.management.module.payment;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class PaymentRequest {
    private Integer sessionId;
    
    private Integer reservationId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;
}
