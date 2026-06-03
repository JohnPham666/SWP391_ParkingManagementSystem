package com.parking.management.module.incident;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "incidentreports")
public class IncidentReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add actual fields mapped to the SQL Schema here
}
