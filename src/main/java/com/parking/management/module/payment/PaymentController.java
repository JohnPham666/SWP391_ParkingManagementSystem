package com.parking.management.module.payment;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "APIs for managing parking fee payments")
public class PaymentController {
    
    private final PaymentService service;

    @Operation(summary = "Create a payment record", description = "Record a new payment for a parking session")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
    @PostMapping
    public ApiResponse<PaymentResponse> create(@Valid @RequestBody PaymentRequest request) {
        PaymentResponse response = service.create(request);
        return ApiResponse.success("Created payment successfully", response);
    }

    @Operation(summary = "Get payment by ID", description = "Retrieve a specific payment record by its ID")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
    @GetMapping("/{id:\\d+}")
    public ApiResponse<PaymentResponse> getById(@PathVariable("id") Integer id) {
        PaymentResponse response = service.getById(id);
        return ApiResponse.success("Fetched payment successfully", response);
    }

    @Operation(summary = "Get all payments", description = "Retrieve a list of all payment records")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff')")
    @GetMapping
    public ApiResponse<List<PaymentResponse>> getAll() {
        List<PaymentResponse> responses = service.getAll();
        return ApiResponse.success("Fetched all payments successfully", responses);
    }

    @Operation(summary = "Get payments page", description = "Retrieve a paginated list of payment records")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff')")
    @GetMapping("/page")
    public ApiResponse<com.parking.management.common.PageResponse<PaymentResponse>> getPaymentsPage(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        return ApiResponse.success("Payments page retrieved successfully", service.getPage(page, size));
    }

    @Operation(summary = "Get payment by session ID", description = "Retrieve payment record by parking session ID")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
    @GetMapping("/session/{sessionId:\\d+}")
    public ApiResponse<PaymentResponse> getBySessionId(@PathVariable("sessionId") Integer sessionId) {
        PaymentResponse response = service.getBySessionId(sessionId);
        return ApiResponse.success("Fetched payment by session successfully", response);
    }

    @Operation(summary = "Update payment status", description = "Update payment status such as PENDING, PAID, FAILED")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff')")
    @PutMapping("/{id}/status")
    public ApiResponse<PaymentResponse> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody PaymentStatusUpdateRequest request
    ) {
        PaymentResponse response = service.updateStatus(id, request);
        return ApiResponse.success("Updated payment status successfully", response);
    }

    @Operation(summary = "Delete a payment", description = "Delete a payment record by its ID")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager')")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.success("Deleted payment successfully", null);
    }

    @Operation(summary = "Confirm cash payment", description = "Staff confirms that cash payment has been received")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff')")
    @PutMapping("/{id}/confirm-cash")
    public ApiResponse<PaymentResponse> confirmCashPayment(@PathVariable Integer id) {
        PaymentResponse response = service.confirmCashPayment(id);
        return ApiResponse.success("Cash payment confirmed successfully", response);
    }

    @Operation(summary = "Create VNPay payment URL", description = "Create VNPay sandbox payment URL for an existing PENDING payment")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
    @PostMapping("/{id}/vnpay-url")
    public ApiResponse<PaymentGatewayResponse> createVnPayPaymentUrl(
            @PathVariable Integer id,
            HttpServletRequest request
    ) {
        PaymentGatewayResponse response = service.createVnPayPaymentUrl(id, request);
        return ApiResponse.success("VNPay payment URL created successfully", response);
    }
}
