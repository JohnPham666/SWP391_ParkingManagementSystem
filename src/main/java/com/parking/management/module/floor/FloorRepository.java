package com.parking.management.module.floor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FloorRepository extends JpaRepository<Floor, Long> {
    // Custom query 1
    // List<Floor> findBySomeField(String field);
}
