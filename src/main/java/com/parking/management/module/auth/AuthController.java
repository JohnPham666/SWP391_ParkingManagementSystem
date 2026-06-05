package com.parking.management.module.auth;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "APIs for user login and registration")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Login", description = "Authenticate user with email and password, returns JWT token")
    @PostMapping("/login")
    public ApiResponse<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        JwtResponse response = authService.login(request);
        return ApiResponse.success("Đăng nhập thành công", response);
    }

    @Operation(summary = "Register", description = "Register a new user account and return JWT token")
    @PostMapping("/register")
    public ApiResponse<JwtResponse> register(@Valid @RequestBody RegisterRequest request) {
        JwtResponse response = authService.register(request);
        return ApiResponse.success("Đăng ký thành công", response);
    }
}
