// Simple shared state for Driver frontend
const DriverState = {
    parkingFilters: { buildingName: 'all', floorName: 'all', zoneName: 'all', vehicleTypeName: 'all', status: 'all', startTime: '', endTime: '' },
    historyFilters: { vehicleId: 'all', status: 'all', paymentStatus: 'all', fromDate: '', toDate: '' },
    pricingFilter: 'all',
    vehicles: [],
    vehicleTypes: [],
    slots: [],
    allSlots: [],
    reservations: [],
    incidents: [],
    pendingReservationSlotId: null,
    availableSlots: [],
    createdPayments: {}
};

window.DriverState = DriverState;
