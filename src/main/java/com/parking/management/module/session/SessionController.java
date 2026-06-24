package com.parking.management.module.session;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
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
        SessionResponse response = service.checkIn(request);
        return ApiResponse.success("Check-in successfully", response);
    }

    @Operation(summary = "Walk-in Check-in", description = "Check in a walk-in guest without prior reservation")
    @PostMapping("/walk-in")
    public ApiResponse<SessionResponse> checkInWalkIn(@Valid @RequestBody WalkInRequest request) {
        SessionResponse response = service.checkInWalkIn(request);
        return ApiResponse.success("Walk-in check-in successfully", response);
    }

    @Operation(summary = "Check-out", description = "Check out and end a parking session")
    @PostMapping("/{sessionId}/check-out")
    public ApiResponse<SessionResponse> checkOut(
            @PathVariable Integer sessionId,
            @RequestBody CheckOutRequest request
    ) {
        SessionResponse response = service.checkOut(sessionId, request);
        return ApiResponse.success("Check-out successfully", response);
    }

    @Operation(
            summary = "Get active session by license plate",
            description = "Find the active parking session by vehicle license plate"
    )
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
    @GetMapping("/active/by-license-plate")
    public ApiResponse<SessionResponse> getActiveSessionByLicensePlate(
            @RequestParam String licensePlate
    ) {
        SessionResponse response = service.getActiveSessionByLicensePlate(licensePlate);
        return ApiResponse.success("Fetched active session successfully", response);
    }

    @Operation(summary = "Get my active sessions", description = "Retrieve a list of all active parking sessions for the current user's vehicles")
    @PreAuthorize("hasRole('Driver')")
    @GetMapping("/me/active")
    public ApiResponse<List<SessionResponse>> getMyActiveSessions() {
        List<SessionResponse> responses = service.getMyActiveSessions();
        return ApiResponse.success("Fetched my active sessions successfully", responses);
    }

    @Operation(summary = "Get session by ID", description = "Retrieve a specific parking session by its ID")
    @GetMapping("/{id}")
    public ApiResponse<SessionResponse> getById(@PathVariable Integer id) {
        SessionResponse response = service.getById(id);
        return ApiResponse.success("Fetched successfully", response);
    }

    @Operation(summary = "Get all sessions", description = "Retrieve a list of all parking sessions")
    @GetMapping
    public ApiResponse<List<SessionResponse>> getAll() {
        List<SessionResponse> responses = service.getAll();
        return ApiResponse.success("Fetched all successfully", responses);
    }

    @Operation(summary = "Delete a session", description = "Delete a parking session by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
    @Operation(summary = "Upload session image", description = "Upload entry or exit image for a session")
    @PostMapping("/{sessionId}/image")
    public ApiResponse<SessionResponse> uploadSessionImage(
            @PathVariable Integer sessionId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "type", defaultValue = "entry") String type
    ) {
        SessionResponse response = service.uploadSessionImage(sessionId, file, type);
        return ApiResponse.success("Image uploaded successfully", response);
    }
}
