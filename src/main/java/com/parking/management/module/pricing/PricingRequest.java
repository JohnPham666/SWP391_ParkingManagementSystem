package com.parking.management.module.pricing;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class PricingRequest {
    @NotNull
    private String name; // TODO: Adjust fields
}
