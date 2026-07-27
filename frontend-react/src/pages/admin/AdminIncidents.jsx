import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Card, Space, Input, Select, Modal, Form, Upload, Typography } from 'antd';
import { SearchOutlined, EditOutlined, SafetyCertificateOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { incidentApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: null });
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newStatus, setNewStatus] = useState('');

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


  const handleUpdateStatus = async () => {
    if (!selectedIncident || !newStatus) return;
    try {
      await incidentApi.updateIncidentStatus(selectedIncident.incidentId || selectedIncident.id, newStatus);
      message.success('Incident status updated successfully');
      setUpdateModalVisible(false);
      fetchIncidents();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update status');
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
      title: 'Type',
      dataIndex: 'incidentType',
      key: 'incidentType',
      render: (type) => {
        const getIcon = () => {
          if (type?.includes('DAMAGE') || type?.includes('LOST')) return <WarningOutlined style={{ color: '#faad14', marginRight: 4 }} />;
          return <InfoCircleOutlined style={{ color: '#1677ff', marginRight: 4 }} />;
        };
        return <span style={{ whiteSpace: 'nowrap' }}>{getIcon()} {type}</span>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'OPEN') color = 'error';
        if (status === 'IN_PROGRESS') color = 'processing';
        if (status === 'RESOLVED') color = 'success';
        if (status === 'CLOSED') color = 'default';
        return <Tag color={color} style={{ minWidth: 80, textAlign: 'center' }}>{status || '-'}</Tag>;
      }
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
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EditOutlined />} 
          onClick={() => {
            setSelectedIncident(record);
            setNewStatus(record.status);
            setUpdateModalVisible(true);
          }}
        >
          Update Status
        </Button>
      )
    },
  ];

  return (
    <Card 
      title={<span style={{ fontSize: '18px' }}>Incident Management</span>}
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
        title="Update Incident Status"
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        onOk={handleUpdateStatus}
        okText="Update"
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary">Updating status for Incident #{selectedIncident?.incidentId || selectedIncident?.id}</Typography.Text>
        </div>
        <Select
          style={{ width: '100%' }}
          value={newStatus}
          onChange={(val) => setNewStatus(val)}
        >
          <Option value="OPEN">Open</Option>
          <Option value="IN_PROGRESS">In Progress</Option>
          <Option value="RESOLVED">Resolved</Option>
          <Option value="CLOSED">Closed</Option>
        </Select>
      </Modal>
    </Card>
  );
};

export default IncidentManagement;
