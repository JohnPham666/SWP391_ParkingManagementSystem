package com.parking.management.module.slot;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class SlotRequest {
    @NotNull
    private String name; // TODO: Adjust fields
}
