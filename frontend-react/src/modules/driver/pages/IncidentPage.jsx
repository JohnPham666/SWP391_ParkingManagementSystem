import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Table, Tag, Modal, Form, Input, Upload, message, Empty } from 'antd';
import { AlertOutlined, UploadOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const IncidentPage = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const incidents = []; // Empty state for now

    const columns = [
        {
            title: 'Incident ID',
            dataIndex: 'id',
            key: 'id',
            render: (text) => <Text strong>#{text}</Text>
        },
        {
            title: 'Date Reported',
            dataIndex: 'date',
            key: 'date'
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = status === 'RESOLVED' ? 'green' : (status === 'IN PROGRESS' ? 'blue' : 'orange');
                return <Tag color={color}>{status}</Tag>
            }
        },
        {
            title: 'Resolution',
            dataIndex: 'resolution',
            key: 'resolution'
        }
    ];

    const handleSubmit = () => {
        message.success('Incident reported successfully. Our team will review it shortly.');
        setIsModalVisible(false);
        form.resetFields();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Incident Reports</Title>
                    <Text type="secondary">Report damages, lost items, or any issues during your parking session.</Text>
                </div>
                <Button type="primary" danger icon={<AlertOutlined />} onClick={() => setIsModalVisible(true)} size="large" style={{ borderRadius: 8 }}>
                    Report New Incident
                </Button>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card className="saas-card" style={{ background: '#f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ padding: 16, background: '#e2e8f0', borderRadius: '50%', color: '#64748b' }}>
                                <AlertOutlined style={{ fontSize: 24 }} />
                            </div>
                            <div>
                                <Text type="secondary">Total Reports</Text>
                                <Title level={2} style={{ margin: 0 }}>0</Title>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="saas-card" style={{ background: '#eff6ff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ padding: 16, background: '#dbeafe', borderRadius: '50%', color: '#3b82f6' }}>
                                <SyncOutlined style={{ fontSize: 24 }} />
                            </div>
                            <div>
                                <Text type="secondary">In Progress</Text>
                                <Title level={2} style={{ margin: 0, color: '#1d4ed8' }}>0</Title>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="saas-card" style={{ background: '#f0fdf4' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ padding: 16, background: '#dcfce7', borderRadius: '50%', color: '#16a34a' }}>
                                <CheckCircleOutlined style={{ fontSize: 24 }} />
                            </div>
                            <div>
                                <Text type="secondary">Resolved</Text>
                                <Title level={2} style={{ margin: 0, color: '#15803d' }}>0</Title>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card className="saas-card" title={<Title level={4} style={{ margin: 0 }}>Your Reports</Title>} bodyStyle={{ padding: 0 }}>
                {incidents.length === 0 ? (
                    <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">You haven't reported any incidents.</Text>}
                        style={{ padding: '60px 0' }}
                    />
                ) : (
                    <Table columns={columns} dataSource={incidents} pagination={{ pageSize: 10 }} />
                )}
            </Card>

            <Modal
                title={<Title level={4} style={{ margin: 0, color: '#dc2626' }}><AlertOutlined /> Report an Incident</Title>}
                open={isModalVisible}
                onOk={handleSubmit}
                onCancel={() => setIsModalVisible(false)}
                okText="Submit Report"
                okButtonProps={{ danger: true }}
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                    <Form.Item name="title" label="Incident Title" rules={[{ required: true }]}>
                        <Input placeholder="e.g., Scratch on left door" size="large" />
                    </Form.Item>
                    <Form.Item name="description" label="Detailed Description" rules={[{ required: true }]}>
                        <TextArea rows={4} placeholder="Please describe exactly what happened and when..." />
                    </Form.Item>
                    <Form.Item name="reservationId" label="Related Reservation (Optional)">
                        <Input placeholder="Enter Reservation ID" size="large" />
                    </Form.Item>
                    <Form.Item label="Photo Evidence (Optional)">
                        <Upload listType="picture" maxCount={3}>
                            <Button icon={<UploadOutlined />}>Click to upload</Button>
                        </Upload>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>You can upload up to 3 images.</Text>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default IncidentPage;
