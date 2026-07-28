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
import com.parking.management.module.vehicle.VehicleTypeRepository;import com.parking.management.common.S3Service;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
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
    private final S3Service s3Service;
    private final com.parking.management.module.config.SystemConfigService configService;

    @Value("${file.upload-dir.sessions:uploads/sessions}")
    private String uploadDir;

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
                        "Reservation not found with id: " + request.getReservationId()));

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
            throw new IllegalArgumentException(
                    "Reservation is not CONFIRMED (maybe not paid yet). Current status: " + reservation.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        int earlyCheckinBuffer = Integer.parseInt(configService.getConfigValue("EARLY_CHECKIN_BUFFER_MINUTES", "30"));
        if (now.isBefore(reservation.getReservationStart().minusMinutes(earlyCheckinBuffer))) {
            throw new IllegalArgumentException(
                    "Too early to check in. You can only check in " + earlyCheckinBuffer + " minutes prior to your reservation time.");
        }

        if (now.isAfter(reservation.getReservationEnd())) {
            throw new IllegalArgumentException("This reservation has expired.");
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

        ParkingSession session = new ParkingSession();
        session.setVehicle(vehicle);
        session.setSlot(slot);
        session.setEntryTime(LocalDateTime.now());
        session.setEntryGate(request.getEntryGate());
        session.setStatus(SessionStatus.PARKING.name());
        session.setEstimatedFee(BigDecimal.ZERO);
        session.setFinalFee(null);

        // Gán thẻ từ nếu staff scan thẻ khi check-in reservation
        if (request.getCardId() != null && !request.getCardId().isBlank()) {
            ParkingCard card = parkingCardRepository.findByCardIdAndStatus(request.getCardId(), "ACTIVE")
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Thẻ từ không hợp lệ hoặc đang được sử dụng: " + request.getCardId()));
            card.setStatus("IN_USE");
            parkingCardRepository.save(card);
            session.setCard(card);
        }

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
        // 0. Xử lý logic Biển số & Thẻ từ
        if (request.getVehicleTypeId() == 4) { // Bicycle
            if (request.getLicensePlate() == null || request.getLicensePlate().trim().isEmpty()) {
                request.setLicensePlate("BICYCLE-" + request.getCardId());
            }
        } else {
            if (request.getLicensePlate() == null || request.getLicensePlate().trim().isEmpty()) {
                throw new IllegalArgumentException("License plate is required for this vehicle type");
            }
        }

        // 1. Tìm hoặc tạo Vehicle ẩn danh
        Vehicle vehicle = vehicleRepository.findByLicensePlate(request.getLicensePlate())
                .orElseGet(() -> {
                    if (!configService.getBoolean("ALLOW_GUEST_PARKING", true)) {
                        throw new IllegalArgumentException("Hệ thống hiện không nhận khách vãng lai. Vui lòng đăng ký tài khoản.");
                    }
                    VehicleType type = vehicleTypeRepository.findById(request.getVehicleTypeId())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Vehicle type not found with id: " + request.getVehicleTypeId()));
                    Vehicle newVehicle = new Vehicle();
                    newVehicle.setLicensePlate(request.getLicensePlate());
                    newVehicle.setVehicleType(type);
                    newVehicle.setOwnerName(request.getGuestName());
                    return vehicleRepository.save(newVehicle);
                });

        if (!configService.getBoolean("ALLOW_GUEST_PARKING", true) && vehicle.getUser() == null) {
            throw new IllegalArgumentException("Hệ thống hiện không nhận khách vãng lai. Vui lòng đăng ký tài khoản.");
        }

        // 2. Kiểm tra xem xe có vé tháng ACTIVE không
        boolean hasActiveSubscription = subscriptionRepository.findByVehicle_VehicleId(vehicle.getVehicleId())
                .stream()
                .anyMatch(sub -> "ACTIVE".equals(sub.getStatus()) && !sub.getStartDate().isAfter(java.time.LocalDate.now()));

        ParkingCard card = null;
        if (!hasActiveSubscription) {
            // Nếu không có vé tháng, bắt buộc phải có CardID
            if (request.getCardId() == null || request.getCardId().trim().isEmpty()) {
                throw new IllegalArgumentException("Card ID is required for walk-in check-in without a monthly subscription.");
            }
            card = parkingCardRepository.findByCardIdAndStatus(request.getCardId(), "ACTIVE")
                    .orElseThrow(() -> new IllegalArgumentException("Parking card is invalid or already in use"));
        }

        // 3. Kiểm tra xe đã có session active chưa
        parkingSessionRepository
                .findFirstByVehicle_VehicleIdAndStatus(vehicle.getVehicleId(), SessionStatus.PARKING.name())
                .ifPresent(existingSession -> {
                    throw new IllegalArgumentException("This vehicle already has an active parking session");
                });

        // 4. Tìm Slot trống đầu tiên phù hợp với loại xe
        ParkingSlot slot = parkingSlotRepository
                .findFirstAvailableSlot(request.getVehicleTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chỗ trống phù hợp cho loại xe này."));

        // 5. Kiểm tra lại capacity trước khi tăng
        if (slot.getCurrentOccupancy() >= slot.getCapacity()) {
            throw new IllegalArgumentException("Ô đỗ đã đầy, vui lòng thử lại.");
        }

        // 6. Cập nhật trạng thái Slot
        slot.setCurrentOccupancy(slot.getCurrentOccupancy() + 1);
        if (slot.getCurrentOccupancy() >= slot.getCapacity()) {
            slot.setStatus(SlotStatus.OCCUPIED);
        }
        parkingSlotRepository.save(slot);

        // 7. Tạo ParkingSession & Đổi trạng thái Thẻ (Nếu có)
        if (card != null) {
            card.setStatus("IN_USE");
            parkingCardRepository.save(card);
        }

        ParkingSession session = new ParkingSession();
        session.setVehicle(vehicle);
        session.setSlot(slot);
        session.setCard(card);
        session.setEntryTime(LocalDateTime.now());
        session.setEntryGate(request.getEntryGate());
        session.setStatus(SessionStatus.PARKING.name());
        // Tính phí khởi tạo (thường là Base Price cho 1 giờ đầu tiên)
        try {
            Long vTypeId = Long.valueOf(vehicle.getVehicleType().getVehicleTypeId());
            FeeCalculationResponse feeRes = pricingService.calculateFee(
                    vTypeId, 
                    session.getEntryTime(), 
                    session.getEntryTime(), 
                    null, 
                    vehicle.getVehicleId()
            );
            session.setEstimatedFee(feeRes.getFinalFee());
        } catch (Exception e) {
            session.setEstimatedFee(BigDecimal.ZERO);
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
     * 4. Tính FinalFee (kiểm tra vé tháng → reservation → walk-in)
     * 5. Gọi completeSessionAndFreeSlot() để hoàn tất
     */
    @Transactional
    public SessionResponse checkOut(Integer sessionId, CheckOutRequest request) {
        //Tìm xem session với id tương ứng có tồn tại hay không
        ParkingSession session = parkingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parking session not found with id: " + sessionId));

        //kiểm tra session chưa thanh toán(UnPaid) thì ko cho check out
        if (SessionStatus.UNPAID.name().equals(session.getStatus())) {
            return mapEntityToResponse(session);
        }

        //kiểm tra session ko có trạng thái PARKING hay không
        if (!SessionStatus.PARKING.name().equals(session.getStatus())) {
            throw new IllegalArgumentException("Session is not active, current status: " + session.getStatus());
        }

        //Get slot của session tương ứng
        ParkingSlot slot = session.getSlot();

        //Nếu không có slot thì return ra exception
        if (slot == null) {
            throw new IllegalArgumentException("Session does not have slot information");
        }

        //Lấy exit time bằng LocalDateTime.now()
        LocalDateTime exitTime = LocalDateTime.now();
        //Gán exitTime và exit gate vào session
        session.setExitTime(exitTime);
        session.setExitGate(request.getExitGate());
        //Lấy vehicleTypeId từ vehicle của session, phục vụ cho việc thanh toán dựa theo loại xe
        Long vehicleTypeId = Long.valueOf(session.getVehicle().getVehicleType().getVehicleTypeId());

        // Kiểm tra xem session này có reservation đi kèm không
        java.util.Optional<Reservation> resOpt = reservationRepository
                .findFirstByVehicle_VehicleIdAndSlot_SlotIdAndStatus(
                        session.getVehicle().getVehicleId(),
                        slot.getSlotId(),
                        "CONFIRMED");

        //Khởi tạo FinalFee
        BigDecimal calculatedFinalFee;

        //Chia thành 3 trường hợp: có vé tháng, có reservation, không có vé tháng không có reservation
        //1. Xử lý vé tháng (Subscription)
        //Tìm vé tháng của vehicle id trên
        List<MonthlySubscription> activeSubs = subscriptionRepository.findByVehicle_VehicleId(session.getVehicle().getVehicleId())
                .stream()
                .filter(sub -> "ACTIVE".equals(sub.getStatus()) || "EXPIRED".equals(sub.getStatus()))
                .filter(sub -> {
                    java.time.LocalDate entryDate = session.getEntryTime().toLocalDate();
                    if (entryDate.isBefore(sub.getStartDate())) return false;
                    if (!entryDate.isAfter(sub.getEndDate())) return true; // Trong hạn lúc check-in
                    return false;
                })
                .toList();

        //Nếu có tồn tại vé tháng
        if (!activeSubs.isEmpty()) {
            // Khách có vé tháng hợp lệ -> Không tính phí đỗ xe vì họ đã thanh toán vé tháng đó rồi
            calculatedFinalFee = BigDecimal.ZERO;

            // Dọn dẹp dữ liệu (Clean-up): Nếu khách dùng tính năng Đặt chỗ (Reservation) để giữ slot, 
            // ta bắt buộc phải "đóng" đơn đặt chỗ đó lại (chuyển sang COMPLETED) khi khách đi ra.
            // Nếu không, đơn sẽ bị treo mãi mãi ở trạng thái CONFIRMED gây kẹt dữ liệu, mặc dù khách không phải trả thêm tiền.
            if (resOpt.isPresent()) {
                Reservation r = resOpt.get();
                r.setStatus("COMPLETED");
                reservationRepository.save(r);
            }
        } else {
            // Exceptional Case 2: Khách huỷ vé tháng trong khi xe đang đỗ trong bãi
            List<MonthlySubscription> cancelledSubsDuringSession = subscriptionRepository.findByVehicle_VehicleId(session.getVehicle().getVehicleId())
                    .stream()
                    .filter(sub -> "CANCELLED".equals(sub.getStatus()))
                    .filter(sub -> sub.getEndDate() != null && !sub.getEndDate().isBefore(session.getEntryTime().toLocalDate()))
                    .toList();
            
            if (!cancelledSubsDuringSession.isEmpty()) {
                // Khách có vé tháng hợp lệ lúc check-in nhưng đã huỷ.
                // Vé tháng đã tính tiền prorated đến hết ngày EndDate.
                // Nếu khách ra sau ngày EndDate, tính phí walk-in từ đầu ngày hôm sau.
                MonthlySubscription cancelledSub = cancelledSubsDuringSession.get(0);
                LocalDateTime feeStartTime = cancelledSub.getEndDate().plusDays(1).atStartOfDay();
                
                if (exitTime.isAfter(feeStartTime)) {
                    FeeCalculationResponse feeResponse = pricingService.calculateFee(
                            vehicleTypeId,
                            feeStartTime,
                            exitTime,
                            null,
                            session.getVehicle() != null ? session.getVehicle().getVehicleId() : null);
                    calculatedFinalFee = feeResponse.getFinalFee();
                } else {
                    calculatedFinalFee = BigDecimal.ZERO;
                }
                
                if (resOpt.isPresent()) {
                    Reservation r = resOpt.get();
                    r.setStatus("COMPLETED");
                    reservationRepository.save(r);
                }
            } else if (resOpt.isPresent()) {//nếu vé tháng ko tồn tại thì sẽ kiểm tra tới reservation
                Reservation r = resOpt.get();
                r.setStatus("COMPLETED");
                reservationRepository.save(r);

                /*
                 * Có reservation -> Tính phí 2 giai đoạn:
                 *
                 * Giai đoạn 1 (normal): entryTime -> ReservationEnd
                 * rush/offpeak rate + BasePrice
                 *
                 * Giai đoạn 2 (overtime): ReservationEnd -> exitTime (nếu xe ra trễ)
                 * OvertimeFeePerHour x số giờ quá
                 *
                 * Sau đó trừ đi phần đã thanh toán khi đặt chỗ.
                 */
                // Bước 1: Tính tổng chi phí thực tế mà khách phải chịu từ lúc Vào cổng đến lúc Ra cổng.
                // Nếu khách ra trễ hơn ReservationEnd, hàm này sẽ tự động tính thêm tiền phạt quá giờ (overtime).
                // Grace period: Miễn phí nếu ra trễ trong khoảng thời gian cho phép
                LocalDateTime effectiveExitTime = exitTime;
                int graceMinutes = configService.getInt("LATE_CHECKOUT_GRACE_MINUTES", 15);
                if (exitTime.isAfter(r.getReservationEnd()) && exitTime.isBefore(r.getReservationEnd().plusMinutes(graceMinutes))) {
                    effectiveExitTime = r.getReservationEnd();
                }

                FeeCalculationResponse feeResponse = pricingService.calculateFee(
                        vehicleTypeId,
                        session.getEntryTime(),
                        effectiveExitTime,
                        r.getReservationEnd(), // overtimeStart = hết giờ đặt chỗ
                        session.getVehicle() != null ? session.getVehicle().getVehicleId() : null
                );

                // Bước 2: Tính lại số tiền khách ĐÃ TRẢ (hoặc đã cọc) lúc tạo đơn Đặt chỗ trước đó.
                // Bằng cách chạy lại hàm tính tiền cho đúng khoảng thời gian đặt giữ chỗ (Start -> End).
                // Phần phí reservation đã thu trước đó (để trừ ra, tránh tính 2 lần)
                FeeCalculationResponse reservationFeeResponse = pricingService.calculateFee(
                        vehicleTypeId,
                        r.getReservationStart(),
                        r.getReservationEnd(),
                        null,
                        session.getVehicle() != null ? session.getVehicle().getVehicleId() : null);
                BigDecimal reservationAlreadyPaid = reservationFeeResponse.getFinalFee();

                // Bước 3: Cấn trừ tiền (Số tiền cần trả thêm = Tổng phí đỗ xe thực tế - Tiền đã cọc lúc đặt chỗ)
                calculatedFinalFee = feeResponse.getFinalFee().subtract(reservationAlreadyPaid);
                
                // Bước 4: Xử lý trường hợp khách về sớm (Tiền trả thêm bị ÂM)
                // Nếu khách về sớm hơn giờ đặt, hệ thống ép tiền trả thêm về 0 đồng (Cho qua cổng luôn, KHÔNG HOÀN LẠI tiền thừa)
                if (calculatedFinalFee.compareTo(BigDecimal.ZERO) < 0) {
                    calculatedFinalFee = BigDecimal.ZERO;
                }

            } else {
                //3. Không có reservation và không có subscription
                /*
                 * Walk-in hoặc không có reservation
                 * FinalFee = BasePrice + HourlyFee (capped by MaxDailyRate)
                 */
                FeeCalculationResponse feeResponse = pricingService.calculateFee(
                        vehicleTypeId,
                        session.getEntryTime(),
                        exitTime,
                        null,
                        session.getVehicle() != null ? session.getVehicle().getVehicleId() : null);
                calculatedFinalFee = feeResponse.getFinalFee();
            }
        }

        session.setFinalFee(calculatedFinalFee);

        if (calculatedFinalFee.compareTo(BigDecimal.ZERO) == 0) {
            // Final fee is 0 (e.g. valid subscription, fully paid reservation) -> Complete
            // immediately
            session.setStatus(SessionStatus.COMPLETED.name());

            //Tìm card từ session
            if (session.getCard() != null) {
                ParkingCard card = session.getCard();
                //Set lại trạng thái là ACTIVE để có thể sử dụng lại 
                card.setStatus("ACTIVE");
                parkingCardRepository.save(card);
            }

            //Giảm currentOccupancy xuống 1 và thay đổi trạng thái của slot
            int newOcc = slot.getCurrentOccupancy() - 1;
            if (newOcc < 0)
                newOcc = 0;// Đảm bảo số lượng không âm
            slot.setCurrentOccupancy(newOcc);//cập nhật số xe hiện tại
            if (slot.getCurrentOccupancy() < slot.getCapacity()) { // Nếu số xe hiện tại ít hơn công suất
                slot.setStatus(SlotStatus.AVAILABLE); // Thì trả trạng thái slot về có sẵn (AVAILABLE)
            }
            parkingSlotRepository.save(slot);//Cập nhật slot
        } else {
            // Nếu finalFee > 0 -> Cần thanh toán -> Set trạng thái UNPAID và không giải phóng slot
            session.setStatus(SessionStatus.UNPAID.name());
        }

        //Lưu updated session
        ParkingSession updatedSession = parkingSessionRepository.save(session);

        //Convert/map to response and return to front end/ swagger
        return mapEntityToResponse(updatedSession);
    }

    // ============================================================
    // HELPER: Hoàn tất session và giải phóng slot
    // ============================================================

    /**
     * Hoàn tất 1 ParkingSession và giải phóng slot tương ứng.
     *
     * Method này được thiết kế IDEMPOTENT (gọi nhiều lần không gây lỗi):
     * - Nếu session đã COMPLETED rồi → return luôn, không làm gì thêm.
     * - Nhờ vậy, dù PaymentService hay SessionService gọi, slot chỉ bị
     * giảm occupancy đúng 1 lần.
     *
     * @param sessionId ID của ParkingSession cần hoàn tất
     */
    @Transactional
    public void completeSession(Integer sessionId) {
        ParkingSession session = parkingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // --- IDEMPOTENT CHECK ---
        // Nếu session đã COMPLETED rồi thì không làm gì nữa.
        if (SessionStatus.COMPLETED.name().equals(session.getStatus())) {
            return;
        }

        session.setStatus(SessionStatus.COMPLETED.name());

        // 2. Trả lại ParkingCard (nếu có) về trạng thái ACTIVE
        if (session.getCard() != null) {
            ParkingCard card = session.getCard();
            card.setStatus("ACTIVE");
            parkingCardRepository.save(card);
        }

        // 3. Giảm occupancy của slot và cập nhật trạng thái
        ParkingSlot slot = session.getSlot();
        if (slot != null) {
            int newOcc = slot.getCurrentOccupancy() - 1;
            if (newOcc < 0)
                newOcc = 0;
            slot.setCurrentOccupancy(newOcc);

            // Nếu slot còn chỗ trống → đổi về AVAILABLE
            if (slot.getCurrentOccupancy() < slot.getCapacity()) {
                slot.setStatus(SlotStatus.AVAILABLE);
            }
            parkingSlotRepository.save(slot);
        }

        // 4. Lưu session đã cập nhật
        parkingSessionRepository.save(session);
    }

    public SessionResponse getById(Integer id) {
        ParkingSession session = parkingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parking session not found with id: " + id));
        return mapEntityToResponse(session);
    }

    public List<SessionResponse> getAll() {
        Integer buildingId = securityUtils.getBuildingId();
        return parkingSessionRepository.findAllWithBuildingFilter(buildingId)
                .stream()
                .map(this::mapEntityToResponse)
                .toList();
    }

    @Transactional
    public void delete(Integer id) {
        ParkingSession session = parkingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parking session not found with id: " + id));
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
        // 1. Kiểm tra đầu vào không được để rỗng (Fail-fast để tránh lỗi NullPointerException phía sau)
        if (licensePlate == null || licensePlate.trim().isEmpty()) {
            throw new IllegalArgumentException("License plate is required");
        }

        // 2. Cắt khoảng trắng dư thừa (do nhân viên nhập tay hoặc camera OCR quét bị dính dấu cách)
        String normalizedLicensePlate = licensePlate.trim();

        // 3. Chỉ lọc các xe ĐANG HOẠT ĐỘNG trong bãi:
        // - PARKING: xe đang gửi trong bãi
        // - UNPAID: xe đã tới cổng và lên hóa đơn nhưng chưa thanh toán
        java.util.List<String> activeStatuses = java.util.Arrays.asList(SessionStatus.PARKING.name(),
                SessionStatus.UNPAID.name());

        // 4. Tìm trong DB theo Biển số xe:
        // - IgnoreCase: Không phân biệt chữ hoa/thường (29a với 29A là như nhau)
        // - OrderBySessionIdDesc + findFirst: Ưu tiên lấy bản ghi mới nhất trong trường hợp 1 xe có nhiều lịch sử hoặc dữ liệu trùng
        java.util.Optional<ParkingSession> sessionOpt = parkingSessionRepository
                .findFirstByVehicle_LicensePlateIgnoreCaseAndStatusInOrderBySessionIdDesc(
                        normalizedLicensePlate, activeStatuses);

        // 5. Cơ chế Fallback (Dự phòng thông minh):
        // - Nếu tìm theo "Biển số xe" không ra, tự động dùng chuỗi này để tìm theo "Mã thẻ quẹt RFID" (CardId).
        // - Xử lý tình huống: Khi camera không đọc được biển xe (do mờ, xước, bẩn), nhân viên chỉ cần quẹt thẻ RFID.
        // Gộp chung vào một hàm giúp xử lý mượt mà cả quét biển lẫn quẹt thẻ mà không cần tách API riêng.
        if (!sessionOpt.isPresent()) {
            sessionOpt = parkingSessionRepository
                    .findFirstByCard_CardIdIgnoreCaseAndStatusInOrderBySessionIdDesc(
                            normalizedLicensePlate, activeStatuses);
        }

        // 6. Nếu cả biển số và mã thẻ đều không có dữ liệu -> Ném lỗi 404 Not Found để giao diện hiển thị thông báo
        ParkingSession session = sessionOpt.orElseThrow(() -> new ResourceNotFoundException(
                "No active parking session found for search key: " + normalizedLicensePlate));

        // 7. Chuyển từ Entity (DB) sang DTO (Data Transfer Object):
        // Giúp ẩn các dữ liệu nhạy cảm trong DB và tránh lỗi lặp vô hạn (Infinite Recursion) của Hibernate
        return mapEntityToResponse(session);
    }

    /*
     * UPLOAD HÌNH ẢNH PHIÊN GỬI XE
     * Dùng để tải lên và lưu hình ảnh chụp xe vào/ra bãi đỗ phục vụ đối chiếu an ninh.
     */
    public SessionResponse uploadSessionImage(Integer sessionId, MultipartFile file, String type) {
        // 1. Kiểm tra session có tồn tại trong DB không, nếu sai ID thì dừng ngay (tránh thao tác ghi đĩa tốn tài nguyên)
        ParkingSession session = parkingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        // 2. Đảm bảo file gửi lên hợp lệ và không bị rỗng (0 byte)
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        // 3. Tách lấy phần đuôi file gốc (VD: .jpg, .png, .webp) để chuẩn hóa định dạng ảnh
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // 4. Định hình tiền tố theo sự kiện ("exit_" nếu là xe ra bãi, "entry_" nếu là xe vào bãi) giúp dễ tra soát thư mục bằng mắt thường
        String prefix = "exit".equalsIgnoreCase(type) ? "exit_" : "entry_";

        // 5. Tạo tên file mới độc nhất bằng UUID:
        // Cú pháp: Tiền_tố + ID_phiên + Mã_UUID + Đuôi_ảnh (VD: entry_10_a1b2c3...jpg)
        // Dùng UUID ngẫu nhiên để không bị ghi đè file khi nhiều camera hay nhiều xe upload ảnh cùng lúc
        String fileName = prefix + sessionId + "_" + UUID.randomUUID() + extension;

        try {
            // 6. Lấy đường dẫn gốc lưu ảnh (uploadDir) và tự động tạo toàn bộ thư mục nếu folder chưa tồn tại trên đĩa
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 7. Nối thư mục gốc với tên file (.resolve tự động điều chỉnh dấu gạch chéo tương thích Windows hoặc Linux)
            Path filePath = uploadPath.resolve(fileName);

            // 8. Lưu luồng dữ liệu (Input Stream) xuống đĩa với chế độ cho phép ghi đè (REPLACE_EXISTING):
            // Copy bằng Stream giúp tiết kiệm bộ nhớ RAM, không cần đọc trọn tệp ảnh vài MB vào RAM trước khi lưu xuống đĩa
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 9. Chỉ lưu đường dẫn tương đối vào DB (VD: /uploads/sessions/entry_10.jpg):
            // Ngăn lỗi mất ảnh khi thay đổi máy chủ hoặc đổi đường dẫn thư mục vật lý sau này
            String imageUrl = "/uploads/sessions/" + fileName;

            // 10. Gán đường dẫn ảnh mới lưu vào cột Entry hoặc Exit trong DB theo loại sự kiện
            if ("exit".equalsIgnoreCase(type)) {
                session.setExitImage(imageUrl);
            } else {
                session.setEntryImage(imageUrl);
            }

            // 11. Lưu cập nhật xuống DB và chuyển sang DTO trả về cho giao diện Frontend có link ảnh hiển thị ngay
            return mapEntityToResponse(parkingSessionRepository.save(session));
        } catch (Exception e) {
            // 12. Nếu có lỗi về I/O khi chép file, ném ra RuntimeException (Unchecked Exception):
            // Việc ném RuntimeException giúp Spring Boot nhận diện lỗi và tự động Rollback (hoàn tác) lệnh save trong DB, đảm bảo dữ liệu luôn đồng bộ
            throw new RuntimeException("Could not upload image: " + e.getMessage());
        }
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
        response.setEntryImage(session.getEntryImage());
        response.setExitImage(session.getExitImage());
        response.setStatus(session.getStatus());
        response.setEstimatedFee(session.getEstimatedFee());
        response.setFinalFee(session.getFinalFee());

        if (session.getCreatedBy() != null) {
            response.setCreatedBy(session.getCreatedBy().getFullName());
        }

        if (session.getCard() != null) {
            response.setCardId(session.getCard().getCardId());
        }

        // Kiểm tra vé tháng (Monthly Subscription)
        // Giúp staff/driver biết ngay lúc check-in rằng xe có vé tháng
        if (session.getVehicle() != null) {
            boolean hasActiveSubscription = subscriptionRepository.findByVehicle_VehicleId(session.getVehicle().getVehicleId())
                    .stream()
                    .filter(sub -> "ACTIVE".equals(sub.getStatus()))
                    .anyMatch(sub -> {
                        java.time.LocalDate now = java.time.LocalDate.now();
                        if (now.isBefore(sub.getStartDate())) return false;
                        if (!now.isAfter(sub.getEndDate())) return true;
                        return false;
                    });
            
            // Exceptional case: Cancelled during session
            if (!hasActiveSubscription && session.getEntryTime() != null) {
                hasActiveSubscription = subscriptionRepository.findByVehicle_VehicleId(session.getVehicle().getVehicleId())
                        .stream()
                        .filter(sub -> "CANCELLED".equals(sub.getStatus()))
                        .filter(sub -> sub.getEndDate() != null && !sub.getEndDate().isBefore(session.getEntryTime().toLocalDate()))
                        .anyMatch(sub -> {
                            java.time.LocalDate exitDate = session.getExitTime() != null ? session.getExitTime().toLocalDate() : java.time.LocalDate.now();
                            return !exitDate.isAfter(sub.getEndDate());
                        });
            }

            response.setHasActiveSubscription(hasActiveSubscription);
        } else {
            response.setHasActiveSubscription(false);
        }

        return response;
    }
}
