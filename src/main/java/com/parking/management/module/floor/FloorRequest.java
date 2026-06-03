package com.parking.management.module.floor;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class FloorRequest {
    @NotNull
    private String name; // TODO: Adjust fields
}
