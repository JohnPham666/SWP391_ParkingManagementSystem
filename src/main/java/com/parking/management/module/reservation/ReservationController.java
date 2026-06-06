package com.parking.management.module.reservation;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {
    
    private final ReservationService service;

    //Hold Slot
    @PostMapping("/hold-slot")
    public ApiResponse<ReservationResponse> holdSlot(@Valid @RequestBody ReservationRequest request) {
        ReservationResponse response = service.holdSlot(request);
        return ApiResponse.success("hold slot successfully", response);
    }
}
