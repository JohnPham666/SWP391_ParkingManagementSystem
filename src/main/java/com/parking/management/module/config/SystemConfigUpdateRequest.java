package com.parking.management.module.config;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SystemConfigUpdateRequest {
    @NotBlank(message = "Value is required")
    private String value;
}
