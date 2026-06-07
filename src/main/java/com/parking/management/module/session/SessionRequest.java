package com.parking.management.module.session;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SessionRequest {
    @NotNull
    private String name; // TODO: Adjust fields
}