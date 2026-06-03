package com.parking.management.module.floor;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "floors")
public class Floor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add actual fields mapped to the SQL Schema here
}
