import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Card, Space, Input, Select, Modal, Form, Upload, Typography } from 'antd';
import { SearchOutlined, AlertOutlined, UploadOutlined } from '@ant-design/icons';
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
    const interval = setInterval(() => {
      fetchIncidents(true); // pass true to indicate silent refresh if needed
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
<<<<<<< Updated upstream
      title: 'Type',
      dataIndex: 'incidentType',
      key: 'incidentType',
    },
    {
=======
>>>>>>> Stashed changes
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'OPEN') color = 'gold';
        if (status === 'IN_PROGRESS') color = 'blue';
        if (status === 'RESOLVED') color = 'green';
        if (status === 'CLOSED') color = 'default';
        return <Tag color={color}>{status || '-'}</Tag>;
      }
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
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: 280 }}
          size="large"
        />
        <Select 
          placeholder="All statuses" 
          style={{ width: 160 }} 
          allowClear 
          size="large"
          onChange={(val) => setFilters({ ...filters, status: val })}
        >
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

          <Form.Item name="incidentImage" label="Photo Evidence (Optional)">
            <Upload beforeUpload={() => false} listType="picture" maxCount={1}>
              <Button icon={<UploadOutlined />}>Click to upload image</Button>
            </Upload>
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
