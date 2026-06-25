import React from 'react';
import { Card, Row, Col, Typography, Button, Divider, Tag } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

const { Title, Text } = Typography;

const PricingPage = () => {
    const plans = [
        {
            type: 'Car',
            price: '$5.00',
            unit: 'per hour',
            color: '#3b82f6',
            bg: '#eff6ff',
            features: ['Covered Parking', '24/7 Security', 'EV Charging (+1$)', 'Valet Available']
        },
        {
            type: 'Motorbike',
            price: '$2.00',
            unit: 'per hour',
            color: '#ea580c',
            bg: '#fff7ed',
            features: ['Designated Zone', 'Helmet Locker', '24/7 Security', 'Ground Floor']
        },
        {
            type: 'Monthly Pass',
            price: '$150.00',
            unit: 'per month',
            color: '#10b981',
            bg: '#f0fdf4',
            features: ['Unlimited Entry/Exit', 'Fixed Spot Option', 'Priority Support', 'No Surge Pricing'],
            popular: true
        }
    ];

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <Title level={2}>Transparent Pricing Policies</Title>
                <Text type="secondary" style={{ fontSize: 16 }}>Simple, predictable pricing for all vehicle types.</Text>
            </div>

            <Row gutter={[24, 24]} justify="center">
                {plans.map((plan, index) => (
                    <Col xs={24} md={8} key={index}>
                        <Card 
                            className="saas-card"
                            style={{ 
                                height: '100%', 
                                borderTop: `4px solid ${plan.color}`,
                                position: 'relative',
                                transform: plan.popular ? 'scale(1.05)' : 'none',
                                zIndex: plan.popular ? 2 : 1
                            }}
                            styles={{ body: { padding: 32, display: 'flex', flexDirection: 'column', height: '100%' } }}
                        >
                            {plan.popular && (
                                <div style={{ position: 'absolute', top: 0, right: 0, background: plan.color, color: 'white', padding: '4px 12px', borderBottomLeftRadius: 12, fontWeight: 600, fontSize: 12 }}>
                                    MOST POPULAR
                                </div>
                            )}
                            <Tag color={plan.bg} style={{ color: plan.color, padding: '4px 12px', borderRadius: 16, border: 'none', fontWeight: 600, alignSelf: 'flex-start', marginBottom: 16 }}>
                                {plan.type}
                            </Tag>
                            <div style={{ marginBottom: 24 }}>
                                <span style={{ fontSize: 48, fontWeight: 800, color: '#0f172a' }}>{plan.price}</span>
                                <span style={{ color: '#64748b', marginLeft: 8 }}>{plan.unit}</span>
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

                            <Button 
                                type={plan.popular ? 'primary' : 'default'} 
                                size="large" 
                                style={{ 
                                    width: '100%', 
                                    marginTop: 24, 
                                    borderRadius: 8,
                                    height: 48,
                                    fontWeight: 600,
                                    background: plan.popular ? plan.color : undefined,
                                    borderColor: plan.color,
                                    color: plan.popular ? 'white' : plan.color
                                }}
                            >
                                Learn More
                            </Button>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default PricingPage;
