package com.parking.management.module.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleRegisterRequest {
    @NotBlank(message = "Token is required")
    private String credential;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
}
