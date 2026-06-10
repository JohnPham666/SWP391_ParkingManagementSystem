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
     * WALK-IN CHECK-IN
     *
     * Dành cho khách vãng lai, tạo trực tiếp Session từ biển số xe
     */
    @Operation(summary = "Walk-in Check-in", description = "Check in a walk-in guest without prior reservation")
    @PostMapping("/walk-in")
    public ApiResponse<SessionResponse> checkInWalkIn(@Valid @RequestBody WalkInRequest request) {
        try {
            SessionResponse response = service.checkInWalkIn(request);
            return ApiResponse.success("Walk-in check-in successfully", response);
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
    /*
     * GET ACTIVE SESSION BY LICENSE PLATE
     *
     * Dùng cho exit/payment flow:
     * Camera hoặc staff nhập biển số xe -> hệ thống tìm session đang PARKING.
     */
    @Operation(
            summary = "Get active session by license plate",
            description = "Find the active parking session by vehicle license plate"
    )
    @GetMapping("/active/by-license-plate")
    public ApiResponse<SessionResponse> getActiveSessionByLicensePlate(
            @RequestParam String licensePlate
    ) {
        try {
            SessionResponse response = service.getActiveSessionByLicensePlate(licensePlate);
            return ApiResponse.success("Fetched active session successfully", response);
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

//    @Operation(summary = "Create a parking session", description = "Manually create a new parking session")
//    @PostMapping
//    public ApiResponse<SessionResponse> create(@Valid @RequestBody SessionRequest request) {
//        return ApiResponse.success("Created successfully", new SessionResponse());
//    }

    @Operation(summary = "Get session by ID", description = "Retrieve a specific parking session by its ID")
    @GetMapping("/{id}")
    public ApiResponse<SessionResponse> getById(@PathVariable Integer id) {
        try {
            SessionResponse response = service.getById(id);
            return ApiResponse.success("Fetched successfully", response);
        } catch (ResourceNotFoundException e) {
            return ApiResponse.error(e.getMessage());
        }
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
        try {
            service.delete(id);
            return ApiResponse.success("Deleted successfully", null);
        } catch (ResourceNotFoundException e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
