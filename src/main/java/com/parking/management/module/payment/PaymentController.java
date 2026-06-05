package com.parking.management.module.payment;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "APIs for managing parking fee payments")
public class PaymentController {
    
    // private final PaymentService service;

    @Operation(summary = "Create a payment record", description = "Record a new payment for a parking session")
    @PostMapping
    public ApiResponse<PaymentResponse> create(@Valid @RequestBody PaymentRequest request) {
        return ApiResponse.success("Created successfully", new PaymentResponse());
    }

    @Operation(summary = "Get payment by ID", description = "Retrieve a specific payment record by its ID")
    @GetMapping("/{id}")
    public ApiResponse<PaymentResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new PaymentResponse());
    }

    @Operation(summary = "Get all payments", description = "Retrieve a list of all payment records")
    @GetMapping
    public ApiResponse<List<PaymentResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", java.util.Collections.emptyList());
    }

    @Operation(summary = "Update a payment", description = "Update payment status (e.g. PENDING to COMPLETED)")
    @PutMapping("/{id}")
    public ApiResponse<PaymentResponse> update(@PathVariable Long id, @Valid @RequestBody PaymentRequest request) {
        return ApiResponse.success("Updated successfully", new PaymentResponse());
    }

    @Operation(summary = "Delete a payment", description = "Delete a payment record by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
