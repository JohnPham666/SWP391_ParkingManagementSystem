package com.parking.management.module.floor;

import com.parking.management.common.ResourceNotFoundException;
import com.parking.management.module.building.Building;
import com.parking.management.module.building.BuildingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class FloorService {
    private final FloorRepository repository;
    private final BuildingService buildingService;

    @Transactional
    public FloorResponse create(FloorRequest request) {
        validateUniqueFloorNumber(request.getBuildingId(), request.getFloorNumber(), null);
        Floor floor = new Floor();
        applyRequest(floor, request);
        return toResponse(repository.save(floor));
    }

    @Transactional(readOnly = true)
    public FloorResponse getById(Integer id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<FloorResponse> getAll(Integer buildingId) {
        List<Floor> floors = buildingId == null ? repository.findAll() : repository.findByBuilding_BuildingId(buildingId);
        return floors.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public FloorResponse update(Integer id, FloorRequest request) {
        validateUniqueFloorNumber(request.getBuildingId(), request.getFloorNumber(), id);
        Floor floor = findEntity(id);
        applyRequest(floor, request);
        return toResponse(repository.save(floor));
    }

    @Transactional
    public void delete(Integer id) {
        Floor floor = findEntity(id);
        repository.delete(floor);
    }

    public Floor findEntity(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Floor not found with id: " + id));
    }

    private void applyRequest(Floor floor, FloorRequest request) {
        Building building = buildingService.findEntity(request.getBuildingId());
        floor.setBuilding(building);
        floor.setFloorNumber(request.getFloorNumber());
        floor.setFloorName(request.getFloorName().trim());
    }

    private void validateUniqueFloorNumber(Integer buildingId, Integer floorNumber, Integer currentFloorId) {
        boolean exists = currentFloorId == null
                ? repository.existsByBuilding_BuildingIdAndFloorNumber(buildingId, floorNumber)
                : repository.existsByBuilding_BuildingIdAndFloorNumberAndFloorIdNot(buildingId, floorNumber, currentFloorId);
        if (exists) {
            throw new IllegalArgumentException("Floor number already exists in this building");
        }
    }

    private FloorResponse toResponse(Floor floor) {
        FloorResponse response = new FloorResponse();
        response.setFloorId(floor.getFloorId());
        response.setBuildingId(floor.getBuilding().getBuildingId());
        response.setBuildingName(floor.getBuilding().getBuildingName());
        response.setFloorNumber(floor.getFloorNumber());
        response.setFloorName(floor.getFloorName());
        return response;
    }
}
