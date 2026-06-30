import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Typography, Drawer, Button, Dropdown, Space, Badge, Tag, Switch, ConfigProvider, theme as antdTheme, Modal, Steps } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    DashboardOutlined,
    CarOutlined,
    CalendarOutlined,
    CreditCardOutlined,
    UserOutlined,
    AlertOutlined,
    DollarOutlined,
    MenuOutlined,
    BellOutlined,
    LogoutOutlined,
    SettingOutlined,
    MoonOutlined,
    SunOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import '../assets/styles/driver.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const DriverLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [user, setUser] = useState(null);
    const [isInstructionModalVisible, setInstructionModalVisible] = useState(false);
    const [isDriverDarkMode, setIsDriverDarkMode] = useState(() => {
        return localStorage.getItem('driver_theme') === 'dark';
    });
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const authStr = localStorage.getItem('parking_auth');
        if (authStr) {
            try {
                setUser(JSON.parse(authStr));
            } catch (e) {}
        }
    }, []);

    const menuItems = [
        {
            type: 'group',
            label: 'MAIN',
            children: [
                { key: '/driver/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
                { key: '/driver/parking', icon: <CarOutlined />, label: 'Find Parking' },
                { key: '/driver/reservations', icon: <CalendarOutlined />, label: 'Reservations' },
            ]
        },
        {
            type: 'group',
            label: 'MANAGEMENT',
            children: [
                { key: '/driver/vehicles', icon: <CarOutlined />, label: 'Vehicles' },
                { key: '/driver/payments', icon: <CreditCardOutlined />, label: 'Payments' },
                { key: '/driver/pricing', icon: <DollarOutlined />, label: 'Pricing' },
            ]
        },
        {
            type: 'group',
            label: 'ACCOUNT',
            children: [
                { key: '/driver/incidents', icon: <AlertOutlined />, label: 'Incidents' },
            ]
        }
    ];

    const handleMenuClick = ({ key }) => {
        navigate(key);
        setDrawerVisible(false);
    };

    const toggleDriverTheme = (checked) => {
        setIsDriverDarkMode(checked);
        localStorage.setItem('driver_theme', checked ? 'dark' : 'light');
    };

    const handleLogout = () => {
        localStorage.removeItem('parking_auth');
        navigate('/login');
    };

    const userMenu = {
        items: [
            { key: 'profile', icon: <UserOutlined />, label: 'My Profile', onClick: () => navigate('/driver/profile') },
            { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
            { type: 'divider' },
            { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout, danger: true },
        ]
    };

    const sidebarContent = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="driver-logo-container" style={{ display: 'flex', flexDirection: 'column', height: 'auto', padding: '24px 16px', cursor: 'pointer' }} onClick={() => navigate('/driver/dashboard')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CarOutlined style={{ fontSize: '28px', color: '#f97316' }} />
                    {!collapsed && <Title level={3} className="driver-logo-text" style={{ margin: 0, color: '#f97316' }}>ParkSmart</Title>}
                </div>
                {!collapsed && <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', fontWeight: 600 }}>Smart Parking Solution</Text>}
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <Menu
                    className="driver-menu"
                    theme={isDriverDarkMode ? 'dark' : 'light'}
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    mode="inline"
                />
            </div>

            <div style={{ padding: '16px', borderTop: isDriverDarkMode ? '1px solid #333' : '1px solid #f0f0f0' }}>
                <Button 
                    type="primary" 
                    icon={<InfoCircleOutlined />} 
                    block={!collapsed}
                    style={{ 
                        backgroundColor: '#ea580c', 
                        borderColor: '#ea580c',
                        height: '40px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: collapsed ? 0 : undefined,
                        boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.4)'
                    }}
                    onClick={() => {
                        setInstructionModalVisible(true);
                        setDrawerVisible(false);
                    }}
                >
                    {!collapsed && <span>How to book</span>}
                </Button>
            </div>
        </div>
    );

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <ConfigProvider theme={{ algorithm: isDriverDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}>
            <Layout className="driver-layout">
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                breakpoint="lg"
                collapsedWidth="80"
                width={260}
                className="driver-sider"
                trigger={null}
                theme={isDriverDarkMode ? 'dark' : 'light'}
            >
                {sidebarContent}
            </Sider>

            <Drawer
                title={null}
                placement="left"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                styles={{ body: { padding: 0 } }}
                width={260}
            >
                <div style={{ height: '100%' }}>
                    {sidebarContent}
                </div>
            </Drawer>

            <Layout>
                <Header className="driver-header" style={{ background: isDriverDarkMode ? '#141414' : '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Button 
                            type="text" 
                            icon={<MenuOutlined />} 
                            onClick={() => setCollapsed(!collapsed)}
                            className="desktop-menu-btn"
                            style={{ display: window.innerWidth > 992 ? 'block' : 'none' }}
                        />
                        <Button 
                            type="text" 
                            icon={<MenuOutlined />} 
                            onClick={() => setDrawerVisible(true)}
                            className="mobile-menu-btn"
                            style={{ display: window.innerWidth <= 992 ? 'block' : 'none' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Title level={4} style={{ margin: 0, fontWeight: 700, lineHeight: 1.2, paddingTop: '8px' }}>
                                Welcome back, {user?.fullName || 'Driver'}! 👋
                            </Title>
                            <Text type="secondary" style={{ fontSize: '13px', lineHeight: 1.2, paddingBottom: '8px' }}>{currentDate}</Text>
                        </div>
                    </div>

                    <div className="header-right">

                        <Switch
                            checked={isDriverDarkMode}
                            onChange={toggleDriverTheme}
                            checkedChildren={<MoonOutlined />}
                            unCheckedChildren={<SunOutlined />}
                            style={{ marginRight: 16 }}
                        />
                        <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                            <Space style={{ cursor: 'pointer' }}>
                                <Avatar size="large" src={user?.avatar || undefined} icon={<UserOutlined />} style={{ backgroundColor: '#f97316' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }} className="user-info-desktop">
                                    <Text strong>{user?.fullName || 'Driver'}</Text>
                                    <Tag color="orange" style={{ margin: 0, fontSize: '11px', border: 'none' }}>DRIVER</Tag>
                                </div>
                            </Space>
                        </Dropdown>
                    </div>
                </Header>
                <Content className="driver-content animate-fade-in">
                    <Outlet />
                </Content>
            </Layout>

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' }}>
                        <InfoCircleOutlined style={{ color: '#ea580c' }} />
                        <span>Booking Instructions</span>
                    </div>
                }
                open={isInstructionModalVisible}
                onCancel={() => setInstructionModalVisible(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setInstructionModalVisible(false)} style={{ backgroundColor: '#ea580c', border: 'none' }}>
                        Got it!
                    </Button>
                ]}
                width={600}
                centered
            >
                <div style={{ padding: '24px 0' }}>
                    <Steps
                        direction="vertical"
                        current={-1}
                        items={[
                            { title: <strong style={{ fontSize: '16px' }}>Register Vehicle</strong>, description: 'Add your vehicle information to the system.' },
                            { title: <strong style={{ fontSize: '16px' }}>Select Slot</strong>, description: 'View available slots and select a suitable position.' },
                            { title: <strong style={{ fontSize: '16px' }}>Create Booking</strong>, description: 'Confirm booking details and create an order.' },
                            { title: <strong style={{ fontSize: '16px' }}>Payment</strong>, description: 'Pay online to complete your reservation.' },
                        ]}
                    />
                </div>
            </Modal>
        </Layout>
        </ConfigProvider>
    );
};

export default DriverLayout;
