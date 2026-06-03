package com.parking.management.module.reservation;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "reservations")
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add actual fields mapped to the SQL Schema here
}
