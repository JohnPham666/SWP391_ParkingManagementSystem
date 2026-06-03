package com.parking.management.module.pricing;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "pricingpolicys")
public class PricingPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add actual fields mapped to the SQL Schema here
}
