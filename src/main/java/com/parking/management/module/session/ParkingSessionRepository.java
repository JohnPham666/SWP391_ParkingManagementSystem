package com.parking.management.module.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParkingSessionRepository extends JpaRepository<ParkingSession, Integer> {

    /*
     * Tìm session đang hoạt động của một xe.
     * Dùng để tránh một xe có nhiều session PARKING cùng lúc.
     */
    Optional<ParkingSession> findFirstByVehicle_VehicleIdAndStatus(Integer vehicleId, String status);

    boolean existsByVehicle_VehicleId(Integer vehicleId);

    /*
     * Tìm active parking session theo license plate.
     * Dùng cho flow exit/payment: staff nhập license plate number-> lấy sessionId.
     */
    Optional<ParkingSession> findFirstByVehicle_LicensePlateIgnoreCaseAndStatusOrderBySessionIdDesc(
            String licensePlate,
            String status
    );

    Optional<ParkingSession> findFirstByVehicle_LicensePlateIgnoreCaseAndStatusInOrderBySessionIdDesc(
            String licensePlate,
            java.util.List<String> statuses
    );

    /*
     * Lấy danh sách tất cả các session đang hoạt động của một user.
     * Dùng để tránh N+1 API calls ở Frontend.
     */
    java.util.List<ParkingSession> findByVehicle_User_UserIdAndStatus(Integer userId, String status);
}
