import React, { useState, useContext, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Badge, Switch, Tag, Popover, List, Button } from 'antd';
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

  const [newIncidentCount, setNewIncidentCount] = useState(0);
  const [newIncidentsList, setNewIncidentsList] = useState([]);
  const [lastCheckedTime, setLastCheckedTime] = useState(() => {
    return parseInt(localStorage.getItem('lastCheckedIncidentTime') || '0', 10);
  });

  useEffect(() => {
    const auth = localStorage.getItem('parking_auth');
    if (auth) {
      const parsed = JSON.parse(auth);
      const user = parsed.user || parsed;
      let role = user.role || 'Staff';
      if (typeof role === 'string') {
        let upperRole = role.toUpperCase();
        if (upperRole.startsWith('ROLE_')) {
          upperRole = upperRole.substring(5);
        }
        if (upperRole === 'ADMIN') role = 'Admin';
        else if (upperRole === 'PARKINGMANAGER' || upperRole === 'PARKING_MANAGER') role = 'ParkingManager';
        else if (upperRole === 'PARKINGSTAFF' || upperRole === 'PARKING_STAFF') role = 'ParkingStaff';
      }
      setUserRole(role);
      setUserName(user.fullName || 'User');
      // Fetch open incidents for manager notification bell
      if (role === 'ParkingManager') {
        const fetchNewIncidents = async () => {
          try {
            const { incidentApi } = await import('../../services/api');
            const res = await incidentApi.getIncidents();
            let data = res.data?.success ? res.data.data : res.data;
            if (Array.isArray(data)) {
              const openIncidents = data.filter(i => i.status === 'OPEN');
              openIncidents.sort((a, b) => new Date(b.createdAt || b.reportTime || 0) - new Date(a.createdAt || a.reportTime || 0));
              
              const newItems = openIncidents.filter(i => new Date(i.createdAt || i.reportTime || 0).getTime() > lastCheckedTime);
              setNewIncidentCount(newItems.length);
              setNewIncidentsList(openIncidents.slice(0, 5));
            }
          } catch (error) {
            // ignore silently for layout
          }
        };
        fetchNewIncidents();
        const interval = setInterval(fetchNewIncidents, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [lastCheckedTime]);

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
    { key: `${basePath}/sessions`, icon: <CarOutlined />, label: 'Parking Sessions', roles: ['ParkingManager', 'ParkingStaff'] },
    { key: `${basePath}/slots`, icon: <DashboardOutlined />, label: 'Parking Slots', roles: ['ParkingManager', 'ParkingStaff'] },
    { key: `${basePath}/vehicles`, icon: <CarOutlined />, label: 'Vehicles', roles: ['ParkingManager'] },
    { key: `${basePath}/reservations`, icon: <CalendarOutlined />, label: 'Reservations', roles: ['ParkingManager', 'ParkingStaff'] },
    { key: `${basePath}/payments`, icon: <CreditCardOutlined />, label: 'Payments', roles: ['ParkingManager', 'ParkingStaff'] },
    { key: `${basePath}/incidents`, icon: <WarningOutlined />, label: 'Incidents', roles: ['Admin', 'ParkingManager', 'ParkingStaff'] },

    // Manager & Admin
    { key: `${basePath}/buildings`, icon: <BankOutlined />, label: 'Parking Config (Buildings)', roles: ['Admin', 'ParkingManager'] },
    { key: `${basePath}/pricing`, icon: <DollarOutlined />, label: 'Pricing Policies', roles: ['Admin'] },

    // Manager only (Vé tháng)
    { key: `${basePath}/subscriptions`, icon: <ProfileOutlined />, label: 'Subscriptions', roles: ['ParkingManager'] },
    { key: `${basePath}/reports`, icon: <BarChartOutlined />, label: 'Reports', roles: ['ParkingManager'] },
  ];

  // Lọc menu theo role hiện tại
  const menuItems = allMenuItems.filter(item =>
    item.roles.includes(userRole)
  );

  const handlePopoverChange = (visible) => {
    if (visible && newIncidentCount > 0) {
      const now = Date.now();
      setLastCheckedTime(now);
      localStorage.setItem('lastCheckedIncidentTime', now.toString());
      setNewIncidentCount(0);
    }
  };

  const notificationContent = (
    <div style={{ width: 320 }}>
      <List
        size="small"
        dataSource={newIncidentsList}
        renderItem={item => (
          <List.Item 
            style={{ cursor: 'pointer', transition: 'background 0.3s' }}
            onClick={() => navigate('/manager/incidents')}
            className="notification-item"
          >
            <List.Item.Meta
              title={<span style={{ fontWeight: 600 }}>#{item.incidentId} - {item.incidentType}</span>}
              description={item.description?.length > 45 ? item.description.substring(0, 45) + '...' : item.description}
            />
          </List.Item>
        )}
        locale={{ emptyText: 'No open incidents' }}
      />
      <div style={{ textAlign: 'center', marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
        <Button type="link" onClick={() => navigate('/manager/incidents')} style={{ fontWeight: 'bold' }}>
          View all incidents
        </Button>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        collapsedWidth={80}
        theme={isDarkMode ? "dark" : "light"}
        style={{
          boxShadow: isDarkMode ? '2px 0 8px 0 rgba(0,0,0,.15)' : '2px 0 8px 0 rgba(29,35,41,.05)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: 'auto', padding: '24px 16px', cursor: 'pointer', borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #f0f0f0' }} onClick={() => navigate(basePath)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <CarOutlined style={{ fontSize: '28px', color: '#f97316' }} />
            {!collapsed && <Title level={3} style={{ margin: 0, color: '#f97316' }}>ParkSmart</Title>}
          </div>
          {!collapsed && <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', fontWeight: 600 }}>Smart Parking Solution</Text>}
        </div>
        <Menu
          className="main-sidebar-menu"
          theme={isDarkMode ? "dark" : "light"}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
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
            <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                checkedChildren={<span>🌙</span>}
                unCheckedChildren={<span>☀️</span>}
                style={{ marginRight: 16 }}
            />
            {userRole === 'ParkingManager' && (
              <Popover
                content={notificationContent}
                title="Recent Open Incidents"
                trigger="click"
                placement="bottomRight"
                onOpenChange={handlePopoverChange}
              >
                <Badge count={newIncidentCount} size="small" offset={[-2, 2]}>
                  <BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: isDarkMode ? '#fff' : '#000', padding: '4px' }} />
                </Badge>
              </Popover>
            )}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer', alignItems: 'center' }}>
                <Avatar style={{ backgroundColor: '#f97316', color: '#fff' }} icon={<UserOutlined />} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                  <Text strong style={{ color: isDarkMode ? '#fff' : '#000' }}>{userName}</Text>
                  <Tag color="orange" style={{ margin: 0, fontSize: '11px', border: 'none' }}>{userRole.toUpperCase()}</Tag>
                </div>
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
