package com.parking.management.module.auth;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "APIs for user login and registration")
public class AuthController {

    private final AuthService authService;

    /**
     * Nhận yêu cầu đăng nhập từ Client.
     * 
     * @param request chứa thông tin email và password.
     * @return ApiResponse chứa JwtResponse (token và thông tin user).
     */
    @Operation(summary = "Login", description = "Authenticate user with email and password, returns JWT token")
    @PostMapping("/login")
    public ApiResponse<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        JwtResponse response = authService.login(request);
        return ApiResponse.success("Đăng nhập thành công", response);
    }

    /**
     * Nhận yêu cầu đăng ký tài khoản mới.
     * 
     * @param request chứa thông tin người dùng mới.
     * @return ApiResponse chứa JwtResponse (token và thông tin user).
     */
    @Operation(summary = "Register", description = "Register a new user account and return JWT token")
    @PostMapping("/register")
    public ApiResponse<JwtResponse> register(@Valid @RequestBody RegisterRequest request) {
        JwtResponse response = authService.register(request);
        return ApiResponse.success("Đăng ký thành công", response);
    }

    /**
     * Nhận yêu cầu gửi link khôi phục mật khẩu.
     * 
     * @param request chứa email của người dùng.
     * @return ApiResponse thông báo thành công (không trả về data).
     */
    @Operation(summary = "Forgot Password", description = "Send a password reset link to the user's email")
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ApiResponse.success(
                "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn.", null);
    }

    /**
     * Nhận yêu cầu đặt lại mật khẩu mới thông qua token.
     * 
     * @param request chứa token và mật khẩu mới.
     * @return ApiResponse thông báo thành công (không trả về data).
     */
    @Operation(summary = "Reset Password", description = "Reset user password using token")
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ApiResponse.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.", null);
    }

    /**
     * Nhận yêu cầu đổi mật khẩu cho người dùng đang đăng nhập.
     * Cần có Authentication token hợp lệ để lấy thông tin email hiện tại.
     * 
     * @param request        chứa mật khẩu cũ và mật khẩu mới.
     * @param authentication thông tin xác thực từ Security Context.
     * @return ApiResponse thông báo thành công (không trả về data).
     */
    @Operation(summary = "Change Password", description = "Change password for the currently authenticated user (requires old password)")
    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        authService.changePassword(email, request.getOldPassword(), request.getNewPassword());
        return ApiResponse.success("Đổi mật khẩu thành công", null);
    }
}
