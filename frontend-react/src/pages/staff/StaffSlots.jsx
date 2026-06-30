import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Space, Tag, Typography, message, Spin, Row, Col, Modal, Descriptions, theme } from 'antd';
import { SearchOutlined, CarOutlined } from '@ant-design/icons';
import { slotApi } from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const StaffSlots = () => {
  const { token } = theme.useToken();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    status: null,
    vehicleType: null
  });

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setIsModalVisible(true);
  };

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
      } else {
        setSlots([]);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      message.error('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const filteredSlots = slots.filter(s => {
    const searchMatch = !filters.search || s.slotCode?.toLowerCase().includes(filters.search.toLowerCase());
    const statusMatch = !filters.status || s.status === filters.status;
    const typeMatch = !filters.vehicleType || s.vehicleTypeName === filters.vehicleType;
    return searchMatch && statusMatch && typeMatch;
  });

  // Extract unique vehicle types for the filter dropdown
  const uniqueVehicleTypes = Array.from(new Set(['Motorbike', 'Car', 'Small Truck', 'Bicycle', 'Large Truck', ...slots.map(s => s.vehicleTypeName).filter(Boolean)]));

  // Group slots by Building -> Floor -> Zone
  const groupedData = {};
  filteredSlots.forEach(s => {
    const bName = s.buildingName || 'Unknown Building';
    const fName = s.floorName || 'Unknown Floor';
    const zName = s.zoneName || 'Unknown Zone';

    if (!groupedData[bName]) groupedData[bName] = {};
    if (!groupedData[bName][fName]) groupedData[bName][fName] = {};
    if (!groupedData[bName][fName][zName]) groupedData[bName][fName][zName] = [];
    
    groupedData[bName][fName][zName].push(s);
  });

  const getStatusColor = (status) => {
    if (status === 'AVAILABLE') return { bg: token.colorSuccessBg, border: token.colorSuccessBorder, text: token.colorSuccessText, label: 'Available' };
    if (status === 'OCCUPIED') return { bg: token.colorErrorBg, border: token.colorErrorBorder, text: token.colorErrorText, label: 'Occupied' };
    if (status === 'RESERVED') return { bg: token.colorWarningBg, border: token.colorWarningBorder, text: token.colorWarningText, label: 'Reserved' };
    return { bg: token.colorFillAlter, border: token.colorBorder, text: token.colorTextSecondary, label: 'Locked' };
  };

  const getVehicleIcon = (type) => {
    if (!type) return '🚗';
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('motor') || lowerType.includes('máy')) return '🏍️';
    if (lowerType.includes('bike') || lowerType.includes('đạp')) return '🚲';
    if (lowerType.includes('bus') || lowerType.includes('khách')) return '🚌';
    if (lowerType.includes('truck') || lowerType.includes('tải')) return '🚚';
    
    return '🚗'; // Default to car
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Building & Slots</Title>

      <Card style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Space style={{ display: 'flex', flexWrap: 'wrap' }} size="middle">
          <Input 
            placeholder="Search slot code..." 
            prefix={<SearchOutlined />} 
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 250 }}
            size="large"
            allowClear
          />
          <Select 
            placeholder="All Statuses" 
            style={{ width: 160 }} 
            allowClear 
            size="large"
            onChange={(val) => setFilters({ ...filters, status: val })}
          >
            <Option value="AVAILABLE">Available</Option>
            <Option value="OCCUPIED">Occupied</Option>
            <Option value="RESERVED">Reserved</Option>
            <Option value="LOCKED">Locked</Option>
          </Select>
          <Select 
            placeholder="All Vehicle Types" 
            style={{ width: 180 }} 
            allowClear 
            size="large"
            onChange={(val) => setFilters({ ...filters, vehicleType: val })}
          >
            {uniqueVehicleTypes.map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
        </Space>
      </Card>

      {Object.keys(groupedData).length === 0 ? (
        <Card><div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No slots match your filters.</div></Card>
      ) : (
        Object.entries(groupedData).map(([bName, floors]) => (
          <Card key={bName} title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>{bName}</span>} style={{ marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            {Object.entries(floors).map(([fName, zones]) => (
              <div key={fName} style={{ marginBottom: 24 }}>
                <Title level={4} type="secondary" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>{fName}</Title>
                
                {Object.entries(zones).map(([zName, zSlots]) => {
                  const currentZ = zSlots.reduce((acc, s) => acc + (s.currentOccupancy || 0), 0);
                  const capZ = zSlots.reduce((acc, s) => acc + (s.capacity || 1), 0);

                  return (
                    <div key={zName} style={{ marginBottom: 20, background: token.colorFillQuaternary, padding: '16px', borderRadius: '8px', border: `1px solid ${token.colorBorderSecondary}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text strong style={{ fontSize: '16px' }}>{zName}</Text>
                        <Tag color="blue" style={{ fontSize: '14px', padding: '4px 10px' }}>
                          Zone Occupancy: {currentZ} / {capZ}
                        </Tag>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {zSlots.map(s => {
                          const colors = getStatusColor(s.status);
                          return (
                              <div 
                                key={s.slotId}
                                title={`${s.vehicleTypeName} | Sức chứa: ${s.currentOccupancy}/${s.capacity}`}
                                style={{ 
                                  padding: '10px 16px', 
                                  border: `2px solid ${colors.border}`, 
                                  borderRadius: '8px',
                                  backgroundColor: colors.bg,
                                  textAlign: 'center',
                                  minWidth: '90px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                }}
                                onClick={() => handleSlotClick(s)}
                              >
                                <div style={{ fontSize: '24px', transition: 'transform 0.3s ease' }} 
                                     onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                     onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                  {getVehicleIcon(s.vehicleTypeName)}
                                </div>
                                <div style={{ fontWeight: '900', fontSize: '16px', color: token.colorText }}>{s.slotCode}</div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: colors.text }}>{colors.label}</div>
                                <div style={{ fontSize: '12px', color: token.colorTextSecondary, marginTop: '2px', background: token.colorBgContainer, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${token.colorBorder}` }}>
                                  {s.currentOccupancy || 0}/{s.capacity || 1}
                                </div>
                              </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </Card>
        ))
      )}
      
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' }}>
            <CarOutlined style={{ color: '#1677ff' }} />
            <span>Slot Details: {selectedSlot?.slotCode}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedSlot && (
          <Descriptions bordered column={1} size="middle" labelStyle={{ fontWeight: 'bold', width: '150px' }}>
            <Descriptions.Item label="Building">{selectedSlot.buildingName}</Descriptions.Item>
            <Descriptions.Item label="Floor">{selectedSlot.floorName}</Descriptions.Item>
            <Descriptions.Item label="Zone (Area)">{selectedSlot.zoneName}</Descriptions.Item>
            <Descriptions.Item label="Vehicle Type">{selectedSlot.vehicleTypeName}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedSlot.status === 'AVAILABLE' ? 'success' : selectedSlot.status === 'OCCUPIED' ? 'error' : 'warning'}>
                {selectedSlot.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Current Occupancy">{selectedSlot.currentOccupancy || 0}</Descriptions.Item>
            <Descriptions.Item label="Total Capacity">{selectedSlot.capacity || 1}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default StaffSlots;
