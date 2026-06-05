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
    
    private final BuildingService service;

    @PostMapping
    public ApiResponse<BuildingResponse> create(@Valid @RequestBody BuildingRequest request) {
        return ApiResponse.success("Created successfully", service.create(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<BuildingResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", service.getById(id));
    }

    @GetMapping
    public ApiResponse<List<BuildingResponse>> getAll(@RequestParam(required = false) String keyword) {
        return ApiResponse.success("Fetched all successfully", service.getAll(keyword));
    }

    @PutMapping("/{id}")
    public ApiResponse<BuildingResponse> update(@PathVariable Integer id, @Valid @RequestBody BuildingRequest request) {
        return ApiResponse.success("Updated successfully", service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}
