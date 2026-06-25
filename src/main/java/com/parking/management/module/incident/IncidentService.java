package com.parking.management.module.incident;

import com.parking.management.module.session.ParkingSession;
import com.parking.management.module.session.ParkingSessionRepository;
import com.parking.management.module.user.User;
import com.parking.management.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class IncidentService {

    private final IncidentReportRepository incidentReportRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final UserRepository userRepository;

    public IncidentResponse create(IncidentRequest request) {
        User reportedBy = getCurrentAuthenticatedUser();

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

        // Khi tạo mới incident, hệ thống luôn set OPEN.
        // User không được tự tạo incident với status RESOLVED.
        incident.setStatus(IncidentStatus.OPEN.name());

        incident.setCreatedAt(LocalDateTime.now());
        incident.setIncidentImage(request.getIncidentImage());

        return IncidentResponse.fromEntity(incidentReportRepository.save(incident));
    }

    public List<IncidentResponse> getAll() {
        User currentUser = getCurrentAuthenticatedUser();
        String roleName = currentUser.getRole().getRoleName();
        if ("ParkingStaff".equals(roleName)) {
            return incidentReportRepository.findByReportedBy_UserIdOrderByCreatedAtDesc(currentUser.getUserId())
                    .stream()
                    .map(IncidentResponse::fromEntity)
                    .toList();
        }
        return incidentReportRepository.findAllByOrderByCreatedAtDesc()
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

        ParkingSession session = null;
        if (request.getSessionId() != null) {
            session = parkingSessionRepository.findById(request.getSessionId())
                    .orElseThrow(() -> new RuntimeException("Parking session not found"));
        }

        // Update không đổi người báo cáo.
        // reportedBy vẫn giữ nguyên người đã tạo incident ban đầu.
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

    public IncidentResponse updateStatus(Integer id, String status) {
        IncidentReport incident = incidentReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident report not found"));
        incident.setStatus(status);
        return IncidentResponse.fromEntity(incidentReportRepository.save(incident));
    }

    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("User is not authenticated");
        }

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Reporter user not found"));
    }
}