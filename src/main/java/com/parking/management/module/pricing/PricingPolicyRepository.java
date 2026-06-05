package com.parking.management.module.pricing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PricingPolicyRepository extends JpaRepository<PricingPolicy, Long> {

    // Tìm danh sách pricing policy theo loại xe
    List<PricingPolicy> findByVehicleTypeId(Long vehicleTypeId);

    // Tìm pricing policy đang hiệu lực theo loại xe và thời điểm hiện tại
    // EffectiveFrom <= now AND (EffectiveTo IS NULL OR EffectiveTo >= now)
    @Query("SELECT p FROM PricingPolicy p WHERE p.vehicleTypeId = :vehicleTypeId " +
           "AND p.effectiveFrom <= :now " +
           "AND (p.effectiveTo IS NULL OR p.effectiveTo >= :now)")
    Optional<PricingPolicy> findActivePolicyByVehicleTypeId(
            @Param("vehicleTypeId") Long vehicleTypeId,
            @Param("now") LocalDateTime now);
}
