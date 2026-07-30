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

// Controller xử lý các API liên quan đến quản lý phương tiện (Vehicle)
// Endpoint chính: /api/vehicles (cho Admin/Staff) và /api/vehicles/me (cho Driver tự quản lý)
// Yêu cầu role: Admin, ParkingManager, ParkingStaff hoặc Driver
public class VehicleController {

    // Inject VehicleService để xử lý business logic
    private final VehicleService vehicleService;

    // [ADMIN/STAFF] Tạo xe mới cho bất kỳ user nào (có thể truyền userId trong request)
    // Endpoint: POST /api/vehicles
    // Input: VehicleRequest JSON body (licensePlate, vehicleTypeId bắt buộc)
    // Output: VehicleResponse chứa thông tin xe vừa tạo (status mặc định = PENDING)
    @Operation(summary = "Create a vehicle", description = "Admin/Staff can create a vehicle for any user")
    @PostMapping
    public ApiResponse<VehicleResponse> create(@Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Created successfully", vehicleService.create(request));
    }

    // [ADMIN/STAFF] Lấy danh sách TẤT CẢ xe trong hệ thống (chỉ xe có isActive = true)
    // Endpoint: GET /api/vehicles
    // Output: List<VehicleResponse>
    @Operation(summary = "Get all vehicles", description = "Admin/Staff can get all vehicles")
    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success("Fetched all successfully", vehicleService.getAll());
    }

    // [ADMIN/STAFF] Lấy thông tin chi tiết 1 xe theo vehicleId
    // Endpoint: GET /api/vehicles/{id}
    // Kiểm tra isActive = true, nếu không → throw RuntimeException
    @Operation(summary = "Get vehicle by ID", description = "Admin/Staff can get a specific vehicle")
    @GetMapping("/{id}")
    public ApiResponse<VehicleResponse> getById(@PathVariable Integer id) {
        return ApiResponse.success("Fetched successfully", vehicleService.getById(id));
    }

    // [ADMIN/STAFF] Cập nhật thông tin xe theo vehicleId
    // Endpoint: PUT /api/vehicles/{id}
    // Validate unique biển số/engine/chassis trước khi update
    @Operation(summary = "Update a vehicle", description = "Admin/Staff can update a specific vehicle")
    @PutMapping("/{id}")
    public ApiResponse<VehicleResponse> update(@PathVariable Integer id,
                                               @Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Updated successfully", vehicleService.update(id, request));
    }

    // [ADMIN/STAFF] Xóa xe theo vehicleId
    // Endpoint: DELETE /api/vehicles/{id}
    // Logic: Soft delete (isActive=false) nếu có session/reservation/subscription liên quan
    //        Hard delete (xóa hẳn record) nếu xe chưa có dữ liệu liên quan
    @Operation(summary = "Delete a vehicle", description = "Admin/Staff can delete a specific vehicle")
    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Integer id) {
        vehicleService.delete(id);
        return ApiResponse.success("Deleted successfully", null);
    }

    // [ADMIN/STAFF] Upload ảnh cho xe (ảnh xe, CCCD, cà vẹt, chân dung chủ xe)
    // Endpoint: POST /api/vehicles/{id}/image (multipart/form-data)
    // Params: file (ảnh), type (ownerportrait|idcardfront|idcardback|vehicle|registrationfront|registrationback)
    // Ảnh được upload lên AWS S3, URL lưu vào column tương ứng trong DB
    @Operation(summary = "Upload vehicle image", description = "Admin/Staff can upload an image for a specific vehicle")
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<VehicleResponse> uploadVehicleImage(@PathVariable Integer id,
                                                           @RequestParam("file") MultipartFile file,
                                                           @RequestParam(value = "type", defaultValue = "vehicle") String type) {
        return ApiResponse.success("Uploaded successfully", vehicleService.uploadVehicleImage(id, file, type));
    }

    // --- SELF-SERVICE ENDPOINTS (Dành cho tài xế tự quản lý xe của mình) ---

    // [DRIVER] Lấy danh sách xe của CHÍNH MÌNH (dựa trên JWT token để xác định userId)
    // Endpoint: GET /api/vehicles/me
    // Chỉ trả về xe có isActive = true
    // Đây là endpoint mà VehiclePage.jsx gọi khi component mount
    @Operation(summary = "Get my vehicles", description = "Driver gets all their own vehicles")
    @GetMapping("/me")
    public ApiResponse<?> getMyVehicles() {
        return ApiResponse.success("Fetched user vehicles successfully", vehicleService.getMyVehicles());
    }

    // [DRIVER] Đăng ký xe MỚI cho chính mình
    // Endpoint: POST /api/vehicles/me
    // Tự động gán userId từ JWT token → không cần truyền userId trong request
    // Xe mới tạo có status = PENDING, cần Manager/Admin duyệt
    @Operation(summary = "Create my vehicle", description = "Driver registers a new vehicle for themselves")
    @PostMapping("/me")
    public ApiResponse<VehicleResponse> createMyVehicle(@Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Created successfully", vehicleService.createMyVehicle(request));
    }

    // [DRIVER] Cập nhật xe của chính mình (kiểm tra xe thuộc về user trước khi update)
    // Endpoint: PUT /api/vehicles/me/{vehicleId}
    // Lưu ý: Frontend hiện KHÔNG hiển thị nút Edit → endpoint này ít được sử dụng
    @Operation(summary = "Update my vehicle", description = "Driver updates their own vehicle")
    @PutMapping("/me/{vehicleId}")
    public ApiResponse<VehicleResponse> updateMyVehicle(@PathVariable Integer vehicleId,
                                                        @Valid @RequestBody VehicleRequest request) {
        return ApiResponse.success("Updated successfully", vehicleService.updateMyVehicle(vehicleId, request));
    }

    // [DRIVER] Xóa xe của chính mình
    // Endpoint: DELETE /api/vehicles/me/{vehicleId}
    // Kiểm tra xe thuộc về user → soft/hard delete tùy theo có dữ liệu liên quan không
    @Operation(summary = "Delete my vehicle", description = "Driver deletes their own vehicle")
    @DeleteMapping("/me/{vehicleId}")
    public ApiResponse<?> deleteMyVehicle(@PathVariable Integer vehicleId) {
        vehicleService.deleteMyVehicle(vehicleId);
        return ApiResponse.success("Deleted successfully", null);
    }

    // [DRIVER] Upload ảnh giấy tờ cho xe của chính mình
    // Endpoint: POST /api/vehicles/me/{vehicleId}/image (multipart/form-data)
    // Kiểm tra xe thuộc về user trước khi upload
    // Ảnh upload lên AWS S3, URL public được lưu vào column tương ứng trong bảng Vehicles
    @Operation(summary = "Upload my vehicle image", description = "Driver uploads an image for their own vehicle")
    @PostMapping(value = "/me/{vehicleId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<VehicleResponse> uploadMyVehicleImage(@PathVariable Integer vehicleId,
                                                             @RequestParam("file") MultipartFile file,
                                                             @RequestParam(value = "type", defaultValue = "vehicle") String type) {
        return ApiResponse.success("Uploaded successfully", vehicleService.uploadMyVehicleImage(vehicleId, file, type));
    }

    // [MANAGER/ADMIN] Duyệt hoặc từ chối đơn đăng ký xe
    // Endpoint: PUT /api/vehicles/{id}/approve?isApproved=true|false
    // isApproved=true → status = APPROVED (xe được phép sử dụng hệ thống)
    // isApproved=false → status = REJECTED (đơn bị từ chối)
    // Chỉ Admin và ParkingManager mới được gọi endpoint này
    @Operation(summary = "Approve or reject a vehicle", description = "Manager/Admin approves a pending vehicle registration")
    @PreAuthorize("hasAnyRole('Admin', 'ParkingManager')")
    @PutMapping("/{id}/approve")
    public ApiResponse<VehicleResponse> approveVehicle(@PathVariable Integer id, @RequestParam boolean isApproved) {
        return ApiResponse.success("Vehicle status updated successfully", vehicleService.approveVehicle(id, isApproved));
    }
}