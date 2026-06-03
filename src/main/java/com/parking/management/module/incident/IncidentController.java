package com.parking.management.module.incident;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {
    
    // private final IncidentService service;

    @PostMapping
    public ApiResponse<IncidentResponse> create(@Valid @RequestBody IncidentRequest request) {
        return ApiResponse.success("Created successfully", new IncidentResponse());
    }

    @GetMapping("/{id}")
    public ApiResponse<IncidentResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new IncidentResponse());
    }

    @GetMapping
    public ApiResponse<List<IncidentResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", List.of());
    }

    @PutMapping("/{id}")
    public ApiResponse<IncidentResponse> update(@PathVariable Long id, @Valid @RequestBody IncidentRequest request) {
        return ApiResponse.success("Updated successfully", new IncidentResponse());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
