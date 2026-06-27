import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { getDefaultRouteByRole } from './utils/authUtils';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';

// Layouts
import MainLayout from './components/layout/MainLayout';
import OldDriverLayout from './components/layout/DriverLayout';

// Driver Module
import DriverRoutes from './modules/driver/routes/DriverRoutes';

// Pages
import LandingPage from './pages/driver/LandingPage';
import DriverDashboard from './pages/driver/DriverDashboard';
// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSessions from './pages/admin/AdminSessions';
import AdminIncidents from './pages/admin/AdminIncidents';
import SystemSettings from './pages/admin/SystemSettings';
import SystemLogs from './pages/admin/SystemLogs';
import UserManagement from './pages/admin/UserManagement';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerSessions from './pages/manager/ManagerSessions';
import ManagerIncidents from './pages/manager/ManagerIncidents';
import ManagerUsers from './pages/manager/ManagerUsers';
import ManagerBuildings from './pages/manager/ManagerBuildings';
import ManagerPayments from './pages/manager/ManagerPayments';
import ManagerPricing from './pages/manager/ManagerPricing';
import ManagerReports from './pages/manager/ManagerReports';
import ManagerReservations from './pages/manager/ManagerReservations';
import ManagerSlots from './pages/manager/ManagerSlots';
import ManagerSubscriptions from './pages/manager/ManagerSubscriptions';
import ManagerVehicles from './pages/manager/ManagerVehicles';

import SubscriptionManagement from './pages/admin/SubscriptionManagement';
import BuildingManagement from './pages/admin/BuildingManagement';
import PricingManagement from './pages/admin/PricingManagement';
import ReportManagement from './pages/admin/ReportManagement';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffIncidents from './pages/staff/StaffIncidents';
import StaffPayments from './pages/staff/StaffPayments';
import StaffSlots from './pages/staff/StaffSlots';
import StaffReservations from './pages/staff/StaffReservations';
import StaffSessions from './pages/staff/StaffSessions';

// Shared Components (To be moved by team later if needed)
import VehicleManagement from './pages/admin/VehicleManagement';
import ReservationManagement from './pages/admin/ReservationManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import SlotManagement from './pages/admin/SlotManagement';

// Component kiểm tra đăng nhập cho Admin/Staff
const PrivateRoute = ({ children, allowedRoles }) => {
  const authStr = localStorage.getItem('parking_auth');
  if (!authStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const auth = JSON.parse(authStr);
    if (!auth || !auth.role) {
      return <Navigate to="/login" replace />;
    }

    // Check role and normalize it by stripping 'ROLE_' prefix if it exists
    let role = auth.role.toUpperCase();
    if (role.startsWith('ROLE_')) {
      role = role.substring(5);
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
      // Redirect to their default dashboard
      const route = getDefaultRouteByRole(auth);
      return <Navigate to={route} replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Nhánh 1: Khách hàng (Driver) - Landing Page public */}
          <Route path="/" element={<OldDriverLayout />}>
            <Route index element={<LandingPage />} />

          </Route>

          {/* New Driver Module Routes */}
          <Route path="/*" element={
            <PrivateRoute allowedRoles={['DRIVER']}>
              <DriverRoutes />
            </PrivateRoute>
          } />

          {/* Nhánh 2: Auth (Login dùng chung hoặc chia ra sau) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Nhánh 3: Quản trị (Admin) */}
          <Route path="/admin" element={<PrivateRoute allowedRoles={['ADMIN']}><MainLayout /></PrivateRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="logs" element={<SystemLogs />} />
            <Route path="sessions" element={<AdminSessions />} />
            <Route path="slots" element={<SlotManagement />} />
            <Route path="vehicles" element={<VehicleManagement />} />
            <Route path="reservations" element={<ReservationManagement />} />
            <Route path="payments" element={<PaymentManagement />} />
            <Route path="incidents" element={<AdminIncidents />} />
            <Route path="buildings" element={<BuildingManagement />} />
            <Route path="pricing" element={<PricingManagement />} />
          </Route>

          {/* Nhánh 4: Quản trị (Manager) */}
          <Route path="/manager" element={<PrivateRoute allowedRoles={['PARKINGMANAGER', 'PARKING_MANAGER', 'ADMIN']}><MainLayout /></PrivateRoute>}>
            <Route index element={<ManagerDashboard />} />
            <Route path="users" element={<ManagerUsers />} />
            <Route path="sessions" element={<ManagerSessions />} />
            <Route path="slots" element={<ManagerSlots />} />
            <Route path="vehicles" element={<ManagerVehicles />} />
            <Route path="reservations" element={<ManagerReservations />} />
            <Route path="payments" element={<ManagerPayments />} />
            <Route path="incidents" element={<ManagerIncidents />} />
            <Route path="subscriptions" element={<ManagerSubscriptions />} />
            <Route path="buildings" element={<ManagerBuildings />} />
            <Route path="pricing" element={<ManagerPricing />} />
            <Route path="reports" element={<ManagerReports />} />
          </Route>

          {/* Nhánh 5: Quản trị (Staff) */}
          <Route path="/staff" element={<PrivateRoute allowedRoles={['PARKINGSTAFF', 'PARKING_STAFF', 'ADMIN']}><MainLayout /></PrivateRoute>}>
            <Route index element={<StaffDashboard />} />
            <Route path="sessions" element={<StaffSessions />} />
            <Route path="slots" element={<StaffSlots />} />
            <Route path="reservations" element={<StaffReservations />} />
            <Route path="payments" element={<StaffPayments />} />
            <Route path="incidents" element={<StaffIncidents />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
