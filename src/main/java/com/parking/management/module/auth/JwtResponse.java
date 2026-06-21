package com.parking.management.module.auth;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private Integer userId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private Boolean status;
    private String role;
}
