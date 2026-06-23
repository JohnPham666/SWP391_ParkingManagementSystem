package com.parking.management.module.reservation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled task: Tự động hủy các đặt chỗ PENDING quá 15 phút.
 *
 * Mục đích:
 * - Dọn rác dữ liệu: Khách tạo đặt chỗ nhưng không thanh toán -> PENDING mãi mãi.
 * - Giải phóng Slot: Tránh "khóa ảo" slot khi khách bỏ ngang.
 *
 * Chạy mỗi 60 giây (fixedRate = 60000ms).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationScheduler {

    private final ReservationRepository reservationRepository;

    /**
     * Quét DB mỗi phút, tìm tất cả Reservation có:
     * - status = "PENDING"
     * - createdAt < (now - 15 phút)
     *
     * Đổi status thành "CANCELLED".
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoCancelStalePendingReservations() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(15);

        List<Reservation> staleReservations = reservationRepository
                .findStalePendingReservations(cutoffTime);

        if (staleReservations.isEmpty()) {
            return;
        }

        log.info("Auto-cancelling {} stale PENDING reservations (older than 15 minutes)",
                staleReservations.size());

        for (Reservation reservation : staleReservations) {
            reservation.setStatus("CANCELLED");
            log.debug("Cancelled stale reservation ID: {}, created at: {}",
                    reservation.getReservationId(), reservation.getCreatedAt());
        }

        reservationRepository.saveAll(staleReservations);

        log.info("Successfully cancelled {} stale reservations", staleReservations.size());
    }
}
