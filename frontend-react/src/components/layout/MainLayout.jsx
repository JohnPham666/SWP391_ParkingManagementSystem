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
  BuildOutlined,
  BarChartOutlined,
  AlertOutlined,
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
    { key: 'profile', icon: <UserOutlined />, label: 'My Profile' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: handleLogout }
  ];

  const allMenuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard', roles: ['Admin', 'ParkingManager'] },
    
    // Admin only
    { key: '/admin/users', icon: <TeamOutlined />, label: 'User Management', roles: ['Admin'] },
    { key: '/admin/settings', icon: <SettingOutlined />, label: 'Settings', roles: ['Admin'] },
    { key: '/admin/logs', icon: <FileTextOutlined />, label: 'System Logs', roles: ['Admin'] },
    
    // Manager & Staff
    { key: '/admin/sessions', icon: <CarOutlined />, label: 'Parking Sessions', roles: ['ParkingManager', 'ParkingStaff'] },
    { key: '/admin/slots', icon: <DashboardOutlined />, label: 'Parking Slots', roles: ['ParkingManager', 'ParkingStaff'] },
    { key: '/admin/vehicles', icon: <CarOutlined />, label: 'Vehicles', roles: ['ParkingManager', 'ParkingStaff'] },
    { key: '/admin/reservations', icon: <ProfileOutlined />, label: 'Reservations', roles: ['ParkingManager', 'ParkingStaff'] },
    { key: '/admin/payments', icon: <ProfileOutlined />, label: 'Payments', roles: ['ParkingManager', 'ParkingStaff'] },
    
    // Manager only
    { key: '/admin/subscriptions', icon: <ProfileOutlined />, label: 'Subscriptions', roles: ['ParkingManager'] },
    { key: '/admin/buildings', icon: <BuildOutlined />, label: 'Buildings', roles: ['ParkingManager'] },
    { key: '/admin/pricing', icon: <SettingOutlined />, label: 'Pricing Policies', roles: ['ParkingManager'] },
    { key: '/admin/reports', icon: <BarChartOutlined />, label: 'Reports', roles: ['ParkingManager'] },
    
    // Shared Incidents
    { key: '/admin/incidents', icon: <AlertOutlined />, label: 'Incidents', roles: ['ParkingManager', 'ParkingStaff'] },
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
          borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #f0f0f0'
        }}>
          <Title level={4} style={{ color: '#ea580c', margin: 0, display: collapsed ? 'none' : 'block' }}>
            ParkSmart
          </Title>
          {collapsed && <Title level={4} style={{ color: '#ea580c', margin: 0 }}>PS</Title>}
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
          background: isDarkMode ? '#141414' : '#fff', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          zIndex: 9
        }}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: () => setCollapsed(!collapsed),
            style: { fontSize: '20px', cursor: 'pointer', transition: 'color 0.3s', color: isDarkMode ? '#fff' : '#000' }
          })}
          <Space size="large">
            <div onClick={toggleTheme} style={{ cursor: 'pointer', fontSize: 20, color: isDarkMode ? '#fff' : '#666', display: 'flex', alignItems: 'center' }}>
              {isDarkMode ? <BulbFilled style={{ color: '#faad14' }} /> : <BulbOutlined />}
            </div>
            <Badge count={5} size="small">
              <BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: isDarkMode ? '#fff' : '#666' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer', alignItems: 'center' }}>
                <Avatar style={{ backgroundColor: '#ea580c' }} icon={<UserOutlined />} />
                <Text strong style={{ color: isDarkMode ? '#fff' : '#000' }}>{userName}</Text>
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
