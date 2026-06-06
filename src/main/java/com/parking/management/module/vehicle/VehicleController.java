package com.parking.management.module.vehicle;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicle", description = "APIs for managing registered vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    @Operation(summary = "Create a new vehicle", description = "Register a new vehicle with license plate, type, owner info")
    @PostMapping
    public ApiResponse<VehicleResponse> create(@Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Created successfully", vehicleService.create(request));
    }

    @Operation(summary = "Get vehicle by ID", description = "Retrieve a specific vehicle by its ID")
    @GetMapping("/{id}")
    public ApiResponse<VehicleResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", vehicleService.getById(id));
    }

    @Operation(summary = "Get all vehicles", description = "Retrieve a list of all registered vehicles")
    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success("Fetched all successfully", vehicleService.getAll());
    }

    @Operation(summary = "Update a vehicle", description = "Update an existing vehicle by its ID")
    @PutMapping("/{id}")
    public ApiResponse<VehicleResponse> update(@PathVariable Integer id,
                                               @Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Updated successfully", vehicleService.update(id, request));
    }

    @Operation(summary = "Delete a vehicle", description = "Delete a vehicle by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Integer id) {
        vehicleService.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}