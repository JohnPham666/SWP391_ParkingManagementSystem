package com.parking.management.module.session;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Tag(name = "Parking Session", description = "APIs for managing parking sessions (check-in / check-out)")
public class SessionController {
    
    // private final SessionService service;

    @Operation(summary = "Create a parking session (Check-in)", description = "Start a new parking session when a vehicle enters the parking lot")
    @PostMapping
    public ApiResponse<SessionResponse> create(@Valid @RequestBody SessionRequest request) {
        return ApiResponse.success("Created successfully", new SessionResponse());
    }

    @Operation(summary = "Get session by ID", description = "Retrieve a specific parking session by its ID")
    @GetMapping("/{id}")
    public ApiResponse<SessionResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new SessionResponse());
    }

    @Operation(summary = "Get all sessions", description = "Retrieve a list of all parking sessions")
    @GetMapping
    public ApiResponse<List<SessionResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", java.util.Collections.emptyList());
    }

    @Operation(summary = "Update a session (Check-out)", description = "Update a parking session, typically to set exit time during check-out")
    @PutMapping("/{id}")
    public ApiResponse<SessionResponse> update(@PathVariable Long id, @Valid @RequestBody SessionRequest request) {
        return ApiResponse.success("Updated successfully", new SessionResponse());
    }

    @Operation(summary = "Delete a session", description = "Delete a parking session by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
