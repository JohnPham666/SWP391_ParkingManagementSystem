import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Select, Button, Space, Tag } from 'antd';
import { 
  CarOutlined, 
  DollarOutlined, 
  AlertOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { monitoringApi, incidentApi, vehicleApi, paymentApi, sessionApi } from '../../services/api';

const { Title, Text } = Typography;

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSessions: 0,
    availableSlots: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [unresolvedIncidentsCount, setUnresolvedIncidentsCount] = useState(0);
  const [pendingVehiclesCount, setPendingVehiclesCount] = useState(0);
  const navigate = useNavigate();

  const auth = JSON.parse(localStorage.getItem('parking_auth') || '{}');
  const isStaff = auth.user?.roleName === 'ParkingStaff' || auth.role === 'ParkingStaff' || auth.user?.role === 'ParkingStaff';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [res, incidentRes, vehicleRes, paymentRes, sessionRes] = await Promise.all([
          monitoringApi.getDashboard().catch(() => ({ data: { data: null } })),
          incidentApi.getIncidents().catch(() => ({ data: { data: [] } })),
          vehicleApi.getVehicles().catch(() => ({ data: { data: [] } })),
          paymentApi.getPayments().catch(() => ({ data: { data: [] } })),
          sessionApi.getSessions().catch(() => ({ data: { data: [] } }))
        ]);
        
        if (res.data?.success) {
          setDashboardData(res.data.data);
        }
        
        let incidentsList = incidentRes.data?.success ? incidentRes.data.data : incidentRes.data;
        if (Array.isArray(incidentsList)) {
          const unresolved = incidentsList.filter(i => ['REPORTED', 'OPEN', 'IN_PROGRESS'].includes(i.status));
          setUnresolvedIncidentsCount(unresolved.length);
        }

        let vehicleList = vehicleRes.data?.success ? vehicleRes.data.data : vehicleRes.data;
        if (Array.isArray(vehicleList)) {
          const pending = vehicleList.filter(v => v.status === 'PENDING');
          setPendingVehiclesCount(pending.length);
        }

        let paymentList = paymentRes.data?.success ? paymentRes.data.data : paymentRes.data;
        let revenue = 0;
        if (Array.isArray(paymentList)) {
          revenue = paymentList.filter(p => p.paymentStatus === 'PAID').reduce((sum, p) => sum + (p.amount || 0), 0);
        }

        let sessionList = sessionRes.data?.success ? sessionRes.data.data : sessionRes.data;
        let active = 0;
        if (Array.isArray(sessionList)) {
          active = sessionList.filter(s => s.status === 'PARKING').length;
        }

        setStats({
          totalRevenue: revenue,
          activeSessions: active,
          availableSlots: res.data?.data?.summary?.availableCapacity || 0
        });
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

  // Prepare data for Table 1: Bảng thống kê lấp đầy
  const occupancyData = [];
  if (dashboardData.buildings) {
    dashboardData.buildings.forEach(b => {
      b.floors.forEach(f => {
        let totalCap = 0;
        let currentOcc = 0;
        f.zones.forEach(z => {
          totalCap += z.summary?.totalCapacity || 0;
          currentOcc += z.summary?.currentOccupancy || 0;
        });
        
        const empty = totalCap - currentOcc;
        const rate = totalCap > 0 ? ((currentOcc / totalCap) * 100).toFixed(0) : 0;
        
        occupancyData.push({
          key: `${b.buildingId}-${f.floorId}`,
          location: `${b.buildingName} - ${f.floorName}`,
          total: totalCap,
          occupied: currentOcc,
          empty: empty,
          rate: parseInt(rate, 10)
        });
      });
    });
  }

  const occupancyColumns = [
    {
      title: 'AREA/FLOOR',
      dataIndex: 'location',
      key: 'location',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'TOTAL CAPACITY',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: 'OCCUPIED',
      dataIndex: 'occupied',
      key: 'occupied',
    },
    {
      title: 'EMPTY',
      dataIndex: 'empty',
      key: 'empty',
    },
    {
      title: 'OCCUPANCY RATE',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate) => {
        let color = '#10b981';
        if (rate < 20) color = '#10b981';
        else if (rate < 80) color = '#f59e0b';
        else color = '#ef4444';
        return <Text strong style={{ color }}>{rate}%</Text>;
      }
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>System Dashboard</Title>
      
      <Row gutter={[16, 16]}>
        {!isStaff && (
          <Col xs={24} sm={12} md={6}>
            <Card 
              bordered={false} 
              hoverable
              onClick={() => navigate('/manager/reports')}
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', borderLeft: '4px solid #3f8600' }}
            >
              <Statistic
                title="Total Revenue"
                value={stats.totalRevenue}
                prefix={<DollarOutlined />}
                suffix="₫"
                valueStyle={{ color: '#3f8600', fontWeight: 600 }}
              />
            </Card>
          </Col>
        )}
        <Col xs={24} sm={12} md={isStaff ? 8 : 6}>
          <Card 
            bordered={false} 
            hoverable
            onClick={() => navigate('/manager/incidents')}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', borderLeft: '4px solid #cf1322' }}
          >
            <Statistic
              title="Incident Reports (Unresolved)"
              value={unresolvedIncidentsCount}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#cf1322', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={isStaff ? 8 : 6}>
          <Card 
            bordered={false} 
            hoverable
            onClick={() => navigate('/manager/vehicles')}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', borderLeft: '4px solid #faad14' }}
          >
            <Statistic
              title="Pending Vehicles"
              value={pendingVehiclesCount}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#faad14', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={isStaff ? 8 : 6}>
          <Card 
            bordered={false} 
            hoverable
            onClick={() => navigate('/manager/slots')}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', borderLeft: '4px solid #1677ff' }}
          >
            <Statistic
              title="Parking Slots Management"
              value="Manage"
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#1677ff', fontWeight: 600 }}
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

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Occupancy Statistics (Area Status)" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Table 
              columns={occupancyColumns} 
              dataSource={occupancyData}
              pagination={false}
              bordered={false}
            />
          </Card>
        </Col>
      </Row>

    </div>
  );
};

export default ManagerDashboard;
