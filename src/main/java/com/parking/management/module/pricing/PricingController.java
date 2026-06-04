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
    
    private final PricingService service;


    //Create new Pricing policy
    @PostMapping
    public ApiResponse<PricingResponse> create(@Valid @RequestBody PricingRequest request) {
        PricingResponse response = service.createNewPricingPolicy(request);
        return ApiResponse.success("Created successfully", response);
    }

    //READ: Find pricing policy by id
    @GetMapping("/{id}")
    public ApiResponse<PricingResponse> getById(@PathVariable Long id) {
        PricingResponse response = service.getPricingPolicyById(id);
        return ApiResponse.success("Fetched successfully", response);
    }

    //READ: Find all pricing policy
    @GetMapping
    public ApiResponse<List<PricingResponse>> getAll() {
        List<PricingResponse> responses = service.getAllPricingPolicy();
        return ApiResponse.success("Fetched all successfully", responses);
    }

    //READ: Get pricing policy by vehicle type id
    @GetMapping("/vehicle-type/{vehicleTypeId}")
    public ApiResponse<List<PricingResponse>> getPricingPolicyByVehicleTypeId(@PathVariable Long vehicleTypeId) {
        List<PricingResponse>response = service.getPricingPolicyByVehicleTypeId(vehicleTypeId);
        return ApiResponse.success("Fetched by vehicle type id successfully", response);
    }

    //UPDATE
    @PutMapping("/{id}")
    public ApiResponse<PricingResponse> update(@PathVariable Long id, @Valid @RequestBody PricingRequest request) {
        PricingResponse response = service.updatePricingPolicy(id,request);
        return ApiResponse.success("Updated successfully", response);
    }

    //DELETE
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.deletePricingPolicyById(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}
