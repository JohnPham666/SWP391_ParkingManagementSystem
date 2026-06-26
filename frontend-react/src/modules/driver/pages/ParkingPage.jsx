import React, { useEffect, useReducer, useState, useMemo } from 'react';
import { Card, Tag, Select, Row, Col, Descriptions, Drawer, Button, message, Skeleton, Empty, Typography, Input, Divider, theme } from 'antd';
import { SearchOutlined, CompassOutlined, BorderOutlined, EnvironmentOutlined, CarOutlined, ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons';
import Icon from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { driverService } from '../services/driverService';
import { parkingStore } from '../store/parkingStore';

const { Option } = Select;
const { Title, Text } = Typography;

const MotorbikeSvg = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="1em" height="1em">
        <circle cx="5.5" cy="16.5" r="3.5" />
        <circle cx="18.5" cy="16.5" r="3.5" />
        <path d="M15 6h5M12.5 12.5l3.5-6.5M5.5 13L9 6h3" />
    </svg>
);
const MotorbikeIcon = (props) => <Icon component={MotorbikeSvg} {...props} />;

const ParkingPage = () => {
    const { token } = theme.useToken();
    const navigate = useNavigate();
    const [, forceRender] = useReducer(x => x + 1, 0);
    const [drawerVisible, setDrawerVisible] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        parkingStore.loading = true;
        forceRender();
        try {
            const [slotsRes, resRes, sesRes] = await Promise.all([
                driverService.loadSlots(),
                driverService.loadReservations(),
                driverService.loadSessions()
            ]);

            parkingStore.slots = Array.isArray(slotsRes?.data || slotsRes) ? (slotsRes?.data || slotsRes) : [];
            parkingStore.allReservations = Array.isArray(resRes?.data || resRes) ? (resRes?.data || resRes) : [];
            parkingStore.allSessions = Array.isArray(sesRes?.data || sesRes) ? (sesRes?.data || sesRes) : [];
        } catch (error) {
            message.error('Failed to load parking data');
            parkingStore.slots = [];
            parkingStore.allReservations = [];
            parkingStore.allSessions = [];
        } finally {
            parkingStore.loading = false;
            forceRender();
        }
    };

    const handleFilterChange = (key, value) => {
        parkingStore.filters[key] = value;
        forceRender();
    };

    const handleResetFilter = () => {
        parkingStore.filters = {
            buildingName: '',
            floorName: '',
            zoneName: '',
            vehicleTypeName: '',
            status: '',
            startTime: '',
            endTime: ''
        };
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
        const isSlotReservedSoon = (slotId, allReservations = []) => {
            const now = Date.now();
            const THIRTY_MINUTES_MS = 30 * 60 * 1000;
            return allReservations.some(r => {
                if (r.slotId !== slotId) return false;
                if (r.status === 'CANCELLED' || r.status === 'COMPLETED') return false;
                const rStart = new Date(r.reservationStart).getTime();
                const rEnd = new Date(r.reservationEnd).getTime();
                if (now > rEnd) return false;
                return (rStart - now) <= THIRTY_MINUTES_MS;
            });
        };

        const isReservationOverlap = (slotId, allReservations, reqStart, reqEnd) => {
            return allReservations.some(r => {
                if (r.slotId !== slotId) return false;
                if (r.status === 'CANCELLED' || r.status === 'COMPLETED') return false;
                const rStart = new Date(r.reservationStart).getTime();
                const rEnd = new Date(r.reservationEnd).getTime();
                return rStart < reqEnd && rEnd > reqStart;
            });
        };

        const isSessionOverlap = (slotId, allSessions, reqStart, reqEnd) => {
            return allSessions.some(s => {
                if (s.slotId !== slotId) return false;
                if (s.status === 'COMPLETED') return false;
                const sStart = new Date(s.entryTime).getTime();
                const sEnd = s.exitTime ? new Date(s.exitTime).getTime() : Infinity;
                return sStart < reqEnd && sEnd > reqStart;
            });
        };

        let processedSlots = slots.map(slot => {
            let newSlot = { ...slot };
            if (newSlot.status === 'AVAILABLE') {
                if (isSlotReservedSoon(newSlot.slotId, parkingStore.allReservations)) {
                    newSlot.status = 'RESERVED';
                }
            }
            return newSlot;
        });

        const f = parkingStore.filters;

        if (f.startTime && f.endTime) {
            const reqStart = new Date(f.startTime).getTime();
            const reqEnd = new Date(f.endTime).getTime();
            if (reqEnd > reqStart) {
                processedSlots = processedSlots.filter(slot => {
                    if (slot.status !== 'AVAILABLE') return false;
                    const isResOverlap = isReservationOverlap(slot.slotId, parkingStore.allReservations, reqStart, reqEnd);
                    const isSesOverlap = isSessionOverlap(slot.slotId, parkingStore.allSessions, reqStart, reqEnd);
                    return !isResOverlap && !isSesOverlap;
                });
            } else {
                message.warning('Thời gian kết thúc phải sau thời gian bắt đầu.');
            }
        }

        const canReserveSlot = (slot) => {
            const vType = String(slot.vehicleTypeName || '').toLowerCase();
            return slot && slot.status === 'AVAILABLE' && !vType.includes('motor') && !vType.includes('xe máy');
        };

        const sortAndRecommendSlots = (slotsToProcess) => {
            slotsToProcess.forEach(s => s.isRecommended = false);
            const reservableSlots = slotsToProcess.filter(s => canReserveSlot(s));
            if (reservableSlots.length > 0) {
                const sorted = [...reservableSlots].sort((a, b) => {
                    const floorA = a.floorName || '';
                    const floorB = b.floorName || '';
                    if (floorA !== floorB) return floorA.localeCompare(floorB);

                    const zoneA = a.zoneName || '';
                    const zoneB = b.zoneName || '';
                    if (zoneA !== zoneB) return zoneA.localeCompare(zoneB);

                    const codeA = a.slotCode || '';
                    const codeB = b.slotCode || '';
                    return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
                });
                const bestSlotId = sorted[0].slotId;
                const bestSlot = slotsToProcess.find(s => s.slotId === bestSlotId);
                if (bestSlot) bestSlot.isRecommended = true;
            }
            return slotsToProcess;
        };

        const finalFilteredSlots = processedSlots.filter(slot => {

            if (f.buildingName && f.buildingName !== 'all' && f.buildingName !== '' && slot.buildingName !== f.buildingName) return false;
            if (f.floorName && f.floorName !== 'all' && f.floorName !== '' && slot.floorName !== f.floorName) return false;
            if (f.zoneName && f.zoneName !== 'all' && f.zoneName !== '' && slot.zoneName !== f.zoneName) return false;
            if (f.vehicleTypeName && f.vehicleTypeName !== 'all' && f.vehicleTypeName !== '' && slot.vehicleTypeName !== f.vehicleTypeName) return false;
            if (f.status && f.status !== 'all' && f.status !== '' && slot.status !== f.status) return false;
            return true;
        });

        finalFilteredSlots.sort((a, b) => {
            const idA = a.slotId || a.id || 0;
            const idB = b.slotId || b.id || 0;
            return idA - idB;
        });

        return sortAndRecommendSlots(finalFilteredSlots);
    }, [slots, parkingStore.filters.buildingName, parkingStore.filters.floorName, parkingStore.filters.zoneName, parkingStore.filters.vehicleTypeName, parkingStore.filters.status, parkingStore.filters.startTime, parkingStore.filters.endTime, parkingStore.allReservations, parkingStore.allSessions]);

    const getStatusInfo = (status) => {
        const s = String(status).toUpperCase();
        if (s === 'AVAILABLE') return { color: 'green', hex: '#10b981', label: 'AVAILABLE' };
        if (s === 'RESERVED') return { color: 'orange', hex: '#f97316', label: 'RESERVED' };
        if (s === 'OCCUPIED') return { color: 'red', hex: '#ef4444', label: 'OCCUPIED' };
        if (s === 'MAINTENANCE') return { color: 'default', hex: '#9ca3af', label: 'MAINTENANCE' };
        if (s === 'DISABLED' || s === 'LOCKED') return { color: 'default', hex: '#4b5563', label: s };
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f97316' }}></div><Text type="secondary">Reserved</Text></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }}></div><Text type="secondary">Occupied</Text></div>
                </div>
            </div>

            <Card className="saas-card" style={{ marginBottom: 24 }} styles={{ body: { padding: '16px 24px' } }}>
                <Row gutter={[16, 16]}>
                    <Col xs={12} sm={8} md={4}>
                        <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600, color: token.colorTextSecondary }}>Tòa nhà</div>
                        <Select style={{ width: '100%' }} size="large" value={parkingStore.filters.buildingName || 'all'} onChange={(v) => handleFilterChange('buildingName', v)}>
                            <Option value="all">Tất cả</Option>
                            {filterOptions.buildings.map(b => <Option key={b} value={b}>{b}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600, color: token.colorTextSecondary }}>Tầng</div>
                        <Select style={{ width: '100%' }} size="large" value={parkingStore.filters.floorName || 'all'} onChange={(v) => handleFilterChange('floorName', v)}>
                            <Option value="all">Tất cả</Option>
                            {filterOptions.floors.map(f => <Option key={f} value={f}>{f}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600, color: token.colorTextSecondary }}>Khu vực</div>
                        <Select style={{ width: '100%' }} size="large" value={parkingStore.filters.zoneName || 'all'} onChange={(v) => handleFilterChange('zoneName', v)}>
                            <Option value="all">Tất cả</Option>
                            {filterOptions.zones.map(z => <Option key={z} value={z}>{z}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600, color: token.colorTextSecondary }}>Loại xe</div>
                        <Select style={{ width: '100%' }} size="large" value={parkingStore.filters.vehicleTypeName || 'all'} onChange={(v) => handleFilterChange('vehicleTypeName', v)}>
                            <Option value="all">Tất cả</Option>
                            {filterOptions.vehicleTypes.map(v => <Option key={v} value={v}>{v}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={12} sm={8} md={8}>
                        <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600, color: token.colorTextSecondary }}>Trạng thái</div>
                        <Select style={{ width: '100%' }} size="large" value={parkingStore.filters.status || 'all'} onChange={(v) => handleFilterChange('status', v)}>
                            <Option value="all">Tất cả</Option>
                            <Option value="AVAILABLE">Trống</Option>
                            <Option value="OCCUPIED">Đang sử dụng</Option>
                            <Option value="RESERVED">Đã đặt</Option>
                            <Option value="LOCKED">Khóa</Option>
                        </Select>
                    </Col>
                </Row>
                <Row gutter={[16, 16]} style={{ marginTop: 16, alignItems: 'flex-end' }}>
                    <Col xs={12} sm={8} md={6}>
                        <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600, color: token.colorTextSecondary }}>Thời gian bắt đầu</div>
                        <Input
                            type="datetime-local"
                            size="large"
                            value={parkingStore.filters.startTime || ''}
                            onChange={(e) => handleFilterChange('startTime', e.target.value)}
                        />
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                        <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600, color: token.colorTextSecondary }}>Thời gian kết thúc</div>
                        <Input
                            type="datetime-local"
                            size="large"
                            value={parkingStore.filters.endTime || ''}
                            onChange={(e) => handleFilterChange('endTime', e.target.value)}
                        />
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                        <Button
                            size="large"
                            onClick={handleResetFilter}
                            icon={<ReloadOutlined />}
                        >
                            Đặt lại
                        </Button>
                    </Col>
                </Row>
            </Card>

            {filteredSlots.length === 0 ? (
                <Empty description="No slots match your criteria" style={{ margin: '60px 0' }} />
            ) : (
                <>
                    {Object.entries(
                        filteredSlots.reduce((acc, slot) => {
                            const b = slot.buildingName || 'Khu vực chung';
                            if (!acc[b]) acc[b] = [];
                            acc[b].push(slot);
                            return acc;
                        }, {})
                    ).map(([buildingName, buildingSlots]) => (
                        <div key={buildingName} style={{ marginBottom: 40 }}>
                            <Title level={4} style={{ marginBottom: 16, color: token.colorTextHeading }}>{buildingName}</Title>
                            <Row gutter={[20, 20]}>
                                {buildingSlots.map((slot) => {
                                    const statusInfo = getStatusInfo(slot.status);

                                    return (
                                        <Col xs={24} sm={12} md={8} lg={6} xl={4} key={slot.slotId || slot.id || slot.slotCode}>
                                            <Card
                                                hoverable
                                                className="saas-card"
                                                styles={{ body: { padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' } }}
                                                onClick={() => handleView(slot)}
                                                style={{
                                                    ... (slot.isRecommended ? { border: `2px solid ${token.colorPrimary}`, boxShadow: `0 4px 16px ${token.colorPrimary}40`, transform: 'scale(1.02)' } : { border: `1px solid ${statusInfo.hex}30` }),
                                                    borderRadius: 16,
                                                    position: 'relative',
                                                    backgroundColor: statusInfo.hex + '0A',
                                                    overflow: 'hidden',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                {slot.isRecommended && (
                                                    <div style={{ position: 'absolute', top: 0, right: 0, background: token.colorPrimary, color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '4px 16px', borderBottomLeftRadius: 16, zIndex: 2, letterSpacing: 0.5, boxShadow: '-2px 2px 8px rgba(0,0,0,0.1)' }}>
                                                        ĐỀ XUẤT
                                                    </div>
                                                )}

                                                <div style={{
                                                    width: 56, height: 56, borderRadius: '50%', backgroundColor: statusInfo.hex + '1A',
                                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                    color: statusInfo.hex, marginBottom: 12
                                                }}>
                                                    {String(slot.vehicleTypeName || '').toLowerCase().includes('motor') || String(slot.vehicleTypeName || '').toLowerCase().includes('xe máy') ? <MotorbikeIcon style={{ fontSize: 28 }} /> : <CarOutlined style={{ fontSize: 28 }} />}
                                                </div>

                                                <Title level={3} style={{ margin: 0, fontWeight: 800, color: statusInfo.hex }}>
                                                    {slot.slotCode || 'N/A'}
                                                </Title>

                                                <Text type="secondary" style={{ fontSize: 13, marginTop: 4, fontWeight: 600 }}>
                                                    {slot.vehicleTypeName || 'N/A'} • {slot.floorName || 'N/A'}
                                                </Text>

                                                <div style={{ marginTop: 16, padding: '8px 16px', width: '100%', backgroundColor: '#fff', borderRadius: 8, border: `1px solid ${token.colorBorderSecondary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Lấp đầy</Text>
                                                    <Text strong style={{ fontSize: 14 }}>{slot.currentOccupancy || 0} / {slot.capacity || 1}</Text>
                                                </div>

                                                <div style={{ marginTop: 12, padding: '6px 16px', borderRadius: 20, backgroundColor: statusInfo.hex, color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                                    {statusInfo.label}
                                                </div>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </div>
                    ))}
                </>
            )}

            <Drawer
                title={<Title level={4} style={{ margin: 0 }}>Slot Information</Title>}
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={400}
                styles={{ body: { background: token.colorFillAlter } }}
            >
                {parkingStore.selectedSlot && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Card className="saas-card" styles={{ body: { textAlign: 'center', padding: '32px 16px' } }}>
                            <Title level={1} style={{ fontSize: 48, color: token.colorText, margin: 0 }}>
                                {parkingStore.selectedSlot.slotCode || 'N/A'}
                            </Title>
                            <Tag color={getStatusInfo(parkingStore.selectedSlot.status).color} style={{ marginTop: 12, fontSize: 14, padding: '4px 12px' }}>
                                {getStatusInfo(parkingStore.selectedSlot.status).label}
                            </Tag>
                        </Card>

                        <Card className="saas-card" title="Location Details" size="small">
                            <Descriptions column={1} size="small" labelStyle={{ color: token.colorTextSecondary }}>
                                <Descriptions.Item label="Building">{parkingStore.selectedSlot.buildingName || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Floor">{parkingStore.selectedSlot.floorName || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Zone"><Text strong>{parkingStore.selectedSlot.zoneName || 'N/A'}</Text></Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card className="saas-card" title="Specifications" size="small">
                            <Descriptions column={1} size="small" labelStyle={{ color: token.colorTextSecondary }}>
                                <Descriptions.Item label="Vehicle Type">{parkingStore.selectedSlot.vehicleTypeName || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Area">{parkingStore.selectedSlot.area != null ? `${parkingStore.selectedSlot.area} m²` : 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Capacity">{parkingStore.selectedSlot.capacity != null ? parkingStore.selectedSlot.capacity : 'N/A'}</Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {parkingStore.selectedSlot.status !== 'AVAILABLE' ? (
                            <div style={{ marginBottom: 12, fontSize: '0.85rem', textAlign: 'center', color: '#f59e0b', background: '#fffbeb', padding: 10, borderRadius: 6 }}>
                                Slot này hiện không thể đặt chỗ.
                            </div>
                        ) : String(parkingStore.selectedSlot.vehicleTypeName || '').toLowerCase().includes('motor') || String(parkingStore.selectedSlot.vehicleTypeName || '').toLowerCase().includes('xe máy') ? (
                            <div style={{ marginBottom: 12, fontSize: '0.85rem', textAlign: 'center', color: '#f59e0b', background: '#fffbeb', padding: 10, borderRadius: 6 }}>
                                Slot xe máy không hỗ trợ đặt trước.
                            </div>
                        ) : (
                            <Button type="primary" size="large" onClick={() => navigate('/driver/reservations', { state: { prefilledSlot: parkingStore.selectedSlot } })} style={{ marginTop: 16, height: 48, borderRadius: 8, fontSize: 16, fontWeight: 600 }}>
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
