package com.parking.management.module.floor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FloorRepository extends JpaRepository<Floor, Integer> {
    List<Floor> findByBuilding_BuildingId(Integer buildingId);

    boolean existsByBuilding_BuildingIdAndFloorNumber(Integer buildingId, Integer floorNumber);

    boolean existsByBuilding_BuildingIdAndFloorNumberAndFloorIdNot(Integer buildingId, Integer floorNumber, Integer floorId);
}
