package com.parking.management.module.session;

import com.parking.management.common.ResourceNotFoundException;
import com.parking.management.module.pricing.FeeCalculationResponse;
import com.parking.management.module.pricing.PricingService;
import com.parking.management.module.reservation.Reservation;
import com.parking.management.module.reservation.ReservationRepository;
import com.parking.management.module.slot.ParkingSlot;
import com.parking.management.module.slot.ParkingSlotRepository;
import com.parking.management.module.slot.SlotStatus;
import com.parking.management.module.vehicle.Vehicle;
import com.parking.management.module.vehicle.VehicleRepository;
import com.parking.management.module.vehicle.VehicleType;
import com.parking.management.module.vehicle.VehicleTypeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SessionService {
    private final ParkingSessionRepository parkingSessionRepository;
    private final ReservationRepository reservationRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final PricingService pricingService;
    private final VehicleRepository vehicleRepository;
    private final VehicleTypeRepository vehicleTypeRepository;

    /*
     * CHECK-IN
     *
     * Luồng:
     * 1. Nhận reservationId
     * 2. Tìm Reservation
     * 3. Lấy Vehicle và Slot từ Reservation
     * 4. Kiểm tra slot đang RESERVED
     * 5. Đổi slot RESERVED -> OCCUPIED
     * 6. Tạo ParkingSession mới với status = PARKING
     */
    @Transactional
    public SessionResponse checkIn(CheckInRequest request) {
        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with id: " + request.getReservationId()
                ));

        Vehicle vehicle = reservation.getVehicle();
        ParkingSlot slot = reservation.getSlot();

        if (vehicle == null) {
            throw new IllegalArgumentException("Reservation does not have vehicle information");
        }

        if (slot == null) {
            throw new IllegalArgumentException("Reservation does not have slot information");
        }

        /*
         * Phải check vehicle active session TRƯỚC khi check slot.
         * Vì nếu check-in lần 2, slot chắc chắn đã OCCUPIED,
         * nhưng lỗi đúng nghiệp vụ phải là xe đã check-in rồi.
         */
        parkingSessionRepository
                .findFirstByVehicle_VehicleIdAndStatus(vehicle.getVehicleId(), SessionStatus.PARKING.name())
                .ifPresent(existingSession -> {
                    throw new IllegalArgumentException("This vehicle already has an active parking session");
                });

        /*
         * Nếu reservation chưa thanh toán (PENDING) thì báo lỗi.
         * Phải CONFIRMED mới được vào.
         */
        if (!"CONFIRMED".equals(reservation.getStatus())) {
            throw new IllegalArgumentException("Reservation is not CONFIRMED (maybe not paid yet). Current status: " + reservation.getStatus());
        }

        if (!SlotStatus.RESERVED.equals(slot.getStatus())) {
            throw new IllegalArgumentException("Slot is not reserved, current status: " + slot.getStatus());
        }

        // Slot RESERVED -> OCCUPIED
        slot.setStatus(SlotStatus.OCCUPIED);
        parkingSlotRepository.save(slot);

        // Reservation: Tạm giữ nguyên CONFIRMED, sẽ đổi thành COMPLETED khi check-out
        // reservation.setStatus("CONFIRMED");
        // reservationRepository.save(reservation);

        ParkingSession session = new ParkingSession();
        session.setVehicle(vehicle);
        session.setSlot(slot);
        session.setEntryTime(LocalDateTime.now());
        session.setEntryGate(request.getEntryGate());
        session.setStatus(SessionStatus.PARKING.name());
        session.setEstimatedFee(BigDecimal.ZERO);
        session.setFinalFee(null);

        ParkingSession savedSession = parkingSessionRepository.save(session);

        return mapEntityToResponse(savedSession);
    }

    /*
     * WALK-IN CHECK-IN (Khách vãng lai / Không đặt trước)
     */
    @Transactional
    public SessionResponse checkInWalkIn(WalkInRequest request) {
        // 1. Tìm hoặc tạo Vehicle ẩn danh
        Vehicle vehicle = vehicleRepository.findByLicensePlate(request.getLicensePlate())
                .orElseGet(() -> {
                    VehicleType type = vehicleTypeRepository.findById(request.getVehicleTypeId())
                            .orElseThrow(() -> new ResourceNotFoundException("Vehicle type not found with id: " + request.getVehicleTypeId()));
                    Vehicle newVehicle = new Vehicle();
                    newVehicle.setLicensePlate(request.getLicensePlate());
                    newVehicle.setVehicleType(type);
                    newVehicle.setOwnerName(request.getGuestName());
                    return vehicleRepository.save(newVehicle);
                });

        // 2. Kiểm tra xe đã có session active chưa
        parkingSessionRepository
                .findFirstByVehicle_VehicleIdAndStatus(vehicle.getVehicleId(), SessionStatus.PARKING.name())
                .ifPresent(existingSession -> {
                    throw new IllegalArgumentException("This vehicle already has an active parking session");
                });

        // 3. Tìm Slot trống đầu tiên phù hợp với loại xe
        ParkingSlot slot = parkingSlotRepository
                .findFirstByVehicleType_VehicleTypeIdAndStatusAndIsActiveTrue(
                        request.getVehicleTypeId(),
                        SlotStatus.AVAILABLE
                )
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chỗ trống phù hợp cho loại xe này."));

        // 4. Cập nhật trạng thái Slot
        slot.setStatus(SlotStatus.OCCUPIED);
        parkingSlotRepository.save(slot);

        // 5. Tạo ParkingSession
        ParkingSession session = new ParkingSession();
        session.setVehicle(vehicle);
        session.setSlot(slot);
        session.setEntryTime(LocalDateTime.now());
        session.setEntryGate(request.getEntryGate());
        session.setStatus(SessionStatus.PARKING.name());
        session.setEstimatedFee(BigDecimal.ZERO);

        ParkingSession savedSession = parkingSessionRepository.save(session);

        return mapEntityToResponse(savedSession);
    }
    /*
     * CHECK-OUT
     *
     * Luồng:
     * 1. Nhận sessionId
     * 2. Tìm ParkingSession
     * 3. Kiểm tra session đang PARKING
     * 4. Set ExitTime
     * 5. Tính FinalFee
     * 6. Đổi session PARKING -> COMPLETED
     * 7. Đổi slot OCCUPIED -> AVAILABLE
     */
    @Transactional
    public SessionResponse checkOut(Integer sessionId, CheckOutRequest request) {
        ParkingSession session = parkingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parking session not found with id: " + sessionId
                ));

        if (!SessionStatus.PARKING.name().equals(session.getStatus())) {
            throw new IllegalArgumentException("Session is not active, current status: " + session.getStatus());
        }

        ParkingSlot slot = session.getSlot();

        if (slot == null) {
            throw new IllegalArgumentException("Session does not have slot information");
        }

        LocalDateTime exitTime = LocalDateTime.now();

        session.setExitTime(exitTime);
        session.setExitGate(request.getExitGate());
        session.setStatus(SessionStatus.COMPLETED.name());

        /*
         * Gọi PricingService để tính phí gửi xe thật.
         */
        Long vehicleTypeId = Long.valueOf(session.getVehicle().getVehicleType().getVehicleTypeId());
        FeeCalculationResponse feeResponse = pricingService.calculateFee(
                vehicleTypeId,
                session.getEntryTime(),
                exitTime
        );
        session.setFinalFee(feeResponse.getFinalFee());

        // Cập nhật Reservation liên quan thành COMPLETED
        reservationRepository.findAll().stream()
                .filter(r -> r.getVehicle().getVehicleId().equals(session.getVehicle().getVehicleId())
                          && r.getSlot().getSlotId().equals(slot.getSlotId())
                          && "CONFIRMED".equals(r.getStatus()))
                .findFirst()
                .ifPresent(r -> {
                    r.setStatus("COMPLETED");
                    reservationRepository.save(r);
                });

        // Slot OCCUPIED -> AVAILABLE
        slot.setStatus(SlotStatus.AVAILABLE);
        parkingSlotRepository.save(slot);

        ParkingSession updatedSession = parkingSessionRepository.save(session);

        return mapEntityToResponse(updatedSession);
    }


    public SessionResponse getById(Integer id) {
        ParkingSession session = parkingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parking session not found with id: " + id
                ));
        return mapEntityToResponse(session);
    }

    public List<SessionResponse> getAll() {
        return parkingSessionRepository.findAll()
                .stream()
                .map(this::mapEntityToResponse)
                .toList();
    }

    @Transactional
    public void delete(Integer id) {
        ParkingSession session = parkingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parking session not found with id: " + id
                ));
        parkingSessionRepository.delete(session);
    }

    // SUPPORTIVE FUNCTION: map entity to response
    private SessionResponse mapEntityToResponse(ParkingSession session) {
        SessionResponse response = new SessionResponse();

        response.setSessionId(session.getSessionId());

        if (session.getVehicle() != null) {
            response.setVehicleId(session.getVehicle().getVehicleId());
            response.setLicensePlate(session.getVehicle().getLicensePlate());
        }

        if (session.getSlot() != null) {
            response.setSlotId(session.getSlot().getSlotId());
            response.setSlotCode(session.getSlot().getSlotCode());
        }

        response.setEntryTime(session.getEntryTime());
        response.setExitTime(session.getExitTime());
        response.setEntryGate(session.getEntryGate());
        response.setExitGate(session.getExitGate());
        response.setStatus(session.getStatus());
        response.setEstimatedFee(session.getEstimatedFee());
        response.setFinalFee(session.getFinalFee());

        return response;
    }
}
