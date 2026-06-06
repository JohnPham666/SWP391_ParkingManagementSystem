package com.parking.management.module.reservation;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@Tag(name = "Reservation", description = "APIs for managing parking slot reservations")
public class ReservationController {

    private final ReservationService reservationService;

    @Operation(summary = "Create a new reservation", description = "Reserve a parking slot for a specific time period")
    @PostMapping
    public ApiResponse<ReservationResponse> create(@Valid @RequestBody ReservationRequest request) {
        return ApiResponse.success("Created successfully", reservationService.create(request));
    }

    @Operation(summary = "Get reservation by ID", description = "Retrieve a specific reservation by its ID")
    @GetMapping("/{id}")
    public ApiResponse<ReservationResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", reservationService.getById(id));
    }

    @Operation(summary = "Get all reservations", description = "Retrieve a list of all reservations")
    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success("Fetched all successfully", reservationService.getAll());
    }

    @Operation(summary = "Update a reservation", description = "Update an existing reservation by its ID")
    @PutMapping("/{id}")
    public ApiResponse<ReservationResponse> update(@PathVariable Integer id,
                                                   @Valid @RequestBody ReservationRequest request) {
        return ApiResponse.success("Updated successfully", reservationService.update(id, request));
    }

    @Operation(summary = "Delete a reservation", description = "Cancel and delete a reservation by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Integer id) {
        reservationService.cancel(id);
        return ApiResponse.success("Reservation cancelled successfully", null);
    }
}