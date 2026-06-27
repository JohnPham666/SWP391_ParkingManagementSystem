import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Card, Space, Input, Select, Modal, Form, Descriptions, Image, Badge, Typography, Divider, Upload } from 'antd';
import { SearchOutlined, AlertOutlined, EyeOutlined, FileImageOutlined, UploadOutlined } from '@ant-design/icons';
import { incidentApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text, Title } = Typography;

const STATUS_CONFIG = {
  OPEN: { color: 'gold', label: 'Open' },
  IN_PROGRESS: { color: 'blue', label: 'In Progress' },
  RESOLVED: { color: 'green', label: 'Resolved' },
  CLOSED: { color: 'default', label: 'Closed' },
};

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: null });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(() => {
      fetchIncidents(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchIncidents = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await incidentApi.getIncidents();
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        data.sort((a, b) => new Date(b.reportTime || b.createdAt || 0) - new Date(a.reportTime || a.createdAt || 0));
        setIncidents(data);
      } else {
        setIncidents([]);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      message.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await incidentApi.updateIncidentStatus(id, status);
      message.success('Status updated successfully');
      // Update in-place
      setIncidents(prev => prev.map(i => i.incidentId === id ? { ...i, status } : i));
      if (selectedIncident?.incidentId === id) {
        setSelectedIncident(prev => ({ ...prev, status }));
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleReportIncident = async (values) => {
    try {
      const { incidentImage, ...restValues } = values;
      const payload = {
        ...restValues,
        sessionId: values.sessionId ? parseInt(values.sessionId) : null
      };
      const response = await incidentApi.createIncident(payload);
      const createdIncident = response?.data?.data || response?.data || response;

      if (values.incidentImage?.fileList?.length > 0) {
        const file = values.incidentImage.fileList[0].originFileObj;
        await incidentApi.uploadIncidentImage(createdIncident.incidentId || createdIncident.id, file);
      }

      message.success('Incident reported successfully');
      setIsCreateModalVisible(false);
      form.resetFields();
      fetchIncidents();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to report incident');
    }
  };

  const handleViewDetail = (record) => {
    setSelectedIncident(record);
    setIsDetailModalVisible(true);
  };

  const filteredIncidents = incidents.filter(i => {
    const searchMatch = !filters.search ||
      i.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      i.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      i.incidentId?.toString().includes(filters.search);
    const statusMatch = !filters.status || i.status === filters.status;
    return searchMatch && statusMatch;
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'incidentId',
      key: 'incidentId',
      width: 70,
      render: (text) => <strong>#{text}</strong>
    },
    {
      title: 'Type',
      dataIndex: 'incidentType',
      key: 'incidentType',
      width: 160,
      render: (type) => <Tag color="purple">{type || '-'}</Tag>
    },
    {
      title: 'Description',
      key: 'description',
      render: (_, record) => (
        <Text ellipsis={{ tooltip: record.description }} style={{ maxWidth: 240, display: 'block' }}>
          {record.description || '-'}
        </Text>
      )
    },
    {
      title: 'Reporter',
      dataIndex: 'reportedByName',
      key: 'reportedByName',
      width: 140,
      render: (text) => text || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status, record) => (
        <Select
          value={status}
          onChange={(val) => handleStatusChange(record.incidentId, val)}
          style={{ width: 140, fontWeight: 600 }}
          bordered={false}
        >
          <Option value="OPEN" style={{ color: '#d97706' }}>Open</Option>
          <Option value="IN_PROGRESS" style={{ color: '#2563eb' }}>In Progress</Option>
          <Option value="RESOLVED" style={{ color: '#059669' }}>Resolved</Option>
          <Option value="CLOSED" style={{ color: '#6b7280' }}>Closed</Option>
        </Select>
      )
    },
    {
      title: 'Time',
      key: 'time',
      width: 160,
      render: (_, record) => {
        const time = record.reportTime || record.createdAt;
        return time ? dayjs(time).format('DD/MM/YYYY HH:mm') : '-';
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          View
        </Button>
      )
    },
  ];

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8080/${path.replace(/^\/+/, '')}`;
  };

  return (
    <Card
      title={<span style={{ fontSize: '18px' }}>Incident Management</span>}
      extra={
        <Button
          type="primary"
          size="large"
          icon={<AlertOutlined />}
          onClick={() => setIsCreateModalVisible(true)}
          style={{ backgroundColor: '#dc2626', fontWeight: 'bold' }}
        >
          Report Emergency Incident
        </Button>
      }
    >
      <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        <Input
          placeholder="Search ID, title, description..."
          prefix={<SearchOutlined />}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: 280 }}
          size="large"
        />
        <Select
          defaultValue=""
          style={{ width: 160 }}
          allowClear
          size="large"
          onChange={(val) => setFilters({ ...filters, status: val || null })}
        >
          <Option value="">All Statuses</Option>
          <Option value="OPEN">Open</Option>
          <Option value="IN_PROGRESS">In Progress</Option>
          <Option value="RESOLVED">Resolved</Option>
          <Option value="CLOSED">Closed</Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredIncidents}
        rowKey="incidentId"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 900 }}
      />


      {/* === DETAIL MODAL === */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertOutlined style={{ color: '#dc2626', fontSize: 20 }} />
            <span style={{ fontSize: 18, fontWeight: 700 }}>
              Incident Report #{selectedIncident?.incidentId}
            </span>
            {selectedIncident && (
              <Tag color={STATUS_CONFIG[selectedIncident.status]?.color || 'default'}>
                {STATUS_CONFIG[selectedIncident.status]?.label || selectedIncident.status}
              </Tag>
            )}
          </div>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        {selectedIncident && (
          <div>
            <Descriptions bordered column={1} size="middle" labelStyle={{ fontWeight: 600, width: 150 }}>
              <Descriptions.Item label="Reporter">
                {selectedIncident.reportedByName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="purple">{selectedIncident.incidentType || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                <Text>{selectedIncident.description || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Session ID">
                {selectedIncident.sessionId ? `#${selectedIncident.sessionId}` : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Reported At">
                {selectedIncident.createdAt
                  ? dayjs(selectedIncident.createdAt).format('DD/MM/YYYY HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Select
                  value={selectedIncident.status}
                  onChange={(val) => handleStatusChange(selectedIncident.incidentId, val)}
                  style={{ width: 160, fontWeight: 600 }}
                >

                  <Option value="OPEN">Open</Option>
                  <Option value="IN_PROGRESS">In Progress</Option>
                  <Option value="RESOLVED">Resolved</Option>
                  <Option value="CLOSED">Closed</Option>
                </Select>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ marginTop: 24 }}>
              <FileImageOutlined style={{ marginRight: 6 }} />
              Incident Image
            </Divider>

            {getImageUrl(selectedIncident.incidentImage) ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <Image
                  src={getImageUrl(selectedIncident.incidentImage)}
                  alt="Incident"
                  style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8, objectFit: 'contain', border: '1px solid #e5e7eb' }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyBoBHhohAMSaSmBkGADgIAIWCiZGUGDAEqODFCaEJmhFgKBkCYCQDSMNUoMIjJFhk4HFT8OqiAgMAAIAeYB8AVAA=="
                />
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '32px',
                background: '#f9fafb',
                borderRadius: 8,
                border: '1px dashed #d1d5db',
                color: '#9ca3af'
              }}>
                <FileImageOutlined style={{ fontSize: 36, marginBottom: 8, display: 'block' }} />
                No image attached to this report
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* === CREATE INCIDENT MODAL === */}

      <Modal
        title="Report New Incident"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleReportIncident} size="large">
          <Form.Item name="description" label="Incident Description" rules={[{ required: true, message: 'Please enter a description' }]}>
            <Input.TextArea rows={4} placeholder="e.g. Car scratched, Barrier broken..." />
          </Form.Item>

          <Form.Item name="incidentType" label="Incident Type" rules={[{ required: true, message: 'Please select a type' }]}>
            <Select>
              <Option value="LOST_TICKET">Lost Ticket</Option>
              <Option value="FACILITY_DAMAGE">Facility Damage</Option>
              <Option value="WRONG_LICENSE_PLATE">Wrong License Plate</Option>
              <Option value="SLOT_OCCUPIED">Slot Occupied</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item name="sessionId" label="Session ID (Optional)">
            <Input type="number" placeholder="Enter session ID if related" />
          </Form.Item>

          <Form.Item name="incidentImage" label="Photo Evidence (Optional)">
            <Upload beforeUpload={() => false} listType="picture" maxCount={1}>
              <Button icon={<UploadOutlined />}>Click to upload image</Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
            <Button onClick={() => setIsCreateModalVisible(false)} style={{ marginRight: 8, height: '40px' }}>Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#dc2626', height: '40px', fontWeight: 'bold' }}>
              Submit Report
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default IncidentManagement;
