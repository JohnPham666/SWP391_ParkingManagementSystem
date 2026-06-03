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
    
    // private final ReservationService service;

    @PostMapping
    public ApiResponse<ReservationResponse> create(@Valid @RequestBody ReservationRequest request) {
        return ApiResponse.success("Created successfully", new ReservationResponse());
    }

    @GetMapping("/{id}")
    public ApiResponse<ReservationResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new ReservationResponse());
    }

    @GetMapping
    public ApiResponse<List<ReservationResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", List.of());
    }

    @PutMapping("/{id}")
    public ApiResponse<ReservationResponse> update(@PathVariable Long id, @Valid @RequestBody ReservationRequest request) {
        return ApiResponse.success("Updated successfully", new ReservationResponse());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
