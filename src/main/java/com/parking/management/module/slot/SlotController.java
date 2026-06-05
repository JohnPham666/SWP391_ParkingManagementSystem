package com.parking.management.module.slot;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/slots")
@RequiredArgsConstructor
@Tag(name = "Parking Slot", description = "APIs for managing individual parking slots within zones")
public class SlotController {
    
    private final SlotService service;

    @Operation(summary = "Create a new parking slot", description = "Add a new parking slot to a zone")
    @PostMapping
    public ApiResponse<SlotResponse> create(@Valid @RequestBody SlotRequest request) {
        return ApiResponse.success("Created successfully", service.create(request));
    }

    @Operation(summary = "Get slot by ID", description = "Retrieve a specific parking slot by its ID")
    @GetMapping("/{id}")
    public ApiResponse<SlotResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", service.getById(id));
    }

    @Operation(summary = "Get all slots", description = "Retrieve a list of all parking slots")
    @GetMapping
    public ApiResponse<List<SlotResponse>> getAll(
            @RequestParam(required = false) Integer zoneId,
            @RequestParam(required = false) Integer vehicleTypeId) {
        return ApiResponse.success("Fetched all successfully", service.getAll(zoneId, vehicleTypeId));
    }

    @Operation(summary = "Update a slot", description = "Update an existing parking slot by its ID")
    @PutMapping("/{id}")
    public ApiResponse<SlotResponse> update(@PathVariable Integer id, @Valid @RequestBody SlotRequest request) {
        return ApiResponse.success("Updated successfully", service.update(id, request));
    }

    @Operation(summary = "Delete a slot", description = "Delete a parking slot by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}
