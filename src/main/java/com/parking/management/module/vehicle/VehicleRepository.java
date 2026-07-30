package com.parking.management.module.vehicle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;
// Repository JPA truy vấn bảng Vehicles trong PostgreSQL
// Spring Data JPA tự động sinh SQL query từ tên method (Query Derivation)
@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {

    // ===== Kiểm tra trùng lặp khi TẠO MỚI (dùng trong validateUniqueOnCreate) =====
    boolean existsByLicensePlate(String licensePlate);        // Biển số đã tồn tại chưa?
    boolean existsByEngineNumber(String engineNumber);        // Số máy đã tồn tại chưa?
    boolean existsByChassisNumber(String chassisNumber);      // Số khung đã tồn tại chưa?

    // ===== Kiểm tra trùng lặp khi CẬP NHẬT (bỏ qua chính xe đang update) =====
    // "AndVehicleIdNot" → WHERE ... AND vehicleid != ?
    boolean existsByLicensePlateAndVehicleIdNot(String licensePlate, Integer vehicleId);
    boolean existsByEngineNumberAndVehicleIdNot(String engineNumber, Integer vehicleId);
    boolean existsByChassisNumberAndVehicleIdNot(String chassisNumber, Integer vehicleId);

    // ===== Tìm xe theo user =====
    List<Vehicle> findByUserUserId(Integer userId);                       // Tất cả xe của user (kể cả soft deleted)
    List<Vehicle> findByUserUserIdAndIsActiveTrue(Integer userId);         // Xe active của user (dùng chính)
    Optional<Vehicle> findByLicensePlate(String licensePlate);  // Tìm xe theo biển số (dùng cho check-in/session)

    /**
     * Lấy tất cả vehicle có filter theo building của Manager.
     */
    @Query("SELECT v FROM Vehicle v " +
       "JOIN FETCH v.user u " +
       "LEFT JOIN u.building b " +
       "WHERE :buildingId IS NULL OR b.buildingId = :buildingId " +
       "ORDER BY v.vehicleId DESC")
    List<Vehicle> findAllWithBuildingFilter(@Param("buildingId") Integer buildingId);
}