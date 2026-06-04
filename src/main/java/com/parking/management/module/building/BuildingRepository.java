package com.parking.management.module.building;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Integer> {
    // Custom query 1
    // List<Building> findBySomeField(String field);
}
