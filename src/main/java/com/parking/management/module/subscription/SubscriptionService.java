package com.parking.management.module.subscription;

import com.parking.management.common.ResourceNotFoundException;
import com.parking.management.module.slot.ParkingSlot;
import com.parking.management.module.slot.ParkingSlotRepository;
import com.parking.management.module.user.User;
import com.parking.management.module.user.UserRepository;
import com.parking.management.module.vehicle.Vehicle;
import com.parking.management.module.vehicle.VehicleRepository;
import com.parking.management.module.zone.Zone;
import com.parking.management.module.zone.ZoneRepository;
import com.parking.management.security.SecurityUtils;
import com.parking.management.module.pricing.PricingPolicyRepository;
import com.parking.management.module.pricing.PricingPolicy;
import com.parking.management.module.payment.Payment;
import com.parking.management.module.payment.PaymentRepository;
import com.parking.management.module.payment.PaymentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SubscriptionService {

    private final SubscriptionRepository repository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final ParkingSlotRepository slotRepository;
    private final ZoneRepository zoneRepository;
    private final PricingPolicyRepository pricingPolicyRepository;
    private final PaymentRepository paymentRepository;
    private final SecurityUtils securityUtils;

    //================================================================================================================
    // C: CREATE - Tạo vé tháng mới
    //================================================================================================================
    public SubscriptionResponse createSubscription(SubscriptionRequest request) {
        securityUtils.checkDataOwnership(request.getUserId());
        // Tìm User theo userId, nếu không tìm thấy thì ném exception
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + request.getUserId()));

        // Tìm Vehicle theo vehicleId
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vehicle not found with id: " + request.getVehicleId()));

        if (!"APPROVED".equals(vehicle.getStatus())) {
            throw new IllegalArgumentException("Phương tiện chưa được duyệt (APPROVED), không thể đăng ký vé tháng.");
        }

        // Kiểm tra xem xe này đã có vé tháng ACTIVE hoặc PENDING chưa
        List<MonthlySubscription> existingSubs = repository.findByVehicle_VehicleId(request.getVehicleId());
        boolean hasActiveOrPendingSub = existingSubs.stream()
                .anyMatch(sub -> SubscriptionStatus.ACTIVE.name().equals(sub.getStatus()) 
                              || SubscriptionStatus.PENDING.name().equals(sub.getStatus()));
        
        if (hasActiveOrPendingSub) {
            throw new IllegalArgumentException("This vehicle already has an ACTIVE or PENDING monthly subscription.");
        }

        // Tạo entity mới
        MonthlySubscription subscription = new MonthlySubscription();
        subscription.setUser(user);
        subscription.setVehicle(vehicle);

        // Nếu có slotId -> tìm và gán slot
        if (request.getSlotId() != null) {
            ParkingSlot slot = slotRepository.findById(request.getSlotId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Slot not found with id: " + request.getSlotId()));
            subscription.setSlot(slot);
        }

        // Nếu có zoneId -> tìm và gán zone
        if (request.getZoneId() != null) {
            Zone zone = zoneRepository.findById(request.getZoneId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Zone not found with id: " + request.getZoneId()));
            subscription.setZone(zone);
        }

        // Set ngày bắt đầu và ngày kết thúc (30 ngày)
        subscription.setStartDate(request.getStartDate());
        subscription.setEndDate(request.getStartDate().plusDays(30));

        // Lấy giá MonthlyPrice từ PricingPolicy đang active (ghi đè request.getMonthlyFee() để bảo mật)
        PricingPolicy policy = pricingPolicyRepository.findActivePolicyByVehicleTypeId(
                Long.valueOf(vehicle.getVehicleType().getVehicleTypeId()), LocalDateTime.now())
                .orElseThrow(() -> new IllegalArgumentException("No active pricing policy for this vehicle type."));
        
        if (policy.getMonthlyPrice() == null) {
            subscription.setMonthlyFee(request.getMonthlyFee()); // Fallback
        } else {
            subscription.setMonthlyFee(policy.getMonthlyPrice());
        }

        // Vé mới tạo -> trạng thái = PENDING (chờ duyệt)
        subscription.setStatus(SubscriptionStatus.PENDING.name());

        // Set thời gian tạo
        subscription.setCreatedAt(LocalDateTime.now());

        // Lưu vào database
        MonthlySubscription saved = repository.save(subscription);

        // Tự động tạo Payment với trạng thái PENDING
        Payment payment = new Payment();
        payment.setSubscription(saved);
        payment.setAmount(saved.getMonthlyFee());
        payment.setPaymentMethod("VNPAY"); // Hoặc mặc định tùy ý
        payment.setPaymentStatus(PaymentStatus.PENDING.name());
        Payment savedPayment = paymentRepository.save(payment);

        // Map sang response và trả về
        SubscriptionResponse response = entityMapToResponse(saved);
        response.setPaymentId(savedPayment.getPaymentId());
        return response;
    }

    //================================================================================================================
    // A: APPROVE/REJECT - Duyệt vé tháng
    //================================================================================================================
    public SubscriptionResponse approveSubscription(Integer id) {
        MonthlySubscription subscription = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + id));

        if (!SubscriptionStatus.PENDING.name().equals(subscription.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể duyệt vé tháng đang chờ duyệt (PENDING).");
        }

        subscription.setStatus(SubscriptionStatus.ACTIVE.name());
        subscription.setStartDate(java.time.LocalDate.now());
        subscription.setEndDate(java.time.LocalDate.now().plusDays(30));
        
        return entityMapToResponse(repository.save(subscription));
    }

    public SubscriptionResponse rejectSubscription(Integer id) {
        MonthlySubscription subscription = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + id));

        if (!SubscriptionStatus.PENDING.name().equals(subscription.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể từ chối vé tháng đang chờ duyệt (PENDING).");
        }

        subscription.setStatus(SubscriptionStatus.REJECTED.name());
        return entityMapToResponse(repository.save(subscription));
    }

    //================================================================================================================
    // R: READ - Lấy vé tháng
    //================================================================================================================

    // Lấy vé tháng theo ID
    public SubscriptionResponse getSubscriptionById(Integer id) {
        MonthlySubscription subscription = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Subscription not found with id: " + id));
        if (subscription.getUser() != null) {
            securityUtils.checkDataOwnership(subscription.getUser().getUserId());
        }
        return entityMapToResponse(subscription);
    }

    // Lấy tất cả vé tháng
    public List<SubscriptionResponse> getAllSubscriptions() {
        Integer driverId = securityUtils.getDriverUserId();
        List<MonthlySubscription> subscriptions = repository.findAll();
        List<SubscriptionResponse> responses = new ArrayList<>();
        for (MonthlySubscription sub : subscriptions) {
            if (driverId == null || (sub.getUser() != null && sub.getUser().getUserId().equals(driverId))) {
                responses.add(entityMapToResponse(sub));
            }
        }
        return responses;
    }

    // Lấy vé tháng theo userId
    public List<SubscriptionResponse> getSubscriptionsByUserId(Integer userId) {
        securityUtils.checkDataOwnership(userId);
        List<MonthlySubscription> subscriptions = repository.findByUser_UserId(userId);
        List<SubscriptionResponse> responses = new ArrayList<>();
        for (MonthlySubscription sub : subscriptions) {
            responses.add(entityMapToResponse(sub));
        }
        return responses;
    }

    //================================================================================================================
    // U: UPDATE - Cập nhật vé tháng
    //================================================================================================================
    public SubscriptionResponse updateSubscription(Integer id, SubscriptionRequest request) {
        // Tìm vé tháng theo id
        MonthlySubscription subscription = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Subscription not found with id: " + id));

        if (subscription.getUser() != null) {
            securityUtils.checkDataOwnership(subscription.getUser().getUserId());
        }
        securityUtils.checkDataOwnership(request.getUserId());

        // Cập nhật User
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + request.getUserId()));
        subscription.setUser(user);

        // Cập nhật Vehicle
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vehicle not found with id: " + request.getVehicleId()));

        if (!"APPROVED".equals(vehicle.getStatus())) {
            throw new IllegalArgumentException("Phương tiện chưa được duyệt (APPROVED), không thể đăng ký vé tháng.");
        }
        subscription.setVehicle(vehicle);

        // Cập nhật Slot (nếu có)
        if (request.getSlotId() != null) {
            ParkingSlot slot = slotRepository.findById(request.getSlotId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Slot not found with id: " + request.getSlotId()));
            subscription.setSlot(slot);
        } else {
            subscription.setSlot(null);
        }

        // Cập nhật Zone (nếu có)
        if (request.getZoneId() != null) {
            Zone zone = zoneRepository.findById(request.getZoneId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Zone not found with id: " + request.getZoneId()));
            subscription.setZone(zone);
        } else {
            subscription.setZone(null);
        }

        // Cập nhật ngày bắt đầu và tự tính lại endDate
        // Cập nhật ngày bắt đầu và giữ endDate
        subscription.setStartDate(request.getStartDate());

        // Cập nhật phí
        subscription.setMonthlyFee(request.getMonthlyFee());

        // Lưu vào database
        MonthlySubscription updated = repository.save(subscription);

        return entityMapToResponse(updated);
    }

    //================================================================================================================
    // D: DELETE - Xóa vé tháng
    //================================================================================================================
    public void deleteSubscription(Integer id) {
        MonthlySubscription subscription = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Subscription not found with id: " + id));
        if (subscription.getUser() != null) {
            securityUtils.checkDataOwnership(subscription.getUser().getUserId());
        }
        repository.delete(subscription);
    }

    //================================================================================================================
    // CANCEL - Người dùng tự hủy vé tháng (Tính phí Prorated)
    //================================================================================================================
    public SubscriptionResponse cancelSubscriptionByUser(Integer id) {
        MonthlySubscription subscription = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + id));

        if (subscription.getUser() != null) {
            securityUtils.checkDataOwnership(subscription.getUser().getUserId());
        }

        if (SubscriptionStatus.PENDING.name().equals(subscription.getStatus())) {
            subscription.setStatus(SubscriptionStatus.CANCELLED.name());
            repository.save(subscription);
            
            paymentRepository.findFirstBySubscription_SubscriptionIdOrderByPaymentIdDesc(id)
                .ifPresent(payment -> {
                    payment.setPaymentStatus(PaymentStatus.FAILED.name());
                    paymentRepository.save(payment);
                });
            return entityMapToResponse(subscription);
        }

        if (!SubscriptionStatus.ACTIVE.name().equals(subscription.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể hủy vé tháng đang hoạt động (ACTIVE) hoặc chờ duyệt (PENDING).");
        }

        // 1. Chốt ngày kết thúc là hôm nay
        java.time.LocalDate today = java.time.LocalDate.now();
        subscription.setEndDate(today);
        subscription.setStatus(SubscriptionStatus.CANCELLED.name());
        
        // 2. Tính tiền theo ngày sử dụng trong tháng hiện tại
        java.time.YearMonth currentMonth = java.time.YearMonth.from(today);
        int daysInMonth = currentMonth.lengthOfMonth();
        
        java.time.LocalDate billingStartDate = subscription.getStartDate();
        if (billingStartDate.isBefore(currentMonth.atDay(1))) {
            billingStartDate = currentMonth.atDay(1); // Nếu vé bắt đầu từ tháng trước, chỉ tính từ đầu tháng này
        }

        long usedDays = java.time.temporal.ChronoUnit.DAYS.between(billingStartDate, today) + 1;
        if (usedDays < 0) usedDays = 0;

        java.math.BigDecimal monthlyFee = subscription.getMonthlyFee();
        java.math.BigDecimal dailyRate = monthlyFee.divide(java.math.BigDecimal.valueOf(daysInMonth), 2, java.math.RoundingMode.HALF_UP);
        java.math.BigDecimal proratedFee = dailyRate.multiply(java.math.BigDecimal.valueOf(usedDays));

        repository.save(subscription);

        // 3. Tạo Payment
        if (proratedFee.compareTo(java.math.BigDecimal.ZERO) > 0) {
            Payment payment = new Payment();
            payment.setSubscription(subscription);
            payment.setAmount(proratedFee);
            payment.setPaymentMethod("VNPAY"); // Default
            payment.setPaymentStatus(PaymentStatus.PENDING.name());
            paymentRepository.save(payment);
        }

        return entityMapToResponse(subscription);
    }

    //================================================================================================================
    // HÀM HỖ TRỢ: Map Entity -> Response
    //================================================================================================================
    private SubscriptionResponse entityMapToResponse(MonthlySubscription entity) {
        SubscriptionResponse response = new SubscriptionResponse();

        response.setSubscriptionId(entity.getSubscriptionId());

        // Thông tin User
        response.setUserId(entity.getUser().getUserId());
        response.setUserFullName(entity.getUser().getFullName());

        // Thông tin Vehicle
        response.setVehicleId(entity.getVehicle().getVehicleId());
        response.setLicensePlate(entity.getVehicle().getLicensePlate());

        // Thông tin Slot (có thể null)
        if (entity.getSlot() != null) {
            response.setSlotId(entity.getSlot().getSlotId());
        }

        // Thông tin Zone (có thể null)
        if (entity.getZone() != null) {
            response.setZoneId(entity.getZone().getZoneId());
        }

        // Thời hạn và phí
        response.setStartDate(entity.getStartDate());
        response.setEndDate(entity.getEndDate());
        response.setMonthlyFee(entity.getMonthlyFee());
        response.setStatus(entity.getStatus());
        response.setCreatedAt(entity.getCreatedAt());

        // Tính toán remainingDays
        if (entity.getEndDate() != null) {
            long remaining = java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDate.now(), entity.getEndDate());
            response.setRemainingDays(remaining > 0 ? (int) remaining : 0);
        } else {
            response.setRemainingDays(0);
        }

        // Lấy Payment ID nếu đang PENDING
        if (SubscriptionStatus.PENDING.name().equals(entity.getStatus())) {
            paymentRepository.findFirstBySubscription_SubscriptionIdOrderByPaymentIdDesc(entity.getSubscriptionId())
                .ifPresent(payment -> {
                    if ("PENDING".equals(payment.getPaymentStatus())) {
                        response.setPaymentId(payment.getPaymentId());
                    }
                });
        }

        return response;
    }
}
