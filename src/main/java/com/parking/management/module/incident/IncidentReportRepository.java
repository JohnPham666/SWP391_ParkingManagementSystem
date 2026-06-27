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

    @org.springframework.data.jpa.repository.Query("SELECT i FROM IncidentReport i " +
       "LEFT JOIN i.reportedBy u " +
       "LEFT JOIN u.building ub " +
       "LEFT JOIN i.session s " +
       "LEFT JOIN s.slot sl " +
       "LEFT JOIN sl.zone z " +
       "LEFT JOIN z.floor f " +
       "LEFT JOIN f.building sb " +
       "WHERE :buildingId IS NULL OR " +
       "(ub.buildingId = :buildingId OR sb.buildingId = :buildingId) " +
       "ORDER BY i.createdAt DESC")
    List<IncidentReport> findAllWithBuildingFilter(@org.springframework.data.repository.query.Param("buildingId") Integer buildingId);
}