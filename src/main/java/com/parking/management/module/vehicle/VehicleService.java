package com.parking.management.module.vehicle;

import com.parking.management.module.user.User;
import com.parking.management.module.user.UserRepository;
import com.parking.management.module.reservation.ReservationRepository;
import com.parking.management.module.session.ParkingSessionRepository;
import com.parking.management.module.subscription.SubscriptionRepository;
import com.parking.management.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.parking.management.common.S3Service;
import com.parking.management.common.CustomValidationException;
import com.parking.management.module.config.SystemConfigService;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;

// Service chứa toàn bộ business logic xử lý Vehicle (CRUD, validate, upload ảnh, duyệt)
// Được inject vào VehicleController để xử lý request
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class VehicleService {

    // Repository truy vấn bảng Vehicles trong PostgreSQL
    private final VehicleRepository vehicleRepository;
    // Repository truy vấn bảng VehicleTypes (loại xe: Car, Motorbike, Bicycle)
    private final VehicleTypeRepository vehicleTypeRepository;
    // Repository truy vấn bảng Users (để tìm user theo userId)
    private final UserRepository userRepository;
    // Repository kiểm tra xe có parking session nào không (dùng khi delete)
    private final ParkingSessionRepository parkingSessionRepository;
    // Repository kiểm tra xe có reservation nào không (dùng khi delete)
    private final ReservationRepository reservationRepository;
    // Repository kiểm tra xe có subscription nào không (dùng khi delete)
    private final SubscriptionRepository subscriptionRepository;
    // Utility kiểm tra quyền truy cập dữ liệu (data ownership)
    private final SecurityUtils securityUtils;
    // Service upload file lên AWS S3
    private final S3Service s3Service;
    // Service cấu hình hệ thống (MAX_VEHICLES_PER_USER, etc.)
    private final SystemConfigService systemConfigService;

    // Đường dẫn thư mục upload local (dự phòng, hiện không dùng — đã chuyển sang S3)
    @Value("${file.upload-dir:uploads/vehicles}")
    private String uploadDir;

    // ========== TẠO XE MỚI (dùng bởi Admin/Staff hoặc gián tiếp bởi Driver) ==========
    // 1. Validate unique: biển số, số máy, số khung không được trùng với xe khác
    // 2. Tìm VehicleType theo vehicleTypeId
    // 3. Tìm User theo userId (nếu có)
    // 4. Tạo entity Vehicle, set tất cả fields
    // 5. Lưu vào DB → status mặc định = "PENDING", isActive = true
    // 6. Trả về VehicleResponse
    public VehicleResponse create(VehicleRequest request) {
        // Kiểm tra biển số, engine number, chassis number có bị trùng không
        validateUniqueOnCreate(request);

        // Tìm loại xe (Car, Motorbike, Bicycle...) từ bảng VehicleTypes
        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new RuntimeException("Vehicle type not found"));

        // Nếu request có userId → kiểm tra quyền truy cập + tìm User entity
        User user = null;
        if (request.getUserId() != null) {
            securityUtils.checkDataOwnership(request.getUserId());
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
                    
            int maxVehicles = systemConfigService.getInt("MAX_VEHICLES_PER_USER", 3);
            long currentVehicleCount = vehicleRepository.findByUserUserIdAndIsActiveTrue(request.getUserId()).size();
            if (currentVehicleCount >= maxVehicles) {
                throw new IllegalArgumentException("Bạn đã đạt giới hạn đăng ký tối đa " + maxVehicles + " xe.");
            }
        }

        // Tạo entity Vehicle và map tất cả fields từ request
        Vehicle vehicle = new Vehicle();
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setVehicleType(vehicleType);
        vehicle.setUser(user);                    // Gán user sở hữu xe
        vehicle.setOwnerName(request.getOwnerName());
        vehicle.setOwnerPhone(request.getOwnerPhone());
        vehicle.setBrand(request.getBrand());
        vehicle.setVehicleColor(request.getVehicleColor());
        vehicle.setEngineNumber(request.getEngineNumber());
        vehicle.setChassisNumber(request.getChassisNumber());
        vehicle.setManufactureYear(request.getManufactureYear());
        vehicle.setRegistrationNumber(request.getRegistrationNumber());
        if (request.getRegistrationDate() != null && !request.getRegistrationDate().isBlank()) {
            vehicle.setRegistrationDate(LocalDate.parse(request.getRegistrationDate()));
        } else {
            vehicle.setRegistrationDate(LocalDate.now());
        }
        if (request.getRegistrationExpiry() != null && !request.getRegistrationExpiry().isBlank()) {
            vehicle.setRegistrationExpiry(LocalDate.parse(request.getRegistrationExpiry()));
        }
        vehicle.setVehicleImage(request.getVehicleImage());
        vehicle.setOwnerPortrait(request.getOwnerPortrait());
        vehicle.setRegistrationPhotoFront(request.getRegistrationPhotoFront());
        vehicle.setRegistrationPhotoBack(request.getRegistrationPhotoBack());
        vehicle.setIdCardFront(request.getIdCardFront());
        vehicle.setIdCardBack(request.getIdCardBack());
        // Lưu ý: status = "PENDING" (default trong Vehicle.java) — xe cần được Manager duyệt

        // Lưu vào PostgreSQL (INSERT INTO vehicles ...) và trả về DTO response
        return VehicleResponse.fromEntity(vehicleRepository.save(vehicle));
    }

    // ========== LẤY TẤT CẢ XE (cho Admin/Staff) ==========
    // Trả về tất cả xe có isActive = true (loại trừ xe đã soft delete)
    // Query: SELECT * FROM vehicles → filter Java-side bằng stream
    public List<VehicleResponse> getAll(Integer reqBuildingId) {
        Integer buildingId = reqBuildingId != null ? reqBuildingId : securityUtils.getBuildingId();
        return vehicleRepository.findAllWithBuildingFilter(buildingId)
                .stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsActive()))  // Chỉ lấy xe chưa bị soft delete
                .map(VehicleResponse::fromEntity)                   // Convert entity → DTO
                .toList();
    }

    // ========== LẤY XE THEO ID ==========
    // Kiểm tra tồn tại + isActive = true + quyền truy cập (data ownership)
    public VehicleResponse getById(Integer id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        // Kiểm tra xe chưa bị soft delete
        if (!Boolean.TRUE.equals(vehicle.getIsActive())) {
            throw new RuntimeException("Vehicle not found with id: " + id);
        }

        // Nếu xe có user → kiểm tra người gọi API có quyền truy cập không
        if (vehicle.getUser() != null) {
            securityUtils.checkDataOwnership(vehicle.getUser().getUserId());
        }

        return VehicleResponse.fromEntity(vehicle);
    }

    // ========== CẬP NHẬT XE (dùng bởi Admin/Staff hoặc gián tiếp bởi Driver) ==========
    // 1. Tìm xe theo id, kiểm tra isActive + quyền truy cập
    // 2. Validate unique: biển số/engine/chassis không trùng với xe KHÁC
    // 3. Cập nhật tất cả fields → lưu lại vào DB
    public VehicleResponse update(Integer id, VehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        // Kiểm tra xe chưa bị soft delete
        if (!Boolean.TRUE.equals(vehicle.getIsActive())) {
            throw new RuntimeException("Vehicle not found with id: " + id);
        }

        // Kiểm tra quyền truy cập dữ liệu
        if (vehicle.getUser() != null) {
            securityUtils.checkDataOwnership(vehicle.getUser().getUserId());
        }
        
        if (request.getUserId() != null) {
            securityUtils.checkDataOwnership(request.getUserId());
        }

        // Validate unique nhưng bỏ qua chính xe đang update (vehicleIdNot)
        validateUniqueOnUpdate(id, request);

        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new RuntimeException("Vehicle type not found"));

        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }

        // Cập nhật tất cả thông tin cơ bản
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setVehicleType(vehicleType);
        vehicle.setUser(user);
        vehicle.setOwnerName(request.getOwnerName());
        vehicle.setOwnerPhone(request.getOwnerPhone());
        vehicle.setBrand(request.getBrand());
        vehicle.setVehicleColor(request.getVehicleColor());
        vehicle.setEngineNumber(request.getEngineNumber());
        vehicle.setChassisNumber(request.getChassisNumber());
        vehicle.setManufactureYear(request.getManufactureYear());
        vehicle.setRegistrationNumber(request.getRegistrationNumber());
        if (request.getRegistrationDate() != null && !request.getRegistrationDate().isBlank()) {
            vehicle.setRegistrationDate(LocalDate.parse(request.getRegistrationDate()));
        }
        if (request.getRegistrationExpiry() != null && !request.getRegistrationExpiry().isBlank()) {
            vehicle.setRegistrationExpiry(LocalDate.parse(request.getRegistrationExpiry()));
        }

        // Chỉ cập nhật ảnh nếu request có giá trị mới (tránh ghi đè null)
        if (request.getVehicleImage() != null) {
            vehicle.setVehicleImage(request.getVehicleImage());
        }
        if (request.getOwnerPortrait() != null) {
            vehicle.setOwnerPortrait(request.getOwnerPortrait());
        }
        if (request.getRegistrationPhotoFront() != null) {
            vehicle.setRegistrationPhotoFront(request.getRegistrationPhotoFront());
        }
        if (request.getRegistrationPhotoBack() != null) {
            vehicle.setRegistrationPhotoBack(request.getRegistrationPhotoBack());
        }
        if (request.getIdCardFront() != null) {
            vehicle.setIdCardFront(request.getIdCardFront());
        }
        if (request.getIdCardBack() != null) {
            vehicle.setIdCardBack(request.getIdCardBack());
        }

        // Lưu lại vào DB (UPDATE vehicles SET ... WHERE vehicleid = ?)
        return VehicleResponse.fromEntity(vehicleRepository.save(vehicle));
    }

    // ========== XÓA XE (cho Admin/Staff) ==========
    // Logic phân nhánh:
    //   - Nếu xe CÓ parking session / reservation / subscription → SOFT DELETE (isActive = false)
    //   - Nếu xe KHÔNG có dữ liệu liên quan → HARD DELETE (xóa hẳn record khỏi DB)
    // Lý do: Tránh vi phạm Foreign Key constraint khi xóa xe đang được tham chiếu
    public void delete(Integer id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        // Kiểm tra quyền truy cập
        if (vehicle.getUser() != null) {
            securityUtils.checkDataOwnership(vehicle.getUser().getUserId());
        }

        // 1. NGĂN CHẶN XÓA nếu xe đang có hoạt động ACTIVE/PENDING
        boolean hasActiveSession = parkingSessionRepository.existsByVehicle_VehicleIdAndStatusIn(
                id, java.util.Arrays.asList("PARKING", "UNPAID"));
        if (hasActiveSession) {
            throw new IllegalArgumentException("Cannot delete vehicle that is currently parking or has unpaid fees.");
        }

        boolean hasActiveReservation = reservationRepository.existsByVehicle_VehicleIdAndStatusIn(
                id, java.util.Arrays.asList("PENDING", "CONFIRMED"));
        if (hasActiveReservation) {
            throw new IllegalArgumentException("Cannot delete vehicle with an active reservation.");
        }

        boolean hasActiveSubscription = subscriptionRepository.existsByVehicle_VehicleIdAndStatusIn(
                id, java.util.Arrays.asList("ACTIVE", "PENDING"));
        if (hasActiveSubscription) {
            throw new IllegalArgumentException("Cannot delete vehicle with an active or pending monthly subscription.");
        }

        // 2. Kiểm tra xe có dữ liệu liên quan trong các bảng khác không để Soft Delete
        boolean hasParkingSessions = parkingSessionRepository.existsByVehicle_VehicleId(id);
        boolean hasReservations = reservationRepository.existsByVehicle_VehicleId(id);
        boolean hasSubscriptions = subscriptionRepository.existsByVehicle_VehicleId(id);

        if (hasParkingSessions || hasReservations || hasSubscriptions) {
            // SOFT DELETE: chỉ đánh dấu isActive = false → xe vẫn còn trong DB nhưng không hiển thị
            vehicle.setIsActive(false);
            vehicleRepository.save(vehicle);
        } else {
            // HARD DELETE: xóa hẳn record khỏi database (DELETE FROM vehicles WHERE vehicleid = ?)
            vehicleRepository.delete(vehicle);
        }
    }

    // ========== UPLOAD ẢNH XE LÊN AWS S3 ==========
    // 1. Tìm xe theo vehicleId
    // 2. Tạo tên file unique: {type}_{vehicleId}_{UUID}.{extension}
    // 3. Upload file lên S3 bucket thư mục "vehicles/"
    // 4. Nhận URL public từ S3 → lưu vào column tương ứng trong DB
    // 5. Trả về VehicleResponse đã cập nhật URL ảnh
    // type hỗ trợ: ownerportrait, registrationfront, registrationback, idcardfront, idcardback, vehicle
    public VehicleResponse uploadVehicleImage(Integer vehicleId, MultipartFile file, String type) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        // Lấy phần mở rộng file (.jpg, .png, ...)
        String originalFilename = file.getOriginalFilename();
        String extension = "";

        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Tạo tên file unique để tránh trùng trên S3
        String prefix = (type != null ? type.toLowerCase() : "vehicle") + "_";
        String fileName = prefix + vehicleId + "_" + UUID.randomUUID() + extension;

        try {
            // Upload lên AWS S3 → nhận URL public
            String imageUrl = s3Service.uploadFile(file, "vehicles", fileName);
            
            // Gán URL vào đúng column dựa trên type
            if ("ownerportrait".equalsIgnoreCase(type)) {
                vehicle.setOwnerPortrait(imageUrl);           // Ảnh chân dung chủ xe
            } else if ("registrationfront".equalsIgnoreCase(type)) {
                vehicle.setRegistrationPhotoFront(imageUrl);  // Ảnh cà vẹt mặt trước
            } else if ("registrationback".equalsIgnoreCase(type)) {
                vehicle.setRegistrationPhotoBack(imageUrl);   // Ảnh cà vẹt mặt sau
            } else if ("idcardfront".equalsIgnoreCase(type)) {
                vehicle.setIdCardFront(imageUrl);              // Ảnh CCCD mặt trước
            } else if ("idcardback".equalsIgnoreCase(type)) {
                vehicle.setIdCardBack(imageUrl);               // Ảnh CCCD mặt sau
            } else {
                vehicle.setVehicleImage(imageUrl);             // Ảnh xe (mặc định)
            }

            // Lưu lại entity với URL ảnh mới → UPDATE vehicles SET ... WHERE vehicleid = ?
            return VehicleResponse.fromEntity(vehicleRepository.save(vehicle));
        } catch (Exception e) {
            throw new RuntimeException("Could not upload image: " + e.getMessage());
        }
    }

    // ========== LẤY DANH SÁCH XE CỦA 1 USER CỤ THỂ ==========
    // Kiểm tra quyền truy cập → query DB lấy xe có isActive = true
    // Được gọi bởi getMyVehicles() (cho Driver) và trực tiếp bởi Admin
    public List<VehicleResponse> getVehiclesByUser(Integer userId) {
        securityUtils.checkDataOwnership(userId);
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }

        // JPA tự sinh query: SELECT * FROM vehicles WHERE userid = ? AND isactive = true
        return vehicleRepository.findByUserUserIdAndIsActiveTrue(userId)
                .stream()
                .map(VehicleResponse::fromEntity)
                .toList();
    }

    // ========== TẠO XE CHO 1 USER CỤ THỂ ==========
    // Set userId vào request → delegate cho create()
    // Được gọi bởi createMyVehicle() (Driver tự đăng ký)
    public VehicleResponse createVehicleForUser(Integer userId, VehicleRequest request) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }

        request.setUserId(userId);  // Gán userId → create() sẽ liên kết xe với user
        return create(request);
    }

    // ========== CẬP NHẬT XE CỦA 1 USER CỤ THỂ ==========
    // Kiểm tra xe thuộc về user → delegate cho update()
    public VehicleResponse updateVehicleForUser(Integer userId, Integer vehicleId, VehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        checkVehicleBelongsToUser(vehicle, userId);  // Xe phải thuộc về user này

        request.setUserId(userId);
        return update(vehicleId, request);
    }

    // ========== XÓA XE CỦA 1 USER CỤ THỂ ==========
    // Kiểm tra xe thuộc về user → logic soft/hard delete giống hàm delete()
    // LƯU Ý: Không tự động hủy reservation/subscription khi soft delete (bug tiềm tàng)
    public void deleteVehicleForUser(Integer userId, Integer vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        checkVehicleBelongsToUser(vehicle, userId);

        // 1. NGĂN CHẶN XÓA nếu xe đang có hoạt động ACTIVE/PENDING
        boolean hasActiveSession = parkingSessionRepository.existsByVehicle_VehicleIdAndStatusIn(
                vehicleId, java.util.Arrays.asList("PARKING", "UNPAID"));
        if (hasActiveSession) {
            throw new IllegalArgumentException("Cannot delete vehicle that is currently parking or has unpaid fees.");
        }

        boolean hasActiveReservation = reservationRepository.existsByVehicle_VehicleIdAndStatusIn(
                vehicleId, java.util.Arrays.asList("PENDING", "CONFIRMED"));
        if (hasActiveReservation) {
            throw new IllegalArgumentException("Cannot delete vehicle with an active reservation.");
        }

        boolean hasActiveSubscription = subscriptionRepository.existsByVehicle_VehicleIdAndStatusIn(
                vehicleId, java.util.Arrays.asList("ACTIVE", "PENDING"));
        if (hasActiveSubscription) {
            throw new IllegalArgumentException("Cannot delete vehicle with an active or pending monthly subscription.");
        }

        // 2. Kiểm tra xe có dữ liệu liên quan trong các bảng khác không để Soft Delete
        boolean hasParkingSessions = parkingSessionRepository.existsByVehicle_VehicleId(vehicleId);
        boolean hasReservations = reservationRepository.existsByVehicle_VehicleId(vehicleId);
        boolean hasSubscriptions = subscriptionRepository.existsByVehicle_VehicleId(vehicleId);

        if (hasParkingSessions || hasReservations || hasSubscriptions) {
            // SOFT DELETE: xe đã có lịch sử → chỉ ẩn đi
            vehicle.setIsActive(false);
            vehicleRepository.save(vehicle);
        } else {
            // HARD DELETE: xe mới đăng ký, chưa dùng → xóa hẳn
            vehicleRepository.delete(vehicle);
        }
    }

    // ========== UPLOAD ẢNH CHO XE CỦA 1 USER CỤ THỂ ==========
    // Kiểm tra xe thuộc về user → delegate cho uploadVehicleImage()
    public VehicleResponse uploadVehicleImageForUser(Integer userId, Integer vehicleId, MultipartFile file, String type) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        checkVehicleBelongsToUser(vehicle, userId);

        return uploadVehicleImage(vehicleId, file, type);
    }

    // ========== HÀM TIỆN ÍCH: Lấy userId từ JWT token đang đăng nhập ==========
    // Lấy email từ SecurityContext → tìm User entity → trả về userId
    // Được gọi bởi các hàm getMyVehicles, createMyVehicle, updateMyVehicle, deleteMyVehicle
    private Integer getCurrentAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new AccessDeniedException("Access denied: Not authenticated");
        }
        String email = authentication.getName();  // Email từ JWT token
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("User not found"))
                .getUserId();
    }

    // ========== CÁC HÀM SELF-SERVICE (Driver tự quản lý xe) ==========
    // Tất cả đều: lấy userId từ JWT → delegate cho xxxForUser()

    // Driver lấy danh sách xe của chính mình
    public List<VehicleResponse> getMyVehicles() {
        return getVehiclesByUser(getCurrentAuthenticatedUserId());
    }

    // Driver đăng ký xe mới cho chính mình
    public VehicleResponse createMyVehicle(VehicleRequest request) {
        return createVehicleForUser(getCurrentAuthenticatedUserId(), request);
    }

    // Driver cập nhật xe của chính mình
    public VehicleResponse updateMyVehicle(Integer vehicleId, VehicleRequest request) {
        return updateVehicleForUser(getCurrentAuthenticatedUserId(), vehicleId, request);
    }

    // Driver xóa xe của chính mình
    public void deleteMyVehicle(Integer vehicleId) {
        deleteVehicleForUser(getCurrentAuthenticatedUserId(), vehicleId);
    }

    // Driver upload ảnh giấy tờ cho xe của chính mình
    public VehicleResponse uploadMyVehicleImage(Integer vehicleId, MultipartFile file, String type) {
        return uploadVehicleImageForUser(getCurrentAuthenticatedUserId(), vehicleId, file, type);
    }

    // ========== HÀM TIỆN ÍCH: Kiểm tra xe có thuộc về user không ==========
    // Dùng trong các hàm xxxForUser() để đảm bảo Driver chỉ thao tác trên xe của mình
    private void checkVehicleBelongsToUser(Vehicle vehicle, Integer userId) {
        securityUtils.checkDataOwnership(userId);
        if (vehicle.getUser() == null || !vehicle.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("This vehicle does not belong to this user");
        }
    }

    // ========== VALIDATE UNIQUE KHI TẠO MỚI ==========
    // Kiểm tra biển số, số máy, số khung chưa tồn tại trong DB
    // Nếu vi phạm → throw CustomValidationException với map lỗi theo từng field
    // → GlobalExceptionHandler bắt và trả về HTTP 400 + JSON lỗi chi tiết
    private void validateUniqueOnCreate(VehicleRequest request) {
        Map<String, String> errors = new HashMap<>();
        
        // Kiểm tra biển số xe đã tồn tại chưa
        if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            errors.put("licensePlate", "Biển số xe đã tồn tại");
        }

        // Kiểm tra số máy (chỉ khi có giá trị, không phải blank)
        if (request.getEngineNumber() != null
                && !request.getEngineNumber().isBlank()
                && vehicleRepository.existsByEngineNumber(request.getEngineNumber())) {
            errors.put("engineNumber", "Số máy đã tồn tại");
        }

        // Kiểm tra số khung (chỉ khi có giá trị)
        if (request.getChassisNumber() != null
                && !request.getChassisNumber().isBlank()
                && vehicleRepository.existsByChassisNumber(request.getChassisNumber())) {
            errors.put("chassisNumber", "Số khung đã tồn tại");
        }
        
        // Nếu có lỗi → throw exception chứa map lỗi
        if (!errors.isEmpty()) {
            throw new CustomValidationException(errors);
        }
    }

    // ========== VALIDATE UNIQUE KHI CẬP NHẬT ==========
    // Tương tự validateUniqueOnCreate nhưng BỎ QUA chính xe đang update
    // (dùng xxxAndVehicleIdNot() để exclude chính nó khỏi kiểm tra trùng)
    private void validateUniqueOnUpdate(Integer id, VehicleRequest request) {
        Map<String, String> errors = new HashMap<>();

        if (vehicleRepository.existsByLicensePlateAndVehicleIdNot(request.getLicensePlate(), id)) {
            errors.put("licensePlate", "Biển số xe đã tồn tại");
        }

        if (request.getEngineNumber() != null
                && !request.getEngineNumber().isBlank()
                && vehicleRepository.existsByEngineNumberAndVehicleIdNot(request.getEngineNumber(), id)) {
            errors.put("engineNumber", "Số máy đã tồn tại");
        }

        if (request.getChassisNumber() != null
                && !request.getChassisNumber().isBlank()
                && vehicleRepository.existsByChassisNumberAndVehicleIdNot(request.getChassisNumber(), id)) {
            errors.put("chassisNumber", "Số khung đã tồn tại");
        }

        if (!errors.isEmpty()) {
            throw new CustomValidationException(errors);
        }
    }

    // ========== DUYỆT / TỪ CHỐI ĐƠN ĐĂNG KÝ XE (cho Manager/Admin) ==========
    // isApproved = true → status = "APPROVED" (xe được phép sử dụng hệ thống)
    // isApproved = false → status = "REJECTED" (đơn bị từ chối)
    // Lưu ý: Không có cơ chế chuyển từ REJECTED → PENDING (resubmit)
    public VehicleResponse approveVehicle(Integer id, boolean isApproved) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        vehicle.setStatus(isApproved ? "APPROVED" : "REJECTED");
        return VehicleResponse.fromEntity(vehicleRepository.save(vehicle));
    }

}
