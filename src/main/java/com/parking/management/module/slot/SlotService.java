package com.parking.management.module.slot;

import com.parking.management.common.ResourceNotFoundException;
import com.parking.management.module.vehicle.VehicleType;
import com.parking.management.module.vehicle.VehicleTypeRepository;
import com.parking.management.module.zone.Zone;
import com.parking.management.module.zone.ZoneService;
import com.parking.management.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SlotService {
    private final ParkingSlotRepository repository;
    private final ZoneService zoneService;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final SecurityUtils securityUtils;

    @Transactional
    public SlotResponse create(SlotRequest request) {
        validateSlot(request, null);
        ParkingSlot slot = new ParkingSlot();
        applyRequest(slot, request);
        return toResponse(repository.save(slot));
    }

    @Transactional(readOnly = true)
    public SlotResponse getById(Integer id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<SlotResponse> getAll(Integer zoneId, Integer vehicleTypeId) {
        Integer buildingId = securityUtils.getBuildingId();
        
        List<ParkingSlot> slots = repository.findSlotsForMonitoring(buildingId, null, zoneId, vehicleTypeId);
        
        return slots.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SlotResponse> getAvailableSlots(Integer buildingIdParam, Integer floorId, Integer zoneId, Integer vehicleTypeId) {
        Integer userBuildingId = securityUtils.getBuildingId();
        Integer finalBuildingId = userBuildingId != null ? userBuildingId : buildingIdParam;

        return repository.findAvailableSlots(finalBuildingId, floorId, zoneId, vehicleTypeId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SlotResponse update(Integer id, SlotRequest request) {
        validateSlot(request, id);
        ParkingSlot slot = findEntity(id);
        applyRequest(slot, request);
        return toResponse(repository.save(slot));
    }

    @Transactional
    public void delete(Integer id) {
        ParkingSlot slot = findEntity(id);
        repository.delete(slot);
    }

    @Transactional
    public SlotResponse updateStatus(Integer id, SlotStatusUpdateRequest request) {
        ParkingSlot slot = findEntity(id);
        applyStatus(slot, request.getStatus(), request.getCurrentOccupancy());
        return toResponse(repository.save(slot));
    }

    @Transactional
    public ParkingSlot markReserved(Integer id) {
        ParkingSlot slot = findEntity(id);
        applyStatus(slot, SlotStatus.RESERVED, slot.getCurrentOccupancy());
        return repository.save(slot);
    }

    @Transactional
    public ParkingSlot markOccupied(Integer id) {
        ParkingSlot slot = findEntity(id);
        applyStatus(slot, SlotStatus.OCCUPIED, slot.getCapacity());
        return repository.save(slot);
    }

    @Transactional
    public ParkingSlot markAvailable(Integer id) {
        ParkingSlot slot = findEntity(id);
        applyStatus(slot, SlotStatus.AVAILABLE, 0);
        return repository.save(slot);
    }

    public ParkingSlot findEntity(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with id: " + id));
    }

    private void applyRequest(ParkingSlot slot, SlotRequest request) {
        Zone zone = zoneService.findEntity(request.getZoneId());
        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle type not found with id: " + request.getVehicleTypeId()));

        slot.setZone(zone);
        slot.setSlotCode(request.getSlotCode().trim());
        slot.setVehicleType(vehicleType);
        slot.setArea(request.getArea());
        slot.setCapacity(request.getCapacity());
        slot.setCurrentOccupancy(request.getCurrentOccupancy());
        slot.setStatus(request.getStatus() == null ? SlotStatus.AVAILABLE : request.getStatus());
        slot.setIsActive(request.getIsActive() == null ? Boolean.TRUE : request.getIsActive());
    }

    private void validateSlot(SlotRequest request, Integer currentSlotId) {
        String slotCode = request.getSlotCode().trim();
        boolean codeExists = currentSlotId == null
                ? repository.existsBySlotCodeIgnoreCase(slotCode)
                : repository.existsBySlotCodeIgnoreCaseAndSlotIdNot(slotCode, currentSlotId);
        if (codeExists) {
            throw new IllegalArgumentException("Slot code already exists");
        }
        if (request.getCurrentOccupancy() > request.getCapacity()) {
            throw new IllegalArgumentException("Current occupancy must not exceed capacity");
        }
    }

    private void applyStatus(ParkingSlot slot, SlotStatus status, Integer requestedOccupancy) {
        int occupancy = requestedOccupancy == null ? deriveOccupancy(slot, status) : requestedOccupancy;
        if (occupancy > slot.getCapacity()) {
            throw new IllegalArgumentException("Current occupancy must not exceed capacity");
        }
        if (status == SlotStatus.AVAILABLE && occupancy >= slot.getCapacity()) {
            throw new IllegalArgumentException("Available slot must have current occupancy lower than capacity");
        }
        if (status == SlotStatus.OCCUPIED && occupancy <= 0) {
            throw new IllegalArgumentException("Occupied slot must have current occupancy greater than 0");
        }
        if (Boolean.FALSE.equals(slot.getIsActive()) && status != SlotStatus.LOCKED) {
            throw new IllegalArgumentException("Inactive slot can only be set to LOCKED");
        }

        slot.setStatus(status);
        slot.setCurrentOccupancy(occupancy);
    }

    private int deriveOccupancy(ParkingSlot slot, SlotStatus status) {
        return switch (status) {
            case AVAILABLE, RESERVED, LOCKED -> 0;
            case OCCUPIED -> slot.getCapacity();
        };
    }

    private SlotResponse toResponse(ParkingSlot slot) {
        SlotResponse response = new SlotResponse();
        response.setSlotId(slot.getSlotId());
        response.setZoneId(slot.getZone().getZoneId());
        response.setZoneName(slot.getZone().getZoneName());
        response.setFloorId(slot.getZone().getFloor().getFloorId());
        response.setFloorName(slot.getZone().getFloor().getFloorName());
        response.setBuildingId(slot.getZone().getFloor().getBuilding().getBuildingId());
        response.setBuildingName(slot.getZone().getFloor().getBuilding().getBuildingName());
        response.setSlotCode(slot.getSlotCode());
        response.setVehicleTypeId(slot.getVehicleType().getVehicleTypeId());
        response.setVehicleTypeName(slot.getVehicleType().getTypeName());
        response.setArea(slot.getArea());
        response.setCapacity(slot.getCapacity());
        response.setCurrentOccupancy(slot.getCurrentOccupancy());
        response.setStatus(slot.getStatus());
        response.setIsActive(slot.getIsActive());
        return response;
    }
}
