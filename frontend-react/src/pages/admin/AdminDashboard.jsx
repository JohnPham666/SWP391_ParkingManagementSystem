import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';
import { 
  CarOutlined, 
  DollarOutlined, 
  SafetyCertificateOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Navigate } from 'react-router-dom';
import { monitoringApi } from '../../services/api';

const { Title, Text } = Typography;

const data = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 1250000,
    activeSessions: 42,
    availableSlots: 156,
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  const auth = JSON.parse(localStorage.getItem('parking_auth') || '{}');
  const isStaff = auth.user?.roleName === 'ParkingStaff' || auth.role === 'ParkingStaff' || auth.user?.role === 'ParkingStaff';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await monitoringApi.getDashboard();
        if (res.data?.success) {
          setDashboardData(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  if (!dashboardData) return <div style={{ textAlign: 'center', padding: '50px' }}>Error loading data</div>;

  const sum = dashboardData.summary;

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>System Dashboard</Title>
      
      <Row gutter={[16, 16]}>
        {!isStaff && (
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Statistic
                title="Total Revenue (This Week)"
                value={1250000} // Mock data for Admin
                prefix={<DollarOutlined />}
                suffix="₫"
                valueStyle={{ color: '#3f8600', fontWeight: 600 }}
              />
            </Card>
          </Col>
        )}
        <Col xs={24} sm={12} md={isStaff ? 8 : 6}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="Total Capacity"
              value={sum.totalCapacity}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1677ff', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={isStaff ? 8 : 6}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="Current Occupancy"
              value={sum.currentOccupancy}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#ea580c', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={isStaff ? 8 : 6}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="Reserved Slots"
              value={sum.reservedSlots}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#cf1322', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title={`Occupancy Rate: ${sum.occupancyRate.toFixed(1)}%`} bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ width: '100%', height: '24px', backgroundColor: '#e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${sum.occupancyRate}%`, 
                  backgroundColor: sum.occupancyRate > 80 ? '#ef4444' : sum.occupancyRate > 50 ? '#f59e0b' : '#10b981',
                  transition: 'width 0.5s ease-in-out'
                }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <Text type="secondary">0%</Text>
              <Text strong>Occupancy: {sum.currentOccupancy} / {sum.totalCapacity}</Text>
              <Text type="secondary">100%</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {!isStaff && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card title="Revenue Trend" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toLocaleString()} ₫`} />
                    <Line type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {isStaff && dashboardData.buildings?.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {dashboardData.buildings.map(b => (
            <Card key={b.buildingId} title={b.buildingName} style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              {b.floors.map(f => (
                <div key={f.floorId} style={{ marginBottom: 20 }}>
                  <Title level={5} type="secondary">{f.floorName}</Title>
                  {f.zones.map(z => (
                    <div key={z.zoneId} style={{ marginBottom: 16, background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text strong>{z.zoneName} <Text type="secondary" style={{ fontWeight: 'normal' }}>({z.description})</Text></Text>
                        <Text>Occupancy: {z.summary.currentOccupancy} / {z.summary.totalCapacity}</Text>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {z.slots.map(s => {
                          const isAvailable = s.status === 'AVAILABLE';
                          const isOccupied = s.status === 'OCCUPIED';
                          return (
                            <div 
                              key={s.slotId}
                              title={s.vehicleTypeName}
                              style={{ 
                                padding: '8px 12px', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '4px',
                                backgroundColor: isAvailable ? '#f6ffed' : isOccupied ? '#fff1f0' : '#fffbe6',
                                borderColor: isAvailable ? '#b7eb8f' : isOccupied ? '#ffa39e' : '#ffe58f',
                                textAlign: 'center',
                                minWidth: '60px'
                              }}
                            >
                              <div style={{ fontWeight: 'bold' }}>{s.slotCode}</div>
                              <div style={{ fontSize: '10px', color: '#8c8c8c' }}>{s.status}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
