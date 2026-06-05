package com.parking.management.module.slot;

import com.parking.management.common.ResourceNotFoundException;
import com.parking.management.module.vehicle.VehicleType;
import com.parking.management.module.vehicle.VehicleTypeRepository;
import com.parking.management.module.zone.Zone;
import com.parking.management.module.zone.ZoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SlotService {
    private final ParkingSlotRepository repository;
    private final ZoneService zoneService;
    private final VehicleTypeRepository vehicleTypeRepository;

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
        List<ParkingSlot> slots;
        if (zoneId != null) {
            slots = repository.findByZone_ZoneId(zoneId);
        } else if (vehicleTypeId != null) {
            slots = repository.findByVehicleType_VehicleTypeId(vehicleTypeId);
        } else {
            slots = repository.findAll();
        }
        return slots.stream().map(this::toResponse).collect(Collectors.toList());
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
