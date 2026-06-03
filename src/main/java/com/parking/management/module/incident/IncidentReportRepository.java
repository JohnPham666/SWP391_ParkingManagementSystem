package com.parking.management.module.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, Long> {
    // Custom query 1
    // List<IncidentReport> findBySomeField(String field);
}
