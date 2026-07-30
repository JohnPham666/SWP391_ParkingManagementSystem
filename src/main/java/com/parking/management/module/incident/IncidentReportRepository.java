package com.parking.management.module.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, Integer> {
    List<IncidentReport> findByIncidentType(String incidentType);

    List<IncidentReport> findByStatus(String status);
    
    List<IncidentReport> findAllByOrderByCreatedAtDesc();
    List<IncidentReport> findByReportedBy_UserIdOrderByCreatedAtDesc(Integer userId);

    /**
     * Lấy tất cả incident có filter theo building của Manager.
     *
     * Logic:
     * - Nếu buildingId IS NULL (Admin) → trả về TẤT CẢ incident.
     * - Nếu buildingId IS NOT NULL (Manager) → trả về:
     *     + Incident CÓ gắn với Session: Chỉ hiện cho Manager của Building chứa Session đó.
     *     + Incident KHÔNG gắn với Session: 
     *           - Từ Driver (không có building) → Hiện cho TẤT CẢ Manager
     *           - Từ Staff (có building) → Hiện cho Manager cùng Building
     */
    @Query("SELECT i FROM IncidentReport i " +
       "LEFT JOIN i.reportedBy u " +
       "LEFT JOIN u.building ub " +
       "LEFT JOIN i.session s " +
       "LEFT JOIN s.slot sl " +
       "LEFT JOIN sl.zone z " +
       "LEFT JOIN z.floor f " +
       "LEFT JOIN f.building sb " +
       "WHERE :buildingId IS NULL " +
       "OR (s.sessionId IS NOT NULL AND sb.buildingId = :buildingId) " +
       "OR (s.sessionId IS NULL AND (ub.buildingId IS NULL OR ub.buildingId = :buildingId)) " +
       "ORDER BY i.createdAt DESC")
    List<IncidentReport> findAllWithBuildingFilter(@Param("buildingId") Integer buildingId);
}