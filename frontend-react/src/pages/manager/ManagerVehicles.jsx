import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Modal, Form, message, Space, Card, Popconfirm, Tag, Typography, Row, Col, Divider, Image } from 'antd';
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

  const getImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http') || path.startsWith('data:')) return path;
      const baseUrl = vehicleApi ? 'http://localhost:8080' : 'http://localhost:8080'; // fallback
      return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

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
  }).sort((a, b) => {
    // 1. PENDING status first
    const aIsPending = a.status === 'PENDING';
    const bIsPending = b.status === 'PENDING';
    
    if (aIsPending && !bIsPending) return -1;
    if (!aIsPending && bIsPending) return 1;
    
    // 2. Sort by vehicleId ascending (theo thứ tự ID)
    return (a.vehicleId || 0) - (b.vehicleId || 0);
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
        width={800}
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

            <Divider style={{ margin: '16px 0', borderBlockColor: '#e8e8e8' }} />
            <Typography.Title level={5} style={{ marginBottom: 16 }}>Image Documents</Typography.Title>
            
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Owner Portrait</Typography.Text>
                <div style={{ textAlign: 'center', height: 160, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e8e8e8' }}>
                  {editingVehicle.ownerPortrait ? <Image src={getImageUrl(editingVehicle.ownerPortrait)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} fallback="https://via.placeholder.com/160?text=Error" /> : <Typography.Text type="secondary" italic>No Image</Typography.Text>}
                </div>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>ID Card (Front)</Typography.Text>
                <div style={{ textAlign: 'center', height: 160, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e8e8e8' }}>
                  {editingVehicle.idCardFront ? <Image src={getImageUrl(editingVehicle.idCardFront)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} fallback="https://via.placeholder.com/160?text=Error" /> : <Typography.Text type="secondary" italic>No Image</Typography.Text>}
                </div>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>ID Card (Back)</Typography.Text>
                <div style={{ textAlign: 'center', height: 160, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e8e8e8' }}>
                  {editingVehicle.idCardBack ? <Image src={getImageUrl(editingVehicle.idCardBack)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} fallback="https://via.placeholder.com/160?text=Error" /> : <Typography.Text type="secondary" italic>No Image</Typography.Text>}
                </div>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Vehicle Image</Typography.Text>
                <div style={{ textAlign: 'center', height: 160, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e8e8e8' }}>
                  {editingVehicle.vehicleImage ? <Image src={getImageUrl(editingVehicle.vehicleImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} fallback="https://via.placeholder.com/160?text=Error" /> : <Typography.Text type="secondary" italic>No Image</Typography.Text>}
                </div>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Registration (Front)</Typography.Text>
                <div style={{ textAlign: 'center', height: 160, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e8e8e8' }}>
                  {editingVehicle.registrationPhotoFront || editingVehicle.registrationPhoto ? <Image src={getImageUrl(editingVehicle.registrationPhotoFront || editingVehicle.registrationPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} fallback="https://via.placeholder.com/160?text=Error" /> : <Typography.Text type="secondary" italic>No Image</Typography.Text>}
                </div>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Registration (Back)</Typography.Text>
                <div style={{ textAlign: 'center', height: 160, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e8e8e8' }}>
                  {editingVehicle.registrationPhotoBack ? <Image src={getImageUrl(editingVehicle.registrationPhotoBack)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} fallback="https://via.placeholder.com/160?text=Error" /> : <Typography.Text type="secondary" italic>No Image</Typography.Text>}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ManagerVehicles;
