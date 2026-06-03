package com.parking.management.module.session;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "parkingsessions")
public class ParkingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add actual fields mapped to the SQL Schema here
}
