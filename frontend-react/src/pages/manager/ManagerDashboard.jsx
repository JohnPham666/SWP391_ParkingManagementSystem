import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Select, Button, Space, Tag, Modal, Descriptions } from 'antd';
import { 
  CarOutlined, 
  DollarOutlined, 
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Navigate, useNavigate } from 'react-router-dom';
import { monitoringApi, incidentApi, vehicleApi } from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const data = [
  { name: 'Mon', rate: 45 },
  { name: 'Tue', rate: 52 },
  { name: 'Wed', rate: 68 },
  { name: 'Thu', rate: 74 },
  { name: 'Fri', rate: 85 },
  { name: 'Sat', rate: 92 },
  { name: 'Sun', rate: 88 },
];

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 1250000,
    activeSessions: 42,
    availableSlots: 156,
  });
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [unresolvedIncidentsCount, setUnresolvedIncidentsCount] = useState(0);
  const [pendingVehiclesCount, setPendingVehiclesCount] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const navigate = useNavigate();

  // Filters for Table 2
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const auth = JSON.parse(localStorage.getItem('parking_auth') || '{}');
  const isStaff = auth.user?.roleName === 'ParkingStaff' || auth.role === 'ParkingStaff' || auth.user?.role === 'ParkingStaff';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [res, incidentRes, vehicleRes] = await Promise.all([
          monitoringApi.getDashboard(),
          incidentApi.getIncidents(),
          vehicleApi.getVehicles()
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

  // Prepare data for Table 2: Sơ đồ bãi đỗ xe chi tiết
  const slotsData = [];
  const vehicleTypesSet = new Set();

  if (dashboardData.buildings) {
    dashboardData.buildings.forEach(b => {
      b.floors.forEach(f => {
        f.zones.forEach(z => {
          z.slots.forEach(s => {
            const vType = s.vehicleTypeName || s.vehicleType?.typeName || 'Khác';
            vehicleTypesSet.add(vType);
            
            slotsData.push({
              key: s.slotId,
              slotCode: s.slotCode,
              location: `${b.buildingName} - ${f.floorName} - ${z.zoneName}`,
              vehicleType: vType,
              status: s.status,
              fullData: {
                ...s,
                buildingName: b.buildingName,
                floorName: f.floorName,
                zoneName: z.zoneName,
                vehicleTypeName: vType
              }
            });
          });
        });
      });
    });
  }

  const uniqueVehicleTypes = Array.from(vehicleTypesSet);

  // Filter slots data
  const filteredSlotsData = slotsData.filter(s => {
    let matchStatus = true;
    if (statusFilter === 'AVAILABLE') matchStatus = s.status === 'AVAILABLE';
    if (statusFilter === 'OCCUPIED') matchStatus = s.status === 'OCCUPIED';
    if (statusFilter === 'RESERVED') matchStatus = s.status === 'RESERVED';
    
    let matchType = true;
    if (typeFilter) matchType = s.vehicleType === typeFilter;

    return matchStatus && matchType;
  });

  const slotsColumns = [
    {
      title: 'SLOT CODE',
      dataIndex: 'slotCode',
      key: 'slotCode',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'LOCATION',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'VEHICLE TYPE',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (status === 'AVAILABLE') return <Text style={{ color: '#10b981', fontWeight: 500 }}>Available</Text>;
        if (status === 'OCCUPIED') return <Text style={{ color: '#ef4444', fontWeight: 500 }}>Occupied</Text>;
        if (status === 'RESERVED') return <Text style={{ color: '#3b82f6', fontWeight: 500 }}>Reserved</Text>;
        return <Text style={{ color: '#f59e0b', fontWeight: 500 }}>{status}</Text>;
      }
    },
    {
      title: 'ACTION',
      key: 'actions',
      render: (_, record) => {
        return (
          <Space>
            <Button size="small" type="primary" onClick={() => {
              setSelectedSlot(record.fullData);
              setIsModalVisible(true);
            }}>View</Button>
            {record.status === 'AVAILABLE' && <Button size="small">Lock</Button>}
          </Space>
        );
      }
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>System Dashboard</Title>
      
      <Row gutter={[16, 16]}>
        {!isStaff && (
          <Col xs={24} sm={12} md={8}>
            <Card 
              bordered={false} 
              hoverable
              onClick={() => navigate('/manager/reports')}
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', borderLeft: '4px solid #3f8600' }}
            >
              <Statistic
                title="Total Revenue (This Week)"
                value={1250000}
                prefix={<DollarOutlined />}
                suffix="₫"
                valueStyle={{ color: '#3f8600', fontWeight: 600 }}
              />
            </Card>
          </Col>
        )}
        <Col xs={24} sm={12} md={isStaff ? 12 : 8}>
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
        <Col xs={24} sm={12} md={isStaff ? 12 : 8}>
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

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card 
            title="Detailed Parking Layout" 
            bordered={false} 
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            extra={
              <Space>
                <Select defaultValue="" style={{ minWidth: 180 }} onChange={setStatusFilter}>
                  <Option value="">All Statuses</Option>
                  <Option value="AVAILABLE">Available</Option>
                  <Option value="OCCUPIED">Occupied</Option>
                  <Option value="RESERVED">Reserved</Option>
                </Select>
                <Select defaultValue="" style={{ minWidth: 160 }} onChange={setTypeFilter}>
                  <Option value="">All Vehicle Types</Option>
                  {uniqueVehicleTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Space>
            }
          >
            <Table 
              columns={slotsColumns} 
              dataSource={filteredSlotsData}
              pagination={{ pageSize: 10 }}
              bordered={false}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={`Slot Details: ${selectedSlot?.slotCode}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {selectedSlot && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Slot ID">{selectedSlot.slotId}</Descriptions.Item>
            <Descriptions.Item label="Slot Code">{selectedSlot.slotCode}</Descriptions.Item>
            <Descriptions.Item label="Building">{selectedSlot.buildingName}</Descriptions.Item>
            <Descriptions.Item label="Floor">{selectedSlot.floorName}</Descriptions.Item>
            <Descriptions.Item label="Zone">{selectedSlot.zoneName}</Descriptions.Item>
            <Descriptions.Item label="Vehicle Type">{selectedSlot.vehicleTypeName}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedSlot.status === 'AVAILABLE' ? 'green' : selectedSlot.status === 'OCCUPIED' ? 'red' : selectedSlot.status === 'RESERVED' ? 'blue' : 'orange'}>
                {selectedSlot.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Capacity">{selectedSlot.capacity || 1}</Descriptions.Item>
            <Descriptions.Item label="Current Occupancy">{selectedSlot.currentOccupancy || 0}</Descriptions.Item>
            <Descriptions.Item label="Is Active">{selectedSlot.isActive !== false ? 'Yes' : 'No'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

    </div>
  );
};

export default ManagerDashboard;

