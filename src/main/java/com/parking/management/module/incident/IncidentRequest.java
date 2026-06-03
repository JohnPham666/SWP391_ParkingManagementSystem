package com.parking.management.module.incident;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class IncidentRequest {
    @NotNull
    private String name; // TODO: Adjust fields
}
