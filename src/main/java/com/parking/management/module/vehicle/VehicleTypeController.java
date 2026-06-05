package com.parking.management.module.vehicle;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicle-types")
@RequiredArgsConstructor
public class VehicleTypeController {

    private final VehicleTypeService vehicleTypeService;

    @PostMapping
    public ApiResponse<VehicleTypeResponse> create(@Valid @RequestBody VehicleTypeRequest request) {
        return ApiResponse.success("Created successfully", vehicleTypeService.create(request));
    }

    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success("Fetched all successfully", vehicleTypeService.getAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<VehicleTypeResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", vehicleTypeService.getById(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<VehicleTypeResponse> update(@PathVariable Integer id,
                                                   @Valid @RequestBody VehicleTypeRequest request) {
        return ApiResponse.success("Updated successfully", vehicleTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Integer id) {
        vehicleTypeService.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}