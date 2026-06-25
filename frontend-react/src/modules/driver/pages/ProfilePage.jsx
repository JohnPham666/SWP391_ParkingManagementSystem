import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Avatar, Button, Divider, Tag } from 'antd';
import { UserOutlined, EditOutlined, SafetyCertificateOutlined, PhoneOutlined, MailOutlined, HomeOutlined, SafetyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ProfilePage = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const authStr = localStorage.getItem('parking_auth');
        if (authStr) {
            try {
                setUser(JSON.parse(authStr));
            } catch (e) {}
        }
    }, []);

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>My Profile</Title>
                    <Text type="secondary">Manage your personal information and security settings</Text>
                </div>
                <Button type="primary" icon={<EditOutlined />} style={{ borderRadius: 8 }}>Edit Profile</Button>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card className="saas-card" style={{ textAlign: 'center' }}>
                        <Avatar size={120} icon={<UserOutlined />} style={{ backgroundColor: '#f97316', marginBottom: 16 }} />
                        <Title level={3} style={{ margin: 0 }}>{user?.fullName || 'Driver User'}</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{user?.email || 'driver@example.com'}</Text>
                        <Tag color="orange" style={{ padding: '4px 16px', borderRadius: 16, fontSize: 14 }}>DRIVER</Tag>
                        
                        <Divider />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <Text type="secondary">Status</Text>
                            <Tag color="green">Active</Tag>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">Member Since</Text>
                            <Text strong>Jan 2024</Text>
                        </div>
                    </Card>
                </Col>
                
                <Col xs={24} md={16}>
                    <Card className="saas-card" title="Personal Information" style={{ marginBottom: 24 }}>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <UserOutlined style={{ fontSize: 20, color: '#94a3b8', marginTop: 4 }} />
                                    <div>
                                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Full Name</Text>
                                        <Text strong>{user?.fullName || 'Not provided'}</Text>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <MailOutlined style={{ fontSize: 20, color: '#94a3b8', marginTop: 4 }} />
                                    <div>
                                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Email Address</Text>
                                        <Text strong>{user?.email || 'Not provided'}</Text>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <PhoneOutlined style={{ fontSize: 20, color: '#94a3b8', marginTop: 4 }} />
                                    <div>
                                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Phone Number</Text>
                                        <Text strong>{user?.phoneNumber || 'Not provided'}</Text>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <HomeOutlined style={{ fontSize: 20, color: '#94a3b8', marginTop: 4 }} />
                                    <div>
                                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Address</Text>
                                        <Text strong>{user?.address || 'Not provided'}</Text>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    <Card className="saas-card" title="Security & Authentication">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ padding: 12, background: '#f1f5f9', borderRadius: '50%' }}>
                                    <SafetyOutlined style={{ fontSize: 20, color: '#64748b' }} />
                                </div>
                                <div>
                                    <Text strong style={{ display: 'block' }}>Password</Text>
                                    <Text type="secondary">Last changed 3 months ago</Text>
                                </div>
                            </div>
                            <Button>Change Password</Button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ padding: 12, background: '#f0fdf4', borderRadius: '50%' }}>
                                    <SafetyCertificateOutlined style={{ fontSize: 20, color: '#16a34a' }} />
                                </div>
                                <div>
                                    <Text strong style={{ display: 'block' }}>Two-Factor Authentication</Text>
                                    <Text type="secondary">Add an extra layer of security</Text>
                                </div>
                            </div>
                            <Button type="primary" ghost>Enable 2FA</Button>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ProfilePage;
