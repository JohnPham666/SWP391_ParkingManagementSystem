package com.parking.management.module.slot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Integer> {
    List<ParkingSlot> findByZone_ZoneId(Integer zoneId);

    List<ParkingSlot> findByVehicleType_VehicleTypeId(Integer vehicleTypeId);

    boolean existsBySlotCodeIgnoreCase(String slotCode);

    boolean existsBySlotCodeIgnoreCaseAndSlotIdNot(String slotCode, Integer slotId);

    @Query("""
            select slot
            from ParkingSlot slot
            where slot.status = com.parking.management.module.slot.SlotStatus.AVAILABLE
              and slot.isActive = true
              and slot.currentOccupancy < slot.capacity
              and (:buildingId is null or slot.zone.floor.building.buildingId = :buildingId)
              and (:floorId is null or slot.zone.floor.floorId = :floorId)
              and (:zoneId is null or slot.zone.zoneId = :zoneId)
              and (:vehicleTypeId is null or slot.vehicleType.vehicleTypeId = :vehicleTypeId)
            order by slot.zone.floor.building.buildingId, slot.zone.floor.floorNumber, slot.zone.zoneName, slot.slotCode
            """)
    List<ParkingSlot> findAvailableSlots(
            @Param("buildingId") Integer buildingId,
            @Param("floorId") Integer floorId,
            @Param("zoneId") Integer zoneId,
            @Param("vehicleTypeId") Integer vehicleTypeId);
}
