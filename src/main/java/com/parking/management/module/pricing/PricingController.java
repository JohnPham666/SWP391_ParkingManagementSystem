package com.parking.management.module.pricing;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pricings")
@RequiredArgsConstructor
public class PricingController {
    
    // private final PricingService service;

    @PostMapping
    public ApiResponse<PricingResponse> create(@Valid @RequestBody PricingRequest request) {
        return ApiResponse.success("Created successfully", new PricingResponse());
    }

    @GetMapping("/{id}")
    public ApiResponse<PricingResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new PricingResponse());
    }

    @GetMapping
    public ApiResponse<List<PricingResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", List.of());
    }

    @PutMapping("/{id}")
    public ApiResponse<PricingResponse> update(@PathVariable Long id, @Valid @RequestBody PricingRequest request) {
        return ApiResponse.success("Updated successfully", new PricingResponse());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
