package com.parking.management.module.incident;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
@Tag(name = "Incident Report", description = "APIs for managing parking incidents")
public class IncidentController {

    private final IncidentService incidentService;

    @Operation(summary = "Create an incident report")
    @PostMapping
    public ApiResponse<IncidentResponse> create(@Valid @RequestBody IncidentRequest request) {
        return ApiResponse.success("Created successfully", incidentService.create(request));
    }

    @Operation(summary = "Get incident by ID")
    @GetMapping("/{id}")
    public ApiResponse<IncidentResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", incidentService.getById(id));
    }

    @Operation(summary = "Get all incidents")
    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success("Fetched all successfully", incidentService.getAll());
    }

    @Operation(summary = "Update an incident")
    @PutMapping("/{id}")
    public ApiResponse<IncidentResponse> update(@PathVariable Integer id,
                                                @Valid @RequestBody IncidentRequest request) {
        return ApiResponse.success("Updated successfully", incidentService.update(id, request));
    }

    @Operation(summary = "Delete an incident")
    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Integer id) {
        incidentService.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }

    @Operation(summary = "Update incident status")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager')")
    @PatchMapping("/{id}/status")
    public ApiResponse<IncidentResponse> updateStatus(@PathVariable Integer id, @RequestParam String status) {
        return ApiResponse.success("Status updated successfully", incidentService.updateStatus(id, status));
    }

    @Operation(summary = "Upload incident image")
    @PostMapping("/{id}/image")
    public ApiResponse<IncidentResponse> uploadIncidentImage(
            @PathVariable Integer id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file
    ) {
        return ApiResponse.success("Image uploaded successfully", incidentService.uploadIncidentImage(id, file));
    }
}