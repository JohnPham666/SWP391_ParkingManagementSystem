package com.parking.management.module.floor;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/floors")
@RequiredArgsConstructor
@Tag(name = "Floor", description = "APIs for managing floors within parking buildings")
public class FloorController {
    
    // private final FloorService service;

    @Operation(summary = "Create a new floor", description = "Add a new floor to a parking building")
    @PostMapping
    public ApiResponse<FloorResponse> create(@Valid @RequestBody FloorRequest request) {
        return ApiResponse.success("Created successfully", new FloorResponse());
    }

    @Operation(summary = "Get floor by ID", description = "Retrieve a specific floor by its ID")
    @GetMapping("/{id}")
    public ApiResponse<FloorResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new FloorResponse());
    }

    @Operation(summary = "Get all floors", description = "Retrieve a list of all floors across all buildings")
    @GetMapping
    public ApiResponse<List<FloorResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", java.util.Collections.emptyList());
    }

    @Operation(summary = "Update a floor", description = "Update an existing floor by its ID")
    @PutMapping("/{id}")
    public ApiResponse<FloorResponse> update(@PathVariable Long id, @Valid @RequestBody FloorRequest request) {
        return ApiResponse.success("Updated successfully", new FloorResponse());
    }

    @Operation(summary = "Delete a floor", description = "Delete a floor by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
