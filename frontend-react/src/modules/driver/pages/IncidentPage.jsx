import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Table, Tag, Modal, Form, Input, Upload, message, Empty , theme, Skeleton, Select } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertOutlined, UploadOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { driverService } from '../services/driverService';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Khởi tạo component quản lý sự cố (IncidentPage)
const IncidentPage = () => {
    const { token } = theme.useToken();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    // Gọi API lấy dữ liệu sự cố ngay khi trang được tải
    useEffect(() => {
        fetchData();
    }, []);

    // Hook này kiểm tra xem có dữ liệu truyền qua state của React Router (navigate) để tự động mở form báo cáo sự cố hay không
    useEffect(() => {
        if (location.state?.autoOpen) {
            form.resetFields();
            form.setFieldsValue({
                title: location.state.incidentType,
                description: location.state.description
            });
            setIsModalVisible(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate]);

    // Hàm gọi API để lấy danh sách sự cố của tài xế hiện tại
    const fetchData = async () => {
        setLoading(true);
        try {
            const authStr = localStorage.getItem('parking_auth');
            let currentUserId = null;
            if (authStr) {
                try {
                    const parsedUser = JSON.parse(authStr);
                    currentUserId = parsedUser.userId || parsedUser.id;
                } catch (e) {}
            }

            const response = await driverService.loadIncidents();
            const rawData = response?.data || response;
            
            if (Array.isArray(rawData)) {
                // Client-side filtering: driver can only see their own incidents
                const myIncidents = rawData.filter(inc => {
                    const reporterId = inc.reportedById || inc.userId;
                    return reporterId === currentUserId;
                });
                
                const formattedData = myIncidents.map(inc => ({
                    id: inc.incidentId || inc.id,
                    date: new Date(inc.createdAt || inc.date).toLocaleDateString(),
                    title: inc.incidentType || inc.title,
                    status: String(inc.status || 'PENDING').toUpperCase(),
                    description: inc.description
                }));
                
                // Sort by newest first
                formattedData.sort((a, b) => new Date(b.date) - new Date(a.date));
                setIncidents(formattedData);
            }
        } catch (error) {
            console.error('Failed to load incidents', error);
            message.error('Failed to load incident history');
        } finally {
            setLoading(false);
        }
    };

    // Danh sách các loại sự cố có thể báo cáo
    const incidentTypes = [
        { value: 'LOST_TICKET', label: 'Lost Ticket' },
        { value: 'WRONG_LICENSE_PLATE', label: 'Wrong License Plate' },
        { value: 'OVERTIME', label: 'Overtime' },
        { value: 'WRONG_ZONE', label: 'Wrong Parking Zone' },
        { value: 'UNPAID', label: 'Payment Issue' },
        { value: 'SLOT_OCCUPIED', label: 'Slot Already Occupied' },
        { value: 'FACILITY_DAMAGE', label: 'Facility or Vehicle Damage' },
        { value: 'OTHER', label: 'Other Issue' }
    ];

    const getIncidentLabel = (value) => {
        const type = incidentTypes.find(t => t.value === value);
        return type ? type.label : value;
    };

    // Cấu hình các cột cho bảng hiển thị danh sách sự cố
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
            title: 'Incident Type',
            dataIndex: 'title',
            key: 'title',
            render: (text) => getIncidentLabel(text)
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = (status === 'RESOLVED' || status === 'CLOSED') ? 'green' : (status === 'IN_PROGRESS' || status === 'IN PROGRESS' ? 'blue' : 'orange');
                let displayStatus = status === 'IN_PROGRESS' ? 'IN PROGRESS' : status;
                return <Tag color={color}>{displayStatus}</Tag>
            }
        }
    ];

    // Hàm xử lý khi người dùng nhấn nút Submit gửi báo cáo sự cố mới
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            
            const { incidentImage, ...restValues } = values;
            const payload = {
                incidentType: restValues.title,
                description: restValues.description,
                sessionId: null,
                status: 'OPEN'
            };
            
            const response = await driverService.createIncident(payload);
            const createdIncident = response?.data || response;

            if (values.incidentImage?.fileList?.length > 0) {
                const file = values.incidentImage.fileList[0].originFileObj;
                await driverService.uploadIncidentImage(createdIncident.incidentId || createdIncident.id, file);
            }

            message.success('Incident reported successfully. Our team will review it shortly.');
            setIsModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (error) {
            if (error.errorFields) return;
            message.error('Failed to report incident. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Tính toán số lượng thống kê để hiển thị trên các thẻ (Cards) đầu trang
    const stats = {
        total: incidents.length,
        active: incidents.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS' || i.status === 'IN PROGRESS').length,
        resolved: incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length
    };

    if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;

    // Render giao diện chính của trang Quản lý sự cố
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
                    <Card className="saas-card" style={{ background: token.colorFillAlter }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ padding: 16, background: token.colorFillAlter, borderRadius: '50%', color: token.colorTextSecondary }}>
                                <AlertOutlined style={{ fontSize: 24 }} />
                            </div>
                            <div>
                                <Text type="secondary">Total Reports</Text>
                                <Title level={2} style={{ margin: 0 }}>{stats.total}</Title>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="saas-card" style={{ background: token.colorInfoBg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ padding: 16, background: '#dbeafe', borderRadius: '50%', color: '#3b82f6' }}>
                                <SyncOutlined style={{ fontSize: 24 }} />
                            </div>
                            <div>
                                <Text type="secondary">Active Reports</Text>
                                <Title level={2} style={{ margin: 0, color: token.colorInfo }}>{stats.active}</Title>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="saas-card" style={{ background: token.colorSuccessBg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ padding: 16, background: token.colorSuccessBg, borderRadius: '50%', color: token.colorSuccess }}>
                                <CheckCircleOutlined style={{ fontSize: 24 }} />
                            </div>
                            <div>
                                <Text type="secondary">Resolved</Text>
                                <Title level={2} style={{ margin: 0, color: token.colorSuccess }}>{stats.resolved}</Title>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card className="saas-card" title={<Title level={4} style={{ margin: 0 }}>Your Reports</Title>} styles={{ body: { padding: 0 } }}>
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
                title={<Title level={4} style={{ margin: 0, color: token.colorError }}><AlertOutlined /> Report an Incident</Title>}
                open={isModalVisible}
                onOk={handleSubmit}
                onCancel={() => setIsModalVisible(false)}
                okText="Submit Report"
                confirmLoading={submitting}
                okButtonProps={{ danger: true }}
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                    <Form.Item name="title" label="Incident Type" rules={[{ required: true, message: 'Please select an incident type' }]}>
                        <Select size="large" placeholder="Select the type of issue">
                            {incidentTypes.map(t => (
                                <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="description" label="Detailed Description" rules={[{ required: true }]}>
                        <TextArea rows={4} placeholder="Please describe exactly what happened and when..." />
                    </Form.Item>
                    <Form.Item name="incidentImage" label="Photo Evidence (Optional)">
                        <Upload beforeUpload={() => false} listType="picture" maxCount={1}>
                            <Button icon={<UploadOutlined />}>Click to upload</Button>
                        </Upload>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>You can upload 1 image.</Text>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default IncidentPage;
