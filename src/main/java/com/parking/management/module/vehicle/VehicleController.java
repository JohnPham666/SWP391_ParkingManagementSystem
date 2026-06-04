package com.parking.management.module.vehicle;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {
    
    // private final VehicleService service;

    @PostMapping
    public ApiResponse<VehicleResponse> create(@Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Created successfully", new VehicleResponse());
    }

    @GetMapping("/{id}")
    public ApiResponse<VehicleResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new VehicleResponse());
    }

    @GetMapping
    public ApiResponse<List<VehicleResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", java.util.Collections.emptyList());
    }

    @PutMapping("/{id}")
    public ApiResponse<VehicleResponse> update(@PathVariable Long id, @Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Updated successfully", new VehicleResponse());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
