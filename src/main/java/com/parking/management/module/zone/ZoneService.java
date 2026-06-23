package com.parking.management.module.zone;

import com.parking.management.common.ResourceNotFoundException;
import com.parking.management.module.floor.Floor;
import com.parking.management.module.floor.FloorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ZoneService {
    private final ZoneRepository repository;
    private final FloorService floorService;

    @Transactional
    public ZoneResponse create(ZoneRequest request) {
        validateUniqueZoneName(request.getFloorId(), request.getZoneName(), null);
        Zone zone = new Zone();
        applyRequest(zone, request);
        return toResponse(repository.save(zone));
    }

    @Transactional(readOnly = true)
    public ZoneResponse getById(Integer id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<ZoneResponse> getAll(Integer floorId) {
        List<Zone> zones = floorId == null ? repository.findAll() : repository.findByFloor_FloorId(floorId);
        return zones.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public ZoneResponse update(Integer id, ZoneRequest request) {
        validateUniqueZoneName(request.getFloorId(), request.getZoneName(), id);
        Zone zone = findEntity(id);
        applyRequest(zone, request);
        return toResponse(repository.save(zone));
    }

    @Transactional
    public void delete(Integer id) {
        Zone zone = findEntity(id);
        repository.delete(zone);
    }

    public Zone findEntity(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Zone not found with id: " + id));
    }

    private void applyRequest(Zone zone, ZoneRequest request) {
        Floor floor = floorService.findEntity(request.getFloorId());
        zone.setFloor(floor);
        zone.setZoneName(request.getZoneName().trim());
        zone.setDescription(request.getDescription());
    }

    private void validateUniqueZoneName(Integer floorId, String zoneName, Integer currentZoneId) {
        boolean exists = currentZoneId == null
                ? repository.existsByFloor_FloorIdAndZoneNameIgnoreCase(floorId, zoneName.trim())
                : repository.existsByFloor_FloorIdAndZoneNameIgnoreCaseAndZoneIdNot(floorId, zoneName.trim(), currentZoneId);
        if (exists) {
            throw new IllegalArgumentException("Zone name already exists in this floor");
        }
    }

    private ZoneResponse toResponse(Zone zone) {
        ZoneResponse response = new ZoneResponse();
        response.setZoneId(zone.getZoneId());
        response.setFloorId(zone.getFloor().getFloorId());
        response.setFloorName(zone.getFloor().getFloorName());
        response.setBuildingId(zone.getFloor().getBuilding().getBuildingId());
        response.setBuildingName(zone.getFloor().getBuilding().getBuildingName());
        response.setZoneName(zone.getZoneName());
        response.setDescription(zone.getDescription());
        return response;
    }
}
