import React, { useState, useEffect, useReducer, useMemo } from 'react';
import { Card, Row, Col, Button, Modal, Form, Input, Select, Popconfirm, Tag, Space, message, Descriptions, Typography, Divider, Empty, Skeleton, Upload, theme } from 'antd';
import { CarOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { driverService } from '../services/driverService';
import { vehicleStore } from '../store/vehicleStore';
import VehicleImageGrid from '../components/VehicleImageGrid';

const { Title, Text } = Typography;
const { Search } = Input;

// Khởi tạo component Quản lý Phương tiện (VehiclePage)
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

    // Kích hoạt việc gọi API lấy danh sách xe khi component được tạo ra
    useEffect(() => {
        fetchData();
    }, []);

    // Hàm gọi song song các API lấy danh sách xe cá nhân và danh mục loại xe từ backend
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

    // Mở popup (modal) để người dùng thêm xe mới, reset lại toàn bộ trường dữ liệu
    const handleAdd = () => {
        setEditingVehicle(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    // Mở popup (modal) chỉnh sửa xe và điền tự động thông tin của xe được chọn vào form
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
            images: {
                idcardfront: record.idCardFront,
                idcardback: record.idCardBack,
                ownerportrait: record.ownerPortrait,
                vehicle: record.vehicleImage,
                registrationfront: record.registrationPhotoFront,
                registrationback: record.registrationPhotoBack
            }
        });
        setIsModalVisible(true);
    };

    // Mở popup xem chi tiết thông tin và giấy tờ của xe (Chế độ chỉ xem - Readonly)
    const handleView = (record) => {
        setViewingVehicle(record);
        setIsViewModalVisible(true);
    };

    // Gọi API xoá một chiếc xe khỏi danh sách của tài xế
    const handleDelete = async (id) => {
        try {
            await driverService.removeVehicle(id);
            message.success('Vehicle deleted successfully');
            fetchData();
        } catch (error) {
            message.error('Failed to delete vehicle');
        }
    };

    // Xử lý logic khi bấm "Lưu" (Đăng ký xe mới hoặc Cập nhật thông tin xe), đồng thời upload từng ảnh chứng từ lên server
    const handleModalOk = async () => {
        try {
            const { images, ...values } = await form.validateFields();
            const payload = { ...values, vehicleColor: values.color };
            let vehicleId;
            
            if (editingVehicle) {
                vehicleId = editingVehicle.vehicleId || editingVehicle.id;
                await driverService.updateVehicle(vehicleId, payload);
                message.success('Vehicle updated successfully');
            } else {
                const res = await driverService.registerVehicle(payload);
                vehicleId = res.data?.vehicleId || res.data?.id || res.vehicleId || res.id || res.data?.content?.vehicleId;
                message.success('Vehicle registered successfully');
            }

            // Upload new images sequentially to avoid backend DB concurrent overwrite issues
            if (images && vehicleId) {
                let uploadedCount = 0;
                for (const [key, file] of Object.entries(images)) {
                    if (file instanceof File || file instanceof Blob) {
                        try {
                            await driverService.uploadVehicleImage(vehicleId, file, key);
                            uploadedCount++;
                        } catch (e) {
                            console.error(`Failed to upload ${key}`, e);
                            message.error(`Failed to upload ${key}`);
                        }
                    }
                }
                if (uploadedCount > 0) {
                    message.success('Images uploaded/updated successfully');
                }
            }

            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            if (error.errorFields) return;
            console.error(error);
            message.error('Operation failed');
        }
    };

    const safeVehicles = Array.isArray(vehicleStore.vehicles) ? vehicleStore.vehicles : [];
    const safeVehicleTypes = Array.isArray(vehicleStore.vehicleTypes) ? vehicleStore.vehicleTypes : [];

    // Lọc danh sách xe trên máy khách (client-side filter) theo từ khoá tìm kiếm và loại xe
    const filteredVehicles = useMemo(() => {
        return safeVehicles.filter(v => {
            const matchSearch = (v.licensePlate || '').toLowerCase().includes(searchText.toLowerCase()) || 
                                (v.brand || '').toLowerCase().includes(searchText.toLowerCase());
            const vTypeId = v.vehicleType?.vehicleTypeId || v.vehicleTypeId || v.vehicleType?.id;
            const matchType = typeFilter === 'all' || vTypeId === typeFilter;
            return matchSearch && matchType;
        });
    }, [safeVehicles, searchText, typeFilter]);

    // Tính toán thống kê nhanh số lượng xe (Tổng số, Ô tô, Xe máy)
    const totalVehicles = safeVehicles.length;
    const cars = safeVehicles.filter(v => (v.vehicleType?.typeName || v.vehicleType?.name || v.vehicleTypeName || '').toLowerCase().includes('car')).length;
    const motorbikes = safeVehicles.filter(v => (v.vehicleType?.typeName || v.vehicleType?.name || v.vehicleTypeName || '').toLowerCase().includes('motor')).length;

    if (vehicleStore.loading) {
        return <Skeleton active paragraph={{ rows: 10 }} />;
    }

    // Render cấu trúc giao diện chính của trang Quản lý Phương tiện
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
                                <Select.Option key={t.vehicleTypeId || t.id} value={t.vehicleTypeId || t.id}>{t.typeName || t.name}</Select.Option>
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
                            const isCar = (vehicle.vehicleType?.typeName || vehicle.vehicleType?.name || vehicle.vehicleTypeName || '').toLowerCase().includes('car');
                            return (
                                <Col xs={24} sm={12} md={8} lg={6} key={vehicle.vehicleId || vehicle.id}>
                                    <Card 
                                        hoverable 
                                        style={{ borderRadius: '12px', overflow: 'hidden' }}
                                        styles={{ body: { padding: 0 } }}
                                        onClick={() => handleView(vehicle)}
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
                                                    <Text type="secondary">{vehicle.brand || 'Unknown Brand'}{vehicle.color ? ` • ${vehicle.color}` : ''}</Text>
                                                </div>
                                                <Tag color={
                                                    vehicle.status === 'APPROVED' ? 'green' : 
                                                    vehicle.status === 'PENDING' ? 'orange' : 
                                                    vehicle.status === 'REJECTED' ? 'red' : 'default'
                                                } style={{ borderRadius: '10px', border: '1px solid', padding: '2px 10px' }}>
                                                   <Text strong style={{ color: '#000' }}>{vehicle.status === 'PENDING' ? 'Pending' :
                            vehicle.status === 'APPROVED' ? 'Approved' :
                            vehicle.status === 'REJECTED' ? 'Rejected' : vehicle.status || 'UNKNOWN'}</Text>
                                                </Tag>
                                            </div>
                                            
                                            <Divider style={{ margin: '12px 0' }} />
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Tag color="blue">{vehicle.vehicleType?.typeName || vehicle.vehicleType?.name || vehicle.vehicleTypeName || 'N/A'}</Tag>
                                                <Space size="small">
                                                    <Popconfirm title="Delete this vehicle?" onConfirm={(e) => { e.stopPropagation(); handleDelete(vehicle.vehicleId || vehicle.id); }} onCancel={(e) => e.stopPropagation()}>
                                                        <Button type="text" danger shape="circle" icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
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
                okText="Register vehicle"
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
                                    {safeVehicleTypes.map(t => <Select.Option key={t.vehicleTypeId || t.id} value={t.vehicleTypeId || t.id}>{t.typeName || t.name}</Select.Option>)}
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
                    
                    <div style={{ marginTop: 16 }}>
                        <Title level={5} style={{ marginBottom: 16 }}>Required Documents</Title>
                        <Form.Item 
                            name="images" 
                            rules={[{
                                validator: async (_, value) => {
                                    const requiredKeys = ['idcardfront', 'idcardback', 'ownerportrait', 'vehicle', 'registrationfront', 'registrationback'];
                                    const missing = requiredKeys.filter(k => !value || !value[k]);
                                    if (missing.length > 0) {
                                        throw new Error('Please upload all 6 required images');
                                    }
                                }
                            }]}
                        >
                            <VehicleImageGrid mode="edit" />
                        </Form.Item>
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
                            <Descriptions.Item label="Vehicle Type">{viewingVehicle.vehicleType?.typeName || viewingVehicle.vehicleType?.name || viewingVehicle.vehicleTypeName || 'N/A'}</Descriptions.Item>
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
                                                   <Text strong>{viewingVehicle.status === 'PENDING' ? 'Pending' :
                                        viewingVehicle.status === 'APPROVED' ? 'Approved' :
                                        viewingVehicle.status === 'REJECTED' ? 'Rejected' : viewingVehicle.status || 'UNKNOWN'}</Text>
                                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>
                        <Divider />
                        <Title level={5} style={{ marginBottom: 16 }}>Attached Documents</Title>
                        <VehicleImageGrid 
                            mode="view" 
                            value={{
                                idcardfront: viewingVehicle.idCardFront,
                                idcardback: viewingVehicle.idCardBack,
                                ownerportrait: viewingVehicle.ownerPortrait,
                                vehicle: viewingVehicle.vehicleImage,
                                registrationfront: viewingVehicle.registrationPhotoFront,
                                registrationback: viewingVehicle.registrationPhotoBack
                            }} 
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default VehiclePage;
