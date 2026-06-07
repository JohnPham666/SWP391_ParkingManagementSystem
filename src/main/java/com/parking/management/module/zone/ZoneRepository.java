package com.parking.management.module.zone;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ZoneRepository extends JpaRepository<Zone, Integer> {
    List<Zone> findByFloor_FloorId(Integer floorId);

    boolean existsByFloor_FloorIdAndZoneNameIgnoreCase(Integer floorId, String zoneName);

    boolean existsByFloor_FloorIdAndZoneNameIgnoreCaseAndZoneIdNot(Integer floorId, String zoneName, Integer zoneId);
}
