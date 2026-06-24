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
import java.time.LocalDate;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final UserRepository userRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final ReservationRepository reservationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SecurityUtils securityUtils;

    @Value("${file.upload-dir:uploads/vehicles}")
    private String uploadDir;

    public VehicleResponse create(VehicleRequest request) {
        validateUniqueOnCreate(request);

        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new RuntimeException("Vehicle type not found"));

        User user = null;
        if (request.getUserId() != null) {
            securityUtils.checkDataOwnership(request.getUserId());
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }

        Vehicle vehicle = new Vehicle();
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
        if (request.getRegistrationExpiry() != null && !request.getRegistrationExpiry().isBlank()) {
            vehicle.setRegistrationExpiry(LocalDate.parse(request.getRegistrationExpiry()));
        }
        vehicle.setVehicleImage(request.getVehicleImage());
        vehicle.setRegistrationPhoto(request.getRegistrationPhoto());

        return VehicleResponse.fromEntity(vehicleRepository.save(vehicle));
    }

    public List<VehicleResponse> getAll() {
        return vehicleRepository.findAll()
                .stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                .map(VehicleResponse::fromEntity)
                .toList();
    }

    public VehicleResponse getById(Integer id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (!Boolean.TRUE.equals(vehicle.getIsActive())) {
            throw new RuntimeException("Vehicle not found with id: " + id);
        }

        if (vehicle.getUser() != null) {
            securityUtils.checkDataOwnership(vehicle.getUser().getUserId());
        }

        return VehicleResponse.fromEntity(vehicle);
    }

    public VehicleResponse update(Integer id, VehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (!Boolean.TRUE.equals(vehicle.getIsActive())) {
            throw new RuntimeException("Vehicle not found with id: " + id);
        }

        if (vehicle.getUser() != null) {
            securityUtils.checkDataOwnership(vehicle.getUser().getUserId());
        }
        
        if (request.getUserId() != null) {
            securityUtils.checkDataOwnership(request.getUserId());
        }

        validateUniqueOnUpdate(id, request);

        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new RuntimeException("Vehicle type not found"));

        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }

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
        if (request.getRegistrationExpiry() != null && !request.getRegistrationExpiry().isBlank()) {
            vehicle.setRegistrationExpiry(LocalDate.parse(request.getRegistrationExpiry()));
        }

        if (request.getVehicleImage() != null) {
            vehicle.setVehicleImage(request.getVehicleImage());
        }
        if (request.getRegistrationPhoto() != null) {
            vehicle.setRegistrationPhoto(request.getRegistrationPhoto());
        }

        return VehicleResponse.fromEntity(vehicleRepository.save(vehicle));
    }

    public void delete(Integer id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (vehicle.getUser() != null) {
            securityUtils.checkDataOwnership(vehicle.getUser().getUserId());
        }

        boolean hasParkingSessions = parkingSessionRepository.existsByVehicle_VehicleId(id);
        boolean hasReservations = reservationRepository.existsByVehicle_VehicleId(id);
        boolean hasSubscriptions = subscriptionRepository.existsByVehicle_VehicleId(id);

        if (hasParkingSessions || hasReservations || hasSubscriptions) {
            vehicle.setIsActive(false);
            vehicleRepository.save(vehicle);
        } else {
            vehicleRepository.delete(vehicle);
        }
    }

    public VehicleResponse uploadVehicleImage(Integer vehicleId, MultipartFile file, String type) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";

        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String prefix = "registration".equalsIgnoreCase(type) ? "reg_" : "vehicle_";
        String fileName = prefix + vehicleId + "_" + UUID.randomUUID() + extension;

        try {
            Path uploadPath = Paths.get(uploadDir);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/uploads/vehicles/" + fileName;
            
            if ("registration".equalsIgnoreCase(type)) {
                vehicle.setRegistrationPhoto(imageUrl);
            } else if (!"portrait".equalsIgnoreCase(type)) {
                vehicle.setVehicleImage(imageUrl);
            }

            return VehicleResponse.fromEntity(vehicleRepository.save(vehicle));
        } catch (Exception e) {
            throw new RuntimeException("Could not upload image: " + e.getMessage());
        }
    }

    public List<VehicleResponse> getVehiclesByUser(Integer userId) {
        securityUtils.checkDataOwnership(userId);
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }

        return vehicleRepository.findByUserUserIdAndIsActiveTrue(userId)
                .stream()
                .map(VehicleResponse::fromEntity)
                .toList();
    }

    public VehicleResponse createVehicleForUser(Integer userId, VehicleRequest request) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }

        request.setUserId(userId);
        return create(request);
    }

    public VehicleResponse updateVehicleForUser(Integer userId, Integer vehicleId, VehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        checkVehicleBelongsToUser(vehicle, userId);

        request.setUserId(userId);
        return update(vehicleId, request);
    }

    public void deleteVehicleForUser(Integer userId, Integer vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        checkVehicleBelongsToUser(vehicle, userId);

        boolean hasParkingSessions = parkingSessionRepository.existsByVehicle_VehicleId(vehicleId);
        boolean hasReservations = reservationRepository.existsByVehicle_VehicleId(vehicleId);
        boolean hasSubscriptions = subscriptionRepository.existsByVehicle_VehicleId(vehicleId);

        if (hasParkingSessions || hasReservations || hasSubscriptions) {
            vehicle.setIsActive(false);
            vehicleRepository.save(vehicle);
        } else {
            vehicleRepository.delete(vehicle);
        }
    }

    public VehicleResponse uploadVehicleImageForUser(Integer userId, Integer vehicleId, MultipartFile file, String type) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        checkVehicleBelongsToUser(vehicle, userId);

        return uploadVehicleImage(vehicleId, file, type);
    }

    private Integer getCurrentAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new AccessDeniedException("Access denied: Not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("User not found"))
                .getUserId();
    }

    public List<VehicleResponse> getMyVehicles() {
        return getVehiclesByUser(getCurrentAuthenticatedUserId());
    }

    public VehicleResponse createMyVehicle(VehicleRequest request) {
        return createVehicleForUser(getCurrentAuthenticatedUserId(), request);
    }

    public VehicleResponse updateMyVehicle(Integer vehicleId, VehicleRequest request) {
        return updateVehicleForUser(getCurrentAuthenticatedUserId(), vehicleId, request);
    }

    public void deleteMyVehicle(Integer vehicleId) {
        deleteVehicleForUser(getCurrentAuthenticatedUserId(), vehicleId);
    }

    public VehicleResponse uploadMyVehicleImage(Integer vehicleId, MultipartFile file, String type) {
        return uploadVehicleImageForUser(getCurrentAuthenticatedUserId(), vehicleId, file, type);
    }

    private void checkVehicleBelongsToUser(Vehicle vehicle, Integer userId) {
        securityUtils.checkDataOwnership(userId);
        if (vehicle.getUser() == null || !vehicle.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("This vehicle does not belong to this user");
        }
    }

    private void validateUniqueOnCreate(VehicleRequest request) {
        if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new IllegalArgumentException("License plate already exists");
        }

        if (request.getEngineNumber() != null
                && !request.getEngineNumber().isBlank()
                && vehicleRepository.existsByEngineNumber(request.getEngineNumber())) {
            throw new IllegalArgumentException("Engine number already exists");
        }

        if (request.getChassisNumber() != null
                && !request.getChassisNumber().isBlank()
                && vehicleRepository.existsByChassisNumber(request.getChassisNumber())) {
            throw new IllegalArgumentException("Chassis number already exists");
        }
    }

    private void validateUniqueOnUpdate(Integer id, VehicleRequest request) {
        if (vehicleRepository.existsByLicensePlateAndVehicleIdNot(request.getLicensePlate(), id)) {
            throw new IllegalArgumentException("License plate already exists");
        }

        if (request.getEngineNumber() != null
                && !request.getEngineNumber().isBlank()
                && vehicleRepository.existsByEngineNumberAndVehicleIdNot(request.getEngineNumber(), id)) {
            throw new IllegalArgumentException("Engine number already exists");
        }

        if (request.getChassisNumber() != null
                && !request.getChassisNumber().isBlank()
                && vehicleRepository.existsByChassisNumberAndVehicleIdNot(request.getChassisNumber(), id)) {
            throw new IllegalArgumentException("Chassis number already exists");
        }
    }

}