import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Divider, Tag, theme, Skeleton } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { driverService } from '../services/driverService';

const { Title, Text } = Typography;

const PricingPage = () => {
    const { token } = theme.useToken();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pricingsRes, typesRes] = await Promise.all([
                driverService.loadPricings(),
                driverService.loadVehicleTypes()
            ]);

            const pData = pricingsRes?.data || pricingsRes;
            const tData = typesRes?.data || typesRes;
            
            const typesMap = {};
            if (Array.isArray(tData)) {
                tData.forEach(t => typesMap[t.vehicleTypeId || t.id] = t.typeName || t.name);
            }

            if (Array.isArray(pData)) {
                const now = new Date();
                
                const activePlans = pData.filter(p => {
                    if (!p.effectiveFrom) return false;
                    const from = new Date(p.effectiveFrom);
                    const to = p.effectiveTo ? new Date(p.effectiveTo) : null;
                    if (now < from) return false;
                    if (to && now > to) return false;
                    return true;
                });

                const formattedPlans = activePlans.map((p, index) => {
                    const vTypeName = typesMap[p.vehicleTypeId] || `Type ${p.vehicleTypeId}`;
                    const isMotorbike = vTypeName.toLowerCase().includes('motor') || vTypeName.toLowerCase().includes('xe máy');
                    
                    const color = isMotorbike ? '#ea580c' : '#3b82f6';
                    const bg = isMotorbike ? '#fff7ed' : '#eff6ff';
                    
                    const formatCurrency = (val) => val != null ? `${val.toLocaleString()} VND` : 'N/A';
                    
                    const features = [
                        `Base Price: ${formatCurrency(p.basePrice)}/hr`,
                        `Rush Hour (${p.rushHourStart || 'N/A'} - ${p.rushHourEnd || 'N/A'}): ${formatCurrency(p.rushHourPrice)}/hr`,
                        `Max Daily: ${formatCurrency(p.maxDailyRate)}`,
                        `Lost Ticket: ${formatCurrency(p.lostTicketFee)}`,
                        `Overtime: ${formatCurrency(p.overtimeFeePerHour)}/hr`
                    ];
                    
                    return {
                        id: p.pricingPolicyId || p.id,
                        type: vTypeName,
                        name: p.policyName,
                        price: p.basePrice != null ? p.basePrice.toLocaleString() : '0',
                        unit: 'VND / hour',
                        color: color,
                        bg: bg,
                        features: features
                    };
                });
                
                setPlans(formattedPlans);
            }
        } catch (error) {
            console.error('Failed to load pricing policies', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Skeleton active paragraph={{ rows: 10 }} />;
    }

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <Title level={2}>Transparent Pricing Policies</Title>
                <Text type="secondary" style={{ fontSize: 16 }}>Simple, predictable pricing for all vehicle types.</Text>
            </div>

            <Row gutter={[24, 24]} justify="center">
                {plans.length === 0 ? (
                    <Col span={24}>
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <Text type="secondary">No active pricing policies found.</Text>
                        </div>
                    </Col>
                ) : plans.map((plan, index) => (
                    <Col xs={24} md={12} lg={8} key={index}>
                        <Card 
                            className="saas-card"
                            style={{ 
                                height: '100%', 
                                borderTop: `4px solid ${plan.color}`,
                                position: 'relative'
                            }}
                            styles={{ body: { padding: 32, display: 'flex', flexDirection: 'column', height: '100%' } }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                                <Tag color={plan.bg} style={{ color: plan.color, padding: '4px 12px', borderRadius: 16, border: 'none', fontWeight: 600, alignSelf: 'flex-start' }}>
                                    {plan.type}
                                </Tag>
                                <Text strong style={{ fontSize: 16 }}>{plan.name}</Text>
                            </div>
                            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'baseline' }}>
                                <span style={{ fontSize: 40, fontWeight: 800, color: token.colorText }}>{plan.price}</span>
                                <span style={{ color: token.colorTextSecondary, marginLeft: 8, fontWeight: 600 }}>{plan.unit}</span>
                            </div>
                            
                            <Divider style={{ margin: '0 0 24px 0' }} />
                            
                            <div style={{ flex: 1 }}>
                                {plan.features.map((feature, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                                        <CheckCircleFilled style={{ color: plan.color, marginRight: 12, fontSize: 16 }} />
                                        <Text>{feature}</Text>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default PricingPage;
