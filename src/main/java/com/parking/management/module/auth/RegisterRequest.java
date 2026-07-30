package com.parking.management.module.auth;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

@Data
public class RegisterRequest {
    @NotBlank(message = "Full name cannot be empty")
    private String fullName;

    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number cannot be empty")
    private String phoneNumber;

    private LocalDate dateOfBirth;

    private String address;

    @NotBlank(message = "Password cannot be empty")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
