package com.parking.management.module.pricing;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pricings")
@RequiredArgsConstructor
@Tag(name = "Pricing Policy", description = "APIs for managing pricing policies and calculating parking fees")
public class PricingController {
    
    private final PricingService service;


    //Create new Pricing policy
    @Operation(summary = "Create a new pricing policy",
               description = "Create a new pricing policy with base price, rush hour price, off-peak price and time ranges")
    @PostMapping
    public ApiResponse<PricingResponse> create(@Valid @RequestBody PricingRequest request) {
        PricingResponse response = service.createNewPricingPolicy(request);
        return ApiResponse.success("Created successfully", response);
    }

    //READ: Find pricing policy by id
    @Operation(summary = "Get pricing policy by ID",
               description = "Retrieve a specific pricing policy by its ID")
    @GetMapping("/{id}")
    public ApiResponse<PricingResponse> getById(@PathVariable Long id) {
        PricingResponse response = service.getPricingPolicyById(id);
        return ApiResponse.success("Fetched successfully", response);
    }

    //READ: Find all pricing policy
    @Operation(summary = "Get all pricing policies",
               description = "Retrieve a list of all pricing policies in the system")
    @GetMapping
    public ApiResponse<List<PricingResponse>> getAll() {
        List<PricingResponse> responses = service.getAllPricingPolicy();
        return ApiResponse.success("Fetched all successfully", responses);
    }

    //READ: Get pricing policy by vehicle type id
    @Operation(summary = "Get pricing policies by vehicle type",
               description = "Retrieve all pricing policies for a specific vehicle type (e.g. Car, Motorbike)")
    @GetMapping("/vehicle-type/{vehicleTypeId}")
    public ApiResponse<List<PricingResponse>> getPricingPolicyByVehicleTypeId(@PathVariable Long vehicleTypeId) {
        List<PricingResponse>response = service.getPricingPolicyByVehicleTypeId(vehicleTypeId);
        return ApiResponse.success("Fetched by vehicle type id successfully", response);
    }

    //UPDATE
    @Operation(summary = "Update a pricing policy",
               description = "Update an existing pricing policy by its ID")
    @PutMapping("/{id}")
    public ApiResponse<PricingResponse> update(@PathVariable Long id, @Valid @RequestBody PricingRequest request) {
        PricingResponse response = service.updatePricingPolicy(id,request);
        return ApiResponse.success("Updated successfully", response);
    }

    //DELETE
    @Operation(summary = "Delete a pricing policy",
               description = "Delete a pricing policy by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.deletePricingPolicyById(id);
        return ApiResponse.success("Deleted successfully", null);
    }

    // PHASE 2: API tính phí gửi xe
    @Operation(summary = "Calculate parking fee",
               description = "Calculate the final parking fee based on vehicle type, entry time and exit time. " +
                             "Uses rush hour / off-peak pricing and applies max daily rate cap if configured.")
    @PostMapping("/calculate-fee")
    public ApiResponse<FeeCalculationResponse> calculateFee(
            @Valid @RequestBody FeeCalculationRequest request) {
        FeeCalculationResponse response = service.calculateFee(
                request.getVehicleTypeId(),
                request.getEntryTime(),
                request.getExitTime());
        return ApiResponse.success("Fee calculated successfully", response);
    }
}
