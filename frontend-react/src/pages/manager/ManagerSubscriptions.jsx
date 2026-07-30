import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Card, Space, Input, Select, Modal, Form, DatePicker, InputNumber } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { subscriptionApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const ManagerSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: null });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await subscriptionApi.getSubscriptions();
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        data.sort((a, b) => b.subscriptionId - a.subscriptionId);
        setSubscriptions(data);
      } else if (data && Array.isArray(data.content)) {
        setSubscriptions(data.content);
      } else {
        setSubscriptions([]);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      message.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (record = null) => {
    if (record) {
      setEditingId(record.subscriptionId);
      form.setFieldsValue({
        ...record,
        startDate: record.startDate ? dayjs(record.startDate) : null,
        endDate: record.endDate ? dayjs(record.endDate) : null,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DDTHH:mm:ss') : null,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DDTHH:mm:ss') : null,
      };

      if (editingId) {
        await subscriptionApi.updateSubscription(editingId, payload);
        message.success('Subscription updated successfully');
      } else {
        await subscriptionApi.createSubscription(payload);
        message.success('Subscription created successfully');
      }
      setIsModalVisible(false);
      fetchSubscriptions();
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleApprove = async (id) => {
    try {
      await subscriptionApi.approveSubscription(id);
      message.success('Subscription approved successfully');
      fetchSubscriptions();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to approve subscription');
    }
  };

  const handleReject = async (id) => {
    try {
      await subscriptionApi.rejectSubscription(id);
      message.success('Subscription rejected successfully');
      fetchSubscriptions();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reject subscription');
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this subscription?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await subscriptionApi.deleteSubscription(id);
          message.success('Subscription deleted successfully');
          fetchSubscriptions();
        } catch (error) {
          message.error('Failed to delete subscription');
        }
      }
    });
  };

  const filteredSubscriptions = subscriptions.filter(s => {
    const searchMatch = !filters.search || 
      s.userFullName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.licensePlate?.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.subscriptionId?.toString().includes(filters.search);
    const statusMatch = !filters.status || s.status === filters.status;
    return searchMatch && statusMatch;
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      render: (text) => <strong>#{text}</strong>
    },
    {
      title: 'Customer',
      dataIndex: 'userFullName',
      key: 'userFullName',
      render: (text) => text || '-'
    },
    {
      title: 'License Plate',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      render: (text) => <strong style={{ color: '#ea580c' }}>{text || '-'}</strong>
    },
    {
      title: 'Slot/Zone',
      key: 'location',
      render: (_, record) => record.slotCode || record.zoneName || 'General'
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Monthly Fee',
      dataIndex: 'monthlyFee',
      key: 'monthlyFee',
      render: (fee) => fee ? `${fee.toLocaleString()} VND` : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'ACTIVE') color = 'success';
        if (status === 'EXPIRED') color = 'error';
        if (status === 'CANCELLED') color = 'warning';
        if (status === 'PENDING') color = 'processing';
        if (status === 'REJECTED') color = 'error';
        return <Tag color={color}>{status || '-'}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'PENDING' && (
            <>
              <Button type="primary" size="small" onClick={() => handleApprove(record.subscriptionId)}>Approve</Button>
              <Button type="primary" danger size="small" onClick={() => handleReject(record.subscriptionId)}>Reject</Button>
            </>
          )}
          <Button type="text" icon={<EyeOutlined />} onClick={() => handleOpenModal(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.subscriptionId)} />
        </Space>
      )
    },
  ];

  return (
    <Card title="Monthly Subscriptions">
      <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        <Input 
          placeholder="Search name, plate, ID..." 
          prefix={<SearchOutlined />} 
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: 250 }}
        />
        <Select 
          defaultValue=""
          style={{ width: 160 }} 
          allowClear 
          onChange={(val) => setFilters({ ...filters, status: val || null })}
        >
          <Option value="">All Statuses</Option>
          <Option value="PENDING">Pending</Option>
          <Option value="ACTIVE">Active</Option>
          <Option value="EXPIRED">Expired</Option>
          <Option value="CANCELLED">Cancelled</Option>
          <Option value="REJECTED">Rejected</Option>
        </Select>
      </Space>

      <Table 
        columns={columns} 
        dataSource={filteredSubscriptions} 
        rowKey="subscriptionId" 
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="View Subscription Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="userFullName" label="Customer Name">
            <Input readOnly />
          </Form.Item>
          
          <Form.Item name="licensePlate" label="License Plate">
            <Input readOnly />
          </Form.Item>

          <Form.Item name="zoneName" label="Parking Zone (Optional)">
            <Input placeholder="E.g., Zone A" readOnly />
          </Form.Item>

          <Space style={{ display: 'flex', width: '100%', gap: '16px' }}>
            <Form.Item name="startDate" label="Start Date" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} disabled />
            </Form.Item>
            <Form.Item name="endDate" label="End Date" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} disabled />
            </Form.Item>
          </Space>

          <Form.Item name="monthlyFee" label="Monthly Fee">
            <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} readOnly />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Input readOnly />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsModalVisible(false)}>Close</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ManagerSubscriptions;
