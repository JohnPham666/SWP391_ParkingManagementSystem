package com.parking.management.module.user;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class UserRequest {
    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    private String phoneNumber;

    private String password; // Có thể null khi update (giữ password cũ)

    @NotNull(message = "RoleId không được để trống")
    private Integer roleId;
}
