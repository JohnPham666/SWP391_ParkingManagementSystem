package com.parking.management.module.user;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@PreAuthorize("hasRole('Admin')")
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Tag(name = "Role", description = "APIs for managing user roles (Admin, Staff, Customer)")
public class RoleController {

    private final RoleService service;

    @Operation(summary = "Create a new role", description = "Create a new role such as Admin, Staff, or Customer")
    @PostMapping
    public ApiResponse<RoleResponse> create(@Valid @RequestBody RoleRequest request) {
        return ApiResponse.success("Created successfully", service.create(request));
    }

    @Operation(summary = "Get role by ID", description = "Retrieve a specific role by its ID")
    @GetMapping("/{id}")
    public ApiResponse<RoleResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", service.getById(id));
    }

    @Operation(summary = "Get all roles", description = "Retrieve a list of all roles in the system")
    @GetMapping
    public ApiResponse<List<RoleResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", service.getAll());
    }

    @Operation(summary = "Update a role", description = "Update an existing role by its ID")
    @PutMapping("/{id}")
    public ApiResponse<RoleResponse> update(@PathVariable Integer id, @Valid @RequestBody RoleRequest request) {
        return ApiResponse.success("Updated successfully", service.update(id, request));
    }

    @Operation(summary = "Delete a role", description = "Delete a role by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}
