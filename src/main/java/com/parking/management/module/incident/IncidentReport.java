package com.parking.management.module.incident;

import com.parking.management.module.session.ParkingSession;
import com.parking.management.module.user.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "IncidentReports")
public class IncidentReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IncidentID")
    private Integer incidentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SessionID")
    private ParkingSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ReportedBy", nullable = false)
    private User reportedBy;

    @Column(name = "IncidentType", length = 50)
    private String incidentType;

    @Column(name = "Description", length = 500)
    private String description;

    @Column(name = "Status", length = 20)
    private String status;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "IncidentImage", length = 255)
    private String incidentImage;
}
