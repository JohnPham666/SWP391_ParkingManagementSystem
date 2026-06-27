package com.parking.management.module.incident;

<<<<<<< Updated upstream
=======
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import com.parking.management.common.EmailService;
>>>>>>> Stashed changes
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

    @Value("${file.upload-dir.incidents:uploads/incidents}")
    private String uploadDir;

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

    public IncidentResponse uploadIncidentImage(Integer incidentId, MultipartFile file) {
        IncidentReport incident = incidentReportRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident report not found with id: " + incidentId));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String fileName = "incident_" + incidentId + "_" + UUID.randomUUID() + extension;

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/uploads/incidents/" + fileName;
            incident.setIncidentImage(imageUrl);

            return IncidentResponse.fromEntity(incidentReportRepository.save(incident));
        } catch (Exception e) {
            throw new RuntimeException("Could not upload image: " + e.getMessage());
        }
    }
}