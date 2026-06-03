package com.parking.management.module.zone;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "zones")
public class Zone {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add actual fields mapped to the SQL Schema here
}
