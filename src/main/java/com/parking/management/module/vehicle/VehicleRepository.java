package com.parking.management.module.vehicle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {
    // Custom query 1
    // List<Vehicle> findBySomeField(String field);
}
