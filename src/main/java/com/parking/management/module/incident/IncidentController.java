package com.parking.management.module.incident;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
@Tag(name = "Incident Report", description = "APIs for managing parking incidents (lost ticket, facility damage)")
public class IncidentController {
    
    // private final IncidentService service;

    @Operation(summary = "Create an incident report", description = "Report a new incident such as LOST_TICKET or FACILITY_DAMAGE")
    @PostMapping
    public ApiResponse<IncidentResponse> create(@Valid @RequestBody IncidentRequest request) {
        return ApiResponse.success("Created successfully", new IncidentResponse());
    }

    @Operation(summary = "Get incident by ID", description = "Retrieve a specific incident report by its ID")
    @GetMapping("/{id}")
    public ApiResponse<IncidentResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new IncidentResponse());
    }

    @Operation(summary = "Get all incidents", description = "Retrieve a list of all incident reports")
    @GetMapping
    public ApiResponse<List<IncidentResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", java.util.Collections.emptyList());
    }

    @Operation(summary = "Update an incident", description = "Update an existing incident report by its ID")
    @PutMapping("/{id}")
    public ApiResponse<IncidentResponse> update(@PathVariable Long id, @Valid @RequestBody IncidentRequest request) {
        return ApiResponse.success("Updated successfully", new IncidentResponse());
    }

    @Operation(summary = "Delete an incident", description = "Delete an incident report by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
