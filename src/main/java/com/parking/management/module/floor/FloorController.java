package com.parking.management.module.floor;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@PreAuthorize("hasRole('Admin')")
@RequestMapping("/api/floors")
@RequiredArgsConstructor
@Tag(name = "Floor", description = "APIs for managing floors within parking buildings")
public class FloorController {
    
    private final FloorService service;

    @Operation(summary = "Create a new floor", description = "Add a new floor to a parking building")
    @PostMapping
    public ApiResponse<FloorResponse> create(@Valid @RequestBody FloorRequest request) {
        return ApiResponse.success("Created successfully", service.create(request));
    }

    @Operation(summary = "Get floor by ID", description = "Retrieve a specific floor by its ID")
    @GetMapping("/{id}")
    public ApiResponse<FloorResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", service.getById(id));
    }

    @Operation(summary = "Get all floors", description = "Retrieve a list of all floors across all buildings")
    @GetMapping
    public ApiResponse<List<FloorResponse>> getAll(@RequestParam(required = false) Integer buildingId) {
        return ApiResponse.success("Fetched all successfully", service.getAll(buildingId));
    }

    @Operation(summary = "Update a floor", description = "Update an existing floor by its ID")
    @PutMapping("/{id}")
    public ApiResponse<FloorResponse> update(@PathVariable Integer id, @Valid @RequestBody FloorRequest request) {
        return ApiResponse.success("Updated successfully", service.update(id, request));
    }

    @Operation(summary = "Delete a floor", description = "Delete a floor by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}
