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
    
    // private final FloorService service;

    @PostMapping
    public ApiResponse<FloorResponse> create(@Valid @RequestBody FloorRequest request) {
        return ApiResponse.success("Created successfully", new FloorResponse());
    }

    @GetMapping("/{id}")
    public ApiResponse<FloorResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new FloorResponse());
    }

    @GetMapping
    public ApiResponse<List<FloorResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", List.of());
    }

    @PutMapping("/{id}")
    public ApiResponse<FloorResponse> update(@PathVariable Long id, @Valid @RequestBody FloorRequest request) {
        return ApiResponse.success("Updated successfully", new FloorResponse());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
