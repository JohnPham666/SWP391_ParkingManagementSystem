import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Avatar, Button, Divider, Tag, Modal, Form, Input, DatePicker, message, Upload, theme } from 'antd';
import { UserOutlined, EditOutlined, SafetyCertificateOutlined, PhoneOutlined, MailOutlined, HomeOutlined, SafetyOutlined, CameraOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { driverService } from '../services/driverService';

const { Title, Text } = Typography;

const ProfilePage = () => {
    const { token } = theme.useToken();
    const [user, setUser] = useState(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const authStr = localStorage.getItem('parking_auth');
        if (authStr) {
            try {
                const parsedUser = JSON.parse(authStr);
                setUser(parsedUser);
            } catch (e) {}
        }
    }, []);

    const handleEditClick = () => {
        form.setFieldsValue({
            fullName: user?.fullName,
            email: user?.email,
            phoneNumber: user?.phoneNumber,
            address: user?.address,
            dob: user?.dob ? dayjs(user.dob) : null,
        });
        setIsEditModalVisible(true);
    };

    const handleSaveProfile = async () => {
        try {
            const values = await form.validateFields();
            // Call API to update profile
            await driverService.updateProfile({
                fullName: values.fullName,
                phoneNumber: values.phoneNumber,
                address: values.address,
                // The backend does not seem to support dob, but we can pass it anyway or store locally
            });

            const updatedUser = {
                ...user,
                fullName: values.fullName,
                phoneNumber: values.phoneNumber,
                address: values.address,
                dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
            };
            setUser(updatedUser);
            localStorage.setItem('parking_auth', JSON.stringify(updatedUser));
            message.success('Cập nhật thông tin thành công!');
            setIsEditModalVisible(false);
        } catch (error) {
            console.error(error);
            if (!error.errorFields) {
                message.error('Cập nhật thông tin thất bại!');
            }
        }
    };

    const handleAvatarChange = (info) => {
        // Prevent default upload behavior since we don't have a backend endpoint for user avatar
    };

    const customUpload = async ({ file, onSuccess, onError }) => {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Avatar = e.target.result;
                const updatedUser = { ...user, avatar: base64Avatar };
                setUser(updatedUser);
                localStorage.setItem('parking_auth', JSON.stringify(updatedUser));
                onSuccess("ok");
                message.success(`${file.name} uploaded successfully!`);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            onError(error);
            message.error(`Failed to upload ${file.name}.`);
        }
    };

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>My Profile</Title>
                    <Text type="secondary">Manage your personal information and security settings</Text>
                </div>
                <Button type="primary" icon={<EditOutlined />} onClick={handleEditClick} style={{ borderRadius: 8 }}>Edit Profile</Button>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card className="saas-card" style={{ textAlign: 'center' }}>
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                            <Avatar size={120} src={user?.avatar} icon={!user?.avatar && <UserOutlined />} style={{ backgroundColor: '#ea580c' }} />
                            <Upload showUploadList={false} onChange={handleAvatarChange} customRequest={customUpload}>
                                <Button 
                                    shape="circle" 
                                    icon={<EditOutlined />} 
                                    size="small"
                                    style={{ 
                                        position: 'absolute', 
                                        bottom: 4, 
                                        right: 4, 
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        border: 'none',
                                        backgroundColor: '#fff',
                                        color: '#ea580c'
                                    }} 
                                />
                            </Upload>
                        </div>
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
                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <CalendarOutlined style={{ fontSize: 20, color: '#94a3b8', marginTop: 4 }} />
                                    <div>
                                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Date of Birth</Text>
                                        <Text strong>{user?.dob ? dayjs(user.dob).format('DD/MM/YYYY') : 'Not provided'}</Text>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    <Card className="saas-card" title="Security & Authentication">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ padding: 12, background: '#f1f5f9', borderRadius: '50%' }}>
                                    <SafetyOutlined style={{ fontSize: 20, color: token.colorTextSecondary }} />
                                </div>
                                <div>
                                    <Text strong style={{ display: 'block' }}>Password</Text>
                                    <Text type="secondary">Last changed 3 months ago</Text>
                                </div>
                            </div>
                            <Button>Change Password</Button>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Modal
                title={<Title level={4} style={{ margin: 0 }}>Chỉnh sửa thông tin</Title>}
                open={isEditModalVisible}
                onOk={handleSaveProfile}
                onCancel={() => setIsEditModalVisible(false)}
                okText="Lưu thay đổi"
                cancelText="Hủy"
                destroyOnHidden
            >
                <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                    <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                        <Input size="large" />
                    </Form.Item>
                    
                    <Form.Item name="email" label="Email (Không được sửa)">
                        <Input size="large" disabled />
                    </Form.Item>
                    
                    <Form.Item name="phoneNumber" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
                        <Input size="large" />
                    </Form.Item>
                    
                    <Form.Item name="dob" label="Ngày sinh">
                        <DatePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="dd/mm/yyyy" />
                    </Form.Item>
                    
                    <Form.Item name="address" label="Địa chỉ">
                        <Input.TextArea rows={3} size="large" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProfilePage;
