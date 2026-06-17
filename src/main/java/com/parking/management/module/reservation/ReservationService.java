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
import com.parking.management.security.SecurityUtils;
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
    private final SecurityUtils securityUtils;


    public ReservationResponse create(ReservationRequest request) {
        validateTime(request);
        securityUtils.checkDataOwnership(request.getUserId());

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));

        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle type not found with id: " + request.getVehicleTypeId()));

        if (!"Ô tô".equalsIgnoreCase(vehicleType.getTypeName()) && !"Car".equalsIgnoreCase(vehicleType.getTypeName())) {
            throw new IllegalArgumentException("Chỉ cho phép xe ô tô sử dụng tính năng đặt chỗ trước");
        }

        ParkingSlot slot;
        if (request.getSlotId() == null) {
            // Đặt nhanh: Tìm chỗ trống đầu tiên
            slot = parkingSlotRepository
                    .findFirstByVehicleType_VehicleTypeIdAndStatusAndIsActiveTrue(
                            request.getVehicleTypeId(),
                            SlotStatus.AVAILABLE
                    )
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chỗ trống phù hợp cho loại xe này."));
        } else {
            // Chọn thủ công
            slot = parkingSlotRepository.findById(request.getSlotId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with id: " + request.getSlotId()));
            
            if (slot.getStatus() != SlotStatus.AVAILABLE) {
                throw new IllegalArgumentException("Ô đỗ này hiện không trống, vui lòng chọn ô khác.");
            }
        }

        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setVehicle(vehicle);
        reservation.setVehicleType(vehicleType);
        reservation.setSlot(slot);
        reservation.setReservationStart(request.getReservationStart());
        reservation.setReservationEnd(request.getReservationEnd());
        reservation.setGuestName(request.getGuestName());
        reservation.setStatus("PENDING");
        reservation.setCreatedAt(LocalDateTime.now());

        // CHÚ Ý: Không cập nhật trạng thái của Slot thành RESERVED ở đây.
        // Việc khóa Slot sẽ diễn ra sau khi thanh toán thành công.

        return ReservationResponse.fromEntity(reservationRepository.save(reservation));
    }

    public List<ReservationResponse> getAll() {
        Integer driverId = securityUtils.getDriverUserId();
        
        List<Reservation> reservations;
        if (driverId == null) {
            reservations = reservationRepository.findAll();
        } else {
            reservations = reservationRepository.findByUser_UserId(driverId);
        }
        
        return reservations.stream()
                .map(ReservationResponse::fromEntity)
                .toList();
    }

    public ReservationResponse getById(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));

        if (reservation.getUser() != null) {
            securityUtils.checkDataOwnership(reservation.getUser().getUserId());
        }

        return ReservationResponse.fromEntity(reservation);
    }

    public ReservationResponse update(Integer id, ReservationRequest request) {
        validateTime(request);

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));

        if (reservation.getUser() != null) {
            securityUtils.checkDataOwnership(reservation.getUser().getUserId());
        }
        securityUtils.checkDataOwnership(request.getUserId());

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));

        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle type not found with id: " + request.getVehicleTypeId()));

        ParkingSlot slot = parkingSlotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with id: " + request.getSlotId()));

        reservation.setUser(user);
        reservation.setVehicle(vehicle);
        reservation.setVehicleType(vehicleType);
        reservation.setSlot(slot);
        reservation.setReservationStart(request.getReservationStart());
        reservation.setReservationEnd(request.getReservationEnd());
        reservation.setStatus("PENDING");
        reservation.setGuestName(request.getGuestName());
        reservation.setCreatedAt(LocalDateTime.now());

        return ReservationResponse.fromEntity(reservationRepository.save(reservation));
    }

    public void cancel(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));

        if (reservation.getUser() != null) {
            securityUtils.checkDataOwnership(reservation.getUser().getUserId());
        }

        reservation.setStatus("CANCELLED");
        reservationRepository.save(reservation);
    }

    private void validateTime(ReservationRequest request) {
        if (!request.getReservationEnd().isAfter(request.getReservationStart())) {
            throw new IllegalArgumentException("Reservation end must be after reservation start");
        }
    }

    public ReservationResponse updateStatus(Integer id, String status) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
        reservation.setStatus(status);
        if ("CONFIRMED".equals(status)) {
            ParkingSlot slot = reservation.getSlot();
            if (slot.getStatus() == SlotStatus.AVAILABLE) {
                slot.setStatus(SlotStatus.RESERVED);
                parkingSlotRepository.save(slot);
            }
        }
        if ("CANCELLED".equals(status) || "COMPLETED".equals(status)) {
            ParkingSlot slot = reservation.getSlot();
            if (slot.getStatus() == SlotStatus.RESERVED) {
                slot.setStatus(SlotStatus.AVAILABLE);
                parkingSlotRepository.save(slot);
            }
        }
        return ReservationResponse.fromEntity(reservationRepository.save(reservation));
    }
}
