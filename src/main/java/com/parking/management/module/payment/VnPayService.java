package com.parking.management.module.payment;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class VnPayService {

    private final VnPayConfig config;

    public VnPayService(VnPayConfig config) {
        this.config = config;
    }

    public String buildPaymentUrl(Payment payment, String transactionRef, jakarta.servlet.http.HttpServletRequest request) {
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDateTime now = LocalDateTime.now(zone);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

        String createDate = now.format(formatter);
        String expireDate = now.plusMinutes(15).format(formatter);

        String vnpAmount = payment.getAmount()
                .multiply(BigDecimal.valueOf(100))
                .toBigInteger()
                .toString();

        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", config.getTmnCode().trim());
        params.put("vnp_Amount", vnpAmount);
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", transactionRef);
        params.put("vnp_OrderInfo", "ParkingPayment" + payment.getPaymentId());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", config.getReturnUrl().trim());
        params.put("vnp_IpAddr", "127.0.0.1");
        params.put("vnp_CreateDate", createDate);
        params.put("vnp_ExpireDate", expireDate);

        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (String fieldName : fieldNames) {
            String fieldValue = params.get(fieldName);

            if (fieldValue != null && !fieldValue.isBlank()) {
                String encodedName = URLEncoder.encode(fieldName, StandardCharsets.UTF_8);
                String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.UTF_8);

                if (hashData.length() > 0) {
                    hashData.append("&");
                    query.append("&");
                }

                // Thử chuẩn: key gốc, value encoded
                hashData.append(fieldName).append("=").append(encodedValue);

                // Query URL: encode cả key và value
                query.append(encodedName).append("=").append(encodedValue);
            }
        }

        String secureHash = hmacSHA512(config.getHashSecret().trim(), hashData.toString());

        System.out.println("===== VNPAY DEBUG =====");
        System.out.println("TMN CODE: " + config.getTmnCode().trim());
        System.out.println("TIMEZONE: Asia/Ho_Chi_Minh");
        System.out.println("CREATE DATE: " + createDate);
        System.out.println("EXPIRE DATE: " + expireDate);
        System.out.println("TRANSACTION REF: " + transactionRef);
        System.out.println("HASH SECRET LENGTH: " + config.getHashSecret().trim().length());
        System.out.println("RETURN URL: " + config.getReturnUrl().trim());
        System.out.println("HASH DATA: " + hashData);
        System.out.println("SECURE HASH: " + secureHash);
        System.out.println("=======================");

        query.append("&vnp_SecureHash=").append(secureHash);

        return config.getPayUrl().trim() + "?" + query;
    }

    public boolean isValidReturn(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");

        if (receivedHash == null || receivedHash.isBlank()) {
            return false;
        }

        Map<String, String> filteredParams = new HashMap<>(params);
        filteredParams.remove("vnp_SecureHash");
        filteredParams.remove("vnp_SecureHashType");

        List<String> fieldNames = new ArrayList<>(filteredParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();

        for (String fieldName : fieldNames) {
            String fieldValue = filteredParams.get(fieldName);

            if (fieldValue != null && !fieldValue.isBlank()) {
                String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.UTF_8);

                if (hashData.length() > 0) {
                    hashData.append("&");
                }

                hashData.append(fieldName).append("=").append(encodedValue);
            }
        }

        String calculatedHash = hmacSHA512(config.getHashSecret().trim(), hashData.toString());

        System.out.println("===== VNPAY RETURN DEBUG =====");
        System.out.println("RETURN HASH DATA: " + hashData);
        System.out.println("RECEIVED HASH: " + receivedHash);
        System.out.println("CALCULATED HASH: " + calculatedHash);
        System.out.println("==============================");

        return calculatedHash.equalsIgnoreCase(receivedHash);
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA512"
            );

            hmac512.init(secretKey);

            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hash = new StringBuilder();
            for (byte b : bytes) {
                hash.append(String.format("%02x", b));
            }

            return hash.toString();
        } catch (Exception e) {
            throw new RuntimeException("Cannot generate HMAC SHA512 signature", e);
        }
    }
}