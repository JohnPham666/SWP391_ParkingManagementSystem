package com.parking.management.module.zone;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class ZoneRequest {
    @NotNull
    private String name; // TODO: Adjust fields
}
