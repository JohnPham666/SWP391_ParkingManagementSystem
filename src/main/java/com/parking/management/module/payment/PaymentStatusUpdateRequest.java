package com.parking.management.module.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentStatusUpdateRequest {

    @NotNull(message = "Payment status is required")
    private PaymentStatus paymentStatus;
}