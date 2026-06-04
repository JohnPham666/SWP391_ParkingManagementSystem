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
    
    // private final ZoneService service;

    @PostMapping
    public ApiResponse<ZoneResponse> create(@Valid @RequestBody ZoneRequest request) {
        return ApiResponse.success("Created successfully", new ZoneResponse());
    }

    @GetMapping("/{id}")
    public ApiResponse<ZoneResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new ZoneResponse());
    }

    @GetMapping
    public ApiResponse<List<ZoneResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", java.util.Collections.emptyList());
    }

    @PutMapping("/{id}")
    public ApiResponse<ZoneResponse> update(@PathVariable Long id, @Valid @RequestBody ZoneRequest request) {
        return ApiResponse.success("Updated successfully", new ZoneResponse());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
