package com.parking.management.module.building;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buildings")
@RequiredArgsConstructor
public class BuildingController {
    
    // private final BuildingService service;

    @PostMapping
    public ApiResponse<BuildingResponse> create(@Valid @RequestBody BuildingRequest request) {
        return ApiResponse.success("Created successfully", new BuildingResponse());
    }

    @GetMapping("/{id}")
    public ApiResponse<BuildingResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new BuildingResponse());
    }

    @GetMapping
    public ApiResponse<List<BuildingResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", java.util.Collections.emptyList());
    }

    @PutMapping("/{id}")
    public ApiResponse<BuildingResponse> update(@PathVariable Long id, @Valid @RequestBody BuildingRequest request) {
        return ApiResponse.success("Updated successfully", new BuildingResponse());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
