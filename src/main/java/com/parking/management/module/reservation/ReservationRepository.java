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
    List<Reservation> findByStatus(String status);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Reservation r WHERE r.slot.slotId = :slotId AND r.status = 'CONFIRMED' AND r.reservationStart < :endTime AND r.reservationEnd > :startTime")
    List<Reservation> findOverlappingReservations(
            @org.springframework.data.repository.query.Param("slotId") Integer slotId,
            @org.springframework.data.repository.query.Param("startTime") java.time.LocalDateTime startTime,
            @org.springframework.data.repository.query.Param("endTime") java.time.LocalDateTime endTime
    );

    /**
     * Tìm các Reservation PENDING đã tạo trước cutoffTime (quá 15 phút).
     * Dùng cho ReservationScheduler để tự động hủy rác dữ liệu.
     */
    @org.springframework.data.jpa.repository.Query("SELECT r FROM Reservation r WHERE r.status = 'PENDING' AND r.createdAt < :cutoffTime AND NOT EXISTS (SELECT p FROM Payment p WHERE p.reservation = r AND p.paymentMethod = 'CASH')")
    List<Reservation> findStalePendingReservations(
            @org.springframework.data.repository.query.Param("cutoffTime") java.time.LocalDateTime cutoffTime
    );

    /**
     * Tìm các Reservation PENDING chọn thanh toán CASH, mà thời gian bắt đầu đặt đỗ đã quá cutoffTime (quá 30 phút).
     */
    @org.springframework.data.jpa.repository.Query("SELECT r FROM Reservation r WHERE r.status = 'PENDING' AND r.reservationStart < :cutoffTime AND EXISTS (SELECT p FROM Payment p WHERE p.reservation = r AND p.paymentMethod = 'CASH')")
    List<Reservation> findStaleCashReservations(
            @org.springframework.data.repository.query.Param("cutoffTime") java.time.LocalDateTime cutoffTime
    );
}