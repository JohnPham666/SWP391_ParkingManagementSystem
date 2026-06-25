import React from 'react';
import { Layout, Menu, Button, Space, Typography } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const DriverLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', label: 'Home' },
    { key: '/features', label: 'Features' },
    { key: '/pricing', label: 'Pricing' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 1000, 
        width: '100%', 
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 5%'
      }}>
        {/* Brand */}
        <div 
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <div style={{
            width: 36, height: 36, backgroundColor: '#ea580c', borderRadius: 8,
            display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 12
          }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>PS</span>
          </div>
          <Title level={3} style={{ margin: 0, color: '#1f2937', fontWeight: 800 }}>ParkSmart</Title>
        </div>

        {/* Navigation */}
        <Menu 
          mode="horizontal" 
          selectedKeys={[location.pathname]} 
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, justifyContent: 'center', borderBottom: 'none', fontWeight: 500, fontSize: '16px' }}
        />

        <Space size="middle">
          <Button type="text" style={{ fontWeight: 600 }} onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button type="primary" style={{ backgroundColor: '#ea580c', fontWeight: 600, borderRadius: 6 }} onClick={() => navigate('/register')}>
            Sign Up
          </Button>
        </Space>
      </Header>

      <Content>
        <Outlet />
      </Content>

      <Footer style={{ textAlign: 'center', backgroundColor: '#f9fafb', padding: '40px 20px', color: '#6b7280' }}>
        <Title level={4} style={{ color: '#374151' }}>ParkSmart - Smart Parking System</Title>
        <p>A system that helps drivers find available spots, book in advance, and pay automatically.</p>
        <p>© {new Date().getFullYear()} ParkSmart. All Rights Reserved.</p>
      </Footer>
    </Layout>
  );
};

export default DriverLayout;
