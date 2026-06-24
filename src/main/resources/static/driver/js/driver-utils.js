// Common helpers for Driver frontend
const DriverUtils = {
    normalizeText(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    },

    formatCurrency(value) {
        if (value === null || value === undefined || value === '') {
            return 'Chưa có dữ liệu phí';
        }
        const num = Number(value);
        if (isNaN(num)) return 'Chưa có dữ liệu phí';
        return num.toLocaleString('vi-VN') + ' đ';
    },

    formatDateTime(value) {
        if(!value) return '-';
        return new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    localDateTimeValue(date) {
        const offset = date.getTimezoneOffset();
        return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
    },

    escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    },

    escapeAttr(value) {
        return this.escapeHtml(value);
    },

    isEmptyValue(val) {
        return val === null || val === undefined || val === '';
    },

    getValueByKeys(obj, keys) {
        for (const k of keys) {
            if (obj[k] !== undefined && obj[k] !== null) return obj[k];
        }
        return null;
    },

    resolveReservationLocation(r, slots) {
        if (r.buildingName && r.floorName && r.zoneName) {
            return `${DriverUtils.escapeHtml(r.buildingName)} - ${DriverUtils.escapeHtml(r.floorName)} - ${DriverUtils.escapeHtml(r.zoneName)}`;
        }
        if (r.slotId && slots && slots.length) {
            const slot = slots.find(s => s.slotId === r.slotId);
            if (slot && slot.buildingName && slot.floorName && slot.zoneName) {
                return `${DriverUtils.escapeHtml(slot.buildingName)} - ${DriverUtils.escapeHtml(slot.floorName)} - ${DriverUtils.escapeHtml(slot.zoneName)}`;
            }
        }
        return 'Chưa có thông tin vị trí';
    },

    resolveReservationFee(r) {
        let fee = DriverConditions.getReservationFee(r);
        return this.formatCurrency(fee);
    },

    statusText(status) {
        return {
            AVAILABLE: 'Trống', RESERVED: 'Đã đặt', OCCUPIED: 'Đang sử dụng', LOCKED: 'Khóa',
            ACTIVE: 'Đang hoạt động', COMPLETED: 'Hoàn tất', PENDING: 'Chờ thanh toán',
            CONFIRMED: 'Đã xác nhận', CANCELLED: 'Đã hủy', PAID: 'Đã thanh toán', UNPAID: 'Chưa thanh toán'
        }[status] || status;
    },

    isReservationOverlap(slotId, allReservations, reqStart, reqEnd) {
        return allReservations.some(r => {
            if (r.slotId !== slotId) return false;
            if (r.status === 'CANCELLED' || r.status === 'COMPLETED') return false;
            const rStart = new Date(r.reservationStart).getTime();
            const rEnd = new Date(r.reservationEnd).getTime();
            return rStart < reqEnd && rEnd > reqStart;
        });
    },

    isSessionOverlap(slotId, allSessions, reqStart, reqEnd) {
        return allSessions.some(s => {
            if (s.slotId !== slotId) return false;
            if (s.status === 'COMPLETED') return false; 
            const sStart = new Date(s.entryTime).getTime();
            const sEnd = s.exitTime ? new Date(s.exitTime).getTime() : Infinity;
            return sStart < reqEnd && sEnd > reqStart;
        });
    },

    filterSlotsByTime(slots, allReservations, allSessions, startTimeStr, endTimeStr) {
        if (!startTimeStr || !endTimeStr) return slots;
        const reqStart = new Date(startTimeStr).getTime();
        const reqEnd = new Date(endTimeStr).getTime();
        if (reqEnd <= reqStart) return slots;

        return slots.filter(slot => {
            if (slot.status !== 'AVAILABLE') return false;
            const isResOverlap = this.isReservationOverlap(slot.slotId, allReservations, reqStart, reqEnd);
            const isSesOverlap = this.isSessionOverlap(slot.slotId, allSessions, reqStart, reqEnd);
            return !isResOverlap && !isSesOverlap;
        });
    },

    filterSlotsByCriteria(slots, f) {
        return slots.filter(s => {
            if (f.buildingName !== 'all' && s.buildingName !== f.buildingName) return false;
            if (f.floorName !== 'all' && s.floorName !== f.floorName) return false;
            if (f.zoneName !== 'all' && s.zoneName !== f.zoneName) return false;
            if (f.vehicleTypeName !== 'all' && s.vehicleTypeName !== f.vehicleTypeName) return false;
            if (f.status !== 'all' && s.status !== f.status) return false;
            return true;
        });
    },

    sortAndRecommendSlots(filteredSlots) {
        filteredSlots.forEach(s => s.isRecommended = false);
        
        const reservableSlots = filteredSlots.filter(s => DriverConditions.canReserveSlot(s));
        
        if (reservableSlots.length > 0) {
            const sorted = [...reservableSlots].sort((a, b) => {
                const floorA = a.floorName || '';
                const floorB = b.floorName || '';
                if (floorA !== floorB) return floorA.localeCompare(floorB);

                const zoneA = a.zoneName || '';
                const zoneB = b.zoneName || '';
                if (zoneA !== zoneB) return zoneA.localeCompare(zoneB);

                const codeA = a.slotCode || '';
                const codeB = b.slotCode || '';
                return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
            });
            const bestSlotId = sorted[0].slotId;
            const bestSlot = filteredSlots.find(s => s.slotId === bestSlotId);
            if (bestSlot) {
                bestSlot.isRecommended = true;
            }
        }
        return filteredSlots;
    }
};

window.DriverUtils = DriverUtils;
// Expose global for existing code compatibility if needed, or update pages.js to use DriverUtils.localDateTimeValue
window.localDateTimeValue = DriverUtils.localDateTimeValue;
