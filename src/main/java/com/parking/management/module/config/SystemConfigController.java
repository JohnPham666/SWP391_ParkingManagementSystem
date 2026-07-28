package com.parking.management.module.config;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Tag(name = "System Settings API", description = "Endpoints for managing system configurations")
public class SystemConfigController {

    private final SystemConfigService configService;

    @GetMapping
    @PreAuthorize("hasRole('Admin')")
    @Operation(summary = "Get all system settings", description = "Returns a list of all system configurations")
    public ApiResponse<List<SystemConfig>> getAllSettings() {
        return ApiResponse.success("Lấy danh sách cấu hình thành công", configService.getAllConfigs());
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('Admin')")
    @Operation(summary = "Update a system setting", description = "Updates the value of a specific configuration")
    public ApiResponse<SystemConfig> updateSetting(
            @PathVariable String key,
            @Valid @RequestBody SystemConfigUpdateRequest request) {
        return ApiResponse.success("Cập nhật cấu hình thành công", configService.updateConfig(key, request.getValue()));
    }
}
