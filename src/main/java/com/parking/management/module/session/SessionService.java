package com.parking.management.module.session;

import com.parking.management.security.SecurityUtils;

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
import com.parking.management.module.subscription.MonthlySubscription;
import com.parking.management.module.subscription.SubscriptionRepository;
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
    private final ParkingCardRepository parkingCardRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SecurityUtils securityUtils;

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

        if (slot.getCurrentOccupancy() >= slot.getCapacity()) {
            throw new IllegalArgumentException("Rất tiếc, ô đỗ đã bị xe vãng lai lấn chiếm (vượt sức chứa)!");
        }

        // Increment occupancy
        slot.setCurrentOccupancy(slot.getCurrentOccupancy() + 1);
        if (slot.getCurrentOccupancy() >= slot.getCapacity()) {
            slot.setStatus(SlotStatus.OCCUPIED);
        } else {
            slot.setStatus(SlotStatus.AVAILABLE);
        }
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

    public List<SessionResponse> getMyActiveSessions() {
        Integer currentUserId = securityUtils.getDriverUserId();
        List<ParkingSession> sessions = parkingSessionRepository
                .findByVehicle_User_UserIdAndStatus(currentUserId, SessionStatus.PARKING.name());
        return sessions.stream().map(this::mapEntityToResponse).toList();
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

        // 3. Tìm Slot trống đầu tiên phù hợp với loại xe (kiểm tra cả capacity)
        ParkingSlot slot = parkingSlotRepository
                .findFirstAvailableSlot(
                        request.getVehicleTypeId()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chỗ trống phù hợp cho loại xe này."));

        // 4. Kiểm tra lại capacity trước khi tăng (phòng race condition)
        if (slot.getCurrentOccupancy() >= slot.getCapacity()) {
            throw new IllegalArgumentException("Ô đỗ đã đầy, vui lòng thử lại.");
        }

        // 5. Cập nhật trạng thái Slot
        slot.setCurrentOccupancy(slot.getCurrentOccupancy() + 1);
        if (slot.getCurrentOccupancy() >= slot.getCapacity()) {
            slot.setStatus(SlotStatus.OCCUPIED);
        }
        parkingSlotRepository.save(slot);

        // 5. Tạo ParkingSession
        ParkingSession session = new ParkingSession();
        session.setVehicle(vehicle);
        session.setSlot(slot);
        session.setEntryTime(LocalDateTime.now());
        session.setEntryGate(request.getEntryGate());
        session.setStatus(SessionStatus.PARKING.name());
        session.setEstimatedFee(BigDecimal.ZERO);

        if (request.getCardId() != null && !request.getCardId().trim().isEmpty()) {
            ParkingCard card = parkingCardRepository.findByCardIdAndStatus(request.getCardId(), "ACTIVE")
                    .orElseThrow(() -> new IllegalArgumentException("Parking card is invalid or already in use"));
            card.setStatus("IN_USE");
            parkingCardRepository.save(card);
            session.setCard(card);
        }

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

        if (session.getCard() != null) {
            ParkingCard card = session.getCard();
            card.setStatus("ACTIVE");
            parkingCardRepository.save(card);
        }

        Long vehicleTypeId = Long.valueOf(session.getVehicle().getVehicleType().getVehicleTypeId());

        // Kiểm tra xem session này có reservation đi kèm không
        java.util.Optional<Reservation> resOpt = reservationRepository.findFirstByVehicle_VehicleIdAndSlot_SlotIdAndStatus(
                session.getVehicle().getVehicleId(),
                slot.getSlotId(),
                "CONFIRMED"
        );

        BigDecimal calculatedFinalFee;

        // Xử lý vé tháng (Subscription)
        List<MonthlySubscription> activeSubs = subscriptionRepository.findActiveSubscriptionsByVehicleId(session.getVehicle().getVehicleId());

        if (!activeSubs.isEmpty()) {
            // Khách có vé tháng hợp lệ -> Không tính phí đỗ xe
            calculatedFinalFee = BigDecimal.ZERO;
            
            if (resOpt.isPresent()) {
                Reservation r = resOpt.get();
                r.setStatus("COMPLETED");
                reservationRepository.save(r);
            }
        } else if (resOpt.isPresent()) {
            Reservation r = resOpt.get();
            r.setStatus("COMPLETED");
            reservationRepository.save(r);

            /*
             * Có reservation -> Tính phí 2 giai đoạn:
             *
             * Giai đoạn 1 (normal): entryTime -> ReservationEnd
             *   rush/offpeak rate + BasePrice
             *
             * Giai đoạn 2 (overtime): ReservationEnd -> exitTime (nếu xe ra trễ)
             *   OvertimeFeePerHour x số giờ quá
             *
             * Sau đó trừ đi phần đã thanh toán khi đặt chỗ.
             */
            FeeCalculationResponse feeResponse = pricingService.calculateFee(
                    vehicleTypeId,
                    session.getEntryTime(),
                    exitTime,
                    r.getReservationEnd()   // overtimeStart = hết giờ đặt chỗ
            );

            // Phần phí reservation đã thu trước đó (để trừ ra, tránh tính 2 lần)
            FeeCalculationResponse reservationFeeResponse = pricingService.calculateFee(
                    vehicleTypeId,
                    r.getReservationStart(),
                    r.getReservationEnd()
            );
            BigDecimal reservationAlreadyPaid = reservationFeeResponse.getFinalFee();

            calculatedFinalFee = feeResponse.getFinalFee().subtract(reservationAlreadyPaid);
            if (calculatedFinalFee.compareTo(BigDecimal.ZERO) < 0) {
                calculatedFinalFee = BigDecimal.ZERO;
            }

        } else {
            /*
             * Walk-in hoặc không có reservation
             * FinalFee = BasePrice + HourlyFee (capped by MaxDailyRate)
             */
            FeeCalculationResponse feeResponse = pricingService.calculateFee(
                    vehicleTypeId,
                    session.getEntryTime(),
                    exitTime
            );
            calculatedFinalFee = feeResponse.getFinalFee();
        }

        session.setFinalFee(calculatedFinalFee);

        // Slot Occupancy Decrement
        int newOcc = slot.getCurrentOccupancy() - 1;
        if (newOcc < 0) newOcc = 0;
        slot.setCurrentOccupancy(newOcc);
        if (slot.getCurrentOccupancy() < slot.getCapacity()) {
            slot.setStatus(SlotStatus.AVAILABLE);
        }
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

    /*
     * GET ACTIVE SESSION BY LICENSE PLATE
     *
     * Luồng:
     * 1. Nhận licensePlate từ camera/staff
     * 2. Tìm ParkingSession có Vehicle.LicensePlate trùng biển số
     * 3. Chỉ lấy session đang PARKING
     * 4. Trả về sessionId và thông tin session để checkout/payment
     */
    public SessionResponse getActiveSessionByLicensePlate(String licensePlate) {
        if (licensePlate == null || licensePlate.trim().isEmpty()) {
            throw new IllegalArgumentException("License plate is required");
        }

        String normalizedLicensePlate = licensePlate.trim();

        ParkingSession session = parkingSessionRepository
                .findFirstByVehicle_LicensePlateIgnoreCaseAndStatusOrderBySessionIdDesc(
                        normalizedLicensePlate,
                        SessionStatus.PARKING.name()
                )
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active parking session found for license plate: " + normalizedLicensePlate
                ));

        return mapEntityToResponse(session);
    }

    // SUPPORTIVE FUNCTION: map entity to response
    private SessionResponse mapEntityToResponse(ParkingSession session) {
        SessionResponse response = new SessionResponse();

        response.setSessionId(session.getSessionId());

        if (session.getVehicle() != null) {
            response.setVehicleId(session.getVehicle().getVehicleId());
            response.setLicensePlate(session.getVehicle().getLicensePlate());
            
            if (session.getVehicle().getVehicleType() != null) {
                response.setVehicleTypeId(session.getVehicle().getVehicleType().getVehicleTypeId());
                response.setVehicleTypeName(session.getVehicle().getVehicleType().getTypeName());
            }

            // Customer info
            if (session.getVehicle().getOwnerName() != null) {
                response.setCustomerName(session.getVehicle().getOwnerName());
                response.setCustomerPhone(session.getVehicle().getOwnerPhone());
            } else if (session.getVehicle().getUser() != null) {
                response.setCustomerName(session.getVehicle().getUser().getFullName());
                response.setCustomerPhone(session.getVehicle().getUser().getPhoneNumber());
            }
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
