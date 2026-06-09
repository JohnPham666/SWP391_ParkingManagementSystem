package com.parking.management.module.vehicle;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@PreAuthorize("hasRole('Admin')")
@RequestMapping("/api/vehicle-types")
@RequiredArgsConstructor
@Tag(name = "Vehicle Type", description = "APIs for managing vehicle types")
public class VehicleTypeController {

    private final VehicleTypeService vehicleTypeService;

    @Operation(summary = "Create a vehicle type", description = "Admin can create a new vehicle type")
    @PostMapping
    public ApiResponse<VehicleTypeResponse> create(@Valid @RequestBody VehicleTypeRequest request) {
        return ApiResponse.success("Created successfully", vehicleTypeService.create(request));
    }

    @Operation(summary = "Get all vehicle types", description = "Get a list of all vehicle types")
    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success("Fetched all successfully", vehicleTypeService.getAll());
    }

    @Operation(summary = "Get vehicle type by ID", description = "Get details of a specific vehicle type")
    @GetMapping("/{id}")
    public ApiResponse<VehicleTypeResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", vehicleTypeService.getById(id));
    }

    @Operation(summary = "Update a vehicle type", description = "Admin can update a vehicle type")
    @PutMapping("/{id}")
    public ApiResponse<VehicleTypeResponse> update(@PathVariable Integer id,
                                                   @Valid @RequestBody VehicleTypeRequest request) {
        return ApiResponse.success("Updated successfully", vehicleTypeService.update(id, request));
    }

    @Operation(summary = "Delete a vehicle type", description = "Admin can delete a vehicle type")
    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Integer id) {
        vehicleTypeService.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}