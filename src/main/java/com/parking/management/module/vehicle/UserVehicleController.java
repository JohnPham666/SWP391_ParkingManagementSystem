package com.parking.management.module.vehicle;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/users/{userId}/vehicles")
@RequiredArgsConstructor
public class UserVehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public ApiResponse<?> getMyVehicles(@PathVariable Integer userId) {
        return ApiResponse.success("Fetched user vehicles successfully",
                vehicleService.getVehiclesByUser(userId));
    }

    @PostMapping
    public ApiResponse<VehicleResponse> createMyVehicle(@PathVariable Integer userId,
                                                        @Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Created successfully",
                vehicleService.createVehicleForUser(userId, request));
    }

    @PutMapping("/{vehicleId}")
    public ApiResponse<VehicleResponse> updateMyVehicle(@PathVariable Integer userId,
                                                        @PathVariable Integer vehicleId,
                                                        @Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Updated successfully",
                vehicleService.updateVehicleForUser(userId, vehicleId, request));
    }

    @DeleteMapping("/{vehicleId}")
    public ApiResponse<?> deleteMyVehicle(@PathVariable Integer userId,
                                          @PathVariable Integer vehicleId) {
        vehicleService.deleteVehicleForUser(userId, vehicleId);
        return ApiResponse.success("Deleted successfully", null);
    }

    @PostMapping(value = "/{vehicleId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<VehicleResponse> uploadMyVehicleImage(@PathVariable Integer userId,
                                                             @PathVariable Integer vehicleId,
                                                             @RequestParam("file") MultipartFile file) {
        return ApiResponse.success("Uploaded successfully",
                vehicleService.uploadVehicleImageForUser(userId, vehicleId, file));
    }
}