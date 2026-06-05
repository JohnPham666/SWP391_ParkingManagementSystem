package com.parking.management.module.slot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Integer> {
    List<ParkingSlot> findByZone_ZoneId(Integer zoneId);

    List<ParkingSlot> findByVehicleType_VehicleTypeId(Integer vehicleTypeId);

    boolean existsBySlotCodeIgnoreCase(String slotCode);

    boolean existsBySlotCodeIgnoreCaseAndSlotIdNot(String slotCode, Integer slotId);
}
