package com.parking.management.module.reservation;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class ReservationRequest {
    @NotNull
    private String name; // TODO: Adjust fields
}
