package com.parking.management.module.session;

import com.parking.management.common.ApiResponse;
import com.parking.management.common.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {
    
    private final SessionService service;

    /*
     * CHECK-IN
     *
     * Tạo ParkingSession từ Reservation đã hold slot.
     */
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
}
