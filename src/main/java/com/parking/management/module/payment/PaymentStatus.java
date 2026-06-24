package com.parking.management.module.payment;

public enum PaymentStatus {
    PENDING,
    PAID,
    FAILED,

    /**
     * Trạng thái đặc biệt: Thanh toán đã thành công nhưng cần hoàn tiền.
     * Ví dụ: VNPay trả về thành công, nhưng không còn chỗ trống nào phù hợp.
     * Staff/Admin cần xử lý hoàn tiền thủ công cho khách.
     */
    REFUND_PENDING
}
