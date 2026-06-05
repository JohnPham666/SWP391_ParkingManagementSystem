package com.parking.management.module.reservation;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@Tag(name = "Reservation", description = "APIs for managing parking slot reservations")
public class ReservationController {
    
    // private final ReservationService service;

    @Operation(summary = "Create a new reservation", description = "Reserve a parking slot for a specific time period")
    @PostMapping
    public ApiResponse<ReservationResponse> create(@Valid @RequestBody ReservationRequest request) {
        return ApiResponse.success("Created successfully", new ReservationResponse());
    }

    @Operation(summary = "Get reservation by ID", description = "Retrieve a specific reservation by its ID")
    @GetMapping("/{id}")
    public ApiResponse<ReservationResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new ReservationResponse());
    }

    @Operation(summary = "Get all reservations", description = "Retrieve a list of all reservations")
    @GetMapping
    public ApiResponse<List<ReservationResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", java.util.Collections.emptyList());
    }

    @Operation(summary = "Update a reservation", description = "Update an existing reservation by its ID")
    @PutMapping("/{id}")
    public ApiResponse<ReservationResponse> update(@PathVariable Long id, @Valid @RequestBody ReservationRequest request) {
        return ApiResponse.success("Updated successfully", new ReservationResponse());
    }

    @Operation(summary = "Delete a reservation", description = "Cancel and delete a reservation by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
