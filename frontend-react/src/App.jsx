import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Layouts
import MainLayout from './components/layout/MainLayout';
import DriverLayout from './components/layout/DriverLayout';

// Pages
import LandingPage from './pages/driver/LandingPage';
import Dashboard from './pages/admin/Dashboard';
import SystemSettings from './pages/admin/SystemSettings';
import SystemLogs from './pages/admin/SystemLogs';
import UserManagement from './pages/admin/UserManagement';
import SessionManagement from './pages/admin/SessionManagement';
import VehicleManagement from './pages/admin/VehicleManagement';
import ReservationManagement from './pages/admin/ReservationManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import IncidentManagement from './pages/admin/IncidentManagement';
import SubscriptionManagement from './pages/admin/SubscriptionManagement';
import BuildingManagement from './pages/admin/BuildingManagement';
import PricingManagement from './pages/admin/PricingManagement';
import ReportManagement from './pages/admin/ReportManagement';
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
          
          {/* Nhánh 3: Quản trị (Admin/Manager/Staff) */}
          <Route 
            path="/admin" 
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            {/* Admin */}
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="logs" element={<SystemLogs />} />
            
            {/* Manager & Staff */}
            <Route path="sessions" element={<SessionManagement />} />
            <Route path="slots" element={<SlotManagement />} />
            <Route path="vehicles" element={<VehicleManagement />} />
            <Route path="reservations" element={<ReservationManagement />} />
            <Route path="payments" element={<PaymentManagement />} />
            <Route path="incidents" element={<IncidentManagement />} />
            
            {/* Manager only */}
            <Route path="subscriptions" element={<SubscriptionManagement />} />
            <Route path="buildings" element={<BuildingManagement />} />
            <Route path="pricing" element={<PricingManagement />} />
            <Route path="reports" element={<ReportManagement />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
