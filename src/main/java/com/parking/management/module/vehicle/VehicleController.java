package com.parking.management.module.vehicle;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "Vehicle", description = "APIs for managing vehicles")
@PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor

public class VehicleController {

    private final VehicleService vehicleService;

    @Operation(summary = "Create a vehicle", description = "Admin/Staff can create a vehicle for any user")
    @PostMapping
    public ApiResponse<VehicleResponse> create(@Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Created successfully", vehicleService.create(request));
    }

    @Operation(summary = "Get all vehicles", description = "Admin/Staff can get all vehicles")
    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success("Fetched all successfully", vehicleService.getAll());
    }

    @Operation(summary = "Get vehicle by ID", description = "Admin/Staff can get a specific vehicle")
    @GetMapping("/{id}")
    public ApiResponse<VehicleResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", vehicleService.getById(id));
    }

    @Operation(summary = "Update a vehicle", description = "Admin/Staff can update a specific vehicle")
    @PutMapping("/{id}")
    public ApiResponse<VehicleResponse> update(@PathVariable Integer id,
                                               @Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Updated successfully", vehicleService.update(id, request));
    }

    @Operation(summary = "Delete a vehicle", description = "Admin/Staff can delete a specific vehicle")
    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Integer id) {
        vehicleService.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }

    @Operation(summary = "Upload vehicle image", description = "Admin/Staff can upload an image for a specific vehicle")
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<VehicleResponse> uploadVehicleImage(@PathVariable Integer id,
                                                           @RequestParam("file") MultipartFile file,
                                                           @RequestParam(value = "type", defaultValue = "vehicle") String type) {
        return ApiResponse.success("Uploaded successfully", vehicleService.uploadVehicleImage(id, file, type));
    }

    // --- SELF-SERVICE ENDPOINTS (Dành cho tài xế tự quản lý xe của mình) ---

    @Operation(summary = "Get my vehicles", description = "Driver gets all their own vehicles")
    @GetMapping("/me")
    public ApiResponse<?> getMyVehicles() {
        return ApiResponse.success("Fetched user vehicles successfully", vehicleService.getMyVehicles());
    }

    @Operation(summary = "Create my vehicle", description = "Driver registers a new vehicle for themselves")
    @PostMapping("/me")
    public ApiResponse<VehicleResponse> createMyVehicle(@Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Created successfully", vehicleService.createMyVehicle(request));
    }

    @Operation(summary = "Update my vehicle", description = "Driver updates their own vehicle")
    @PutMapping("/me/{vehicleId}")
    public ApiResponse<VehicleResponse> updateMyVehicle(@PathVariable Integer vehicleId,
                                                        @Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Updated successfully", vehicleService.updateMyVehicle(vehicleId, request));
    }

    @Operation(summary = "Delete my vehicle", description = "Driver deletes their own vehicle")
    @DeleteMapping("/me/{vehicleId}")
    public ApiResponse<?> deleteMyVehicle(@PathVariable Integer vehicleId) {
        vehicleService.deleteMyVehicle(vehicleId);
        return ApiResponse.success("Deleted successfully", null);
    }

    @Operation(summary = "Upload my vehicle image", description = "Driver uploads an image for their own vehicle")
    @PostMapping(value = "/me/{vehicleId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<VehicleResponse> uploadMyVehicleImage(@PathVariable Integer vehicleId,
                                                             @RequestParam("file") MultipartFile file,
                                                             @RequestParam(value = "type", defaultValue = "vehicle") String type) {
        return ApiResponse.success("Uploaded successfully", vehicleService.uploadMyVehicleImage(vehicleId, file, type));
    }
}