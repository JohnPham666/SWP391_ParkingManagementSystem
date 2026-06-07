package com.parking.management.module.incident;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class IncidentRequest {

    private Integer sessionId;

    @NotNull(message = "Reported by user id is required")
    private Integer reportedById;

    @NotBlank(message = "Incident type is required")
    private String incidentType;

    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;

    private String status;

    private String incidentImage;
}