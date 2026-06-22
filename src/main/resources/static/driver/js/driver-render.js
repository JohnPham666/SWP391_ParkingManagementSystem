// Reusable HTML render helpers
const DriverRender = {
    renderBadge(text, typeCls) {
        return `<span class="badge ${typeCls}">${DriverUtils.escapeHtml(text)}</span>`;
    },

    renderInfoRow(label, value) {
        return `<div class="list-item"><div class="list-info"><h4>${DriverUtils.escapeHtml(label)}</h4><p>${DriverUtils.escapeHtml(String(value ?? '-'))}</p></div></div>`;
    },

    renderEmptyState(icon, message) {
        return `<div class="empty-state">${icon}<p>${DriverUtils.escapeHtml(message)}</p></div>`;
    },

    renderLoadingState() {
        return `<div class="loading-spinner"><div class="spinner"></div></div>`;
    },

    renderErrorState(message) {
        return `<div class="empty-state"><p style="color:var(--red)">Lỗi: ${DriverUtils.escapeHtml(message)}</p></div>`;
    },

    renderActionButton(label, onclickStr, typeCls = 'btn-primary', extraStyles = '') {
        return `<button class="btn ${typeCls}" style="${extraStyles}" onclick="${onclickStr}">${DriverUtils.escapeHtml(label)}</button>`;
    },

    iconSvg(path) { return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${path}</svg>`; },
    iconCar() { return this.iconSvg('<path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>'); },
    iconCalendar() { return this.iconSvg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'); },
    iconMapPin() { return this.iconSvg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>'); },
    iconClock() { return this.iconSvg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'); },
    iconWallet() { return this.iconSvg('<path d="M20 7H5a2 2 0 010-4h14v4z"/><path d="M5 7h16v14H5a2 2 0 01-2-2V5"/><path d="M16 14h2"/>'); },
    iconTag() { return this.iconSvg('<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1"/>'); },
    iconReceipt() { return this.iconSvg('<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2H4z"/><path d="M8 7h8M8 11h8M8 15h5"/>'); },
    iconAlert() { return this.iconSvg('<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>'); },
    iconUser() { return this.iconSvg('<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>'); },
    iconFilter() { return this.iconSvg('<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>'); },
    iconClose() { return this.iconSvg('<path d="M18 6L6 18M6 6l12 12"/>'); }
};

window.DriverRender = DriverRender;
