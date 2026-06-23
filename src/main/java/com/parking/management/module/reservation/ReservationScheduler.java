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
        // 1. Hủy rác dữ liệu: Các vé không phải CASH, tạo quá 15 phút mà vẫn PENDING
        LocalDateTime creationCutoffTime = LocalDateTime.now().minusMinutes(15);
        List<Reservation> staleOnlineReservations = reservationRepository
                .findStalePendingReservations(creationCutoffTime);

        if (!staleOnlineReservations.isEmpty()) {
            log.info("Auto-cancelling {} stale online PENDING reservations (older than 15 minutes)",
                    staleOnlineReservations.size());
            for (Reservation reservation : staleOnlineReservations) {
                reservation.setStatus("CANCELLED");
                log.debug("Cancelled stale online reservation ID: {}", reservation.getReservationId());
            }
            reservationRepository.saveAll(staleOnlineReservations);
        }

        // 2. Hủy các vé CASH PENDING mà khách đến trễ quá 30 phút so với giờ bắt đầu đặt đỗ
        LocalDateTime lateCutoffTime = LocalDateTime.now().minusMinutes(30);
        List<Reservation> staleCashReservations = reservationRepository
                .findStaleCashReservations(lateCutoffTime);

        if (!staleCashReservations.isEmpty()) {
            log.info("Auto-cancelling {} stale CASH PENDING reservations (30 minutes past reservation start)",
                    staleCashReservations.size());
            for (Reservation reservation : staleCashReservations) {
                reservation.setStatus("CANCELLED");
                log.debug("Cancelled stale cash reservation ID: {}", reservation.getReservationId());
            }
            reservationRepository.saveAll(staleCashReservations);
        }

        // 3. Kiểm tra các vé PENDING xem có bị cướp Slot không (bị vé CONFIRMED trùng giờ, hoặc xe vãng lai đã đậu OCCUPIED)
        List<Reservation> allPending = reservationRepository.findByStatus("PENDING");
        LocalDateTime now = LocalDateTime.now();
        
        for (Reservation pendingRes : allPending) {
            boolean isLost = false;

            // Check overlap với CONFIRMED
            List<Reservation> overlaps = reservationRepository.findOverlappingReservations(
                    pendingRes.getSlot().getSlotId(),
                    pendingRes.getReservationStart(),
                    pendingRes.getReservationEnd()
            );
            if (!overlaps.isEmpty()) {
                isLost = true;
            }

            // Check nếu slot đang OCCUPIED và thời gian hiện tại nằm trong khoảng reservation
            if (!isLost && pendingRes.getSlot().getStatus() == com.parking.management.module.slot.SlotStatus.OCCUPIED 
                && !now.isBefore(pendingRes.getReservationStart()) 
                && !now.isAfter(pendingRes.getReservationEnd())) {
                isLost = true;
            }

            if (isLost) {
                pendingRes.setStatus("CANCELLED");
                reservationRepository.save(pendingRes);
                System.out.println("GỬI THÔNG BÁO CHO DRIVER: Rất tiếc, ô đỗ của vé " + pendingRes.getReservationId() + " đã bị người khác thanh toán/đỗ mất. Vui lòng đặt lại.");
                log.info("Auto-cancelled PENDING reservation ID: {} because the slot was taken.", pendingRes.getReservationId());
            }
        }
    }
}
