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

        // Kiểm tra xem xe này đã có vé tháng ACTIVE chưa
        List<MonthlySubscription> existingSubs = repository.findByVehicle_VehicleId(request.getVehicleId());
        boolean hasActiveSub = existingSubs.stream()
                .anyMatch(sub -> SubscriptionStatus.ACTIVE.name().equals(sub.getStatus()));
        
        if (hasActiveSub) {
            throw new IllegalArgumentException("This vehicle already has an ACTIVE monthly subscription.");
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

        // Set ngày bắt đầu
        subscription.setStartDate(request.getStartDate());

        // Tự tính endDate = startDate + 1 tháng
        subscription.setEndDate(request.getStartDate().plusMonths(1));

        // Set phí hàng tháng
        subscription.setMonthlyFee(request.getMonthlyFee());

        // Vé mới tạo -> trạng thái = ACTIVE
        subscription.setStatus(SubscriptionStatus.ACTIVE.name());

        // Set thời gian tạo
        subscription.setCreatedAt(LocalDateTime.now());

        // Lưu vào database
        MonthlySubscription saved = repository.save(subscription);

        // Map sang response và trả về
        return entityMapToResponse(saved);
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
        subscription.setStartDate(request.getStartDate());
        subscription.setEndDate(request.getStartDate().plusMonths(1));

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

        return response;
    }
}
