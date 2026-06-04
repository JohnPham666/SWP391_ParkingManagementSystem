package com.parking.management.module.user;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Integer userId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String roleName;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
