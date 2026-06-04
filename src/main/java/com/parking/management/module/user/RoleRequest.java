package com.parking.management.module.user;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class RoleRequest {
    @NotBlank(message = "Tên role không được để trống")
    private String roleName;

    private String description;
}
