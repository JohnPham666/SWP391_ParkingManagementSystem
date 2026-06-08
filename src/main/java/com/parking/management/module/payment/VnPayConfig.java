package com.parking.management.module.payment;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class VnPayConfig {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.pay-url}")
    private String payUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    public String getTmnCode() {
        return tmnCode.trim();
    }

    public String getHashSecret() {
        return hashSecret.trim();
    }

    public String getPayUrl() {
        return payUrl.trim();
    }

    public String getReturnUrl() {
        return returnUrl.trim();
    }
}