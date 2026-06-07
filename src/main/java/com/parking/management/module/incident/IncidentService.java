package com.parking.management.module.incident;

import com.parking.management.module.session.ParkingSession;
import com.parking.management.module.session.ParkingSessionRepository;
import com.parking.management.module.user.User;
import com.parking.management.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentReportRepository incidentReportRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final UserRepository userRepository;

    public IncidentResponse create(IncidentRequest request) {
        User reportedBy = userRepository.findById(request.getReportedById())
                .orElseThrow(() -> new RuntimeException("Reporter user not found"));

        ParkingSession session = null;
        if (request.getSessionId() != null) {
            session = parkingSessionRepository.findById(request.getSessionId())
                    .orElseThrow(() -> new RuntimeException("Parking session not found"));
        }

        IncidentReport incident = new IncidentReport();
        incident.setReportedBy(reportedBy);
        incident.setSession(session);
        incident.setIncidentType(request.getIncidentType());
        incident.setDescription(request.getDescription());
        incident.setStatus(request.getStatus() != null ? request.getStatus() : IncidentStatus.OPEN.name());
        incident.setCreatedAt(LocalDateTime.now());
        incident.setIncidentImage(request.getIncidentImage());

        return IncidentResponse.fromEntity(incidentReportRepository.save(incident));
    }

    public List<IncidentResponse> getAll() {
        return incidentReportRepository.findAll()
                .stream()
                .map(IncidentResponse::fromEntity)
                .toList();
    }

    public IncidentResponse getById(Integer id) {
        IncidentReport incident = incidentReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident report not found"));

        return IncidentResponse.fromEntity(incident);
    }

    public IncidentResponse update(Integer id, IncidentRequest request) {
        IncidentReport incident = incidentReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident report not found"));

        User reportedBy = userRepository.findById(request.getReportedById())
                .orElseThrow(() -> new RuntimeException("Reporter user not found"));

        ParkingSession session = null;
        if (request.getSessionId() != null) {
            session = parkingSessionRepository.findById(request.getSessionId())
                    .orElseThrow(() -> new RuntimeException("Parking session not found"));
        }

        incident.setReportedBy(reportedBy);
        incident.setSession(session);
        incident.setIncidentType(request.getIncidentType());
        incident.setDescription(request.getDescription());

        if (request.getStatus() != null) {
            incident.setStatus(request.getStatus());
        }

        incident.setIncidentImage(request.getIncidentImage());

        return IncidentResponse.fromEntity(incidentReportRepository.save(incident));
    }

    public void delete(Integer id) {
        IncidentReport incident = incidentReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident report not found"));

        incidentReportRepository.delete(incident);
    }
}