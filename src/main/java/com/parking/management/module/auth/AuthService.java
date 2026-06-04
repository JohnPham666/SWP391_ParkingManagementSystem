package com.parking.management.module.auth;

import com.parking.management.module.user.Role;
import com.parking.management.module.user.RoleRepository;
import com.parking.management.module.user.User;
import com.parking.management.module.user.UserRepository;
import com.parking.management.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /**
     * Xử lý đăng nhập:
     * 1. Tìm user theo email
     * 2. So sánh password
     * 3. Kiểm tra tài khoản active
     * 4. Tạo JWT token
     */
    public JwtResponse login(LoginRequest request) {
        // 1. Tìm user theo email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

        // 2. So sánh password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu không chính xác");
        }

        // 3. Kiểm tra tài khoản có bị khóa không
        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa");
        }

        // 4. Tạo JWT token
        String token = jwtUtil.generateToken(user.getEmail());

        return JwtResponse.builder()
                .token(token)
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().getRoleName())
                .build();
    }

    /**
     * Xử lý đăng ký:
     * 1. Kiểm tra email trùng
     * 2. Tìm role mặc định DRIVER
     * 3. Hash password và tạo User
     * 4. Lưu DB, tạo JWT token
     */
    public JwtResponse register(RegisterRequest request) {
        // 1. Kiểm tra email đã tồn tại chưa
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        // 2. Tìm role mặc định cho người dùng mới = DRIVER
        Role driverRole = roleRepository.findByRoleName("DRIVER")
                .orElseThrow(() -> new RuntimeException("Role DRIVER chưa được tạo trong Database. Hãy tạo Role trước."));

        // 3. Tạo User entity mới
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(driverRole);

        // 4. Lưu vào Database
        User savedUser = userRepository.save(user);

        // 5. Tạo JWT token
        String token = jwtUtil.generateToken(savedUser.getEmail());

        return JwtResponse.builder()
                .token(token)
                .userId(savedUser.getUserId())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole().getRoleName())
                .build();
    }
}
