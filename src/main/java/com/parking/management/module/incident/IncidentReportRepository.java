package com.parking.management.module.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, Integer> {
    List<IncidentReport> findByIncidentType(String incidentType);

    List<IncidentReport> findByStatus(String status);
    
    List<IncidentReport> findAllByOrderByCreatedAtDesc();
    
    List<IncidentReport> findByReportedBy_UserIdOrderByCreatedAtDesc(Integer userId);
}