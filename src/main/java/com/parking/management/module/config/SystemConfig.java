package com.parking.management.module.config;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "systemconfigs")
public class SystemConfig {

    @Id
    @Column(name = "configkey")
    private String configKey;

    @Column(name = "configvalue", nullable = false)
    private String configValue;

    @Column(name = "description")
    private String description;

    @Column(name = "category")
    private String category;
}
