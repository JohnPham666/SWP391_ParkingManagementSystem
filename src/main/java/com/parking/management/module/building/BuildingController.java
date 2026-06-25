package com.parking.management.module.building;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@PreAuthorize("hasAnyRole('Admin', 'ParkingManager')")
@RequestMapping("/api/buildings")
@RequiredArgsConstructor
@Tag(name = "Building", description = "APIs for managing parking buildings")
public class BuildingController {
    
    private final BuildingService service;

    @Operation(summary = "Create a new building", description = "Register a new parking building in the system")
    @PostMapping
    public ApiResponse<BuildingResponse> create(@Valid @RequestBody BuildingRequest request) {
        return ApiResponse.success("Created successfully", service.create(request));
    }

    @Operation(summary = "Get building by ID", description = "Retrieve a specific parking building by its ID")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
    @GetMapping("/{id}")
    public ApiResponse<BuildingResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", service.getById(id));
    }

    @Operation(summary = "Get all buildings", description = "Retrieve a list of all parking buildings")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
    @GetMapping
    public ApiResponse<List<BuildingResponse>> getAll(@RequestParam(required = false) String keyword) {
        return ApiResponse.success("Fetched all successfully", service.getAll(keyword));
    }

    @Operation(summary = "Update a building", description = "Update an existing parking building by its ID")
    @PutMapping("/{id}")
    public ApiResponse<BuildingResponse> update(@PathVariable Integer id, @Valid @RequestBody BuildingRequest request) {
        return ApiResponse.success("Updated successfully", service.update(id, request));
    }

    @Operation(summary = "Delete a building", description = "Delete a parking building by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}
