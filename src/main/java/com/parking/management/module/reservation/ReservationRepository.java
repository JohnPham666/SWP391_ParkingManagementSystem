package com.parking.management.module.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
    boolean existsByVehicle_VehicleId(Integer vehicleId);
    boolean existsByVehicle_VehicleIdAndStatusIn(Integer vehicleId, List<String> statuses);
    boolean existsByVehicle_VehicleIdAndStatusInAndReservationIdNot(Integer vehicleId, List<String> statuses, Integer reservationId);
    Optional<Reservation> findFirstByVehicle_VehicleIdAndSlot_SlotIdAndStatus(Integer vehicleId, Integer slotId, String status);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"user", "vehicle", "vehicleType", "slot", "slot.zone", "slot.zone.floor", "slot.zone.floor.building"})
    List<Reservation> findAll();

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Reservation r WHERE (:buildingId IS NULL OR r.slot.zone.floor.building.buildingId = :buildingId)")
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"user", "vehicle", "vehicleType", "slot", "slot.zone", "slot.zone.floor", "slot.zone.floor.building"})
    List<Reservation> findAllWithBuildingFilter(@org.springframework.data.repository.query.Param("buildingId") Integer buildingId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"user", "vehicle", "vehicleType", "slot", "slot.zone", "slot.zone.floor", "slot.zone.floor.building"})
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