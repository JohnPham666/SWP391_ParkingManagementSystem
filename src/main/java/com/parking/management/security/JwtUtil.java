package com.parking.management.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey getSigningKey() {
        // Chuyển chuỗi secret thành một khóa mã hóa (Key) dùng cho thuật toán HMAC-SHA256
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(String username) {
        // 1. Lấy thời gian hiện tại (Thời điểm token được sinh ra)
        Date now = new Date();
        
        // 2. Tính toán thời điểm hết hạn = Hiện tại + Khoảng thời gian sống (expiration)
        Date expiryDate = new Date(now.getTime() + expiration);

        // 3. Sử dụng Builder pattern để lắp ráp 3 phần của JWT
        return Jwts.builder()
                .subject(username)          // Payload: Đặt "chủ ngữ" là username (email)
                .issuedAt(now)              // Payload: Đặt thời gian phát hành
                .expiration(expiryDate)     // Payload: Đặt thời gian hết hạn
                .signWith(getSigningKey())  // Signature: Đóng dấu bằng Khóa bí mật
                .compact();                 // Đóng gói thành chuỗi String cuối cùng (Header.Payload.Signature)
    }

    public String extractUsername(String token) {
        // Để lấy được thông tin (Payload) bên trong token ra, ta phải:
        // 1. Khởi tạo một máy đọc (parser) và bắt buộc đưa cho nó Khóa Bí Mật để nó verify chữ ký.
        // Cực kỳ quan trọng: Nếu token bị chỉnh sửa, chữ ký sẽ sai -> Hàm này sẽ văng Exception ngay lập tức!
        io.jsonwebtoken.JwtParser parser = Jwts.parser()
                .verifyWith(getSigningKey())
                .build();
        
        // 2. Đưa token vào máy đọc, nó sẽ bóc tách lấy cái ruột (Payload / Claims)
        io.jsonwebtoken.Claims payload = parser.parseSignedClaims(token).getPayload();
        
        // 3. Trả về subject (chính là username/email ta nhét vào lúc nãy)
        return payload.getSubject();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        // Lấy username từ token
        final String username = extractUsername(token);
        
        // Kiểm tra 2 điều kiện: 
        // 1. Username trong token có khớp với username trong DB không?
        // 2. Token còn hạn sử dụng không?
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        // Tương tự như lấy username, ta lấy ruột token (Payload) ra
        io.jsonwebtoken.JwtParser parser = Jwts.parser()
                .verifyWith(getSigningKey())
                .build();
        io.jsonwebtoken.Claims payload = parser.parseSignedClaims(token).getPayload();
        
        // Kiểm tra xem thời gian hết hạn (Expiration) có TRƯỚC thời gian hiện tại (new Date()) không?
        return payload.getExpiration().before(new Date());
    }
}
