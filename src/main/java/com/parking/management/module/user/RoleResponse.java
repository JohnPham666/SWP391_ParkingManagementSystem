package com.parking.management.module.user;

import lombok.Data;

@Data
public class RoleResponse {
    private Integer roleId;
    private String roleName;
    private String description;
}
