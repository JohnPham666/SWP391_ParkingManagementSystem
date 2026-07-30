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
import com.parking.management.module.payment.Payment;
import com.parking.management.module.payment.PaymentRepository;
import com.parking.management.module.payment.PaymentStatus;
import com.parking.management.module.pricing.PricingService;
import com.parking.management.module.pricing.FeeCalculationResponse;
import com.parking.management.module.config.SystemConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final SecurityUtils securityUtils;
    private final PaymentRepository paymentRepository;
    private final PricingService pricingService;
    private final SystemConfigService systemConfigService;


    public ReservationResponse create(ReservationRequest request) {
        validateTime(request);
        securityUtils.checkDataOwnership(request.getUserId());

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));

        if (!"APPROVED".equals(vehicle.getStatus())) {
            throw new IllegalArgumentException("Vehicle is not APPROVED, cannot make a reservation.");
        }

        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle type not found with id: " + request.getVehicleTypeId()));

        if (!vehicleType.getIsReservable()) {
            throw new IllegalArgumentException("This vehicle type does not support reservations.");
        }

        if (reservationRepository.existsByVehicle_VehicleIdAndStatusIn(request.getVehicleId(), List.of("PENDING", "CONFIRMED"))) {
            throw new IllegalArgumentException("This vehicle already has an active reservation. Please complete or cancel it before making a new one.");
        }

        ParkingSlot slot;
        if (request.getSlotId() == null) {
            // Đặt nhanh: Tìm chỗ trống đầu tiên
            slot = parkingSlotRepository
                    .findFirstAvailableSlot(
                            request.getVehicleTypeId()
                    )
                    .orElseThrow(() -> new ResourceNotFoundException("No available slots found for this vehicle type."));
        } else {
            // Chọn thủ công
            slot = parkingSlotRepository.findById(request.getSlotId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with id: " + request.getSlotId()));
            
            if (slot.getStatus() != SlotStatus.AVAILABLE) {
                throw new IllegalArgumentException("This slot is not currently available, please choose another one.");
            }
        }

        if (!slot.getVehicleType().getIsReservable()) {
            throw new IllegalArgumentException("This slot does not support reservations for this vehicle type.");
        }

        String vTypeName = slot.getVehicleType().getTypeName().toLowerCase();
        if (vTypeName.contains("bicycle") || vTypeName.contains("xe đạp") || vTypeName.contains("bike")) {
            throw new IllegalArgumentException("Bicycle slots cannot be reserved.");
        }

        // Kiểm tra Double Booking (Overlap)
        List<Reservation> overlaps = reservationRepository.findOverlappingReservations(
                slot.getSlotId(), request.getReservationStart(), request.getReservationEnd()
        );
        if (!overlaps.isEmpty()) {
            throw new IllegalArgumentException("Sorry, this slot is already reserved during the selected time period.");
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

        return mapToResponse(reservationRepository.save(reservation));
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
                .map(this::mapToResponse)
                .toList();
    }

    public ReservationResponse getById(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));

        if (reservation.getUser() != null) {
            securityUtils.checkDataOwnership(reservation.getUser().getUserId());
        }

        return mapToResponse(reservation);
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

        if (!"APPROVED".equals(vehicle.getStatus())) {
            throw new IllegalArgumentException("Vehicle is not APPROVED, cannot make a reservation.");
        }

        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle type not found with id: " + request.getVehicleTypeId()));

        ParkingSlot slot = parkingSlotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with id: " + request.getSlotId()));

        if (!vehicleType.getIsReservable()) {
            throw new IllegalArgumentException("This vehicle type does not support reservations.");
        }
        if (!slot.getVehicleType().getIsReservable()) {
            throw new IllegalArgumentException("This slot does not support reservations for this vehicle type.");
        }

        if (reservationRepository.existsByVehicle_VehicleIdAndStatusInAndReservationIdNot(request.getVehicleId(), List.of("PENDING", "CONFIRMED"), id)) {
            throw new IllegalArgumentException("This vehicle already has an active reservation. Please complete or cancel it before making a new one.");
        }

        // Kiểm tra Double Booking (Overlap)
        List<Reservation> overlaps = reservationRepository.findOverlappingReservations(
                slot.getSlotId(), request.getReservationStart(), request.getReservationEnd()
        );
        // Lọc bỏ chính reservation hiện tại
        overlaps = overlaps.stream()
                .filter(r -> !r.getReservationId().equals(id))
                .toList();

        if (!overlaps.isEmpty()) {
            throw new IllegalArgumentException("Sorry, this slot is already reserved during the selected time period.");
        }

        reservation.setUser(user);
        reservation.setVehicle(vehicle);
        reservation.setVehicleType(vehicleType);
        reservation.setSlot(slot);
        reservation.setReservationStart(request.getReservationStart());
        reservation.setReservationEnd(request.getReservationEnd());
        reservation.setStatus("PENDING");
        reservation.setGuestName(request.getGuestName());
        reservation.setCreatedAt(LocalDateTime.now());

        return mapToResponse(reservationRepository.save(reservation));
    }

    public void cancel(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));

        if (reservation.getUser() != null) {
            securityUtils.checkDataOwnership(reservation.getUser().getUserId());
        }

        String currentStatus = reservation.getStatus();
        if (!"PENDING".equals(currentStatus) && !"CONFIRMED".equals(currentStatus)) {
            throw new IllegalArgumentException("Cannot cancel this reservation because it is already " + currentStatus);
        }

        reservation.setStatus("CANCELLED");

        ParkingSlot slot = reservation.getSlot();
        if (slot != null && slot.getStatus() == SlotStatus.RESERVED) {
            slot.setStatus(SlotStatus.AVAILABLE);
            parkingSlotRepository.save(slot);
        }

        // Cập nhật trạng thái Payment liên quan
        paymentRepository.findFirstByReservation_ReservationIdOrderByPaymentIdDesc(reservation.getReservationId())
                .ifPresent(payment -> {
                    String paymentStatus = payment.getPaymentStatus();
                    if (PaymentStatus.PAID.name().equals(paymentStatus)) {
                        // Đã thanh toán rồi -> cần hoàn tiền, Staff/Admin xử lý thủ công
                        payment.setPaymentStatus(PaymentStatus.REFUND_PENDING.name());
                        paymentRepository.save(payment);
                    } else if (PaymentStatus.PENDING.name().equals(paymentStatus)) {
                        // Chưa thanh toán -> hủy luôn
                        payment.setPaymentStatus(PaymentStatus.FAILED.name());
                        paymentRepository.save(payment);
                    }
                });

        reservationRepository.save(reservation);
    }

    private void validateTime(ReservationRequest request) {
        LocalDateTime now = LocalDateTime.now();
        
        if (request.getReservationStart().isBefore(now)) {
            throw new IllegalArgumentException("Reservation start time cannot be in the past.");
        }

        if (!request.getReservationEnd().isAfter(request.getReservationStart())) {
            throw new IllegalArgumentException("Reservation end time must be after start time.");
        }
        
        int maxAdvanceDays = systemConfigService.getInt("MAX_ADVANCE_RESERVATION_DAYS", 3);
        if (request.getReservationStart().isAfter(now.plusDays(maxAdvanceDays))) {
            throw new IllegalArgumentException("You can only reserve up to " + maxAdvanceDays + " days in advance.");
        }

        int maxHours = systemConfigService.getInt("MAX_RESERVATION_HOURS", 24);
        long hours = java.time.Duration.between(request.getReservationStart(), request.getReservationEnd()).toHours();
        if (hours > maxHours) {
            throw new IllegalArgumentException("Reservation duration exceeds maximum allowed hours: " + maxHours + "h.");
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
        return mapToResponse(reservationRepository.save(reservation));
    }

    private ReservationResponse mapToResponse(Reservation reservation) {
        ReservationResponse response = ReservationResponse.fromEntity(reservation);
        try {
            FeeCalculationResponse feeRes = pricingService.calculateFee(
                    Long.valueOf(reservation.getVehicleType().getVehicleTypeId()),
                    reservation.getReservationStart(),
                    reservation.getReservationEnd(),
                    null,
                    reservation.getVehicle() != null ? reservation.getVehicle().getVehicleId() : null
            );
            response.setEstimatedFee(feeRes.getFinalFee());
        } catch (Exception e) {
            response.setEstimatedFee(null);
        }

        paymentRepository.findFirstByReservation_ReservationIdOrderByPaymentIdDesc(reservation.getReservationId())
                .ifPresent(p -> {
                    response.setPaymentStatus(p.getPaymentStatus());
                    response.setPaymentId(p.getPaymentId());
                    response.setAmount(p.getAmount());
                });

        return response;
    }
}
