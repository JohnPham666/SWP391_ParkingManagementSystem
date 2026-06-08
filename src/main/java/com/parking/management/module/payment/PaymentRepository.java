package com.parking.management.module.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    Optional<Payment> findBySession_SessionId(Integer sessionId);

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
}