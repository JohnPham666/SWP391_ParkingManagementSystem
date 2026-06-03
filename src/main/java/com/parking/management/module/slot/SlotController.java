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
    
    // private final SlotService service;

    @PostMapping
    public ApiResponse<SlotResponse> create(@Valid @RequestBody SlotRequest request) {
        return ApiResponse.success("Created successfully", new SlotResponse());
    }

    @GetMapping("/{id}")
    public ApiResponse<SlotResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Fetched successfully", new SlotResponse());
    }

    @GetMapping
    public ApiResponse<List<SlotResponse>> getAll() {
        return ApiResponse.success("Fetched all successfully", List.of());
    }

    @PutMapping("/{id}")
    public ApiResponse<SlotResponse> update(@PathVariable Long id, @Valid @RequestBody SlotRequest request) {
        return ApiResponse.success("Updated successfully", new SlotResponse());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success("Deleted successfully", null);
    }
}
