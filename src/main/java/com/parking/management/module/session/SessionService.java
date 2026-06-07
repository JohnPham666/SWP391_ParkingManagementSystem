package com.parking.management.module.session;

import com.parking.management.common.ResourceNotFoundException;
import com.parking.management.module.reservation.Reservation;
import com.parking.management.module.reservation.ReservationRepository;
import com.parking.management.module.slot.ParkingSlot;
import com.parking.management.module.slot.ParkingSlotRepository;
import com.parking.management.module.slot.SlotStatus;
import com.parking.management.module.vehicle.Vehicle;
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
         * Nếu reservation đã CONFIRMED thì không cho check-in lại.
         * Trường hợp này thường xảy ra sau khi xe đã từng check-in.
         */
        if ("CONFIRMED".equals(reservation.getStatus())) {
            throw new IllegalArgumentException("This reservation has already been checked in");
        }

        if (!"RESERVED".equals(reservation.getStatus()) && !"PENDING".equals(reservation.getStatus())) {
            throw new IllegalArgumentException("Reservation is not valid for check-in, current status: " + reservation.getStatus());
        }

        if (!SlotStatus.RESERVED.equals(slot.getStatus())) {
            throw new IllegalArgumentException("Slot is not reserved, current status: " + slot.getStatus());
        }

        // Slot RESERVED -> OCCUPIED
        slot.setStatus(SlotStatus.OCCUPIED);
        parkingSlotRepository.save(slot);

        // Reservation RESERVED/PENDING -> CONFIRMED after check-in
        reservation.setStatus("CONFIRMED");
        reservationRepository.save(reservation);

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
         * Sau này gọi PricingService để tính tiền thật.
         * Ví dụ:
         * BigDecimal finalFee = pricingService.calculateFinalFee(session);
         *
         * Tạm thời set 0 để hoàn thành luồng check-out.
         */
        BigDecimal finalFee = BigDecimal.ZERO;
        session.setFinalFee(finalFee);

        // Slot OCCUPIED -> AVAILABLE
        slot.setStatus(SlotStatus.AVAILABLE);
        parkingSlotRepository.save(slot);

        ParkingSession updatedSession = parkingSessionRepository.save(session);

        return mapEntityToResponse(updatedSession);
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
