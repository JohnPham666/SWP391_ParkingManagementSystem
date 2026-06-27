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

    @org.springframework.data.jpa.repository.Query("SELECT i FROM IncidentReport i WHERE :buildingId IS NULL OR " +
       "(i.reportedBy.building.buildingId = :buildingId OR " +
       "(i.session IS NOT NULL AND i.session.slot.zone.floor.building.buildingId = :buildingId)) " +
       "ORDER BY i.createdAt DESC")
    List<IncidentReport> findAllWithBuildingFilter(@org.springframework.data.repository.query.Param("buildingId") Integer buildingId);
}