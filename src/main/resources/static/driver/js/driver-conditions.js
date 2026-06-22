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
