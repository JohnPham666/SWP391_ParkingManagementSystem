import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Modal, Form, message, Space, Card, Popconfirm, Tag, Typography, Row, Col, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CarOutlined } from '@ant-design/icons';
import { vehicleApi } from '../../services/api';

const { Option } = Select;

const ManagerVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ plate: '', owner: '', type: '', status: '' });

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

  const handleApprove = async (id, isApproved) => {
    try {
      await vehicleApi.approveVehicle(id, isApproved);
      message.success(isApproved ? 'Vehicle approved successfully' : 'Vehicle rejected successfully');
      setIsModalVisible(false);
      fetchVehicles();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update vehicle status');
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

  const uniqueVehicleTypes = Array.from(new Set(vehicles.map(v => v.vehicleTypeName || v.vehicleType?.typeName || 'Ô tô')));

  const filteredVehicles = vehicles.filter(v => {
    const plateMatch = !filters.plate || v.licensePlate?.toLowerCase().includes(filters.plate.toLowerCase());
    const ownerMatch = !filters.owner || v.ownerName?.toLowerCase().includes(filters.owner.toLowerCase());
    const typeMatch = !filters.type || (v.vehicleTypeName || v.vehicleType?.typeName || 'Ô tô') === filters.type;
    const statusMatch = !filters.status || v.status === filters.status;
    return plateMatch && ownerMatch && typeMatch && statusMatch;
  });

  const columns = [
    { title: 'ID', dataIndex: 'vehicleId', key: 'vehicleId', render: (text) => <strong>#{text}</strong> },
    { title: 'LICENSE PLATE', dataIndex: 'licensePlate', key: 'licensePlate', render: (text) => <strong>{text}</strong> },
    { title: 'OWNER NAME', dataIndex: 'ownerName', key: 'ownerName' },
    { title: 'VEHICLE TYPE', key: 'vehicleType', render: (_, record) => record.vehicleTypeName || record.vehicleType?.typeName || 'Car' },
    { title: 'BRAND', dataIndex: 'brand', key: 'brand' },
    { title: 'REGISTRATION DATE', key: 'registrationDate', render: (_, record) => {
        const date = record.createdAt || record.registrationDate || record.registrationExpiry || record.createdDate;
        return date ? new Date(date).toLocaleDateString() : '-';
    }},
    { title: 'STATUS', dataIndex: 'status', key: 'status', render: (status) => {
        let color = 'default';
        let text = status;
        if (status === 'PENDING') { color = 'warning'; text = 'Pending'; }
        if (status === 'APPROVED') { color = 'success'; text = 'Approved'; }
        if (status === 'REJECTED') { color = 'error'; text = 'Rejected'; }
        return <Tag color={color}>{text}</Tag>;
    }},
    { title: 'ACTION', key: 'action', render: (_, record) => (
        <Button style={{ borderRadius: 6, padding: '4px 16px', height: 'auto', borderColor: '#d9d9d9' }} onClick={() => handleEditVehicle(record)}>
          View Details
        </Button>
    )}
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '16px' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Vehicle Management</Typography.Title>
        <Space style={{ flexWrap: 'wrap' }}>
          <Input 
            placeholder="Search plate..." 
            onChange={(e) => setFilters({ ...filters, plate: e.target.value })}
            style={{ width: 150 }}
          />
          <Input 
            placeholder="Search owner..." 
            onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
            style={{ width: 150 }}
          />
          <Select 
            defaultValue=""
            style={{ width: 140 }} 
            onChange={(val) => setFilters({ ...filters, type: val })}
          >
            <Option value="">All Types</Option>
            {uniqueVehicleTypes.map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
          <Select 
            defaultValue=""
            style={{ width: 150 }} 
            onChange={(val) => setFilters({ ...filters, status: val })}
          >
            <Option value="">All Statuses</Option>
            <Option value="APPROVED">Approved</Option>
            <Option value="PENDING">Pending</Option>
            <Option value="REJECTED">Rejected</Option>
          </Select>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredVehicles} 
        rowKey="vehicleId" 
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />

      <Modal
        title="Vehicle Details & Approval"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={
          editingVehicle && editingVehicle.status === 'PENDING' ? [
            <Button key="reject" danger onClick={() => handleApprove(editingVehicle.vehicleId, false)} style={{ borderRadius: 6, minWidth: 80 }}>Reject</Button>,
            <Button key="approve" type="primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981', borderRadius: 6, minWidth: 80 }} onClick={() => handleApprove(editingVehicle.vehicleId, true)}>Approve</Button>,
            <Button key="close" onClick={() => setIsModalVisible(false)} style={{ borderRadius: 6, minWidth: 80 }}>Cancel</Button>
          ] : [
            <Button key="close" onClick={() => setIsModalVisible(false)} style={{ borderRadius: 6, minWidth: 80 }}>Close</Button>
          ]
        }
        width={600}
      >
        {editingVehicle && (
          <div>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Typography.Text type="secondary">Owner Name:</Typography.Text>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{editingVehicle.ownerName || '-'}</div>
              </Col>
              <Col span={12}>
                <Typography.Text type="secondary">Phone Number:</Typography.Text>
                <div style={{ fontSize: 16 }}>{editingVehicle.ownerPhone || '-'}</div>
              </Col>

              <Col span={12}>
                <Typography.Text type="secondary">License Plate:</Typography.Text>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{editingVehicle.licensePlate || '-'}</div>
              </Col>
              <Col span={12}>
                <Typography.Text type="secondary">Vehicle Type:</Typography.Text>
                <div style={{ fontSize: 16 }}>{editingVehicle.vehicleTypeName || editingVehicle.vehicleType?.typeName || 'Car'}</div>
              </Col>

              <Col span={12}>
                <Typography.Text type="secondary">Brand:</Typography.Text>
                <div style={{ fontSize: 16 }}>{editingVehicle.brand || '-'}</div>
              </Col>
              <Col span={12}>
                <Typography.Text type="secondary">Color:</Typography.Text>
                <div style={{ fontSize: 16 }}>{editingVehicle.vehicleColor || '-'}</div>
              </Col>

              <Col span={12}>
                <Typography.Text type="secondary">Chassis Number:</Typography.Text>
                <div style={{ fontSize: 16 }}>{editingVehicle.chassisNumber || '-'}</div>
              </Col>
              <Col span={12}>
                <Typography.Text type="secondary">Engine Number:</Typography.Text>
                <div style={{ fontSize: 16 }}>{editingVehicle.engineNumber || '-'}</div>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0', borderBlockColor: 'transparent' }} />
            <Typography.Text type="secondary">Registration Document (Image):</Typography.Text>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              {editingVehicle.registrationPhoto || editingVehicle.vehicleImage ? (
                <img src={editingVehicle.registrationPhoto || editingVehicle.vehicleImage} alt="Registration" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }} />
              ) : (
                <Typography.Text type="secondary" style={{ fontSize: 16 }}>No image available</Typography.Text>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ManagerVehicles;
