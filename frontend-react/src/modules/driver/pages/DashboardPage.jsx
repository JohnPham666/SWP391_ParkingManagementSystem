import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Tag, Space, Progress, Skeleton, Statistic, Badge, Divider, theme } from 'antd';
import { 
    CarOutlined, 
    CalendarOutlined, 
    EnvironmentOutlined, 
    ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { driverService } from '../services/driverService';

const { Title, Text } = Typography;

const DashboardPage = () => {
    const navigate = useNavigate();
    const { token } = theme.useToken();
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
            color: token.colorPrimary,
            bg: token.colorPrimaryBg,
            action: 'View Vehicles',
            path: '/driver/vehicles'
        },
        {
            title: 'Active Reservations',
            value: stats.activeReservations,
            icon: <CalendarOutlined />,
            color: token.colorSuccess,
            bg: token.colorSuccessBg,
            action: 'Manage Reservations',
            path: '/driver/reservations'
        },
        {
            title: 'Available Slots',
            value: stats.availableSlots,
            icon: <EnvironmentOutlined />,
            color: token.colorInfo,
            bg: token.colorInfoBg,
            action: 'Find Parking',
            path: '/driver/parking'
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
                                boxShadow: token.boxShadowTertiary,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                background: token.colorBgContainer
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
                                    <Title level={2} style={{ margin: 0 }}>{card.value}</Title>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <Text style={{ fontSize: '16px', fontWeight: 600 }}>{card.title}</Text>
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
                style={{ borderRadius: '16px', border: 'none', boxShadow: token.boxShadowTertiary, background: token.colorBgContainer }}
            >
                <Row gutter={[32, 32]} align="middle">
                    <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                        <Progress 
                            type="dashboard" 
                            percent={stats.occupancyRate} 
                            strokeColor={{ '0%': token.colorSuccess, '100%': token.colorError }}
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
                                <Statistic title="Available Slots" value={stats.availableSlots} valueStyle={{ color: token.colorSuccess }} />
                            </Col>
                            <Col xs={12} sm={8}>
                                <Statistic title="Occupied Slots" value={stats.occupiedSlots} valueStyle={{ color: token.colorWarning }} />
                            </Col>
                            <Col xs={12} sm={8}>
                                <Statistic title="Reserved Slots" value={stats.reservedSlots} valueStyle={{ color: token.colorInfo }} />
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
                            <Badge status="processing" text={<Text>Reservations: {stats.todaysReservations}</Text>} />
                            <Badge status="success" text={<Text>Check-ins: {stats.todaysCheckins}</Text>} />
                            <Badge status="warning" text={<Text>Check-outs: {stats.todaysCheckouts}</Text>} />
                        </Space>
                        
                        <div style={{ marginTop: '24px' }}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Capacity Breakdown</Text>
                            <Progress 
                                percent={100} 
                                success={{ percent: stats.totalSlots ? (stats.availableSlots / stats.totalSlots) * 100 : 0, strokeColor: token.colorSuccess }} 
                                strokeColor={token.colorWarning}
                                format={() => `${stats.totalSlots} Total`}
                            />
                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                                <Tag color={token.colorSuccess}>Available</Tag>
                                <Tag color={token.colorWarning}>Occupied</Tag>
                                <Tag color={token.colorInfo}>Reserved</Tag>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default DashboardPage;

