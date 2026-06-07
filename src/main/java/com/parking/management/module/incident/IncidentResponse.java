package com.parking.management.module.incident;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentResponse {
    private Integer incidentId;
    private Integer sessionId;
    private Integer reportedById;
    private String reportedByName;
    private String incidentType;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private String incidentImage;

    public static IncidentResponse fromEntity(IncidentReport incident) {
        return new IncidentResponse(
                incident.getIncidentId(),
                incident.getSession() != null ? incident.getSession().getSessionId() : null,
                incident.getReportedBy() != null ? incident.getReportedBy().getUserId() : null,
                incident.getReportedBy() != null ? incident.getReportedBy().getFullName() : null,
                incident.getIncidentType(),
                incident.getDescription(),
                incident.getStatus(),
                incident.getCreatedAt(),
                incident.getIncidentImage()
        );
    }
}