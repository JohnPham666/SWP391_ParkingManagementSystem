import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DriverLayout from '../layouts/DriverLayout';
import DashboardPage from '../pages/DashboardPage';
import ParkingPage from '../pages/ParkingPage';
import ReservationPage from '../pages/ReservationPage';
import VehiclePage from '../pages/VehiclePage';
import ProfilePage from '../pages/ProfilePage';
import PaymentPage from '../pages/PaymentPage';
import PricingPage from '../pages/PricingPage';
import IncidentPage from '../pages/IncidentPage';

const DriverRoutes = () => {
    return (
        <Routes>
            <Route element={<DriverLayout />}>
                {/* Redirect /driver to /driver/dashboard */}
                <Route path="/driver" element={<Navigate to="dashboard" replace />} />
                <Route path="/driver/dashboard" element={<DashboardPage />} />
                <Route path="/driver/parking" element={<ParkingPage />} />
                <Route path="/driver/reservations" element={<ReservationPage />} />
                <Route path="/driver/vehicles" element={<VehiclePage />} />
                <Route path="/driver/payments" element={<PaymentPage />} />
                <Route path="/driver/pricing" element={<PricingPage />} />
                <Route path="/driver/incidents" element={<IncidentPage />} />
                <Route path="/driver/profile" element={<ProfilePage />} />
            </Route>
        </Routes>
    );
};

export default DriverRoutes;
