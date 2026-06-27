package com.parking.management.module.monitoring;

import com.parking.management.module.building.Building;
import com.parking.management.module.floor.Floor;
import com.parking.management.module.slot.ParkingSlot;
import com.parking.management.module.slot.ParkingSlotRepository;
import com.parking.management.module.slot.SlotStatus;
import com.parking.management.module.zone.Zone;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MonitoringService {
    private final ParkingSlotRepository parkingSlotRepository;
    private final com.parking.management.security.SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public MonitoringDashboardResponse getParkingDashboard(
            Integer buildingId,
            Integer floorId,
            Integer zoneId,
            Integer vehicleTypeId) {
        Integer userBuildingId = securityUtils.getBuildingId();
        if (userBuildingId != null) {
            buildingId = userBuildingId; // Force manager/staff to only see their building
        }

        List<ParkingSlot> slots = parkingSlotRepository.findSlotsForMonitoring(buildingId, floorId, zoneId, vehicleTypeId);

        MonitoringDashboardResponse response = new MonitoringDashboardResponse();
        response.setGeneratedAt(LocalDateTime.now());
        response.setSummary(buildSummary(slots));
        response.setBuildings(buildBuildingResponses(slots));
        return response;
    }

    private List<BuildingDashboardResponse> buildBuildingResponses(List<ParkingSlot> slots) {
        Map<Building, List<ParkingSlot>> slotsByBuilding = slots.stream()
                .collect(Collectors.groupingBy(slot -> slot.getZone().getFloor().getBuilding()));

        return slotsByBuilding.entrySet().stream()
                .sorted(Map.Entry.comparingByKey((left, right) -> left.getBuildingName().compareToIgnoreCase(right.getBuildingName())))
                .map(entry -> {
                    Building building = entry.getKey();
                    List<ParkingSlot> buildingSlots = entry.getValue();

                    BuildingDashboardResponse buildingResponse = new BuildingDashboardResponse();
                    buildingResponse.setBuildingId(building.getBuildingId());
                    buildingResponse.setBuildingName(building.getBuildingName());
                    buildingResponse.setAddress(building.getAddress());
                    buildingResponse.setSummary(buildSummary(buildingSlots));
                    buildingResponse.setFloors(buildFloorResponses(buildingSlots));
                    return buildingResponse;
                })
                .collect(Collectors.toList());
    }

    private List<FloorDashboardResponse> buildFloorResponses(List<ParkingSlot> slots) {
        Map<Floor, List<ParkingSlot>> slotsByFloor = slots.stream()
                .collect(Collectors.groupingBy(slot -> slot.getZone().getFloor()));

        return slotsByFloor.entrySet().stream()
                .sorted(Map.Entry.comparingByKey((left, right) -> {
                    int floorCompare = left.getFloorNumber().compareTo(right.getFloorNumber());
                    if (floorCompare != 0) {
                        return floorCompare;
                    }
                    return left.getFloorId().compareTo(right.getFloorId());
                }))
                .map(entry -> {
                    Floor floor = entry.getKey();
                    List<ParkingSlot> floorSlots = entry.getValue();

                    FloorDashboardResponse floorResponse = new FloorDashboardResponse();
                    floorResponse.setFloorId(floor.getFloorId());
                    floorResponse.setFloorNumber(floor.getFloorNumber());
                    floorResponse.setFloorName(floor.getFloorName());
                    floorResponse.setSummary(buildSummary(floorSlots));
                    floorResponse.setZones(buildZoneResponses(floorSlots));
                    return floorResponse;
                })
                .collect(Collectors.toList());
    }

    private List<ZoneDashboardResponse> buildZoneResponses(List<ParkingSlot> slots) {
        Map<Zone, List<ParkingSlot>> slotsByZone = slots.stream()
                .collect(Collectors.groupingBy(slot -> slot.getZone()));

        return slotsByZone.entrySet().stream()
                .sorted(Map.Entry.comparingByKey((left, right) -> left.getZoneName().compareToIgnoreCase(right.getZoneName())))
                .map(entry -> {
                    Zone zone = entry.getKey();
                    List<ParkingSlot> zoneSlots = entry.getValue();

                    ZoneDashboardResponse zoneResponse = new ZoneDashboardResponse();
                    zoneResponse.setZoneId(zone.getZoneId());
                    zoneResponse.setZoneName(zone.getZoneName());
                    zoneResponse.setDescription(zone.getDescription());
                    zoneResponse.setSummary(buildSummary(zoneSlots));
                    zoneResponse.setSlots(buildSlotResponses(zoneSlots));
                    return zoneResponse;
                })
                .collect(Collectors.toList());
    }

    private List<SlotMapResponse> buildSlotResponses(List<ParkingSlot> slots) {
        return slots.stream()
                .sorted((left, right) -> left.getSlotCode().compareToIgnoreCase(right.getSlotCode()))
                .map(this::toSlotMapResponse)
                .collect(Collectors.toList());
    }

    private SlotMapResponse toSlotMapResponse(ParkingSlot slot) {
        SlotMapResponse response = new SlotMapResponse();
        response.setSlotId(slot.getSlotId());
        response.setSlotCode(slot.getSlotCode());
        response.setVehicleTypeId(slot.getVehicleType().getVehicleTypeId());
        response.setVehicleTypeName(slot.getVehicleType().getTypeName());
        response.setCapacity(slot.getCapacity());
        response.setCurrentOccupancy(slot.getCurrentOccupancy());
        response.setAvailableCapacity(calculateAvailableCapacity(slot));
        response.setStatus(slot.getStatus());
        response.setIsActive(slot.getIsActive());
        return response;
    }

    private DashboardSummaryResponse buildSummary(List<ParkingSlot> slots) {
        DashboardSummaryAccumulator accumulator = new DashboardSummaryAccumulator();
        slots.forEach(accumulator::add);
        return accumulator.toResponse();
    }

    private int calculateAvailableCapacity(ParkingSlot slot) {
        if (!Boolean.TRUE.equals(slot.getIsActive()) || slot.getStatus() != SlotStatus.AVAILABLE) {
            return 0;
        }
        return Math.max(slot.getCapacity() - slot.getCurrentOccupancy(), 0);
    }

    private class DashboardSummaryAccumulator {
        private final List<ParkingSlot> slots = new ArrayList<>();
        private int totalCapacity;
        private int currentOccupancy;
        private int availableCapacity;
        private int activeSlots;
        private int availableSlots;
        private int occupiedSlots;
        private int reservedSlots;
        private int lockedSlots;

        private void add(ParkingSlot slot) {
            slots.add(slot);
            totalCapacity += slot.getCapacity();
            currentOccupancy += slot.getCurrentOccupancy();
            availableCapacity += calculateAvailableCapacity(slot);

            if (Boolean.TRUE.equals(slot.getIsActive())) {
                activeSlots++;
            }
            if (slot.getStatus() == SlotStatus.AVAILABLE && Boolean.TRUE.equals(slot.getIsActive()) && slot.getCurrentOccupancy() < slot.getCapacity()) {
                availableSlots++;
            } else if (slot.getStatus() == SlotStatus.OCCUPIED) {
                occupiedSlots++;
            } else if (slot.getStatus() == SlotStatus.RESERVED) {
                reservedSlots++;
            } else if (slot.getStatus() == SlotStatus.LOCKED) {
                lockedSlots++;
            }
        }

        private DashboardSummaryResponse toResponse() {
            DashboardSummaryResponse response = new DashboardSummaryResponse();
            response.setTotalSlots(slots.size());
            response.setActiveSlots(activeSlots);
            response.setAvailableSlots(availableSlots);
            response.setOccupiedSlots(occupiedSlots);
            response.setReservedSlots(reservedSlots);
            response.setLockedSlots(lockedSlots);
            response.setTotalCapacity(totalCapacity);
            response.setCurrentOccupancy(currentOccupancy);
            response.setAvailableCapacity(availableCapacity);
            response.setOccupancyRate(totalCapacity == 0 ? 0.0 : Math.round((currentOccupancy * 10000.0) / totalCapacity) / 100.0);
            return response;
        }
    }
}
