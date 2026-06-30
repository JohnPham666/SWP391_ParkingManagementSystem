import React, { useContext } from 'react';
import { Layout, Button, Space, Typography, Dropdown, theme } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import logoImg from '../../assets/logo.png';
import { 
  CarOutlined, 
  GlobalOutlined, 
  DownOutlined, 
  EnvironmentOutlined, 
  CreditCardOutlined, 
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  MoonOutlined,
  SunOutlined
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const DriverLayout = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  // Dropdown for Services
  const servicesMenu = {
    items: [
      { 
        key: 'find-parking', 
        icon: <EnvironmentOutlined style={{ color: '#ea580c', fontSize: '16px' }}/>, 
        label: <span style={{ fontWeight: 500 }}>Find Parking Spot</span>, 
        onClick: () => navigate('/login') 
      },
      { 
        key: 'booking', 
        icon: <SafetyCertificateOutlined style={{ color: '#ea580c', fontSize: '16px' }}/>, 
        label: <span style={{ fontWeight: 500 }}>Advanced Booking</span>, 
        onClick: () => navigate('/login') 
      },
      { 
        key: 'subscriptions', 
        icon: <CreditCardOutlined style={{ color: '#ea580c', fontSize: '16px' }}/>, 
        label: <span style={{ fontWeight: 500 }}>Monthly Subscriptions</span>, 
        onClick: () => navigate('/login') 
      },
    ]
  };

  // Dropdown for Features
  const featuresMenu = {
    items: [
      { 
        key: 'real-time', 
        label: <span style={{ fontWeight: 500 }}>Real-time Availability</span>, 
        onClick: () => {
          if (window.location.pathname !== '/') {
            navigate('/');
            setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 300);
          } else {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      },
      { 
        key: 'history', 
        label: <span style={{ fontWeight: 500 }}>Transparent History</span>, 
        onClick: () => {
          if (window.location.pathname !== '/') {
            navigate('/');
            setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 300);
          } else {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      },
      { 
        key: 'support', 
        icon: <ThunderboltOutlined style={{ color: '#ea580c' }}/>,
        label: <span style={{ fontWeight: 500 }}>Instant Support</span>, 
        onClick: () => {
          if (window.location.pathname !== '/') {
            navigate('/');
            setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 300);
          } else {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      },
    ]
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/');
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: token.colorBgLayout }}>
      <Header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 1000, 
        width: '100%', 
        backgroundColor: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: '120px',
        lineHeight: '120px'
      }}>
        {/* Left Section: Brand & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Brand */}
          <div 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: '48px' }}
            onClick={scrollToTop}
          >
            <img src={logoImg} alt="ParkSmart Logo" style={{ 
              height: '72px', 
              marginRight: '12px', 
              objectFit: 'contain',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }} />
            <Title level={3} style={{ margin: 0, color: token.colorTextHeading, fontWeight: 800, fontSize: '24px', letterSpacing: '-0.5px' }}>ParkSmart</Title>
          </div>

          {/* Navigation (Dropbox style spacing and font) */}
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <Dropdown menu={servicesMenu} placement="bottom" arrow={{ pointAtCenter: true }} trigger={['hover', 'click']}>
              <span style={{ cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: token.colorText, display: 'flex', alignItems: 'center', gap: '6px' }} className="nav-item">
                Services <DownOutlined style={{ fontSize: '12px', color: token.colorTextSecondary, fontWeight: 'bold' }} className="nav-arrow" />
              </span>
            </Dropdown>
            
            <Dropdown menu={featuresMenu} placement="bottom" arrow={{ pointAtCenter: true }} trigger={['hover', 'click']}>
              <span style={{ cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: token.colorText, display: 'flex', alignItems: 'center', gap: '6px' }} className="nav-item">
                Features <DownOutlined style={{ fontSize: '12px', color: token.colorTextSecondary, fontWeight: 'bold' }} className="nav-arrow" />
              </span>
            </Dropdown>

            <span 
              style={{ cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: token.colorText }} 
              className="nav-item"
              onClick={() => {
                if (window.location.pathname !== '/') navigate('/');
                setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
              }}
            >
              Pricing
            </span>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Space size="large" align="center">
            {/* Theme Toggle */}
            <Button 
              type="text" 
              icon={isDarkMode ? <SunOutlined style={{ fontSize: '20px', color: '#fbbf24' }}/> : <MoonOutlined style={{ fontSize: '20px', color: '#4b5563' }}/>} 
              onClick={toggleTheme}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />

            {localStorage.getItem('parking_auth') ? (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginLeft: '12px' }}>
                <span 
                  style={{ cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: token.colorText }} 
                  onClick={() => navigate('/dashboard')}
                  className="nav-item"
                >
                  Dashboard
                </span>
                <Button 
                  type="primary" 
                  style={{ backgroundColor: '#ea580c', fontWeight: 600, borderRadius: '8px', height: '42px', padding: '0 24px', fontSize: '15px', boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.2)', border: 'none' }} 
                  onClick={() => {
                    localStorage.removeItem('parking_auth');
                    navigate('/login');
                  }}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginLeft: '16px' }}>
                <span 
                  style={{ cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: token.colorText }} 
                  onClick={() => navigate('/login')}
                  className="nav-item"
                >
                  Log in
                </span>
                <Button 
                  type="primary" 
                  style={{ backgroundColor: '#ea580c', fontWeight: 600, borderRadius: '8px', height: '42px', padding: '0 28px', fontSize: '15px', boxShadow: '0 4px 10px -2px rgba(234, 88, 12, 0.3)', border: 'none' }} 
                  onClick={() => navigate('/register')}
                >
                  Sign up
                </Button>
              </div>
            )}
          </Space>
        </div>
      </Header>

      <Content>
        <Outlet />
      </Content>

      {/* Embedded CSS for seamless hover states */}
      <style>{`
        .nav-item {
          transition: all 0.2s ease;
        }
        .nav-item:hover {
          color: #ea580c !important;
        }
        .nav-item:hover .nav-arrow {
          color: #ea580c !important;
          transform: rotate(180deg);
        }
        .nav-arrow {
          transition: transform 0.3s ease, color 0.2s ease;
        }
        .nav-icon:hover {
          color: #ea580c !important;
        }
      `}</style>
    </Layout>
  );
};

export default DriverLayout;
