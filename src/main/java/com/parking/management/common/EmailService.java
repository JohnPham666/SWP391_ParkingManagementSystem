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

                This is an automated message. Please do not reply to this email.
                """.formatted(name, incidentId, incidentType, statusLabel, statusMessage);
    }

    /**
     * Gửi email khôi phục mật khẩu với giao diện chuyên nghiệp
     * Gửi đồng bộ để lỗi SMTP được trả về cho client
     */
    public void sendResetPasswordEmail(String toEmail, String resetLink) {
        try {
            jakarta.mail.internet.MimeMessage mimeMessage = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(mimeMessage, "utf-8");

            helper.setTo(toEmail);
            helper.setSubject("Reset Your ParkSmart Password");

            String htmlMsg = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; color: #333333;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden;">
                        <tr>
                            <td style="background-color: #ea580c; padding: 30px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">ParkSmart</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="margin-top: 0; color: #1f2937; font-size: 22px;">Password Reset Request</h2>
                                <p style="line-height: 1.6; color: #4b5563; font-size: 16px;">
                                    We received a request to reset the password associated with your ParkSmart account. 
                                    If you made this request, please click the button below to set a new password.
                                </p>
                                <div style="text-align: center; margin: 35px 0;">
                                    <a href="%s" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: 600; display: inline-block;">Reset My Password</a>
                                </div>
                                <p style="line-height: 1.6; color: #4b5563; font-size: 15px;">
                                    <strong>Note:</strong> This link is valid for 15 minutes. If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                                </p>
                                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                                <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
                                    If the button above doesn't work, copy and paste the following link into your browser:<br>
                                    <a href="%s" style="color: #ea580c; word-break: break-all;">%s</a>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                                    &copy; 2026 ParkSmart Solutions. All rights reserved.<br>
                                    This is an automated message, please do not reply.
                                </p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(resetLink, resetLink, resetLink);

            helper.setText(htmlMsg, true);
            mailSender.send(mimeMessage);
            log.info("Password reset email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send reset password email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu: " + e.getMessage());
        }
    }
}
