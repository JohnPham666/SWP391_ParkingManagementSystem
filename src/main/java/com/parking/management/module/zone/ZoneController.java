package com.parking.management.module.zone;

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
@RequestMapping("/api/zones")
@RequiredArgsConstructor
@Tag(name = "Zone", description = "APIs for managing parking zones within floors")
public class ZoneController {
    
    private final ZoneService service;

    @Operation(summary = "Create a new zone", description = "Create a new parking zone (e.g. Zone A, Zone B) within a floor")
    @PostMapping
    public ApiResponse<ZoneResponse> create(@Valid @RequestBody ZoneRequest request) {
        return ApiResponse.success("Created successfully", service.create(request));
    }

    @Operation(summary = "Get zone by ID", description = "Retrieve a specific zone by its ID")
    @GetMapping("/{id}")
    public ApiResponse<ZoneResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", service.getById(id));
    }

    @Operation(summary = "Get all zones", description = "Retrieve a list of all zones across all floors")
    @GetMapping
    public ApiResponse<List<ZoneResponse>> getAll(@RequestParam(required = false) Integer floorId) {
        return ApiResponse.success("Fetched all successfully", service.getAll(floorId));
    }

    @Operation(summary = "Update a zone", description = "Update an existing zone by its ID")
    @PutMapping("/{id}")
    public ApiResponse<ZoneResponse> update(@PathVariable Integer id, @Valid @RequestBody ZoneRequest request) {
        return ApiResponse.success("Updated successfully", service.update(id, request));
    }

    @Operation(summary = "Delete a zone", description = "Delete a zone by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}
