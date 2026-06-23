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
    @org.springframework.data.jpa.repository.Query("SELECT r FROM Reservation r WHERE r.slot.slotId = :slotId AND r.status IN ('PENDING', 'CONFIRMED') AND r.reservationStart < :endTime AND r.reservationEnd > :startTime")
    List<Reservation> findOverlappingReservations(
            @org.springframework.data.repository.query.Param("slotId") Integer slotId,
            @org.springframework.data.repository.query.Param("startTime") java.time.LocalDateTime startTime,
            @org.springframework.data.repository.query.Param("endTime") java.time.LocalDateTime endTime
    );

    /**
     * Tìm các Reservation PENDING đã tạo trước cutoffTime (quá 15 phút).
     * Dùng cho ReservationScheduler để tự động hủy rác dữ liệu.
     */
    @org.springframework.data.jpa.repository.Query("SELECT r FROM Reservation r WHERE r.status = 'PENDING' AND r.createdAt < :cutoffTime")
    List<Reservation> findStalePendingReservations(
            @org.springframework.data.repository.query.Param("cutoffTime") java.time.LocalDateTime cutoffTime
    );
}