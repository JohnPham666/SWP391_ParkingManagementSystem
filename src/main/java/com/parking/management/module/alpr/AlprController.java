package com.parking.management.module.alpr;

import com.parking.management.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/alpr")
@RequiredArgsConstructor
public class AlprController {

    private final AlprService alprService;

    @PostMapping("/scan")
    public ApiResponse<String> scanPlate(@RequestParam("image") MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return ApiResponse.error("Image file is required");
        }
        
        String plate = alprService.recognizeLicensePlate(image);
        if (plate != null) {
            return ApiResponse.success("Recognized license plate successfully", plate);
        } else {
            return ApiResponse.error("Could not recognize license plate from the image");
        }
    }
}
