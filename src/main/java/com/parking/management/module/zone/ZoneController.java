package com.parking.management.module.zone;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
@RequiredArgsConstructor
@Tag(name = "Zone", description = "APIs for managing parking zones within floors")
public class ZoneController {
    
    // private final ZoneService service;

    @Operation(summary = "Create a new zone", description = "Create a new parking zone (e.g. Zone A, Zone B) within a floor")
    @PostMapping
    public ApiResponse<ZoneResponse> create(@Valid @RequestBody ZoneRequest request) {
        return ApiResponse.success("Created successfully", new ZoneResponse());
    }

    @Operation(summary = "Get zone by ID", description = "Retrieve a specific zone by its ID")
    @GetMapping("/{id}")
    public ApiResponse<ZoneResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new ZoneResponse());
    }

    @Operation(summary = "Get all zones", description = "Retrieve a list of all zones across all floors")
    @GetMapping
    public ApiResponse<List<ZoneResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", java.util.Collections.emptyList());
    }

    @Operation(summary = "Update a zone", description = "Update an existing zone by its ID")
    @PutMapping("/{id}")
    public ApiResponse<ZoneResponse> update(@PathVariable Long id, @Valid @RequestBody ZoneRequest request) {
        return ApiResponse.success("Updated successfully", new ZoneResponse());
    }

    @Operation(summary = "Delete a zone", description = "Delete a zone by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
