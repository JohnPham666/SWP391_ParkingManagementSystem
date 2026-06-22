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
    }
};

window.DriverUtils = DriverUtils;
// Expose global for existing code compatibility if needed, or update pages.js to use DriverUtils.localDateTimeValue
window.localDateTimeValue = DriverUtils.localDateTimeValue;
