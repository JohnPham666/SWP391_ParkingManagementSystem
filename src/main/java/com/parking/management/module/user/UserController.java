package com.parking.management.module.user;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "APIs for managing user accounts")
public class UserController {

    private final UserService service;

    // ===== Self-service endpoints (any authenticated user) =====

    @Operation(summary = "Get my profile", description = "Get the profile of the currently authenticated user")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ApiResponse<UserResponse> getMyProfile(Authentication authentication) {
        return ApiResponse.success("Fetched successfully", service.getByEmail(authentication.getName()));
    }

    @Operation(summary = "Update my profile", description = "Update own profile (fullName, phoneNumber, address only)")
    @PreAuthorize("isAuthenticated()")
    @PutMapping("/me")
    public ApiResponse<UserResponse> updateMyProfile(Authentication authentication, @RequestBody Map<String, String> body) {
        String email = authentication.getName();
        String fullName = body.get("fullName");
        String phoneNumber = body.get("phoneNumber");
        String address = body.get("address");
        return ApiResponse.success("Updated successfully", service.updateOwnProfile(email, fullName, phoneNumber, address));
    }

    // ===== Admin-only endpoints =====

    @Operation(summary = "Create a new user", description = "Create a new user with full name, email, phone and role")
    @PreAuthorize("hasRole('Admin')")
    @PostMapping
    public ApiResponse<UserResponse> create(@Valid @RequestBody UserRequest request) {
        return ApiResponse.success("Created successfully", service.create(request));
    }

    @Operation(summary = "Get user by ID", description = "Retrieve a specific user by their ID")
    @GetMapping("/{id}")
    public ApiResponse<UserResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", service.getById(id));
    }

    @Operation(summary = "Get all users", description = "Retrieve a list of all users in the system")
    @PreAuthorize("hasRole('Admin')")
    @GetMapping
    public ApiResponse<List<UserResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", service.getAll());
    }

    @Operation(summary = "Update a user", description = "Update an existing user by their ID")
    @PutMapping("/{id}")
    public ApiResponse<UserResponse> update(@PathVariable Integer id, @Valid @RequestBody UserRequest request) {
        return ApiResponse.success("Updated successfully", service.update(id, request));
    }

    @Operation(summary = "Delete a user", description = "Delete a user by their ID")
    @PreAuthorize("hasRole('Admin')")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}

