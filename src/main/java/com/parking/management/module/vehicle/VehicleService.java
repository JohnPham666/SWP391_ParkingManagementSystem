package com.parking.management.module.vehicle;

import com.parking.management.common.ResourceNotFoundException;
import com.parking.management.module.user.User;
import com.parking.management.module.user.UserRepository;
import com.parking.management.module.reservation.ReservationRepository;
import com.parking.management.module.session.ParkingSessionRepository;
import com.parking.management.module.subscription.SubscriptionRepository;
import com.parking.management.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public VehicleResponse create(VehicleRequest request) {
        validateUniqueOnCreate(request);

        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle type not found with id: " + request.getVehicleTypeId()));

        User user = null;
        if (request.getUserId() != null) {
            securityUtils.checkDataOwnership(request.getUserId());
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));
        }

        Vehicle vehicle = new Vehicle();
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setVehicleType(vehicleType);
        vehicle.setOwnerName(request.getOwnerName());
        vehicle.setOwnerPhone(request.getOwnerPhone());
        vehicle.setUser(user);
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
                .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                .map(VehicleResponse::fromEntity)
                .toList();
    }

    public VehicleResponse getById(Integer id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        if (!Boolean.TRUE.equals(vehicle.getIsActive())) {
            throw new ResourceNotFoundException("Vehicle not found with id: " + id);
        }

        if (vehicle.getUser() != null) {
            securityUtils.checkDataOwnership(vehicle.getUser().getUserId());
        }

        return VehicleResponse.fromEntity(vehicle);
    }

    public VehicleResponse update(Integer id, VehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        if (!Boolean.TRUE.equals(vehicle.getIsActive())) {
            throw new ResourceNotFoundException("Vehicle not found with id: " + id);
        }

        if (vehicle.getUser() != null) {
            securityUtils.checkDataOwnership(vehicle.getUser().getUserId());
        }
        
        if (request.getUserId() != null) {
            securityUtils.checkDataOwnership(request.getUserId());
        }

        validateUniqueOnUpdate(id, request);

        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle type not found with id: " + request.getVehicleTypeId()));

        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));
        }

        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setVehicleType(vehicleType);
        vehicle.setOwnerName(request.getOwnerName());
        vehicle.setOwnerPhone(request.getOwnerPhone());
        vehicle.setUser(user);
        vehicle.setBrand(request.getBrand());
        vehicle.setVehicleColor(request.getVehicleColor());
        vehicle.setEngineNumber(request.getEngineNumber());
        vehicle.setChassisNumber(request.getChassisNumber());
        vehicle.setManufactureYear(request.getManufactureYear());
        vehicle.setVehicleImage(request.getVehicleImage());

        return VehicleResponse.fromEntity(vehicleRepository.save(vehicle));
    }

    public void delete(Integer id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

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

    private void validateUniqueOnCreate(VehicleRequest request) {
        if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new IllegalArgumentException("License plate already exists");
        }

        if (request.getEngineNumber() != null && !request.getEngineNumber().isBlank()
                && vehicleRepository.existsByEngineNumber(request.getEngineNumber())) {
            throw new IllegalArgumentException("Engine number already exists");
        }

        if (request.getChassisNumber() != null && !request.getChassisNumber().isBlank()
                && vehicleRepository.existsByChassisNumber(request.getChassisNumber())) {
            throw new IllegalArgumentException("Chassis number already exists");
        }
    }

    private void validateUniqueOnUpdate(Integer id, VehicleRequest request) {
        if (vehicleRepository.existsByLicensePlateAndVehicleIdNot(request.getLicensePlate(), id)) {
            throw new IllegalArgumentException("License plate already exists");
        }

        if (request.getEngineNumber() != null && !request.getEngineNumber().isBlank()
                && vehicleRepository.existsByEngineNumberAndVehicleIdNot(request.getEngineNumber(), id)) {
            throw new IllegalArgumentException("Engine number already exists");
        }

        if (request.getChassisNumber() != null && !request.getChassisNumber().isBlank()
                && vehicleRepository.existsByChassisNumberAndVehicleIdNot(request.getChassisNumber(), id)) {
            throw new IllegalArgumentException("Chassis number already exists");
        }
    }
}