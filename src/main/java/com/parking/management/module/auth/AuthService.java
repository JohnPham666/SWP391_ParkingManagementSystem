package com.parking.management.module.auth;

import com.parking.management.module.user.Role;
import com.parking.management.module.user.RoleRepository;
import com.parking.management.module.user.User;
import com.parking.management.module.user.UserRepository;
import com.parking.management.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.Claims;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JavaMailSender mailSender;

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

        // 2. So sánh password (Hỗ trợ cả BCrypt và so sánh chuỗi trực tiếp cho Seed Data)
        boolean isMatch = passwordEncoder.matches(request.getPassword(), user.getPasswordHash()) 
                       || request.getPassword().equals(user.getPasswordHash());

        if (!isMatch) {
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
        // 1. Kiểm tra email và số điện thoại đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new RuntimeException("Số điện thoại đã được sử dụng");
        }

        // 2. Tìm role mặc định cho người dùng mới = DRIVER
        Role driverRole = roleRepository.findByRoleName("DRIVER")
                .orElseThrow(() -> new RuntimeException("Role DRIVER chưa được tạo trong Database. Hãy tạo Role trước."));

        // 3. Tạo User entity mới
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setAddress(request.getAddress());
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

    /**
     * Xử lý Quên mật khẩu:
     * Tạo JWT với secret = jwt.secret + passwordHash
     * Thời hạn 15 phút.
     */
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

        long expirationMillis = 15 * 60 * 1000; // 15 mins
        Date now = new Date();
        Date expiration = new Date(now.getTime() + expirationMillis);

        // Tạo secret riêng biệt chứa password hash
        // Nếu user đổi mật khẩu, passwordHash sẽ thay đổi -> token cũ bị vô hiệu
        String secretString = "fallback_secret_key_needs_to_be_long_enough_for_hs256" + user.getPasswordHash();
        SecretKey key = Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));

        String token = Jwts.builder()
                .subject(user.getEmail())
                .issuedAt(now)
                .expiration(expiration)
                .signWith(key)
                .compact();

        // Cấu hình link reset (Frontend URL)
        String resetLink = "http://localhost:8080/driver/index.html?resetToken=" + token;

        // Gửi email bằng HTML để đảm bảo link không bị cắt chữ
        try {
            jakarta.mail.internet.MimeMessage mimeMessage = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(mimeMessage, "utf-8");
            
            helper.setTo(user.getEmail());
            helper.setSubject("Đặt lại mật khẩu - ParkSmart");
            
            String htmlMsg = "<h3>Yêu cầu đặt lại mật khẩu</h3>"
                    + "<p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng click vào nút bên dưới để khôi phục (Link có hiệu lực trong 15 phút):</p>"
                    + "<a href=\"" + resetLink + "\" style=\"display:inline-block;padding:10px 20px;color:white;background-color:#ea580c;text-decoration:none;border-radius:5px;\">Đặt lại mật khẩu</a>"
                    + "<p>Hoặc copy đường link sau và dán vào trình duyệt của bạn:</p>"
                    + "<p><a href=\"" + resetLink + "\">" + resetLink + "</a></p>"
                    + "<br><p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>";
            
            helper.setText(htmlMsg, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("Lỗi gửi mail (có thể chưa cấu hình SMTP): " + e.getMessage());
            // Log link ra console để dev dễ test khi chưa có mail server thực tế
            System.out.println("RESET LINK (TESTING): " + resetLink);
        }
    }

    /**
     * Xử lý Đặt lại mật khẩu:
     * Parse token, extract email, verify bằng passwordHash hiện tại.
     * Sau đó cập nhật mật khẩu mới.
     */
    public void resetPassword(String token, String newPassword) {
        try {
            // Lấy email từ token (chưa verify chữ ký vì cần lấy passwordHash để tạo secret)
            // Parse token string để lấy payload (Base64 decode)
            String[] splitToken = token.split("\\.");
            if (splitToken.length < 2) {
                throw new RuntimeException("Token không hợp lệ");
            }
            
            String payloadStr = new String(java.util.Base64.getUrlDecoder().decode(splitToken[1]), StandardCharsets.UTF_8);
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> payloadMap = mapper.readValue(payloadStr, java.util.Map.class);
            String email = (String) payloadMap.get("sub");

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Email trong token không tồn tại"));

            // Verify chữ ký
            String secretString = "fallback_secret_key_needs_to_be_long_enough_for_hs256" + user.getPasswordHash();
            SecretKey key = Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));

            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);

            // Cập nhật mật khẩu mới
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            userRepository.save(user);

        } catch (Exception e) {
            throw new RuntimeException("Token không hợp lệ hoặc đã hết hạn", e);
        }
    }
}
