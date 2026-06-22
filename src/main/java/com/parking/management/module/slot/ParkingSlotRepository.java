package com.parking.management.module.slot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.parking.management.module.slot.SlotStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Integer> {

    /**
     * Tìm slot trống đầu tiên phù hợp với loại xe.
     * Kiểm tra ĐỒNG THỜI: status = AVAILABLE, isActive = true, VÀ currentOccupancy < capacity.
     * Tránh lỗi: slot AVAILABLE nhưng thực tế đã đầy do race condition.
     */
    @Query("SELECT s FROM ParkingSlot s WHERE s.vehicleType.vehicleTypeId = :vehicleTypeId " +
           "AND s.status = com.parking.management.module.slot.SlotStatus.AVAILABLE " +
           "AND s.isActive = true " +
           "AND s.currentOccupancy < s.capacity " +
           "ORDER BY s.slotCode ASC LIMIT 1")
    Optional<ParkingSlot> findFirstAvailableSlot(
            @Param("vehicleTypeId") Integer vehicleTypeId
    );

    List<ParkingSlot> findByZone_ZoneId(Integer zoneId);

    List<ParkingSlot> findByVehicleType_VehicleTypeId(Integer vehicleTypeId);

    boolean existsBySlotCodeIgnoreCase(String slotCode);

    boolean existsBySlotCodeIgnoreCaseAndSlotIdNot(String slotCode, Integer slotId);

    long countByStatus(SlotStatus status);

    long countByIsActiveTrue();

    long countByStatusAndIsActiveTrue(SlotStatus status);

    long countByZone_Floor_FloorIdAndIsActiveTrue(Integer floorId);

    long countByZone_Floor_FloorIdAndStatusAndIsActiveTrue(Integer floorId, SlotStatus status);

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

    @Query("""
            select slot
            from ParkingSlot slot
            join fetch slot.zone zone
            join fetch zone.floor floor
            join fetch floor.building building
            join fetch slot.vehicleType vehicleType
            where (:buildingId is null or building.buildingId = :buildingId)
              and (:floorId is null or floor.floorId = :floorId)
              and (:zoneId is null or zone.zoneId = :zoneId)
              and (:vehicleTypeId is null or vehicleType.vehicleTypeId = :vehicleTypeId)
            order by building.buildingName, floor.floorNumber, zone.zoneName, slot.slotCode
            """)
    List<ParkingSlot> findSlotsForMonitoring(
            @Param("buildingId") Integer buildingId,
            @Param("floorId") Integer floorId,
            @Param("zoneId") Integer zoneId,
            @Param("vehicleTypeId") Integer vehicleTypeId);
}
