package com.parking.management.module.payment;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    
    // private final PaymentService service;

    @PostMapping
    public ApiResponse<PaymentResponse> create(@Valid @RequestBody PaymentRequest request) {
        return ApiResponse.success("Created successfully", new PaymentResponse());
    }

    @GetMapping("/{id}")
    public ApiResponse<PaymentResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new PaymentResponse());
    }

    @GetMapping
    public ApiResponse<List<PaymentResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", List.of());
    }

    @PutMapping("/{id}")
    public ApiResponse<PaymentResponse> update(@PathVariable Long id, @Valid @RequestBody PaymentRequest request) {
        return ApiResponse.success("Updated successfully", new PaymentResponse());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
