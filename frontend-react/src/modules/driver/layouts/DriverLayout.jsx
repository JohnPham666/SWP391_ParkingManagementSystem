import React, { useState } from 'react';
import { Layout, Menu, Avatar, Typography, Drawer, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    DashboardOutlined,
    CarOutlined,
    CalendarOutlined,
    CreditCardOutlined,
    UserOutlined,
    HistoryOutlined,
    AlertOutlined,
    DollarOutlined,
    MenuOutlined
} from '@ant-design/icons';
import '../assets/styles/driver.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const DriverLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { key: '/driver/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: '/driver/parking', icon: <CarOutlined />, label: 'Parking' },
        { key: '/driver/reservations', icon: <CalendarOutlined />, label: 'Reservations' },
        { key: '/driver/vehicles', icon: <CarOutlined />, label: 'Vehicles' },
        { key: '/driver/payments', icon: <CreditCardOutlined />, label: 'Payments' },
        { key: '/driver/pricing', icon: <DollarOutlined />, label: 'Pricing' },
        { key: '/driver/history', icon: <HistoryOutlined />, label: 'History' },
        { key: '/driver/incidents', icon: <AlertOutlined />, label: 'Incidents' },
        { key: '/driver/profile', icon: <UserOutlined />, label: 'Profile' },
    ];

    const handleMenuClick = ({ key }) => {
        navigate(key);
        setDrawerVisible(false);
    };

    const logoStyle = {
        height: '32px',
        margin: '16px',
        color: '#f97316',
        fontWeight: 'bold',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
    };

    const sidebarContent = (
        <>
            <div style={logoStyle}>
                {collapsed ? 'PMS' : 'Parking Management System'}
            </div>
            <Menu
                theme="light"
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
            />
        </>
    );

    return (
        <Layout style={{ minHeight: '100vh' }} className="driver-layout">
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                breakpoint="lg"
                collapsedWidth="80"
                className="desktop-sider"
                theme="light"
            >
                {sidebarContent}
            </Sider>

            <Drawer
                title="Menu"
                placement="left"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                styles={{ body: { padding: 0 } }}
                className="mobile-drawer"
            >
                {sidebarContent}
            </Drawer>

            <Layout>
                <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="header-left">
                        <Button 
                            className="mobile-menu-btn" 
                            type="text" 
                            icon={<MenuOutlined />} 
                            onClick={() => setDrawerVisible(true)} 
                        />
                        <Title level={4} style={{ margin: 0, display: 'inline-block' }} className="desktop-title">
                            Parking Management System
                        </Title>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Text strong>Driver User</Text>
                        <Avatar style={{ backgroundColor: '#f97316' }} icon={<UserOutlined />} />
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#f5f5f5', borderRadius: '8px' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default DriverLayout;
