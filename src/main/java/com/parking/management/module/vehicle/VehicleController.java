package com.parking.management.module.vehicle;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

@RestController
@PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor

public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping
    public ApiResponse<VehicleResponse> create(@Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Created successfully", vehicleService.create(request));
    }

    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success("Fetched all successfully", vehicleService.getAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<VehicleResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", vehicleService.getById(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<VehicleResponse> update(@PathVariable Integer id,
                                               @Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Updated successfully", vehicleService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Integer id) {
        vehicleService.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<VehicleResponse> uploadVehicleImage(@PathVariable Integer id,
                                                           @RequestParam("file") MultipartFile file) {
        return ApiResponse.success("Uploaded successfully", vehicleService.uploadVehicleImage(id, file));
    }
}