package com.parking.management.module.zone;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
@RequiredArgsConstructor
public class ZoneController {
    
    private final ZoneService service;

    @PostMapping
    public ApiResponse<ZoneResponse> create(@Valid @RequestBody ZoneRequest request) {
        return ApiResponse.success("Created successfully", service.create(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<ZoneResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", service.getById(id));
    }

    @GetMapping
    public ApiResponse<List<ZoneResponse>> getAll(@RequestParam(required = false) Integer floorId) {
        return ApiResponse.success("Fetched all successfully", service.getAll(floorId));
    }

    @PutMapping("/{id}")
    public ApiResponse<ZoneResponse> update(@PathVariable Integer id, @Valid @RequestBody ZoneRequest request) {
        return ApiResponse.success("Updated successfully", service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}
