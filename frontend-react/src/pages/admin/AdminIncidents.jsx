import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Card, Space, Input, Select, Modal, Form } from 'antd';
import { SearchOutlined, AlertOutlined } from '@ant-design/icons';
import { incidentApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: null });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
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
      fetchIncidents();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleReportIncident = async (values) => {
    try {
      const payload = {
        ...values,
        sessionId: values.sessionId ? parseInt(values.sessionId) : null
      };
      await incidentApi.createIncident(payload);
      message.success('Incident reported successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchIncidents();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to report incident');
    }
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
      render: (text) => <strong>#{text}</strong>
    },
    {
      title: 'Title / Description',
      key: 'title',
      render: (_, record) => <span style={{ fontWeight: 600 }}>{record.title || record.description || '-'}</span>
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (sev) => {
        let color = 'default';
        if (sev === 'LOW') color = 'blue';
        if (sev === 'MEDIUM') color = 'orange';
        if (sev === 'HIGH') color = 'red';
        if (sev === 'CRITICAL') color = '#991b1b'; // darker red
        return <Tag color={color}>{sev || '-'}</Tag>;
      }
    },
    {
      title: 'Type',
      dataIndex: 'incidentType',
      key: 'incidentType',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select 
          value={status} 
          onChange={(val) => handleStatusChange(record.incidentId, val)}
          style={{ width: 140, fontWeight: 600 }}
          bordered={false}
        >
          <Option value="REPORTED" style={{ color: '#d97706' }}>Reported</Option>
          <Option value="OPEN" style={{ color: '#d97706' }}>Open</Option>
          <Option value="IN_PROGRESS" style={{ color: '#2563eb' }}>In Progress</Option>
          <Option value="RESOLVED" style={{ color: '#059669' }}>Resolved</Option>
          <Option value="CLOSED" style={{ color: '#6b7280' }}>Closed</Option>
        </Select>
      )
    },
    {
      title: 'Reporter',
      key: 'reporter',
      render: (_, record) => record.reporterName || record.reportedBy || record.reporter?.fullName || '-'
    },
    {
      title: 'Time',
      key: 'time',
      render: (_, record) => {
        const time = record.reportTime || record.createdAt;
        return time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '-';
      }
    },
  ];

  return (
    <Card 
      title={<span style={{ fontSize: '18px' }}>Incident Management</span>}
      extra={
        <Button 
          type="primary" 
          size="large"
          icon={<AlertOutlined />} 
          onClick={() => setIsModalVisible(true)} 
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
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: 280 }}
          size="large"
        />
        <Select 
          placeholder="All statuses" 
          style={{ width: 160 }} 
          allowClear 
          size="large"
          value={filters.status}
          onChange={(val) => setFilters({ ...filters, status: val })}
        >
          <Option value="REPORTED">Reported</Option>
          <Option value="OPEN">Open</Option>
          <Option value="IN_PROGRESS">In Progress</Option>
          <Option value="RESOLVED">Resolved</Option>
          <Option value="CLOSED">Closed</Option>
        </Select>
        <Button size="large" onClick={() => setFilters({ search: '', status: null })}>Reset Filters</Button>
      </Space>

      <Table 
        columns={columns} 
        dataSource={filteredIncidents} 
        rowKey="incidentId" 
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 900 }}
      />

      <Modal
        title="Report New Incident"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
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

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
            <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: 8, height: '40px' }}>Cancel</Button>
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
