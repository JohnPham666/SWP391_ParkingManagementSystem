package com.parking.management.module.payment;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class PaymentRequest {
    @NotNull
    private String name; // TODO: Adjust fields
}
