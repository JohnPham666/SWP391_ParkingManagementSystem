// Simple shared state for Driver frontend
const DriverState = {
    // State properties
    parkingFilters: { buildingName: 'all', floorName: 'all', zoneName: 'all', vehicleTypeName: 'all', status: 'all', startTime: '', endTime: '' },
    historyFilters: { vehicleId: 'all', status: 'all', paymentStatus: 'all', fromDate: '', toDate: '' },
    pricingFilter: 'all',
    vehicles: [],
    vehicleTypes: [],
    slots: [],
    rawSlots: [],
    allReservations: [],
    allSessions: [],
    incidents: [],
    pendingReservationSlotId: null,
    availableSlots: [],
    createdPayments: {},
    filterTimer: null,
    
    // Getters
    getParkingFilters() { return this.parkingFilters; },
    getParkingFilter(key) { return this.parkingFilters[key]; },
    getHistoryFilters() { return this.historyFilters; },
    getHistoryFilter(key) { return this.historyFilters[key]; },
    getPricingFilter() { return this.pricingFilter; },
    getVehicles() { return this.vehicles; },
    getVehicleTypes() { return this.vehicleTypes; },
    getSlots() { return this.slots; },
    getRawSlots() { return this.rawSlots; },
    getAllReservations() { return this.allReservations; },
    getAllSessions() { return this.allSessions; },
    getIncidents() { return this.incidents; },
    getPendingReservationSlotId() { return this.pendingReservationSlotId; },
    getAvailableSlots() { return this.availableSlots; },
    getCreatedPayments() { return this.createdPayments; },
    getCreatedPayment(id) { return this.createdPayments[id]; },
    getFilterTimer() { return this.filterTimer; },

    // Setters
    setParkingFilters(filters) { this.parkingFilters = filters; },
    setParkingFilter(key, value) { this.parkingFilters[key] = value; },
    resetParkingFilters() { this.parkingFilters = { buildingName: 'all', floorName: 'all', zoneName: 'all', vehicleTypeName: 'all', status: 'all', startTime: '', endTime: '' }; },
    
    setHistoryFilters(filters) { this.historyFilters = filters; },
    setHistoryFilter(key, value) { this.historyFilters[key] = value; },
    
    setPricingFilter(filter) { this.pricingFilter = filter; },
    setVehicles(veh) { this.vehicles = veh; },
    setVehicleTypes(types) { this.vehicleTypes = types; },
    setSlots(slots) { this.slots = slots; },
    setRawSlots(slots) { this.rawSlots = slots; },
    setAllReservations(res) { this.allReservations = res; },
    setAllSessions(ses) { this.allSessions = ses; },
    setIncidents(inc) { this.incidents = inc; },
    setPendingReservationSlotId(id) { this.pendingReservationSlotId = id; },
    setAvailableSlots(slots) { this.availableSlots = slots; },
    setCreatedPayments(payments) { this.createdPayments = payments; },
    setCreatedPayment(id, token) { this.createdPayments[id] = token; },
    
    setFilterTimer(timer) { 
        if (this.filterTimer) clearTimeout(this.filterTimer);
        this.filterTimer = timer; 
    },
    clearFilterTimer() {
        if (this.filterTimer) clearTimeout(this.filterTimer);
        this.filterTimer = null;
    }
};

window.DriverState = DriverState;
