package com.parking.management.module.slot;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/slots")
@RequiredArgsConstructor
public class SlotController {
    
    private final SlotService service;

    @PostMapping
    public ApiResponse<SlotResponse> create(@Valid @RequestBody SlotRequest request) {
        return ApiResponse.success("Created successfully", service.create(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<SlotResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", service.getById(id));
    }

    @GetMapping
    public ApiResponse<List<SlotResponse>> getAll(
            @RequestParam(required = false) Integer zoneId,
            @RequestParam(required = false) Integer vehicleTypeId) {
        return ApiResponse.success("Fetched all successfully", service.getAll(zoneId, vehicleTypeId));
    }

    @GetMapping("/available")
    public ApiResponse<List<SlotResponse>> getAvailableSlots(
            @RequestParam(required = false) Integer buildingId,
            @RequestParam(required = false) Integer floorId,
            @RequestParam(required = false) Integer zoneId,
            @RequestParam(required = false) Integer vehicleTypeId) {
        return ApiResponse.success("Fetched available slots successfully",
                service.getAvailableSlots(buildingId, floorId, zoneId, vehicleTypeId));
    }

    @PutMapping("/{id}")
    public ApiResponse<SlotResponse> update(@PathVariable Integer id, @Valid @RequestBody SlotRequest request) {
        return ApiResponse.success("Updated successfully", service.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<SlotResponse> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody SlotStatusUpdateRequest request) {
        return ApiResponse.success("Slot status updated successfully", service.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}
