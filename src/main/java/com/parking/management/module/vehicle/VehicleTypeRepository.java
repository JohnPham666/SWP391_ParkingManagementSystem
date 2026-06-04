package com.parking.management.module.vehicle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleTypeRepository extends JpaRepository<VehicleType, Integer> {
    boolean existsByTypeName(String typeName);

    boolean existsByTypeNameAndVehicleTypeIdNot(String typeName, Integer vehicleTypeId);
}