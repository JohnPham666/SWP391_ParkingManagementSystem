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
    @Operation(summary = "Forgot Password", description = "Send a password reset link to the user's email")
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ApiResponse.success("Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn.", null);
    }

    @Operation(summary = "Reset Password", description = "Reset user password using token")
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ApiResponse.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.", null);
    }
}
