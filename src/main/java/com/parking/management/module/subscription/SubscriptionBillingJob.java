package com.parking.management.module.subscription;

import com.parking.management.module.payment.Payment;
import com.parking.management.module.payment.PaymentRepository;
import com.parking.management.module.payment.PaymentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionBillingJob {

    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;

    /**
     * Chạy vào lúc 00:00:00 ngày 1 hàng tháng.
     * Quét tất cả vé tháng đang ACTIVE và xuất hóa đơn cho tháng trước.
     */
    @Scheduled(cron = "0 0 0 1 * ?")
    public void generateMonthlyInvoices() {
        log.info("Starting monthly billing job for subscriptions...");

        LocalDate today = LocalDate.now();
        YearMonth previousMonth = YearMonth.from(today.minusMonths(1));
        int daysInPrevMonth = previousMonth.lengthOfMonth();

        List<MonthlySubscription> activeSubscriptions = subscriptionRepository.findAll().stream()
                .filter(sub -> SubscriptionStatus.ACTIVE.name().equals(sub.getStatus()))
                .toList();

        int count = 0;
        for (MonthlySubscription sub : activeSubscriptions) {
            LocalDate startDate = sub.getStartDate();
            
            // Nếu StartDate lớn hơn ngày cuối của tháng trước -> chưa sử dụng trong tháng trước -> bỏ qua
            if (startDate.isAfter(previousMonth.atEndOfMonth())) {
                continue;
            }

            // Tính số ngày sử dụng trong tháng trước
            LocalDate billingStartDate = startDate;
            if (billingStartDate.isBefore(previousMonth.atDay(1))) {
                billingStartDate = previousMonth.atDay(1); // Đã dùng trọn tháng trước
            }

            long usedDays = ChronoUnit.DAYS.between(billingStartDate, previousMonth.atEndOfMonth()) + 1;
            if (usedDays < 0) usedDays = 0;
            if (usedDays > daysInPrevMonth) usedDays = daysInPrevMonth;

            BigDecimal monthlyFee = sub.getMonthlyFee();
            BigDecimal dailyRate = monthlyFee.divide(BigDecimal.valueOf(daysInPrevMonth), 2, RoundingMode.HALF_UP);
            BigDecimal proratedFee = dailyRate.multiply(BigDecimal.valueOf(usedDays));

            if (proratedFee.compareTo(BigDecimal.ZERO) > 0) {
                Payment payment = new Payment();
                payment.setSubscription(sub);
                payment.setAmount(proratedFee);
                payment.setPaymentMethod("VNPAY"); // Phương thức thanh toán mặc định
                payment.setPaymentStatus(PaymentStatus.PENDING.name());
                paymentRepository.save(payment);
                count++;
            }
        }

        log.info("Monthly billing job completed. Generated {} invoices.", count);
    }
}
