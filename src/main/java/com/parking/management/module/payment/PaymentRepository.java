package com.parking.management.module.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    Optional<Payment> findFirstBySession_SessionIdOrderByPaymentIdDesc(Integer sessionId);
    Optional<Payment> findFirstByReservation_ReservationIdOrderByPaymentIdDesc(Integer reservationId);

    @Query("""
           SELECT COALESCE(SUM(p.amount), 0)
           FROM Payment p
           LEFT JOIN p.session s
           LEFT JOIN p.reservation r
           WHERE p.paymentStatus = 'PAID'
             AND p.paidAt BETWEEN :fromDateTime AND :toDateTime
             AND (:buildingId IS NULL OR (s.slot.zone.floor.building.buildingId = :buildingId OR r.slot.zone.floor.building.buildingId = :buildingId))
           """)
    BigDecimal getTotalRevenue(@Param("fromDateTime") LocalDateTime fromDateTime, @Param("toDateTime") LocalDateTime toDateTime, @Param("buildingId") Integer buildingId);

    @Query("""
           SELECT COUNT(p)
           FROM Payment p
           LEFT JOIN p.session s
           LEFT JOIN p.reservation r
           WHERE p.paymentStatus = 'PAID'
             AND p.paidAt BETWEEN :fromDateTime AND :toDateTime
             AND (:buildingId IS NULL OR (s.slot.zone.floor.building.buildingId = :buildingId OR r.slot.zone.floor.building.buildingId = :buildingId))
           """)
    Long countPaidPayments(@Param("fromDateTime") LocalDateTime fromDateTime, @Param("toDateTime") LocalDateTime toDateTime, @Param("buildingId") Integer buildingId);

    @Query("""
           SELECT cast(p.paidAt as date) as date, SUM(p.amount) as revenue
           FROM Payment p
           LEFT JOIN p.session s
           LEFT JOIN p.reservation r
           WHERE p.paymentStatus = 'PAID'
             AND p.paidAt BETWEEN :fromDateTime AND :toDateTime
             AND (:buildingId IS NULL OR (s.slot.zone.floor.building.buildingId = :buildingId OR r.slot.zone.floor.building.buildingId = :buildingId))
           GROUP BY cast(p.paidAt as date)
           ORDER BY cast(p.paidAt as date) ASC
           """)
    java.util.List<Object[]> getDailyRevenueTrend(@Param("fromDateTime") LocalDateTime fromDateTime, @Param("toDateTime") LocalDateTime toDateTime, @Param("buildingId") Integer buildingId);
}