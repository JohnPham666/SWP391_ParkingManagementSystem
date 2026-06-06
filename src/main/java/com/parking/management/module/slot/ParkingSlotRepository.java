package com.parking.management.module.slot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Integer> {
    Optional<ParkingSlot> findFirstByVehicleType_VehicleTypeIdAndStatusAndIsActiveTrue(
            Integer vehicleTypeId,
            String status
    );
}
