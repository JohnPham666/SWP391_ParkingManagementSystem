package com.parking.management.module.subscription;

import com.parking.management.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')")
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Monthly Subscription", description = "APIs for managing monthly parking subscriptions")
public class SubscriptionController {

    private final SubscriptionService service;

    // CREATE: Tạo vé tháng mới
    @Operation(summary = "Create a new monthly subscription",
               description = "Register a monthly parking pass for a user and vehicle. " +
                             "End date is auto-calculated as start date + 1 month. Status defaults to ACTIVE.")
    @PostMapping
    public ApiResponse<SubscriptionResponse> create(
            @Valid @RequestBody SubscriptionRequest request) {
        SubscriptionResponse response = service.createSubscription(request);
        return ApiResponse.success("Subscription created successfully", response);
    }

    // READ: Lấy vé tháng theo ID
    @Operation(summary = "Get subscription by ID",
               description = "Retrieve a specific monthly subscription by its ID")
    @GetMapping("/{id}")
    public ApiResponse<SubscriptionResponse> getById(@PathVariable Integer id) {
        SubscriptionResponse response = service.getSubscriptionById(id);
        return ApiResponse.success("Fetched successfully", response);
    }

    // READ: Lấy tất cả vé tháng
    @Operation(summary = "Get all subscriptions",
               description = "Retrieve a list of all monthly subscriptions in the system")
    @GetMapping
    public ApiResponse<List<SubscriptionResponse>> getAll() {
        List<SubscriptionResponse> responses = service.getAllSubscriptions();
        return ApiResponse.success("Fetched all successfully", responses);
    }

    // READ: Lấy vé tháng theo userId
    @Operation(summary = "Get subscriptions by user ID",
               description = "Retrieve all monthly subscriptions belonging to a specific user")
    @GetMapping("/user/{userId}")
    public ApiResponse<List<SubscriptionResponse>> getByUserId(@PathVariable Integer userId) {
        List<SubscriptionResponse> responses = service.getSubscriptionsByUserId(userId);
        return ApiResponse.success("Fetched by user id successfully", responses);
    }

    // UPDATE: Cập nhật vé tháng
    @Operation(summary = "Update a subscription",
               description = "Update an existing monthly subscription by its ID")
    @PutMapping("/{id}")
    public ApiResponse<SubscriptionResponse> update(
            @PathVariable Integer id,
            @Valid @RequestBody SubscriptionRequest request) {
        SubscriptionResponse response = service.updateSubscription(id, request);
        return ApiResponse.success("Updated successfully", response);
    }

    // DELETE: Xóa vé tháng
    @Operation(summary = "Delete a subscription",
               description = "Delete a monthly subscription by its ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.deleteSubscription(id);
        return ApiResponse.success("Deleted successfully", null);
    }
}
