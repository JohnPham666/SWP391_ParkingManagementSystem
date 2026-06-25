import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, message, Select, Row, Col, Typography, Badge } from 'antd';
import { CarOutlined } from '@ant-design/icons';
import { slotApi } from '../../services/api';

const { Option } = Select;
const { Title } = Typography;

const SlotManagement = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await slotApi.getSlots();
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        setSlots(data);
      }
    } catch (error) {
      message.error('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await slotApi.updateSlotStatus(id, status);
      message.success('Slot status updated successfully');
      fetchSlots();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update slot status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return '#059669'; // green
      case 'OCCUPIED': return '#dc2626'; // red
      case 'RESERVED': return '#d97706'; // yellow
      case 'MAINTENANCE': return '#6b7280'; // gray
      default: return '#1677ff'; // blue
    }
  };

  const columns = [
    { title: 'Code', dataIndex: 'slotCode', key: 'slotCode', render: (val) => <strong>{val}</strong> },
    { title: 'Floor', dataIndex: 'floorId', key: 'floorId', render: (val) => `Floor ${val}` },
    { title: 'Vehicle Type', dataIndex: 'vehicleType', key: 'vehicleType' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status, record) => (
        <Select 
          value={status} 
          onChange={(val) => handleStatusChange(record.slotId, val)}
          style={{ width: 140, fontWeight: 600 }}
          bordered={false}
        >
          <Option value="AVAILABLE" style={{ color: '#059669' }}>Available</Option>
          <Option value="OCCUPIED" style={{ color: '#dc2626' }}>Occupied</Option>
          <Option value="RESERVED" style={{ color: '#d97706' }}>Reserved</Option>
          <Option value="MAINTENANCE" style={{ color: '#6b7280' }}>Maintenance</Option>
        </Select>
      )
    },
  ];

  return (
    <Card 
      title="Parking Slots"
      extra={
        <Select value={viewMode} onChange={setViewMode} style={{ width: 120 }}>
          <Option value="grid">Grid View</Option>
          <Option value="list">List View</Option>
        </Select>
      }
    >
      {viewMode === 'list' ? (
        <Table columns={columns} dataSource={slots} rowKey="slotId" loading={loading} />
      ) : (
        <Row gutter={[16, 16]}>
          {slots.map(slot => (
            <Col xs={12} sm={8} md={6} lg={4} xl={3} key={slot.slotId}>
              <Card 
                hoverable
                style={{ 
                  textAlign: 'center', 
                  borderTop: `4px solid ${getStatusColor(slot.status)}`,
                  background: slot.status === 'OCCUPIED' ? '#fff1f0' : '#fff'
                }}
                bodyStyle={{ padding: '16px 8px' }}
              >
                <Title level={4} style={{ margin: 0 }}>{slot.slotCode}</Title>
                <div style={{ margin: '8px 0', color: getStatusColor(slot.status) }}>
                  <CarOutlined style={{ fontSize: 24 }} />
                </div>
                <Select 
                  value={slot.status} 
                  onChange={(val) => handleStatusChange(slot.slotId, val)}
                  style={{ width: '100%', fontSize: '12px' }}
                  size="small"
                >
                  <Option value="AVAILABLE">Available</Option>
                  <Option value="OCCUPIED">Occupied</Option>
                  <Option value="RESERVED">Reserved</Option>
                  <Option value="MAINTENANCE">Maintenance</Option>
                </Select>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Card>
  );
};

export default SlotManagement;
