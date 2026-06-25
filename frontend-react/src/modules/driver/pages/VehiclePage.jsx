import React, { useState, useEffect, useReducer } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Popconfirm, Tag, Space, message, Descriptions } from 'antd';
import { driverService } from '../services/driverService';
import { vehicleStore } from '../store/vehicleStore';

const VehiclePage = () => {
    // UI states
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [viewingVehicle, setViewingVehicle] = useState(null);
    const [, forceRender] = useReducer(x => x + 1, 0);
    const [form] = Form.useForm();

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
            
            vehicleStore.vehicles = vehiclesRes?.data || vehiclesRes || [];
            vehicleStore.vehicleTypes = typesRes?.data || typesRes || [];
        } catch (error) {
            message.error('Failed to load data');
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
            color: record.color,
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
            if (editingVehicle) {
                await driverService.updateVehicle(editingVehicle.vehicleId || editingVehicle.id, values);
                message.success('Vehicle updated successfully');
            } else {
                await driverService.registerVehicle(values);
                message.success('Vehicle registered successfully');
            }
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            if (error.errorFields) {
                return;
            }
            message.error('Operation failed');
        }
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
    };

    const columns = [
        {
            title: 'License Plate',
            dataIndex: 'licensePlate',
            key: 'licensePlate',
        },
        {
            title: 'Vehicle Type',
            key: 'vehicleType',
            render: (_, record) => record.vehicleType?.name || record.vehicleTypeName || 'N/A',
        },
        {
            title: 'Owner Name',
            dataIndex: 'ownerName',
            key: 'ownerName',
        },
        {
            title: 'Owner Phone',
            dataIndex: 'ownerPhone',
            key: 'ownerPhone',
        },
        {
            title: 'Brand',
            dataIndex: 'brand',
            key: 'brand',
        },
        {
            title: 'Color',
            dataIndex: 'color',
            key: 'color',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = status === 'ACTIVE' ? 'green' : (status === 'INACTIVE' ? 'volcano' : 'default');
                if (!status) return <Tag>UNKNOWN</Tag>;
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" onClick={() => handleView(record)} style={{ padding: 0 }}>View</Button>
                    <Button type="link" onClick={() => handleEdit(record)} style={{ padding: 0 }}>Edit</Button>
                    <Popconfirm
                        title="Are you sure you want to delete this vehicle?"
                        onConfirm={() => handleDelete(record.vehicleId || record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger style={{ padding: 0 }}>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card title="My Vehicles" extra={<Button type="primary" onClick={handleAdd}>Register Vehicle</Button>}>
            <Table 
                columns={columns} 
                dataSource={vehicleStore.vehicles} 
                rowKey={(record) => record.vehicleId || record.id || record.licensePlate} 
                loading={vehicleStore.loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingVehicle ? "Edit Vehicle" : "Register Vehicle"}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                okText="Submit"
                cancelText="Cancel"
            >
                <Form form={form} layout="vertical">
                    <Form.Item 
                        name="licensePlate" 
                        label="License Plate" 
                        rules={[{ required: true, message: 'Please enter license plate' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item 
                        name="vehicleTypeId" 
                        label="Vehicle Type" 
                        rules={[{ required: true, message: 'Please select a vehicle type' }]}
                    >
                        <Select placeholder="Select a type">
                            {vehicleStore.vehicleTypes.map(type => (
                                <Select.Option key={type.vehicleTypeId || type.id} value={type.vehicleTypeId || type.id}>
                                    {type.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item 
                        name="ownerName" 
                        label="Owner Name" 
                        rules={[{ required: true, message: 'Please enter owner name' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item 
                        name="ownerPhone" 
                        label="Owner Phone" 
                        rules={[{ required: true, message: 'Please enter owner phone' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item 
                        name="brand" 
                        label="Brand" 
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item 
                        name="color" 
                        label="Color" 
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="View Vehicle"
                open={isViewModalVisible}
                onCancel={() => setIsViewModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsViewModalVisible(false)}>
                        Close
                    </Button>
                ]}
            >
                {viewingVehicle && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="License Plate">{viewingVehicle.licensePlate}</Descriptions.Item>
                        <Descriptions.Item label="Vehicle Type">{viewingVehicle.vehicleType?.name || viewingVehicle.vehicleTypeName || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Owner Name">{viewingVehicle.ownerName}</Descriptions.Item>
                        <Descriptions.Item label="Owner Phone">{viewingVehicle.ownerPhone}</Descriptions.Item>
                        <Descriptions.Item label="Brand">{viewingVehicle.brand}</Descriptions.Item>
                        <Descriptions.Item label="Color">{viewingVehicle.color}</Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color={viewingVehicle.status === 'ACTIVE' ? 'green' : 'default'}>{viewingVehicle.status}</Tag>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </Card>
    );
};

export default VehiclePage;
