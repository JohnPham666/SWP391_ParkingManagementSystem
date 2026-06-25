import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Modal, Form, message, Space, Card, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CarOutlined } from '@ant-design/icons';
import { vehicleApi } from '../../services/api';

const { Option } = Select;

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ search: '' });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await vehicleApi.getVehicles();
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        setVehicles(data);
      } else {
        setVehicles([]);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      message.error('Failed to load vehicles list');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditVehicle = (record) => {
    setEditingVehicle(record);
    form.setFieldsValue({
      licensePlate: record.licensePlate,
      ownerName: record.ownerName,
      ownerPhone: record.ownerPhone,
      brand: record.brand,
      vehicleColor: record.vehicleColor,
    });
    setIsModalVisible(true);
  };

  const handleDeleteVehicle = async (id) => {
    try {
      await vehicleApi.deleteVehicle(id);
      message.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      message.error('Deletion failed');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingVehicle) {
        await vehicleApi.updateVehicle(editingVehicle.vehicleId, values);
        message.success('Vehicle updated successfully');
      } else {
        await vehicleApi.createVehicle(values);
        message.success('Vehicle added successfully');
      }
      setIsModalVisible(false);
      fetchVehicles();
    } catch (error) {
      message.error(error.response?.data?.message || 'An error occurred while saving');
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const searchStr = filters.search.toLowerCase();
    return !filters.search || 
      v.licensePlate?.toLowerCase().includes(searchStr) || 
      v.ownerName?.toLowerCase().includes(searchStr) ||
      v.ownerPhone?.includes(searchStr);
  });

  const columns = [
    {
      title: 'License Plate',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Owner Name',
      dataIndex: 'ownerName',
      key: 'ownerName',
    },
    {
      title: 'Phone Number',
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
      dataIndex: 'vehicleColor',
      key: 'vehicleColor',
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEditVehicle(record)} style={{ color: '#1890ff' }} />
          <Popconfirm
            title="Are you sure you want to delete this vehicle?"
            onConfirm={() => handleDeleteVehicle(record.vehicleId)}
            okText="Delete"
            cancelText="Cancel"
            okType="danger"
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title="Vehicle Management" 
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddVehicle} style={{ backgroundColor: '#ea580c' }}>
          Add Vehicle
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <Input 
          placeholder="Search plate, owner, phone..." 
          prefix={<SearchOutlined />} 
          onChange={(e) => setFilters({ search: e.target.value })}
          style={{ width: 250 }}
        />
      </Space>

      <Table 
        columns={columns} 
        dataSource={filteredVehicles} 
        rowKey="vehicleId" 
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="licensePlate" label="License Plate" rules={[{ required: true, message: 'Please enter license plate' }]}>
            <Input placeholder="Ex: 51H-123.45" />
          </Form.Item>
          
          <Form.Item name="ownerName" label="Owner Name" rules={[{ required: true, message: 'Please enter owner name' }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="ownerPhone" label="Owner Phone">
            <Input />
          </Form.Item>

          <Form.Item name="brand" label="Brand (e.g., Honda, Toyota)">
            <Input placeholder="Ex: Honda, Toyota..." />
          </Form.Item>

          <Form.Item name="vehicleColor" label="Vehicle Color">
            <Input placeholder="Ex: Black, White..." />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: 8 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#ea580c' }}>
              {editingVehicle ? 'Update' : 'Add'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default VehicleManagement;
