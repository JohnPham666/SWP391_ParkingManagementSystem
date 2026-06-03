package com.parking.management.module.session;

import com.parking.management.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {
    
    // private final SessionService service;

    @PostMapping
    public ApiResponse<SessionResponse> create(@Valid @RequestBody SessionRequest request) {
        return ApiResponse.success("Created successfully", new SessionResponse());
    }

    @GetMapping("/{id}")
    public ApiResponse<SessionResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new SessionResponse());
    }

    @GetMapping
    public ApiResponse<List<SessionResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", java.util.Collections.emptyList());
    }

    @PutMapping("/{id}")
    public ApiResponse<SessionResponse> update(@PathVariable Long id, @Valid @RequestBody SessionRequest request) {
        return ApiResponse.success("Updated successfully", new SessionResponse());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
