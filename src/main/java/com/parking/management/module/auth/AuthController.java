package com.parking.management.module.auth;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ApiResponse<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        // Implementation here
        return ApiResponse.success("Login successful", new JwtResponse());
    }
}
