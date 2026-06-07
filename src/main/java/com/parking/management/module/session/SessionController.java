package com.parking.management.module.session;

import com.parking.management.common.ApiResponse;
import com.parking.management.common.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff')")
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Tag(name = "Parking Session", description = "APIs for managing parking sessions (check-in / check-out)")
public class SessionController {
    
    private final SessionService service;

    /*
     * CHECK-IN
     *
     * Tạo ParkingSession từ Reservation đã hold slot.
     */
    @Operation(summary = "Check-in", description = "Check in and start a parking session")
    @PostMapping("/check-in")
    public ApiResponse<SessionResponse> checkIn(@Valid @RequestBody CheckInRequest request) {
        try {
            SessionResponse response = service.checkIn(request);
            return ApiResponse.success("Check-in successfully", response);
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /*
     * CHECK-OUT
     *
     * Kết thúc ParkingSession.
     */
    @Operation(summary = "Check-out", description = "Check out and end a parking session")
    @PostMapping("/{sessionId}/check-out")
    public ApiResponse<SessionResponse> checkOut(
            @PathVariable Integer sessionId,
            @RequestBody CheckOutRequest request
    ) {
        try {
            SessionResponse response = service.checkOut(sessionId, request);
            return ApiResponse.success("Check-out successfully", response);
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Operation(summary = "Create a parking session", description = "Manually create a new parking session")
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

    @Operation(summary = "Update a session", description = "Update a parking session")
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
