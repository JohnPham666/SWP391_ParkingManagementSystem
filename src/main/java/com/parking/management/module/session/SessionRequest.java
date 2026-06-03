package com.parking.management.module.session;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class SessionRequest {
    @NotNull
    private String name; // TODO: Adjust fields
}
