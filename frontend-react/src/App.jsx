import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Layouts
import MainLayout from './components/layout/MainLayout';
import DriverLayout from './components/layout/DriverLayout';

// Pages
import LandingPage from './pages/driver/LandingPage';
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
import StaffSessions from './pages/staff/StaffSessions';
import StaffIncidents from './pages/staff/StaffIncidents';

// Shared Components (To be moved by team later if needed)
import VehicleManagement from './pages/admin/VehicleManagement';
import ReservationManagement from './pages/admin/ReservationManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import SlotManagement from './pages/admin/SlotManagement';

// Component kiểm tra đăng nhập cho Admin/Staff
const PrivateRoute = ({ children }) => {
  const auth = localStorage.getItem('parking_auth');
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  return children;
};



function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Nhánh 1: Khách hàng (Driver) */}
          <Route path="/" element={<DriverLayout />}>
            <Route index element={<LandingPage />} />
            {/* Các trang dành cho driver (đặt chỗ, lịch sử) sẽ thêm sau */}
          </Route>

          {/* Nhánh 2: Auth (Login dùng chung hoặc chia ra sau) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Nhánh 3: Quản trị (Admin) */}
          <Route path="/admin" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
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
          </Route>

          {/* Nhánh 4: Quản trị (Manager) */}
          <Route path="/manager" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
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
          <Route path="/staff" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route index element={<StaffDashboard />} />
            <Route path="sessions" element={<StaffSessions />} />
            <Route path="slots" element={<SlotManagement />} />
            <Route path="vehicles" element={<VehicleManagement />} />
            <Route path="reservations" element={<ReservationManagement />} />
            <Route path="payments" element={<PaymentManagement />} />
            <Route path="incidents" element={<StaffIncidents />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
