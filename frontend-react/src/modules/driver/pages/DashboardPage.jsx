import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Button, Tag, Space, Progress, Skeleton, Statistic, Badge, Divider } from 'antd';
import { 
    CarOutlined, 
    CalendarOutlined, 
    EnvironmentOutlined, 
    HistoryOutlined,
    DollarOutlined,
    AlertOutlined,
    ArrowRightOutlined
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
        totalSlots: 0,
        occupiedSlots: 0,
        reservedSlots: 0,
        motorbikeSlots: 'N/A',
        carSlots: 'N/A',
        occupancyRate: 0,
        todaysReservations: 0,
        todaysCheckins: 0,
        todaysCheckouts: 0,
        peakHours: 'N/A'
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
            
            const occupiedSlots = slots.filter(s => s.status === 'OCCUPIED');
            const reservedSlots = slots.filter(s => s.status === 'RESERVED');
            const totalSlots = slots.length;
            const occupancyRate = totalSlots > 0 ? Math.round(((occupiedSlots.length + reservedSlots.length) / totalSlots) * 100) : 0;

            let motorbikeCount = 0;
            let carCount = 0;
            let typeAvailable = false;
            slots.forEach(s => {
                const typeName = s.vehicleType?.name || s.vehicleTypeName || '';
                if (typeName.toLowerCase().includes('motor')) {
                    motorbikeCount++;
                    typeAvailable = true;
                } else if (typeName.toLowerCase().includes('car')) {
                    carCount++;
                    typeAvailable = true;
                }
            });

            const todayStr = new Date().toDateString();
            const todaysReservations = reservations.filter(r => new Date(r.startTime).toDateString() === todayStr);
            const todaysCheckins = reservations.filter(r => r.checkInTime && new Date(r.checkInTime).toDateString() === todayStr);
            const todaysCheckouts = reservations.filter(r => r.checkOutTime && new Date(r.checkOutTime).toDateString() === todayStr);

            setStats({
                vehicles: vehicles.length,
                activeReservations: activeReservations.length,
                availableSlots: availableSlots.length,
                totalSlots,
                occupiedSlots: occupiedSlots.length,
                reservedSlots: reservedSlots.length,
                motorbikeSlots: typeAvailable ? motorbikeCount : 'N/A',
                carSlots: typeAvailable ? carCount : 'N/A',
                occupancyRate,
                todaysReservations: todaysReservations.length,
                todaysCheckins: todaysCheckins.length,
                todaysCheckouts: todaysCheckouts.length,
                peakHours: 'N/A'
            });
        } catch (error) {
            // Error handling ignored for UI as per requirement
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Skeleton active paragraph={{ rows: 10 }} />;
    }

    const cards = [
        {
            title: 'My Vehicles',
            value: stats.vehicles,
            icon: <CarOutlined />,
            color: '#f97316',
            bg: '#fff7ed',
            action: 'View Vehicles',
            path: '/driver/vehicles'
        },
        {
            title: 'Active Reservations',
            value: stats.activeReservations,
            icon: <CalendarOutlined />,
            color: '#10b981',
            bg: '#d1fae5',
            action: 'Manage Reservations',
            path: '/driver/reservations'
        },
        {
            title: 'Available Slots',
            value: stats.availableSlots,
            icon: <EnvironmentOutlined />,
            color: '#3b82f6',
            bg: '#dbeafe',
            action: 'Find Parking',
            path: '/driver/parking'
        },
        {
            title: 'Pricing Policies',
            value: null,
            icon: <DollarOutlined />,
            color: '#8b5cf6',
            bg: '#f3e8ff',
            action: 'View Pricing',
            path: '/driver/pricing'
        },
        {
            title: 'History',
            value: null,
            icon: <HistoryOutlined />,
            color: '#06b6d4',
            bg: '#cffafe',
            action: 'View History',
            path: '/driver/history'
        },
        {
            title: 'Report Incident',
            value: null,
            icon: <AlertOutlined />,
            color: '#ef4444',
            bg: '#fee2e2',
            action: 'Report',
            path: '/driver/incidents'
        }
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }} className="animate-fade-in">
            {/* Interactive Cards Row */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                {cards.map((card, index) => (
                    <Col xs={24} sm={12} lg={8} xl={8} key={index}>
                        <Card 
                            hoverable 
                            className="interactive-stat-card"
                            style={{ 
                                borderRadius: '16px', 
                                border: 'none', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            bodyStyle={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}
                            onClick={() => navigate(card.path)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div 
                                    style={{ 
                                        width: '48px', 
                                        height: '48px', 
                                        borderRadius: '12px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        color: card.color,
                                        backgroundColor: card.bg
                                    }}
                                >
                                    {card.icon}
                                </div>
                                {card.value !== null && (
                                    <Title level={2} style={{ margin: 0, color: '#1f2937' }}>{card.value}</Title>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <Text style={{ fontSize: '16px', fontWeight: 600, color: '#4b5563' }}>{card.title}</Text>
                            </div>
                            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', color: card.color, fontWeight: 600 }}>
                                <span>{card.action}</span>
                                <ArrowRightOutlined style={{ marginLeft: '8px', fontSize: '12px' }} />
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Parking Occupancy Overview */}
            <Card 
                title={<Title level={4} style={{ margin: 0 }}>Parking Occupancy Overview</Title>} 
                style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
                <Row gutter={[32, 32]} align="middle">
                    <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                        <Progress 
                            type="dashboard" 
                            percent={stats.occupancyRate} 
                            strokeColor={{ '0%': '#10b981', '100%': '#ef4444' }}
                            size={180}
                        />
                        <div style={{ marginTop: '16px' }}>
                            <Title level={5} style={{ margin: 0 }}>Current Occupancy</Title>
                            <Text type="secondary">Real-time status of all parking zones</Text>
                        </div>
                    </Col>
                    
                    <Col xs={24} md={16}>
                        <Row gutter={[16, 24]}>
                            <Col xs={12} sm={8}>
                                <Statistic title="Available Slots" value={stats.availableSlots} valueStyle={{ color: '#10b981' }} />
                            </Col>
                            <Col xs={12} sm={8}>
                                <Statistic title="Occupied Slots" value={stats.occupiedSlots} valueStyle={{ color: '#f97316' }} />
                            </Col>
                            <Col xs={12} sm={8}>
                                <Statistic title="Reserved Slots" value={stats.reservedSlots} valueStyle={{ color: '#3b82f6' }} />
                            </Col>
                            <Col xs={12} sm={8}>
                                <Statistic title="Car Slots" value={stats.carSlots} prefix={<CarOutlined />} />
                            </Col>
                            <Col xs={12} sm={8}>
                                <Statistic title="Motorbike Slots" value={stats.motorbikeSlots} />
                            </Col>
                            <Col xs={12} sm={8}>
                                <Statistic title="Peak Hours" value={stats.peakHours} />
                            </Col>
                        </Row>
                        
                        <Divider style={{ margin: '24px 0' }} />
                        
                        <Title level={5} style={{ marginBottom: '16px' }}>Today's Activity</Title>
                        <Space size="large" wrap>
                            <Badge status="processing" text={`Reservations: ${stats.todaysReservations}`} />
                            <Badge status="success" text={`Check-ins: ${stats.todaysCheckins}`} />
                            <Badge status="warning" text={`Check-outs: ${stats.todaysCheckouts}`} />
                        </Space>
                        
                        <div style={{ marginTop: '24px' }}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Capacity Breakdown</Text>
                            <Progress 
                                percent={100} 
                                success={{ percent: stats.totalSlots ? (stats.availableSlots / stats.totalSlots) * 100 : 0, strokeColor: '#10b981' }} 
                                strokeColor="#f97316"
                                format={() => `${stats.totalSlots} Total`}
                            />
                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                                <Tag color="#10b981">Available</Tag>
                                <Tag color="#f97316">Occupied</Tag>
                                <Tag color="#3b82f6">Reserved</Tag>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default DashboardPage;

