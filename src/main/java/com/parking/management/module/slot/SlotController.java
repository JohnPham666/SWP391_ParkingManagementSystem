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
    
    // private final SlotService service;

    @Operation(summary = "Create a new parking slot", description = "Add a new parking slot to a zone")
    @PostMapping
    public ApiResponse<SlotResponse> create(@Valid @RequestBody SlotRequest request) {
        return ApiResponse.success("Created successfully", new SlotResponse());
    }

    @Operation(summary = "Get slot by ID", description = "Retrieve a specific parking slot by its ID")
    @GetMapping("/{id}")
    public ApiResponse<SlotResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new SlotResponse());
    }

    @Operation(summary = "Get all slots", description = "Retrieve a list of all parking slots")
    @GetMapping
    public ApiResponse<List<SlotResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", java.util.Collections.emptyList());
    }

    @Operation(summary = "Update a slot", description = "Update an existing parking slot by its ID")
    @PutMapping("/{id}")
    public ApiResponse<SlotResponse> update(@PathVariable Long id, @Valid @RequestBody SlotRequest request) {
        return ApiResponse.success("Updated successfully", new SlotResponse());
    }

    @Operation(summary = "Delete a slot", description = "Delete a parking slot by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
