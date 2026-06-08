package com.parking.management.module.payment;

import com.parking.management.common.ApiResponse;
import com.parking.management.common.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.List;

@RestController
@PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff')")
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "APIs for managing parking fee payments")
public class PaymentController {
    
    private final PaymentService service;

    @Operation(summary = "Create a payment record", description = "Record a new payment for a parking session")
    @PostMapping
    public ApiResponse<PaymentResponse> create(@Valid @RequestBody PaymentRequest request) {
        try {
            PaymentResponse response = service.create(request);
            return ApiResponse.success("Created payment successfully", response);
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Operation(summary = "Get payment by ID", description = "Retrieve a specific payment record by its ID")
    @GetMapping("/{id}")
    public ApiResponse<PaymentResponse> getById(@PathVariable Integer id) {
        try {
            PaymentResponse response = service.getById(id);
            return ApiResponse.success("Fetched payment successfully", response);
        } catch (ResourceNotFoundException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Operation(summary = "Get all payments", description = "Retrieve a list of all payment records")
    @GetMapping
    public ApiResponse<List<PaymentResponse>> getAll() {
        List<PaymentResponse> responses = service.getAll();
        return ApiResponse.success("Fetched all payments successfully", responses);
    }

    @Operation(summary = "Get payment by session ID", description = "Retrieve payment record by parking session ID")
    @GetMapping("/session/{sessionId}")
    public ApiResponse<PaymentResponse> getBySessionId(@PathVariable Integer sessionId) {
        try {
            PaymentResponse response = service.getBySessionId(sessionId);
            return ApiResponse.success("Fetched payment by session successfully", response);
        } catch (ResourceNotFoundException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Operation(summary = "Update payment status", description = "Update payment status such as PENDING, PAID, FAILED")
    @PutMapping("/{id}/status")
    public ApiResponse<PaymentResponse> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody PaymentStatusUpdateRequest request
    ) {
        try {
            PaymentResponse response = service.updateStatus(id, request);
            return ApiResponse.success("Updated payment status successfully", response);
        } catch (ResourceNotFoundException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Operation(summary = "Delete a payment", description = "Delete a payment record by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        try {
            service.delete(id);
            return ApiResponse.success("Deleted payment successfully", null);
        } catch (ResourceNotFoundException e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    @Operation(summary = "Confirm cash payment", description = "Staff confirms that cash payment has been received")
    @PutMapping("/{id}/confirm-cash")
    public ApiResponse<PaymentResponse> confirmCashPayment(@PathVariable Integer id) {
        try {
            PaymentResponse response = service.confirmCashPayment(id);
            return ApiResponse.success("Cash payment confirmed successfully", response);
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Operation(summary = "Simulate online payment success", description = "Simulate successful online payment for bank transfer, e-wallet, or credit card")
    @PutMapping("/{id}/simulate-success")
    public ApiResponse<PaymentResponse> simulateOnlinePaymentSuccess(@PathVariable Integer id) {
        try {
            PaymentResponse response = service.simulateOnlinePaymentSuccess(id);
            return ApiResponse.success("Online payment simulated successfully", response);
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Operation(summary = "Create VNPay payment URL", description = "Create VNPay sandbox payment URL for an existing PENDING payment")
    @PostMapping("/{id}/vnpay-url")
    public ApiResponse<PaymentGatewayResponse> createVnPayPaymentUrl(
            @PathVariable Integer id,
            HttpServletRequest request
    ) {
        try {
            PaymentGatewayResponse response = service.createVnPayPaymentUrl(id, request);
            return ApiResponse.success("VNPay payment URL created successfully", response);
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            return ApiResponse.error(e.getMessage());
        }
  }
//
//    @PreAuthorize("permitAll()")
//    @Operation(summary = "Handle VNPay return", description = "Handle VNPay return URL after customer completes payment")
//    @GetMapping("/vnpay-return")
//    public ApiResponse<PaymentGatewayResponse> handleVnPayReturn(@RequestParam Map<String, String> params) {
//        try {
//            PaymentGatewayResponse response = service.handleVnPayReturn(params);
//            return ApiResponse.success("VNPay return handled successfully", response);
//        } catch (IllegalArgumentException | ResourceNotFoundException e) {
//            return ApiResponse.error(e.getMessage());
//        }
//    }
}
