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
}
