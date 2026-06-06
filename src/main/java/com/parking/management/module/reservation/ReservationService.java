package com.parking.management.module.reservation;

import com.parking.management.common.ResourceNotFoundException;
import com.parking.management.module.slot.ParkingSlot;
import com.parking.management.module.slot.ParkingSlotRepository;
import com.parking.management.module.slot.SlotStatus;
import com.parking.management.module.user.User;
import com.parking.management.module.user.UserRepository;
import com.parking.management.module.vehicle.Vehicle;
import com.parking.management.module.vehicle.VehicleRepository;
import com.parking.management.module.vehicle.VehicleType;
import com.parking.management.module.vehicle.VehicleTypeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final ParkingSlotRepository parkingSlotRepository;

    @Transactional
    public ReservationResponse holdSlot(ReservationRequest request){
        //Tim xem user id co ton tai hay ko
        User user = userRepository.findById(request.getUserId()).orElseThrow(()-> new ResourceNotFoundException("User id is not found"));
        //Tim xem vehicle id co ton tai hay ko
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId()).orElseThrow(()-> new ResourceNotFoundException("Vehicle id is not found"));
        //Tim xem vehicle type id co ton tai hay ko
        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId()).orElseThrow(()-> new ResourceNotFoundException("Vehicle type id is not found"));
        //Tim slot available dau tien
        ParkingSlot slot = parkingSlotRepository
                .findFirstByVehicleType_VehicleTypeIdAndStatusAndIsActiveTrue(
                        request.getVehicleTypeId(),
                        SlotStatus.AVAILABLE.name()
                )
                .orElseThrow(() -> new ResourceNotFoundException("No available slot found for vehicle type id: " + request.getVehicleTypeId()));

        //Update slot status
        //Hold slot AVAILABLE --> RESERVED
        slot.setStatus(SlotStatus.RESERVED.name());
        parkingSlotRepository.save(slot);

        Reservation reservation = new Reservation();

        reservation.setUser(user);
        reservation.setVehicle(vehicle);
        reservation.setVehicleType(vehicleType);
        reservation.setSlot(slot);
        reservation.setReservationStart(request.getReservationStart());
        reservation.setReservationEnd(request.getReservationEnd());
        reservation.setStatus("RESERVED");
        reservation.setGuestName(request.getGuestName());
        reservation.setCreatedAt(LocalDateTime.now());

        //Set to database
        Reservation savedReservation = reservationRepository.save(reservation);

        return mapEntityToResponse(savedReservation);
    }
//========================================================================================================================
    //Supportive function: map entity to response

    // Map request sang entity
    private void mapRequestToEntity(ReservationRequest request, Reservation reservation) {
        validateTime(request);
        User user = getUserById(request.getUserId());
        Vehicle vehicle = getVehicleById(request.getVehicleId());
        VehicleType vehicleType = getVehicleTypeById(request.getVehicleTypeId());

        reservation.setUser(user);
        reservation.setVehicle(vehicle);
        reservation.setVehicleType(vehicleType);
        reservation.setReservationStart(request.getReservationStart());
        reservation.setReservationEnd(request.getReservationEnd());
        reservation.setGuestName(request.getGuestName());

        if (reservation.getCreatedAt() == null) {
            reservation.setCreatedAt(LocalDateTime.now());
        }

        if (reservation.getStatus() == null) {
            reservation.setStatus("CREATED");
        }
    }
    // Map entity sang response để trả ra Swagger/Frontend
    private ReservationResponse mapEntityToResponse(Reservation reservationEntity){
        ReservationResponse response = new ReservationResponse();

        response.setReservationId(reservationEntity.getReservationId());
        response.setUserId(reservationEntity.getUser().getUserId());
        response.setVehicleId(reservationEntity.getVehicle().getVehicleId());
        response.setVehicleTypeId(reservationEntity.getVehicleType().getVehicleTypeId());
        response.setSlotId(reservationEntity.getSlot().getSlotId());
        response.setReservationStart(reservationEntity.getReservationStart());
        response.setReservationEnd(reservationEntity.getReservationEnd());
        response.setStatus(reservationEntity.getStatus());
        response.setGuestName(reservationEntity.getGuestName());
        response.setCreatedAt(reservationEntity.getCreatedAt());
        return response;
    }


    private User getUserById(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + userId
                ));
    }

    private Vehicle getVehicleById(Integer vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vehicle not found with id: " + vehicleId
                ));
    }

    private VehicleType getVehicleTypeById(Integer vehicleTypeId) {
        return vehicleTypeRepository.findById(vehicleTypeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vehicle type not found with id: " + vehicleTypeId
                ));
    }

    private void validateTime(ReservationRequest request) {
        if (request.getReservationStart().isAfter(request.getReservationEnd())
                || request.getReservationStart().equals(request.getReservationEnd())) {
            throw new IllegalArgumentException("Reservation start time must be before reservation end time");
        }
    }
}
