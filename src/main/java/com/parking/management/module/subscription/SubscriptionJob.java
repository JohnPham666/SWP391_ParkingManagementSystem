package com.parking.management.module.subscription;

import com.parking.management.common.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionJob {

    private final SubscriptionRepository subscriptionRepository;
    private final EmailService emailService;

    /**
     * TỰ ĐỘNG CHẠY (CRON JOB): Mỗi ngày vào lúc 08:00 sáng.
     * Mục đích:
     * 1. Tìm tất cả các vé tháng đang ACTIVE và hết hạn vào ngày hôm nay.
     * 2. Đổi trạng thái vé từ ACTIVE sang EXPIRED (để chặn cổng ra vào bãi xe đối với xe này).
     * 3. Gửi email thông báo hết hạn và hướng dẫn gia hạn cho khách hàng.
     */
    @Scheduled(cron = "0 0 8 * * ?")
    public void sendExpirationEmails() {
        log.info("Running job to send subscription expiration emails...");
        LocalDate today = LocalDate.now();

        List<MonthlySubscription> expiringSubscriptions = subscriptionRepository.findAll()
                .stream()
                .filter(sub -> "ACTIVE".equals(sub.getStatus()))
                .filter(sub -> sub.getEndDate() != null && sub.getEndDate().isEqual(today))
                .toList();

        int count = 0;
        for (MonthlySubscription sub : expiringSubscriptions) {
            if (sub.getUser() != null && sub.getUser().getEmail() != null) {
                String toEmail = sub.getUser().getEmail();
                String fullName = sub.getUser().getFullName();
                Integer subscriptionId = sub.getSubscriptionId();
                String licensePlate = sub.getVehicle() != null ? sub.getVehicle().getLicensePlate() : "N/A";

                emailService.sendSubscriptionExpirationEmail(toEmail, fullName, subscriptionId, licensePlate);
                count++;
                
                // Đồng thời chuyển trạng thái vé sang EXPIRED để luồng check-in biết
                sub.setStatus(SubscriptionStatus.EXPIRED.name());
                subscriptionRepository.save(sub);
            }
        }

        log.info("Finished running expiration email job. Sent {} emails.", count);
    }
}
