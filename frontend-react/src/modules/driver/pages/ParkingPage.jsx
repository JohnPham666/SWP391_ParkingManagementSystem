import React, { useEffect, useReducer, useState, useMemo } from 'react';
import { Card, Tag, Select, Row, Col, Descriptions, Drawer, Button, message, Skeleton, Empty, Typography, Input, Badge, Divider } from 'antd';
import { SearchOutlined, CompassOutlined, BorderOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { driverService } from '../services/driverService';
import { parkingStore } from '../store/parkingStore';

const { Option } = Select;
const { Title, Text } = Typography;

const ParkingPage = () => {
    const [, forceRender] = useReducer(x => x + 1, 0);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        parkingStore.loading = true;
        forceRender();
        try {
            const slotsRes = await driverService.loadSlots();
            const result = slotsRes?.data || slotsRes;
            parkingStore.slots = Array.isArray(result) ? result : [];
        } catch (error) {
            message.error('Failed to load parking slots');
            parkingStore.slots = [];
        } finally {
            parkingStore.loading = false;
            forceRender();
        }
    };

    const handleFilterChange = (key, value) => {
        parkingStore.filters[key] = value;
        forceRender();
    };

    const handleView = (record) => {
        parkingStore.selectedSlot = record;
        setDrawerVisible(true);
    };

    const slots = Array.isArray(parkingStore.slots) ? parkingStore.slots : [];

    // Calculate dynamic options for filters
    const filterOptions = useMemo(() => {
        const buildings = new Set();
        const floors = new Set();
        const zones = new Set();
        const vehicleTypes = new Set();
        const statuses = new Set();

        slots.forEach(slot => {
            if (slot.buildingName) buildings.add(slot.buildingName);
            if (slot.floorName) floors.add(slot.floorName);
            if (slot.zoneName) zones.add(slot.zoneName);
            if (slot.vehicleTypeName) vehicleTypes.add(slot.vehicleTypeName);
            if (slot.status) statuses.add(slot.status);
        });

        return {
            buildings: Array.from(buildings),
            floors: Array.from(floors),
            zones: Array.from(zones),
            vehicleTypes: Array.from(vehicleTypes),
            statuses: Array.from(statuses)
        };
    }, [slots]);

    // Apply filters
    const filteredSlots = useMemo(() => {
        return slots.filter(slot => {
            const f = parkingStore.filters;
            
            // Text Search
            if (searchText) {
                const search = searchText.toLowerCase();
                const code = (slot.slotName || slot.slotCode || '').toLowerCase();
                if (!code.includes(search)) return false;
            }

            if (f.buildingName && f.buildingName !== 'all' && slot.buildingName !== f.buildingName) return false;
            if (f.floorName && f.floorName !== 'all' && slot.floorName !== f.floorName) return false;
            if (f.zoneName && f.zoneName !== 'all' && slot.zoneName !== f.zoneName) return false;
            if (f.vehicleTypeName && f.vehicleTypeName !== 'all' && slot.vehicleTypeName !== f.vehicleTypeName) return false;
            if (f.status && f.status !== 'all' && slot.status !== f.status) return false;
            return true;
        });
    }, [slots, searchText, parkingStore.filters.buildingName, parkingStore.filters.floorName, parkingStore.filters.zoneName, parkingStore.filters.vehicleTypeName, parkingStore.filters.status]);

    const getStatusInfo = (status) => {
        const s = String(status).toUpperCase();
        if (s === 'AVAILABLE') return { color: 'green', hex: '#10b981', label: 'AVAILABLE' };
        if (s === 'RESERVED') return { color: 'gold', hex: '#f59e0b', label: 'RESERVED' };
        if (s === 'OCCUPIED') return { color: 'red', hex: '#ef4444', label: 'OCCUPIED' };
        return { color: 'default', hex: '#94a3b8', label: s || 'UNKNOWN' };
    };

    if (parkingStore.loading) {
        return <Skeleton active paragraph={{ rows: 12 }} />;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Find Parking</Title>
                
                {/* Status Legend */}
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981' }}></div><Text type="secondary">Available</Text></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b' }}></div><Text type="secondary">Reserved</Text></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }}></div><Text type="secondary">Occupied</Text></div>
                </div>
            </div>

            <Card className="saas-card" style={{ marginBottom: 24 }} styles={{ body: { padding: '16px 24px' } }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={6}>
                        <Input 
                            prefix={<SearchOutlined />} 
                            placeholder="Search slot code..." 
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            size="large"
                        />
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <Select style={{ width: '100%' }} size="large" value={parkingStore.filters.buildingName || 'all'} onChange={(v) => handleFilterChange('buildingName', v)}>
                            <Option value="all">Building: All</Option>
                            {filterOptions.buildings.map(b => <Option key={b} value={b}>{b}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <Select style={{ width: '100%' }} size="large" value={parkingStore.filters.floorName || 'all'} onChange={(v) => handleFilterChange('floorName', v)}>
                            <Option value="all">Floor: All</Option>
                            {filterOptions.floors.map(f => <Option key={f} value={f}>{f}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={12} sm={8} md={3}>
                        <Select style={{ width: '100%' }} size="large" value={parkingStore.filters.zoneName || 'all'} onChange={(v) => handleFilterChange('zoneName', v)}>
                            <Option value="all">Zone: All</Option>
                            {filterOptions.zones.map(z => <Option key={z} value={z}>{z}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <Select style={{ width: '100%' }} size="large" value={parkingStore.filters.vehicleTypeName || 'all'} onChange={(v) => handleFilterChange('vehicleTypeName', v)}>
                            <Option value="all">Vehicle: All</Option>
                            {filterOptions.vehicleTypes.map(v => <Option key={v} value={v}>{v}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={12} sm={8} md={3}>
                        <Select style={{ width: '100%' }} size="large" value={parkingStore.filters.status || 'all'} onChange={(v) => handleFilterChange('status', v)}>
                            <Option value="all">Status: All</Option>
                            {filterOptions.statuses.map(s => <Option key={s} value={s}>{s}</Option>)}
                        </Select>
                    </Col>
                </Row>
            </Card>

            {filteredSlots.length === 0 ? (
                <Empty description="No slots match your criteria" style={{ margin: '60px 0' }} />
            ) : (
                <Row gutter={[20, 20]}>
                    {filteredSlots.map((slot, index) => {
                        const statusInfo = getStatusInfo(slot.status);
                        // Make the first available slot recommended randomly for demo purposes
                        const isRecommended = slot.status === 'AVAILABLE' && index % 7 === 0;

                        return (
                            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={slot.slotId || slot.id || slot.slotName}>
                                <Badge.Ribbon text="Recommended" color="#ea580c" style={{ display: isRecommended ? 'block' : 'none' }}>
                                    <Card 
                                        hoverable 
                                        className={`saas-card ${isRecommended ? 'recommended-slot' : ''}`}
                                        styles={{ body: { padding: 16 } }}
                                        onClick={() => handleView(slot)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>{slot.slotName || slot.slotCode}</Title>
                                            <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: statusInfo.hex, boxShadow: `0 0 8px ${statusInfo.hex}66` }} />
                                        </div>
                                        
                                        <div style={{ color: '#64748b', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <div><EnvironmentOutlined /> {slot.buildingName || 'N/A'} - {slot.floorName || 'N/A'}</div>
                                            <div><BorderOutlined /> Zone: <Text strong>{slot.zoneName || 'N/A'}</Text></div>
                                            <div><CompassOutlined /> {slot.vehicleTypeName || 'N/A'}</div>
                                        </div>

                                        <Divider style={{ margin: '12px 0' }} />
                                        
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <Tag color={statusInfo.color} style={{ margin: 0, border: 'none', fontWeight: 600 }}>{statusInfo.label}</Tag>
                                        </div>
                                    </Card>
                                </Badge.Ribbon>
                            </Col>
                        );
                    })}
                </Row>
            )}

            <Drawer
                title={<Title level={4} style={{ margin: 0 }}>Slot Information</Title>}
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={400}
                styles={{ body: { background: '#f8fafc' } }}
            >
                {parkingStore.selectedSlot && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Card className="saas-card" styles={{ body: { textAlign: 'center', padding: '32px 16px' } }}>
                            <Title level={1} style={{ fontSize: 48, color: '#0f172a', margin: 0 }}>
                                {parkingStore.selectedSlot.slotName || parkingStore.selectedSlot.slotCode || 'N/A'}
                            </Title>
                            <Tag color={getStatusInfo(parkingStore.selectedSlot.status).color} style={{ marginTop: 12, fontSize: 14, padding: '4px 12px' }}>
                                {getStatusInfo(parkingStore.selectedSlot.status).label}
                            </Tag>
                        </Card>

                        <Card className="saas-card" title="Location Details" size="small">
                            <Descriptions column={1} size="small" labelStyle={{ color: '#64748b' }}>
                                <Descriptions.Item label="Building">{parkingStore.selectedSlot.buildingName || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Floor">{parkingStore.selectedSlot.floorName || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Zone"><Text strong>{parkingStore.selectedSlot.zoneName || 'N/A'}</Text></Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card className="saas-card" title="Specifications" size="small">
                            <Descriptions column={1} size="small" labelStyle={{ color: '#64748b' }}>
                                <Descriptions.Item label="Vehicle Type">{parkingStore.selectedSlot.vehicleTypeName || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Area">{parkingStore.selectedSlot.area != null ? `${parkingStore.selectedSlot.area} m²` : 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Capacity">{parkingStore.selectedSlot.capacity != null ? parkingStore.selectedSlot.capacity : 'N/A'}</Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {parkingStore.selectedSlot.status === 'AVAILABLE' && (
                            <Button type="primary" size="large" style={{ marginTop: 16, height: 48, borderRadius: 8, fontSize: 16, fontWeight: 600 }}>
                                Book this Slot
                            </Button>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default ParkingPage;
