package com.parking.management.module.vehicle;

import com.parking.management.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleTypeService {

    private final VehicleTypeRepository vehicleTypeRepository;

    public VehicleTypeResponse create(VehicleTypeRequest request) {
        if (vehicleTypeRepository.existsByTypeName(request.getTypeName())) {
            throw new IllegalArgumentException("Vehicle type name already exists");
        }

        VehicleType vehicleType = new VehicleType();
        vehicleType.setTypeName(request.getTypeName());
        vehicleType.setDescription(request.getDescription());

        return VehicleTypeResponse.fromEntity(vehicleTypeRepository.save(vehicleType));
    }

    public List<VehicleTypeResponse> getAll() {
        return vehicleTypeRepository.findAll()
                .stream()
                .map(VehicleTypeResponse::fromEntity)
                .toList();
    }

    public VehicleTypeResponse getById(Integer id) {
        VehicleType vehicleType = vehicleTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle type not found with id: " + id));

        return VehicleTypeResponse.fromEntity(vehicleType);
    }

    public VehicleTypeResponse update(Integer id, VehicleTypeRequest request) {
        VehicleType vehicleType = vehicleTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle type not found with id: " + id));

        if (vehicleTypeRepository.existsByTypeNameAndVehicleTypeIdNot(request.getTypeName(), id)) {
            throw new IllegalArgumentException("Vehicle type name already exists");
        }

        vehicleType.setTypeName(request.getTypeName());
        vehicleType.setDescription(request.getDescription());

        return VehicleTypeResponse.fromEntity(vehicleTypeRepository.save(vehicleType));
    }

    public void delete(Integer id) {
        VehicleType vehicleType = vehicleTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle type not found with id: " + id));

        vehicleTypeRepository.delete(vehicleType);
    }
}