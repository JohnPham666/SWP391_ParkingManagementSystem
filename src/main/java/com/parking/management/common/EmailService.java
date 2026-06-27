package com.parking.management.common;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    /**
     * Gửi email thông báo thay đổi trạng thái Incident về người báo cáo.
     * Chạy bất đồng bộ (@Async) để không block luồng chính của request.
     */
    @Async
    public void sendIncidentStatusUpdate(String toEmail, String recipientName,
                                         Integer incidentId, String incidentType,
                                         String newStatus) {
        try {
            String statusLabel = mapStatusToLabel(newStatus);
            String subject = "[ParkSmart] Incident Report #" + incidentId + " - Status Updated: " + statusLabel;

            String body = buildEmailBody(recipientName, incidentId, incidentType, newStatus, statusLabel);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("smartparking.admin25.noreply@gmail.com");
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            log.info("Incident status notification sent to {} for incident #{}", toEmail, incidentId);
        } catch (Exception e) {
            // Log lỗi nhưng KHÔNG throw để không làm hỏng luồng update status chính
            log.error("Failed to send incident notification email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String mapStatusToLabel(String status) {
        return switch (status.toUpperCase()) {
            case "OPEN"        -> "Open - Awaiting Review";
            case "IN_PROGRESS" -> "In Progress - Being Handled";
            case "RESOLVED"    -> "Resolved - Issue Fixed";
            case "CLOSED"      -> "Closed";
            case "REJECTED"    -> "Rejected";
            default            -> status;
        };
    }

    private String buildEmailBody(String name, Integer incidentId,
                                   String incidentType, String status, String statusLabel) {
        String statusMessage = switch (status.toUpperCase()) {
            case "IN_PROGRESS" -> "Our team is currently looking into your report. We will update you once resolved.";
            case "RESOLVED"    -> "Great news! Your incident has been resolved. Thank you for your patience.";
            case "CLOSED"      -> "Your incident report has been officially closed. Thank you for helping us improve.";
            case "REJECTED"    -> "After review, your incident report could not be confirmed. If you believe this is an error, please contact our support team.";
            default            -> "Our team has received your report and will review it shortly.";
        };

        return """
                Dear %s,

                We're writing to inform you that your incident report has been updated.

                ──────────────────────────────
                  Report ID   : #%d
                  Type        : %s
                  New Status  : %s
                ──────────────────────────────

                %s

                If you have any questions, please contact our support team.

                Best regards,
                ParkSmart Management Team

                ─────────────────────────────────────────
                This is an automated message. Please do not reply to this email.
                """.formatted(name, incidentId, incidentType, statusLabel, statusMessage);
    }
}
