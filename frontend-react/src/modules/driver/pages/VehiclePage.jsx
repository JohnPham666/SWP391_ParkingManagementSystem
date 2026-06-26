import React, { useState, useEffect, useReducer, useMemo } from 'react';
import { Card, Row, Col, Button, Modal, Form, Input, Select, Popconfirm, Tag, Space, message, Descriptions, Typography, Divider, Empty, Skeleton, Upload, theme } from 'antd';
import { CarOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { driverService } from '../services/driverService';
import { vehicleStore } from '../store/vehicleStore';

const { Title, Text } = Typography;
const { Search } = Input;

const VehiclePage = () => {
    const { token } = theme.useToken();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [viewingVehicle, setViewingVehicle] = useState(null);
    const [, forceRender] = useReducer(x => x + 1, 0);
    const [form] = Form.useForm();
    
    // Local filters
    const [searchText, setSearchText] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        vehicleStore.loading = true;
        forceRender();
        try {
            const [vehiclesRes, typesRes] = await Promise.all([
                driverService.loadMyVehicles(),
                driverService.loadVehicleTypes()
            ]);
            
            const vRes = vehiclesRes?.data || vehiclesRes;
            vehicleStore.vehicles = Array.isArray(vRes) ? vRes : [];

            const tRes = typesRes?.data || typesRes;
            vehicleStore.vehicleTypes = Array.isArray(tRes) ? tRes : [];
        } catch (error) {
            message.error('Failed to load data');
            vehicleStore.vehicles = [];
            vehicleStore.vehicleTypes = [];
        } finally {
            vehicleStore.loading = false;
            forceRender();
        }
    };

    const handleAdd = () => {
        setEditingVehicle(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingVehicle(record);
        form.setFieldsValue({
            licensePlate: record.licensePlate,
            vehicleTypeId: record.vehicleType?.vehicleTypeId || record.vehicleTypeId,
            ownerName: record.ownerName,
            ownerPhone: record.ownerPhone,
            brand: record.brand,
            color: record.color || record.vehicleColor,
            engineNumber: record.engineNumber,
            chassisNumber: record.chassisNumber,
            manufactureYear: record.manufactureYear,
        });
        setIsModalVisible(true);
    };

    const handleView = (record) => {
        setViewingVehicle(record);
        setIsViewModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await driverService.removeVehicle(id);
            message.success('Vehicle deleted successfully');
            fetchData();
        } catch (error) {
            message.error('Failed to delete vehicle');
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const payload = { ...values, vehicleColor: values.color };
            if (editingVehicle) {
                await driverService.updateVehicle(editingVehicle.vehicleId || editingVehicle.id, payload);
                message.success('Vehicle updated successfully');
            } else {
                await driverService.registerVehicle(payload);
                message.success('Vehicle registered successfully');
            }
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            if (error.errorFields) return;
            message.error('Operation failed');
        }
    };

    const safeVehicles = Array.isArray(vehicleStore.vehicles) ? vehicleStore.vehicles : [];
    const safeVehicleTypes = Array.isArray(vehicleStore.vehicleTypes) ? vehicleStore.vehicleTypes : [];

    // Filter logic
    const filteredVehicles = useMemo(() => {
        return safeVehicles.filter(v => {
            const matchSearch = (v.licensePlate || '').toLowerCase().includes(searchText.toLowerCase()) || 
                                (v.brand || '').toLowerCase().includes(searchText.toLowerCase());
            const vTypeId = v.vehicleType?.vehicleTypeId || v.vehicleTypeId || v.vehicleType?.id;
            const matchType = typeFilter === 'all' || vTypeId === typeFilter;
            return matchSearch && matchType;
        });
    }, [safeVehicles, searchText, typeFilter]);

    // Stats
    const totalVehicles = safeVehicles.length;
    const cars = safeVehicles.filter(v => (v.vehicleType?.name || v.vehicleTypeName || '').toLowerCase().includes('car')).length;
    const motorbikes = safeVehicles.filter(v => (v.vehicleType?.name || v.vehicleTypeName || '').toLowerCase().includes('motor')).length;

    if (vehicleStore.loading) {
        return <Skeleton active paragraph={{ rows: 10 }} />;
    }

    return (
        <div>
            {/* Statistics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card className="saas-card" style={{ background: token.colorFillSecondary, color: token.colorText }}>
                        <Text style={{ color: token.colorTextSecondary }}>Total Vehicles</Text>
                        <Title level={2} style={{ color: token.colorText, margin: 0 }}>{totalVehicles}</Title>
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card className="saas-card" style={{ background: token.colorSuccessBg, borderColor: token.colorBorder }}>
                        <Text type="secondary">Cars</Text>
                        <Title level={2} style={{ color: token.colorSuccess, margin: 0 }}>{cars}</Title>
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card className="saas-card" style={{ background: token.colorInfoBg, borderColor: token.colorBorder }}>
                        <Text type="secondary">Motorbikes</Text>
                        <Title level={2} style={{ color: token.colorInfo, margin: 0 }}>{motorbikes}</Title>
                    </Card>
                </Col>
            </Row>

            <Card className="saas-card">
                {/* Header Actions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', flex: 1 }}>
                        <Search 
                            placeholder="Search license plate or brand" 
                            allowClear 
                            prefix={<SearchOutlined />}
                            style={{ width: 250 }} 
                            onChange={(e) => setSearchText(e.target.value)} 
                        />
                        <Select 
                            value={typeFilter} 
                            onChange={setTypeFilter} 
                            style={{ width: 180 }}
                            suffixIcon={<FilterOutlined />}
                        >
                            <Select.Option value="all">All Types</Select.Option>
                            {safeVehicleTypes.map(t => (
                                <Select.Option key={t.vehicleTypeId || t.id} value={t.vehicleTypeId || t.id}>{t.name}</Select.Option>
                            ))}
                        </Select>
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large" style={{ borderRadius: '8px' }}>
                        Register Vehicle
                    </Button>
                </div>

                {/* Cards View */}
                {filteredVehicles.length === 0 ? (
                    <Empty description="No vehicles found" style={{ margin: '40px 0' }} />
                ) : (
                    <Row gutter={[24, 24]}>
                        {filteredVehicles.map(vehicle => {
                            const isCar = (vehicle.vehicleType?.name || vehicle.vehicleTypeName || '').toLowerCase().includes('car');
                            return (
                                <Col xs={24} sm={12} md={8} lg={6} key={vehicle.vehicleId || vehicle.id}>
                                    <Card 
                                        hoverable 
                                        style={{ borderRadius: '12px', overflow: 'hidden' }}
                                        styles={{ body: { padding: 0 } }}
                                    >
                                        <div style={{ 
                                            height: 120, 
                                            background: isCar ? '#e0f2fe' : '#fce7f3',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <CarOutlined style={{ fontSize: 64, color: isCar ? '#0284c7' : '#db2777', opacity: 0.8 }} />
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <div>
                                                    <Title level={4} style={{ margin: 0, fontWeight: 800, letterSpacing: '1px' }}>{vehicle.licensePlate}</Title>
                                                    <Text type="secondary">{vehicle.brand || 'Unknown Brand'} • {vehicle.color || 'No Color'}</Text>
                                                </div>
                                                <Tag color={
                                                    vehicle.status === 'APPROVED' ? 'green' : 
                                                    vehicle.status === 'PENDING' ? 'orange' : 
                                                    vehicle.status === 'REJECTED' ? 'red' : 'default'
                                                } style={{ borderRadius: '10px' }}>
                                                    {vehicle.status === 'PENDING' ? 'Đang chờ xét duyệt' :
                                                     vehicle.status === 'APPROVED' ? 'Đã duyệt' :
                                                     vehicle.status === 'REJECTED' ? 'Bị từ chối' : vehicle.status || 'UNKNOWN'}
                                                </Tag>
                                            </div>
                                            
                                            <Divider style={{ margin: '12px 0' }} />
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Tag color="blue">{vehicle.vehicleType?.name || vehicle.vehicleTypeName || 'N/A'}</Tag>
                                                <Space size="small">
                                                    <Button type="text" shape="circle" icon={<EyeOutlined />} onClick={() => handleView(vehicle)} />
                                                    <Button type="text" shape="circle" icon={<EditOutlined />} onClick={() => handleEdit(vehicle)} />
                                                    <Popconfirm title="Delete this vehicle?" onConfirm={() => handleDelete(vehicle.vehicleId || vehicle.id)}>
                                                        <Button type="text" danger shape="circle" icon={<DeleteOutlined />} />
                                                    </Popconfirm>
                                                </Space>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </Card>

            {/* Modals remain mostly the same structurally but improved visually by the layout */}
            <Modal
                title={<Title level={4} style={{ margin: 0 }}>{editingVehicle ? "Edit Vehicle" : "Register New Vehicle"}</Title>}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                okText="Save Vehicle"
                cancelText="Cancel"
                destroyOnHidden
            >
                <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="licensePlate" label="License Plate" rules={[{ required: true }]}>
                                <Input size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="vehicleTypeId" label="Vehicle Type" rules={[{ required: true }]}>
                                <Select size="large">
                                    {safeVehicleTypes.map(t => <Select.Option key={t.vehicleTypeId || t.id} value={t.vehicleTypeId || t.id}>{t.name}</Select.Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="ownerName" label="Owner Name" rules={[{ required: true }]}>
                                <Input size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="ownerPhone" label="Owner Phone" rules={[{ required: true }]}>
                                <Input size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="brand" label="Brand"><Input size="large" /></Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="color" label="Color"><Input size="large" /></Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="engineNumber" label="Engine Number"><Input size="large" /></Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="chassisNumber" label="Chassis Number"><Input size="large" /></Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="manufactureYear" label="Manufacture Year"><Input type="number" size="large" /></Form.Item>
                        </Col>
                    </Row>
                    
                    <div style={{ marginTop: 16, background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8, color: '#334155' }}>Attached Images (Max 20 images)</Text>
                        <ul style={{ color: '#64748b', fontSize: 14, marginBottom: 16, listStyleType: 'none', paddingLeft: 0 }}>
                            <li style={{ marginBottom: 4 }}>- Portrait photo of the registrant</li>
                            <li style={{ marginBottom: 4 }}>- Front side of ID Card / Citizen ID / Passport / Birth Certificate (CMND/CCCD/Hộ chiếu/Giấy khai sinh)</li>
                            <li style={{ marginBottom: 4 }}>- Back side of ID Card / Citizen ID (CMND/CCCD)</li>
                            <li style={{ marginBottom: 4 }}>- Photo of vehicle registration certificate (Giấy đăng ký xe) for car/motorbike</li>
                            <li style={{ marginBottom: 4 }}>- Photo of the resident with bicycle/e-bike (if registering a bicycle/e-bike)</li>
                            <li style={{ marginBottom: 4 }}>- For cars: Proof of residence (Xác nhận cư trú) submitted within 30 days of registration (except for owner, spouse, children, siblings, parents, and shop houses)</li>
                            <li style={{ marginBottom: 4 }}>- For motorbikes/bicycles: Exceeding limit registration requires proof of residence (Xác nhận cư trú)</li>
                        </ul>
                        <Upload
                            listType="picture-card"
                            multiple
                            maxCount={20}
                            customRequest={({ file, onSuccess }) => setTimeout(() => onSuccess("ok"), 500)}
                        >
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                        </Upload>
                    </div>
                </Form>
            </Modal>

            <Modal
                title={<Title level={4} style={{ margin: 0 }}>Vehicle Details</Title>}
                open={isViewModalVisible}
                onCancel={() => setIsViewModalVisible(false)}
                footer={<Button onClick={() => setIsViewModalVisible(false)}>Close</Button>}
            >
                {viewingVehicle && (
                    <div style={{ marginTop: 24 }}>
                        <Descriptions column={1} bordered size="middle" styles={{ label: { width: '120px', background: token.colorFillAlter, fontWeight: 600 } }}>
                            <Descriptions.Item label="License Plate"><Text strong style={{ fontSize: 16 }}>{viewingVehicle.licensePlate}</Text></Descriptions.Item>
                            <Descriptions.Item label="Vehicle Type">{viewingVehicle.vehicleType?.name || viewingVehicle.vehicleTypeName || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Owner Name">{viewingVehicle.ownerName}</Descriptions.Item>
                            <Descriptions.Item label="Owner Phone">{viewingVehicle.ownerPhone}</Descriptions.Item>
                            <Descriptions.Item label="Brand">{viewingVehicle.brand}</Descriptions.Item>
                            <Descriptions.Item label="Color">{viewingVehicle.color || viewingVehicle.vehicleColor}</Descriptions.Item>
                            <Descriptions.Item label="Engine No.">{viewingVehicle.engineNumber || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Chassis No.">{viewingVehicle.chassisNumber || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Mfg Year">{viewingVehicle.manufactureYear || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Status">
                                                <Tag color={
                                                    viewingVehicle.status === 'APPROVED' ? 'green' : 
                                                    viewingVehicle.status === 'PENDING' ? 'orange' : 
                                                    viewingVehicle.status === 'REJECTED' ? 'red' : 'default'
                                                }>
                                                    {viewingVehicle.status === 'PENDING' ? 'Đang chờ xét duyệt' :
                                                     viewingVehicle.status === 'APPROVED' ? 'Đã duyệt' :
                                                     viewingVehicle.status === 'REJECTED' ? 'Bị từ chối' : viewingVehicle.status || 'UNKNOWN'}
                                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default VehiclePage;
