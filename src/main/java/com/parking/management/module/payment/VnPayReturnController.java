package com.parking.management.module.payment;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class VnPayReturnController {

    private final PaymentService service;

    @Operation(summary = "Handle VNPay return", description = "Handle VNPay return URL after customer completes payment")
    @GetMapping("/vnpay-return")
    public ApiResponse<PaymentGatewayResponse> handleVnPayReturn(@RequestParam Map<String, String> params) {
        PaymentGatewayResponse response = service.handleVnPayReturn(params);
        return ApiResponse.success("VNPay return handled successfully", response);
    }
}