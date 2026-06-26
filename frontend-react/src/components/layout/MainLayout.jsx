import React, { useState, useContext, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Badge } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  UserOutlined, 
  DashboardOutlined, 
  CarOutlined, 
  LogoutOutlined,
  TeamOutlined,
  BellOutlined,
  SettingOutlined,
  ProfileOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  PlusCircleOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  WarningOutlined,
  BankOutlined,
  DollarOutlined,
  BarChartOutlined,
  BulbOutlined,
  BulbFilled
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('User');
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    const auth = localStorage.getItem('parking_auth');
    if (auth) {
      const parsed = JSON.parse(auth);
      const user = parsed.user || parsed;
      setUserRole(user.role || 'Staff');
      setUserName(user.fullName || 'User');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('parking_auth');
    navigate('/login');
  };

  const userMenuItems = [
    ...(userRole !== 'ParkingManager' ? [
      { key: 'profile', icon: <UserOutlined />, label: 'My Profile' },
      { type: 'divider' }
    ] : []),
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: handleLogout }
  ];

  const basePath = userRole === 'Admin' ? '/admin' : userRole === 'ParkingManager' ? '/manager' : '/staff';

  const allMenuItems = [
    { key: `${basePath}`, icon: <AppstoreOutlined />, label: 'Dashboard', roles: ['Admin', 'ParkingManager', 'ParkingStaff'] },
    
    // Admin only
    { key: `${basePath}/users`, icon: <TeamOutlined />, label: 'User Management', roles: ['Admin'] },
    { key: `${basePath}/settings`, icon: <SettingOutlined />, label: 'System Settings', roles: ['Admin'] },
    { key: `${basePath}/logs`, icon: <FileTextOutlined />, label: 'System Logs', roles: ['Admin'] },
    
    // Shared Operational
    // Shared Operational
    { key: `${basePath}/sessions`, icon: <CarOutlined />, label: 'Parking Sessions', roles: ['ParkingManager'] },
    { key: `${basePath}/slots`, icon: <DashboardOutlined />, label: 'Parking Slots', roles: ['ParkingManager', 'ParkingStaff'] },
    { key: `${basePath}/vehicles`, icon: <CarOutlined />, label: 'Vehicles', roles: ['ParkingManager'] },
    { key: `${basePath}/reservations`, icon: <CalendarOutlined />, label: 'Reservations', roles: ['ParkingManager', 'ParkingStaff'] },
    { key: `${basePath}/payments`, icon: <CreditCardOutlined />, label: 'Payments', roles: ['ParkingManager', 'ParkingStaff'] },
    { key: `${basePath}/incidents`, icon: <WarningOutlined />, label: 'Incidents', roles: ['ParkingManager', 'ParkingStaff'] },
    
    // Manager & Admin
    { key: `${basePath}/buildings`, icon: <BankOutlined />, label: 'Parking Config (Buildings)', roles: ['Admin', 'ParkingManager'] },
    { key: `${basePath}/pricing`, icon: <DollarOutlined />, label: 'Pricing Policies', roles: ['Admin', 'ParkingManager'] },

    // Manager only (Vé tháng)
    { key: `${basePath}/subscriptions`, icon: <ProfileOutlined />, label: 'Subscriptions', roles: ['ParkingManager'] },
    { key: `${basePath}/reports`, icon: <BarChartOutlined />, label: 'Reports', roles: ['ParkingManager'] },
  ];

  // Lọc menu theo role hiện tại
  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        theme={isDarkMode ? "dark" : "light"}
        style={{
          boxShadow: isDarkMode ? '2px 0 8px 0 rgba(0,0,0,.15)' : '2px 0 8px 0 rgba(29,35,41,.05)',
          zIndex: 10
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#ea580c',
          borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #ea580c'
        }}>
          <Title level={4} style={{ color: '#fff', margin: 0, display: collapsed ? 'none' : 'block' }}>
            ParkSmart
          </Title>
          {collapsed && <Title level={4} style={{ color: '#fff', margin: 0 }}>PS</Title>}
        </div>
        <Menu 
          theme={isDarkMode ? "dark" : "light"} 
          mode="inline" 
          selectedKeys={[location.pathname]} 
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, padding: '8px 0' }}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#ea580c', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          zIndex: 9
        }}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: () => setCollapsed(!collapsed),
            style: { fontSize: '20px', cursor: 'pointer', transition: 'color 0.3s', color: '#fff' }
          })}
          <Space size="large">
            <div onClick={toggleTheme} style={{ cursor: 'pointer', fontSize: 20, color: '#fff', display: 'flex', alignItems: 'center' }}>
              {isDarkMode ? <BulbFilled style={{ color: '#faad14' }} /> : <BulbOutlined />}
            </div>
            {userRole !== 'ParkingManager' && (
              <Badge count={5} size="small">
                <BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#fff' }} />
              </Badge>
            )}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer', alignItems: 'center' }}>
                <Avatar style={{ backgroundColor: '#fff', color: '#ea580c' }} icon={<UserOutlined />} />
                <Text strong style={{ color: '#fff' }}>{userName}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: isDarkMode ? '#141414' : '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
