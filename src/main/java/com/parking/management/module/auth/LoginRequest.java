package com.parking.management.module.auth;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class LoginRequest {
    @NotNull
    private String name; // TODO: Adjust fields
}
