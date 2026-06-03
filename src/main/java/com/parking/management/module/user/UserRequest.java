package com.parking.management.module.user;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class UserRequest {
    @NotNull
    private String name; // TODO: Adjust fields
}
