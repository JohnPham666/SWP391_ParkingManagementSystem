package com.parking.management.module.reservation;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    public ApiResponse<ReservationResponse> create(@Valid @RequestBody ReservationRequest request) {
        return ApiResponse.success("Created successfully", reservationService.create(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<ReservationResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", reservationService.getById(id));
    }

    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success("Fetched all successfully", reservationService.getAll());
    }

    @PutMapping("/{id}")
    public ApiResponse<ReservationResponse> update(@PathVariable Integer id,
                                                   @Valid @RequestBody ReservationRequest request) {
        return ApiResponse.success("Updated successfully", reservationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Integer id) {
        reservationService.cancel(id);
        return ApiResponse.success("Reservation cancelled successfully", null);
    }
}