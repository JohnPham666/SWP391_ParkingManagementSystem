package com.parking.management.module.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingSessionRepository extends JpaRepository<ParkingSession, Integer> {
    // Custom query 1
    // List<ParkingSession> findBySomeField(String field);
}
