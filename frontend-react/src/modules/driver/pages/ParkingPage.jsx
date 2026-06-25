import React, { useEffect, useReducer, useState, useMemo } from 'react';
import { Card, Table, Tag, Select, Row, Col, Descriptions, Drawer, Button, Space, message } from 'antd';
import { driverService } from '../services/driverService';
import { parkingStore } from '../store/parkingStore';

const { Option } = Select;

const ParkingPage = () => {
    const [, forceRender] = useReducer(x => x + 1, 0);
    const [drawerVisible, setDrawerVisible] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        parkingStore.loading = true;
        forceRender();
        try {
            const slotsRes = await driverService.loadSlots();
            parkingStore.slots = slotsRes?.data || slotsRes || [];
        } catch (error) {
            message.error('Failed to load parking slots');
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

    const handleCloseDrawer = () => {
        setDrawerVisible(false);
    };

    // Calculate dynamic options for filters
    const filterOptions = useMemo(() => {
        const buildings = new Set();
        const floors = new Set();
        const zones = new Set();
        const vehicleTypes = new Set();
        const statuses = new Set();

        parkingStore.slots.forEach(slot => {
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
    }, [parkingStore.slots]);

    // Apply filters
    const filteredSlots = useMemo(() => {
        return parkingStore.slots.filter(slot => {
            const f = parkingStore.filters;
            if (f.buildingName !== 'all' && slot.buildingName !== f.buildingName) return false;
            if (f.floorName !== 'all' && slot.floorName !== f.floorName) return false;
            if (f.zoneName !== 'all' && slot.zoneName !== f.zoneName) return false;
            if (f.vehicleTypeName !== 'all' && slot.vehicleTypeName !== f.vehicleTypeName) return false;
            if (f.status !== 'all' && slot.status !== f.status) return false;
            return true;
        });
    }, [parkingStore.slots, parkingStore.filters.buildingName, parkingStore.filters.floorName, parkingStore.filters.zoneName, parkingStore.filters.vehicleTypeName, parkingStore.filters.status]);

    const getStatusTag = (status) => {
        const s = String(status).toUpperCase();
        let color = 'default';
        if (s === 'AVAILABLE') color = 'green';
        else if (s === 'RESERVED') color = 'gold';
        else if (s === 'OCCUPIED') color = 'red';
        else if (s === 'LOCKED') color = 'default';
        return <Tag color={color}>{s || 'UNKNOWN'}</Tag>;
    };

    const columns = [
        {
            title: 'Slot Code',
            dataIndex: 'slotName',
            key: 'slotName',
            render: (text, record) => text || record.slotCode || 'N/A'
        },
        {
            title: 'Building',
            dataIndex: 'buildingName',
            key: 'buildingName',
            render: (text) => text || 'N/A'
        },
        {
            title: 'Floor',
            dataIndex: 'floorName',
            key: 'floorName',
            render: (text) => text || 'N/A'
        },
        {
            title: 'Zone',
            dataIndex: 'zoneName',
            key: 'zoneName',
            render: (text) => text || 'N/A'
        },
        {
            title: 'Vehicle Type',
            dataIndex: 'vehicleTypeName',
            key: 'vehicleTypeName',
            render: (text) => text || 'N/A'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getStatusTag(status)
        },
        {
            title: 'Capacity',
            dataIndex: 'capacity',
            key: 'capacity',
            render: (val) => val != null ? val : 'N/A'
        },
        {
            title: 'Current Occupancy',
            dataIndex: 'currentOccupancy',
            key: 'currentOccupancy',
            render: (val) => val != null ? val : 'N/A'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button type="link" onClick={() => handleView(record)} style={{ padding: 0 }}>View</Button>
            )
        }
    ];

    const selSlot = parkingStore.selectedSlot;

    return (
        <Card title="Parking Slots">
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Select 
                        style={{ width: '100%' }} 
                        value={parkingStore.filters.buildingName} 
                        onChange={(val) => handleFilterChange('buildingName', val)}
                    >
                        <Option value="all">All Buildings</Option>
                        {filterOptions.buildings.map(b => <Option key={b} value={b}>{b}</Option>)}
                    </Select>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Select 
                        style={{ width: '100%' }} 
                        value={parkingStore.filters.floorName} 
                        onChange={(val) => handleFilterChange('floorName', val)}
                    >
                        <Option value="all">All Floors</Option>
                        {filterOptions.floors.map(f => <Option key={f} value={f}>{f}</Option>)}
                    </Select>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Select 
                        style={{ width: '100%' }} 
                        value={parkingStore.filters.zoneName} 
                        onChange={(val) => handleFilterChange('zoneName', val)}
                    >
                        <Option value="all">All Zones</Option>
                        {filterOptions.zones.map(z => <Option key={z} value={z}>{z}</Option>)}
                    </Select>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Select 
                        style={{ width: '100%' }} 
                        value={parkingStore.filters.vehicleTypeName} 
                        onChange={(val) => handleFilterChange('vehicleTypeName', val)}
                    >
                        <Option value="all">All Vehicle Types</Option>
                        {filterOptions.vehicleTypes.map(v => <Option key={v} value={v}>{v}</Option>)}
                    </Select>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Select 
                        style={{ width: '100%' }} 
                        value={parkingStore.filters.status} 
                        onChange={(val) => handleFilterChange('status', val)}
                    >
                        <Option value="all">All Statuses</Option>
                        {filterOptions.statuses.map(s => <Option key={s} value={s}>{s}</Option>)}
                    </Select>
                </Col>
            </Row>

            <Table 
                columns={columns} 
                dataSource={filteredSlots} 
                rowKey={(record) => record.slotId || record.id || record.slotName || Math.random().toString()} 
                loading={parkingStore.loading}
                pagination={{ pageSize: 10 }}
            />

            <Drawer
                title="Slot Details"
                placement="right"
                onClose={handleCloseDrawer}
                open={drawerVisible}
                width={400}
            >
                {selSlot && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="Slot Code">{selSlot.slotName || selSlot.slotCode || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Building">{selSlot.buildingName || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Floor">{selSlot.floorName || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Zone">{selSlot.zoneName || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Vehicle Type">{selSlot.vehicleTypeName || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Capacity">{selSlot.capacity != null ? selSlot.capacity : 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Current Occupancy">{selSlot.currentOccupancy != null ? selSlot.currentOccupancy : 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Status">{getStatusTag(selSlot.status)}</Descriptions.Item>
                        <Descriptions.Item label="Area">{selSlot.area != null ? `${selSlot.area} m²` : 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Active">
                            {selSlot.isActive !== undefined ? (selSlot.isActive ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>) : 'N/A'}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Drawer>
        </Card>
    );
};

export default ParkingPage;
