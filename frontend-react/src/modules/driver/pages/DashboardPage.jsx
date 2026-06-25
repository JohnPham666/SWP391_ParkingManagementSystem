import React, { useEffect, useState, useReducer } from 'react';
import { Row, Col, Card, Typography, Table, Button, Tag, Space, Progress, Skeleton, Empty } from 'antd';
import { 
    CarOutlined, 
    CalendarOutlined, 
    EnvironmentOutlined, 
    PlusOutlined,
    SearchOutlined,
    HistoryOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { driverService } from '../services/driverService';

const { Title, Text } = Typography;

const DashboardPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        vehicles: 0,
        activeReservations: 0,
        availableSlots: 0,
        recentReservations: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [vehiclesRes, reservationsRes, slotsRes] = await Promise.all([
                driverService.loadMyVehicles(),
                driverService.loadReservations(),
                driverService.loadSlots()
            ]);

            const vehicles = Array.isArray(vehiclesRes?.data || vehiclesRes) ? (vehiclesRes?.data || vehiclesRes) : [];
            const reservations = Array.isArray(reservationsRes?.data || reservationsRes) ? (reservationsRes?.data || reservationsRes) : [];
            const slots = Array.isArray(slotsRes?.data || slotsRes) ? (slotsRes?.data || slotsRes) : [];

            const activeReservations = reservations.filter(r => r.status === 'CONFIRMED' || r.status === 'PENDING');
            const availableSlots = slots.filter(s => s.status === 'AVAILABLE');
            
            // Get 5 most recent reservations
            const recent = [...reservations].sort((a, b) => new Date(b.startTime) - new Date(a.startTime)).slice(0, 5);

            setStats({
                vehicles: vehicles.length,
                activeReservations: activeReservations.length,
                availableSlots: availableSlots.length,
                recentReservations: recent
            });
        } catch (error) {
            // Error handling ignored for UI as per requirement
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Vehicle',
            key: 'vehicle',
            render: (_, r) => r.vehicle?.licensePlate || r.licensePlate || 'N/A'
        },
        {
            title: 'Slot',
            key: 'slot',
            render: (_, r) => r.slot?.slotName || r.parkingSlot?.slotName || r.slotId || 'N/A'
        },
        {
            title: 'Time',
            key: 'time',
            render: (_, r) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{new Date(r.startTime).toLocaleDateString()}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(r.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const s = String(status).toUpperCase();
                let color = 'default';
                if (s === 'CONFIRMED' || s === 'COMPLETED') color = 'green';
                else if (s === 'PENDING') color = 'gold';
                else if (s === 'CANCELLED') color = 'volcano';
                return <Tag color={color} style={{ borderRadius: '12px' }}>{s}</Tag>;
            }
        }
    ];

    if (loading) {
        return <Skeleton active paragraph={{ rows: 10 }} />;
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Statistics Row */}
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={8}>
                    <div className="stat-card">
                        <div className="stat-icon"><CarOutlined /></div>
                        <Title level={2} className="stat-value">{stats.vehicles}</Title>
                        <p className="stat-title">My Vehicles</p>
                    </div>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: '#10b981', background: '#d1fae5' }}><CalendarOutlined /></div>
                        <Title level={2} className="stat-value">{stats.activeReservations}</Title>
                        <p className="stat-title">Active Reservations</p>
                    </div>
                </Col>
                <Col xs={24} sm={24} lg={8}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: '#3b82f6', background: '#dbeafe' }}><EnvironmentOutlined /></div>
                        <Title level={2} className="stat-value">{stats.availableSlots}</Title>
                        <p className="stat-title">Available Slots</p>
                    </div>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                {/* Main Content Area */}
                <Col xs={24} lg={16}>
                    <Card title="Recent Reservations" className="saas-card" extra={<Button type="link" onClick={() => navigate('/driver/reservations')}>View All</Button>}>
                        {stats.recentReservations.length === 0 ? (
                            <Empty description="No recent reservations found." style={{ margin: '40px 0' }} />
                        ) : (
                            <Table 
                                columns={columns} 
                                dataSource={stats.recentReservations} 
                                rowKey={(r) => r.reservationId || r.id}
                                pagination={false}
                                size="middle"
                            />
                        )}
                    </Card>

                    <Card title="Parking Occupancy Overview" className="saas-card" style={{ marginTop: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <Progress type="dashboard" percent={75} strokeColor="#ea580c" />
                            <div>
                                <Title level={4} style={{ margin: 0 }}>High Demand Area</Title>
                                <Text type="secondary">Zone A is currently 75% full. We recommend booking in advance if you plan to park here.</Text>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Sidebar Area */}
                <Col xs={24} lg={8}>
                    <Card title="Quick Actions" className="saas-card" style={{ marginBottom: '24px' }}>
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Card hoverable className="action-card" style={{ background: '#fff7ed', border: 'none' }} onClick={() => navigate('/driver/parking')}>
                                    <SearchOutlined className="action-icon" />
                                    <div style={{ fontWeight: 600 }}>Find Parking</div>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card hoverable className="action-card" style={{ background: '#f0fdf4', border: 'none' }} onClick={() => navigate('/driver/reservations')}>
                                    <CalendarOutlined className="action-icon" style={{ color: '#10b981' }} />
                                    <div style={{ fontWeight: 600 }}>Book Slot</div>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card hoverable className="action-card" style={{ background: '#eff6ff', border: 'none' }} onClick={() => navigate('/driver/vehicles')}>
                                    <PlusOutlined className="action-icon" style={{ color: '#3b82f6' }} />
                                    <div style={{ fontWeight: 600 }}>Add Vehicle</div>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card hoverable className="action-card" style={{ background: '#f5f3ff', border: 'none' }} onClick={() => navigate('/driver/history')}>
                                    <HistoryOutlined className="action-icon" style={{ color: '#8b5cf6' }} />
                                    <div style={{ fontWeight: 600 }}>View History</div>
                                </Card>
                            </Col>
                        </Row>
                    </Card>

                    <Card className="saas-card" style={{ background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', color: 'white', border: 'none' }}>
                        <Title level={4} style={{ color: 'white', marginTop: 0 }}>Pro Tip 💡</Title>
                        <p style={{ opacity: 0.9 }}>Link your payment method in the profile section to enable 1-click booking and automated exit payments.</p>
                        <Button ghost shape="round" onClick={() => navigate('/driver/payments')}>Manage Payments</Button>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardPage;
