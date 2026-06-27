package com.parking.management.module.user;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Integer userId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String address;
    private String roleName;
    private Boolean isActive;
    private LocalDateTime createdAt;
    
    private Integer buildingId;
    private String buildingName;
}
