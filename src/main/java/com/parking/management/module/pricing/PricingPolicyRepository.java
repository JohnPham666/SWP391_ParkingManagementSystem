package com.parking.management.module.pricing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PricingPolicyRepository extends JpaRepository<PricingPolicy, Integer> {
    // Custom query 1
    // List<PricingPolicy> findBySomeField(String field);
}
