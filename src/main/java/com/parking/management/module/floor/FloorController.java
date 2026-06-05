package com.parking.management.module.floor;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/floors")
@RequiredArgsConstructor
public class FloorController {
    
    private final FloorService service;

    @PostMapping
    public ApiResponse<FloorResponse> create(@Valid @RequestBody FloorRequest request) {
        return ApiResponse.success("Created successfully", service.create(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<FloorResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", service.getById(id));
    }

    @GetMapping
    public ApiResponse<List<FloorResponse>> getAll(@RequestParam(required = false) Integer buildingId) {
        return ApiResponse.success("Fetched all successfully", service.getAll(buildingId));
    }

    @PutMapping("/{id}")
    public ApiResponse<FloorResponse> update(@PathVariable Integer id, @Valid @RequestBody FloorRequest request) {
        return ApiResponse.success("Updated successfully", service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}
