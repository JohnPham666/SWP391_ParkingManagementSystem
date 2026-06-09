package com.parking.management.module.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
    boolean existsByVehicle_VehicleId(Integer vehicleId);
    Optional<Reservation> findFirstByVehicle_VehicleIdAndSlot_SlotIdAndStatus(Integer vehicleId, Integer slotId, String status);
    List<Reservation> findByUser_UserId(Integer userId);
}