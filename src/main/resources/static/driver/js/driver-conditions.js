// Readable business condition helpers
const DriverConditions = {
    isMotorbikeType(typeName) {
        const text = DriverUtils.normalizeText(typeName);
        return (
            text === "xe may" ||
            text === "motorbike" ||
            text === "motorcycle" ||
            text.includes("xe may") ||
            text.includes("motorbike") ||
            text.includes("motorcycle")
        );
    },

    isReservableVehicleType(typeName) {
        return !this.isMotorbikeType(typeName);
    },

    isSlotAvailable(slot) {
        return slot && slot.status === 'AVAILABLE';
    },

    isMotorbikeSlot(slot) {
        return slot && this.isMotorbikeType(slot.vehicleTypeName);
    },

    canReserveSlot(slot) {
        return this.isSlotAvailable(slot) && !this.isMotorbikeSlot(slot);
    },

    /**
     * Helper kiểm tra xem một slot có bị giữ (lock) bởi reservation nào sắp diễn ra không.
     * Giải thích:
     * Vì sao chỉ khóa gần giờ sử dụng? Để tối ưu hóa công suất bãi đỗ (maximize utilization).
     * Nếu khách đặt chỗ trước cho chiều nay hoặc ngày mai, slot đó hiện tại vẫn thực sự trống.
     * Ta nên cho phép khách vãng lai hoặc khách đặt chỗ ngắn hạn khác sử dụng slot đó tạm thời.
     * Slot chỉ bị "khóa" (hiển thị bận) khi thời gian hiện tại đến giờ đặt (reservationStart) <= 30 phút
     * (thời gian giữ chỗ - Reservation Hold Window).
     */
    isSlotReservedSoon(slotId, allReservations = []) {
        const now = Date.now();
        const THIRTY_MINUTES_MS = 30 * 60 * 1000;
        
        return allReservations.some(r => {
            if (r.slotId !== slotId) return false;
            // Bỏ qua các đơn đã bị hủy hoặc hoàn thành
            if (r.status === 'CANCELLED' || r.status === 'COMPLETED') return false;
            
            const rStart = new Date(r.reservationStart).getTime();
            const rEnd = new Date(r.reservationEnd).getTime();
            
            // Nếu đã qua giờ kết thúc thì reservation này không còn ý nghĩa giữ slot
            if (now > rEnd) return false;
            
            // Nếu thời gian bắt đầu cách hiện tại <= 30 phút, hoặc đang diễn ra
            return (rStart - now) <= THIRTY_MINUTES_MS;
        });
    },

    isReservationCancelled(reservation) {
        return reservation && reservation.status === 'CANCELLED';
    },

    isReservationCompleted(reservation) {
        return reservation && reservation.status === 'COMPLETED';
    },

    isReservationPaid(reservation) {
        return reservation && (reservation.paymentStatus === 'PAID' || reservation.status === 'CONFIRMED' || reservation.status === 'COMPLETED');
    },

    isReservationUnpaid(reservation) {
        return !this.isReservationPaid(reservation);
    },

    canCancelReservation(reservation) {
        return reservation && ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED'].includes(reservation.status);
    },

    canPayReservation(reservation) {
        return reservation && ['PENDING', 'PENDING_PAYMENT'].includes(reservation.status) && this.isReservationUnpaid(reservation);
    },

    hasRealFee(value) {
        return value !== null && value !== undefined && value !== '';
    },

    getReservationFee(reservation) {
        if (!reservation) return null;
        return reservation.amount !== undefined ? reservation.amount : reservation.estimatedFee;
    },

    canEditProfileField(fieldName) {
        // Example logic
        return fieldName !== 'email';
    }
};

window.DriverConditions = DriverConditions;
