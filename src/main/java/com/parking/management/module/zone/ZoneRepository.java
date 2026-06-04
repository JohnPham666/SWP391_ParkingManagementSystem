package com.parking.management.module.zone;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ZoneRepository extends JpaRepository<Zone, Integer> {
    // Custom query 1
    // List<Zone> findBySomeField(String field);
}
