package com.parking.management.module.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    // Custom query 1
    // List<Payment> findBySomeField(String field);
}
