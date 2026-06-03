package com.parking.management.module.slot;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "parkingslots")
public class ParkingSlot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add actual fields mapped to the SQL Schema here
}
