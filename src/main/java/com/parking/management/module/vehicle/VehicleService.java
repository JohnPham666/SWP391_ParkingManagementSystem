package com.parking.management.module.vehicle;

import com.parking.management.module.user.User;
import com.parking.management.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir:uploads/vehicles}")
    private String uploadDir;

    public VehicleResponse create(VehicleRequest request) {
        validateUniqueOnCreate(request);

        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new RuntimeException("Vehicle type not found"));

        User user = null;
        if (request.getUserId() != null) {
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
        vehicle.setVehicleImage(request.getVehicleImage());

        return VehicleResponse.fromEntity(vehicleRepository.save(vehicle));
    }

    public List<VehicleResponse> getAll() {
        return vehicleRepository.findAll()
                .stream()
                .map(VehicleResponse::fromEntity)
                .toList();
    }

    public VehicleResponse getById(Integer id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        return VehicleResponse.fromEntity(vehicle);
    }

    public VehicleResponse update(Integer id, VehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

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

        if (request.getVehicleImage() != null) {
            vehicle.setVehicleImage(request.getVehicleImage());
        }

        return VehicleResponse.fromEntity(vehicleRepository.save(vehicle));
    }

    public void delete(Integer id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        try {
            vehicleRepository.delete(vehicle);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException(
                    "Cannot delete this vehicle because it has related parking sessions or reservations."
            );
        }
    }

    public VehicleResponse uploadVehicleImage(Integer vehicleId, MultipartFile file) {
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

        String fileName = "vehicle_" + vehicleId + "_" + UUID.randomUUID() + extension;

        try {
            Path uploadPath = Paths.get(uploadDir);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/uploads/vehicles/" + fileName;
            vehicle.setVehicleImage(imageUrl);

            return VehicleResponse.fromEntity(vehicleRepository.save(vehicle));
        } catch (Exception e) {
            throw new RuntimeException("Could not upload vehicle image: " + e.getMessage());
        }
    }

    public List<VehicleResponse> getVehiclesByUser(Integer userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }

        return vehicleRepository.findByUserUserId(userId)
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

        try {
            vehicleRepository.delete(vehicle);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException(
                    "Cannot delete this vehicle because it has related parking sessions or reservations."
            );
        }
    }

    public VehicleResponse uploadVehicleImageForUser(Integer userId, Integer vehicleId, MultipartFile file) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        checkVehicleBelongsToUser(vehicle, userId);

        return uploadVehicleImage(vehicleId, file);
    }

    private void checkVehicleBelongsToUser(Vehicle vehicle, Integer userId) {
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