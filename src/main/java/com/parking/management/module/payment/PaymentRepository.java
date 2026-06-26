package com.parking.management.module.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

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
           WHERE p.paymentStatus = 'PAID'
             AND p.paidAt BETWEEN :fromDateTime AND :toDateTime
           """)
    BigDecimal getTotalRevenue(LocalDateTime fromDateTime, LocalDateTime toDateTime);

    @Query("""
           SELECT COUNT(p)
           FROM Payment p
           WHERE p.paymentStatus = 'PAID'
             AND p.paidAt BETWEEN :fromDateTime AND :toDateTime
           """)
    Long countPaidPayments(LocalDateTime fromDateTime, LocalDateTime toDateTime);

    @Query(value = """
           SELECT DATE(p.paidat) as date, SUM(p.amount) as revenue
           FROM payments p
           WHERE p.paymentstatus = 'PAID'
             AND p.paidat BETWEEN :fromDateTime AND :toDateTime
           GROUP BY DATE(p.paidat)
           ORDER BY DATE(p.paidat) ASC
           """, nativeQuery = true)
    java.util.List<Object[]> getDailyRevenueTrendNative(LocalDateTime fromDateTime, LocalDateTime toDateTime);
}