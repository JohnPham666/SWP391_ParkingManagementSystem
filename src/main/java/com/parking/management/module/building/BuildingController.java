package com.parking.management.module.building;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buildings")
@RequiredArgsConstructor
@Tag(name = "Building", description = "APIs for managing parking buildings")
public class BuildingController {
    
    // private final BuildingService service;

    @Operation(summary = "Create a new building", description = "Register a new parking building in the system")
    @PostMapping
    public ApiResponse<BuildingResponse> create(@Valid @RequestBody BuildingRequest request) {
        return ApiResponse.success("Created successfully", new BuildingResponse());
    }

    @Operation(summary = "Get building by ID", description = "Retrieve a specific parking building by its ID")
    @GetMapping("/{id}")
    public ApiResponse<BuildingResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new BuildingResponse());
    }

    @Operation(summary = "Get all buildings", description = "Retrieve a list of all parking buildings")
    @GetMapping
    public ApiResponse<List<BuildingResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", java.util.Collections.emptyList());
    }

    @Operation(summary = "Update a building", description = "Update an existing parking building by its ID")
    @PutMapping("/{id}")
    public ApiResponse<BuildingResponse> update(@PathVariable Long id, @Valid @RequestBody BuildingRequest request) {
        return ApiResponse.success("Updated successfully", new BuildingResponse());
    }

    @Operation(summary = "Delete a building", description = "Delete a parking building by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
