import React, { useEffect, useState } from 'react';
import { Typography, Card, Row, Col, Statistic, Empty, Button } from 'antd';
import { CarOutlined, HistoryOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title, Text } = Typography;

const DriverDashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = localStorage.getItem('parking_auth');
    if (!auth) {
      navigate('/login');
      return;
    }
    try {
      const parsed = JSON.parse(auth);
      setUser(parsed.user || parsed);
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <div style={{ padding: '40px 10%', minHeight: 'calc(100vh - 64px - 150px)', backgroundColor: '#f9fafb' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2}>Welcome back, {user.fullName || 'Driver'}!</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>Here is your parking overview.</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: 12 }}>
            <Statistic 
              title={<span style={{ fontWeight: 600 }}>Active Sessions</span>}
              value={0} 
              prefix={<CarOutlined style={{ color: '#ea580c' }} />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: 12 }}>
            <Statistic 
              title={<span style={{ fontWeight: 600 }}>Upcoming Reservations</span>}
              value={0} 
              prefix={<CalendarOutlined style={{ color: '#10b981' }} />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ borderRadius: 12 }}>
            <Statistic 
              title={<span style={{ fontWeight: 600 }}>Total Payments</span>}
              value={0} 
              prefix={<HistoryOutlined style={{ color: '#3b82f6' }} />} 
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 48, backgroundColor: '#fff', padding: 40, borderRadius: 16, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Empty 
          description={
            <span>
              You don't have any active parking sessions right now.
            </span>
          }
        >
          <Button type="primary" size="large" style={{ backgroundColor: '#ea580c', marginTop: 16 }}>
            Book a Slot
          </Button>
        </Empty>
      </div>
    </div>
  );
};

export default DriverDashboard;
