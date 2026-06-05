package com.parking.management.module.subscription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<MonthlySubscription, Integer> {

    // Tìm vé tháng theo userId
    List<MonthlySubscription> findByUser_UserId(Integer userId);

    // Tìm vé tháng theo vehicleId
    List<MonthlySubscription> findByVehicle_VehicleId(Integer vehicleId);

    // Tìm vé tháng theo trạng thái (VD: tìm tất cả vé đang ACTIVE)
    List<MonthlySubscription> findByStatus(String status);
}
