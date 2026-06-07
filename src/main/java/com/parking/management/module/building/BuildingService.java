package com.parking.management.module.building;

import com.parking.management.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BuildingService {
    private final BuildingRepository repository;

    @Transactional
    public BuildingResponse create(BuildingRequest request) {
        validateOperatingTime(request);
        Building building = new Building();
        applyRequest(building, request);
        return toResponse(repository.save(building));
    }

    @Transactional(readOnly = true)
    public BuildingResponse getById(Integer id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<BuildingResponse> getAll(String keyword) {
        List<Building> buildings = keyword == null || keyword.isBlank()
                ? repository.findAll()
                : repository.findByBuildingNameContainingIgnoreCase(keyword.trim());
        return buildings.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public BuildingResponse update(Integer id, BuildingRequest request) {
        validateOperatingTime(request);
        Building building = findEntity(id);
        applyRequest(building, request);
        return toResponse(repository.save(building));
    }

    @Transactional
    public void delete(Integer id) {
        Building building = findEntity(id);
        repository.delete(building);
    }

    public Building findEntity(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with id: " + id));
    }

    private void applyRequest(Building building, BuildingRequest request) {
        building.setBuildingName(request.getBuildingName().trim());
        building.setAddress(request.getAddress());
        building.setTotalFloors(request.getTotalFloors());
        building.setOperatingStartTime(request.getOperatingStartTime());
        building.setOperatingEndTime(request.getOperatingEndTime());
    }

    private void validateOperatingTime(BuildingRequest request) {
        if (request.getOperatingStartTime() != null
                && request.getOperatingEndTime() != null
                && !request.getOperatingStartTime().isBefore(request.getOperatingEndTime())) {
            throw new IllegalArgumentException("Operating start time must be before operating end time");
        }
    }

    private BuildingResponse toResponse(Building building) {
        BuildingResponse response = new BuildingResponse();
        response.setBuildingId(building.getBuildingId());
        response.setBuildingName(building.getBuildingName());
        response.setAddress(building.getAddress());
        response.setTotalFloors(building.getTotalFloors());
        response.setOperatingStartTime(building.getOperatingStartTime());
        response.setOperatingEndTime(building.getOperatingEndTime());
        response.setCreatedAt(building.getCreatedAt());
        return response;
    }
}
