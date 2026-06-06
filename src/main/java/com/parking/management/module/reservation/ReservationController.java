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

    // READ: tìm reservation theo id
    @GetMapping("/{id}")
    public ApiResponse<ReservationResponse> getById(@PathVariable Integer id) {
        ReservationResponse response = service.getReservationById(id);
        return ApiResponse.success("Fetched successfully", response);
    }

    // READ: lấy tất cả reservation
    @GetMapping
    public ApiResponse<List<ReservationResponse>> getAll() {
        List<ReservationResponse> responses = service.getAllReservations();
        return ApiResponse.success("Fetched all successfully", responses);
    }

    // UPDATE
    @PutMapping("/{id}")
    public ApiResponse<ReservationResponse> update(@PathVariable Integer id, @Valid @RequestBody ReservationRequest request
    ) {
        ReservationResponse response = service.updateReservation(id, request);
        return ApiResponse.success("Updated successfully", response);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.deleteReservation(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}
