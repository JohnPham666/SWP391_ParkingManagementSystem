package com.parking.management.module.vehicle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {
    boolean existsByLicensePlate(String licensePlate);
    boolean existsByEngineNumber(String engineNumber);
    boolean existsByChassisNumber(String chassisNumber);

    boolean existsByLicensePlateAndVehicleIdNot(String licensePlate, Integer vehicleId);
    boolean existsByEngineNumberAndVehicleIdNot(String engineNumber, Integer vehicleId);
    boolean existsByChassisNumberAndVehicleIdNot(String chassisNumber, Integer vehicleId);

    List<Vehicle> findByUserUserId(Integer userId);
    List<Vehicle> findByUserUserIdAndIsActiveTrue(Integer userId);
}