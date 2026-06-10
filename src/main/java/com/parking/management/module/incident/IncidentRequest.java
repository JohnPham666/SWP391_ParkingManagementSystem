package com.parking.management.module.incident;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class IncidentRequest {

    @Schema(
            description = "Parking session ID related to the incident. Can be null if the incident is not linked to a session.",
            example = "null",
            nullable = true
    )
    private Integer sessionId;

    @NotBlank(message = "Incident type is required")
    private String incidentType;

    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;

    private String status;

    private String incidentImage;
}