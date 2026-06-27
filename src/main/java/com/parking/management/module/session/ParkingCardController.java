package com.parking.management.module.session;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
@Tag(name = "Parking Card", description = "APIs for managing physical parking cards")
@PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff')")
public class ParkingCardController {

    private final ParkingCardService service;

    @Operation(summary = "Create a new parking card", description = "Register a new physical parking card into the system")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager')")
    @PostMapping
    public ApiResponse<ParkingCardResponse> createCard(@Valid @RequestBody ParkingCardRequest request) {
        ParkingCardResponse response = service.createCard(request);
        return ApiResponse.success("Created parking card successfully", response);
    }

    @Operation(summary = "Get all parking cards", description = "Retrieve a list of all parking cards")
    @GetMapping
    public ApiResponse<List<ParkingCardResponse>> getAllCards() {
        List<ParkingCardResponse> responses = service.getAllCards();
        return ApiResponse.success("Fetched all parking cards successfully", responses);
    }

    @Operation(summary = "Get a parking card by ID", description = "Retrieve a specific parking card by its ID")
    @GetMapping("/{cardId}")
    public ApiResponse<ParkingCardResponse> getCardById(@PathVariable String cardId) {
        ParkingCardResponse response = service.getCardById(cardId);
        return ApiResponse.success("Fetched parking card successfully", response);
    }

    @Operation(summary = "Update parking card status", description = "Change the status of an existing parking card")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager')")
    @PutMapping("/{cardId}/status")
    public ApiResponse<ParkingCardResponse> updateCardStatus(
            @PathVariable String cardId,
            @RequestParam String status) {
        ParkingCardResponse response = service.updateCardStatus(cardId, status);
        return ApiResponse.success("Updated parking card status successfully", response);
    }

    @Operation(summary = "Delete a parking card", description = "Remove a parking card from the system")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager')")
    @DeleteMapping("/{cardId}")
    public ApiResponse<Void> deleteCard(@PathVariable String cardId) {
        service.deleteCard(cardId);
        return ApiResponse.success("Deleted parking card successfully", null);
    }
}
