package com.parking.management.module.user;

import com.parking.management.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class RoleService {

    private final RoleRepository repository;

    public RoleResponse create(RoleRequest request) {
        Role role = new Role();
        role.setRoleName(request.getRoleName());
        role.setDescription(request.getDescription());
        return toResponse(repository.save(role));
    }

    public RoleResponse getById(Integer id) {
        Role role = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
        return toResponse(role);
    }

    public List<RoleResponse> getAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public RoleResponse update(Integer id, RoleRequest request) {
        Role role = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
        role.setRoleName(request.getRoleName());
        role.setDescription(request.getDescription());
        return toResponse(repository.save(role));
    }

    public void delete(Integer id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Role not found with id: " + id);
        }
        repository.deleteById(id);
    }

    private RoleResponse toResponse(Role role) {
        RoleResponse res = new RoleResponse();
        res.setRoleId(role.getRoleId());
        res.setRoleName(role.getRoleName());
        res.setDescription(role.getDescription());
        return res;
    }
}
