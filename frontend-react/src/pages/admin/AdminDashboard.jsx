import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Tag, Space, Button } from 'antd';
import { 
  BankOutlined, 
  TeamOutlined, 
  SafetyCertificateOutlined,
  AlertOutlined,
  ArrowRightOutlined,
  HistoryOutlined,
  DollarCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { buildingApi, userApi, incidentApi, sessionApi } from '../../services/api';

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    buildingsCount: 0,
    usersCount: 0,
    pendingIncidentsCount: 0,
    activeSessions: 0, 
    failedLogins: 0    
  });

  const mockLogs = [
    { key: '1', time: '10 mins ago', user: 'admin@parksmart.com', action: 'Login Success', ip: '192.168.1.45', status: 'success' },
    { key: '2', time: '15 mins ago', user: 'staff1@parksmart.com', action: 'Login Success', ip: '192.168.1.12', status: 'success' },
    { key: '3', time: '1 hour ago', user: 'unknown', action: 'Login Failed', ip: '113.160.2.14', status: 'failed' },
    { key: '4', time: '2 hours ago', user: 'manager@parksmart.com', action: 'Login Success', ip: '192.168.1.66', status: 'success' },
    { key: '5', time: '2 hours ago', user: 'unknown', action: 'Login Failed', ip: '113.160.2.14', status: 'failed' },
  ];

  const logColumns = [
    { title: 'Time', dataIndex: 'time', key: 'time', width: 120 },
    { title: 'User / Target', dataIndex: 'user', key: 'user' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    { title: 'IP Address', dataIndex: 'ip', key: 'ip' },
  ];

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [buildingsRes, usersRes, incidentsRes, sessionRes] = await Promise.all([
          buildingApi.getBuildings().catch(() => ({ data: { data: [] } })),
          userApi.getUsers().catch(() => ({ data: { data: [] } })),
          incidentApi.getIncidents().catch(() => ({ data: { data: [] } })),
          sessionApi.getSessions().catch(() => ({ data: { data: [] } }))
        ]);

        const buildings = buildingsRes.data?.data || [];
        const users = usersRes.data?.data || [];
        const incidents = incidentsRes.data?.data || [];
        const sessions = sessionRes.data?.data || [];
        
        const pendingIncidents = incidents.filter(i => i.status !== 'RESOLVED');
        const activeSessionsList = sessions.filter(s => s.status === 'PARKING');

        setStats(prev => ({
          ...prev,
          buildingsCount: buildings.length,
          usersCount: users.length,
          pendingIncidentsCount: pendingIncidents.length,
          activeSessions: activeSessionsList.length
        }));
      } catch (error) {
        console.error('Failed to fetch admin stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  return (
    <div className="admin-dashboard">
      <Title level={2} style={{ marginBottom: 24 }}>Command Center</Title>

      <Row gutter={[16, 16]}>
        {/* CARD 1: BUILDINGS */}
        <Col xs={24} sm={12} md={8} lg={8}>
          <Card 
            hoverable 
            style={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#e6f4ff' }}
            onClick={() => navigate('/admin/buildings')}
          >
            <Statistic
              title={<span style={{ fontSize: 16, fontWeight: 500, color: '#1677ff' }}>Buildings Network</span>}
              value={stats.buildingsCount}
              prefix={<BankOutlined style={{ color: '#1677ff' }} />}
              suffix={<ArrowRightOutlined style={{ fontSize: 14, color: '#bfbfbf', marginLeft: 8 }} />}
              valueStyle={{ fontSize: 32, fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Manage facilities, floors, and zones</Text>
            </div>
          </Card>
        </Col>

        {/* CARD 2: USERS */}
        <Col xs={24} sm={12} md={8} lg={8}>
          <Card 
            hoverable 
            style={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#f6ffed' }}
            onClick={() => navigate('/admin/users')}
          >
            <Statistic
              title={<span style={{ fontSize: 16, fontWeight: 500, color: '#52c41a' }}>System Users</span>}
              value={stats.usersCount}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              suffix={<ArrowRightOutlined style={{ fontSize: 14, color: '#bfbfbf', marginLeft: 8 }} />}
              valueStyle={{ fontSize: 32, fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Manage access and roles</Text>
            </div>
          </Card>
        </Col>

        {/* CARD 3: PRICING POLICIES */}
        <Col xs={24} sm={12} md={8} lg={8}>
          <Card 
            hoverable 
            style={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#e6fffb' }}
            onClick={() => navigate('/admin/pricing')}
          >
            <Statistic
              title={<span style={{ fontSize: 16, fontWeight: 500, color: '#13c2c2' }}>Pricing Policies</span>}
              value="Configuration"
              prefix={<DollarCircleOutlined style={{ color: '#13c2c2' }} />}
              suffix={<ArrowRightOutlined style={{ fontSize: 14, color: '#bfbfbf', marginLeft: 8 }} />}
              valueStyle={{ fontSize: 24, fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Manage vehicle rates and fees</Text>
            </div>
          </Card>
        </Col>

        {/* CARD 4: PENDING INCIDENTS */}
        <Col xs={24} sm={12} md={12} lg={12}>
          <Card 
            hoverable 
            style={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#ffccc7', background: stats.pendingIncidentsCount > 0 ? '#fff1f0' : '#fff' }}
            onClick={() => navigate('/admin/incidents')}
          >
            <Statistic
              title={<span style={{ fontSize: 16, fontWeight: 500, color: '#f5222d' }}>Pending Incidents</span>}
              value={stats.pendingIncidentsCount}
              prefix={<AlertOutlined style={{ color: '#f5222d' }} />}
              suffix={<ArrowRightOutlined style={{ fontSize: 14, color: '#bfbfbf', marginLeft: 8 }} />}
              valueStyle={{ fontSize: 32, fontWeight: 'bold', color: stats.pendingIncidentsCount > 0 ? '#cf1322' : 'inherit' }}
            />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">{stats.pendingIncidentsCount > 0 ? 'Requires immediate attention' : 'All systems normal'}</Text>
            </div>
          </Card>
        </Col>

        {/* CARD 5: SECURITY & HEALTH */}
        <Col xs={24} sm={24} md={12} lg={12}>
          <Card 
            style={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#fffb8f' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <SafetyCertificateOutlined style={{ fontSize: 20, color: '#faad14', marginRight: 8 }} />
              <Text strong style={{ fontSize: 16, color: '#faad14' }}>Security & Health</Text>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="Active Sessions" value={stats.activeSessions} valueStyle={{ color: '#389e0d', fontSize: 24 }} />
              </Col>
              <Col span={12}>
                <Statistic title="Failed Logins" value={stats.failedLogins} valueStyle={{ color: '#cf1322', fontSize: 24 }} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* CARD 4: RECENT LOGS */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card 
            title={<Space><HistoryOutlined /> Recent Login Activities</Space>}
            extra={<Button type="link" onClick={() => navigate('/admin/logs')}>View Full Logs</Button>}
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            <Table 
              dataSource={mockLogs} 
              columns={logColumns} 
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
