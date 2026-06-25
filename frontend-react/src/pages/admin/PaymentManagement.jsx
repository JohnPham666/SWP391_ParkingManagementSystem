import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Card, Space, Input, Select, Popconfirm } from 'antd';
import { SearchOutlined, DollarOutlined } from '@ant-design/icons';
import { paymentApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: null });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getPayments();
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        // Sort descending by created/paid time if any, else ID
        data.sort((a, b) => b.paymentId - a.paymentId);
        setPayments(data);
      } else if (data && Array.isArray(data.content)) { // pagination case
        setPayments(data.content);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      message.error('Failed to load payments history');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCash = async (id) => {
    try {
      await paymentApi.confirmCash(id);
      message.success('Payment confirmed successfully');
      fetchPayments();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to confirm payment');
    }
  };

  const filteredPayments = payments.filter(p => {
    const searchMatch = !filters.search || 
      p.paymentId?.toString().includes(filters.search) ||
      p.paymentMethod?.toLowerCase().includes(filters.search.toLowerCase());
    const statusMatch = !filters.status || p.paymentStatus === filters.status;
    return searchMatch && statusMatch;
  });

  const columns = [
    {
      title: 'Payment ID',
      dataIndex: 'paymentId',
      key: 'paymentId',
      render: (text) => <strong>#{text}</strong>
    },
    {
      title: 'Type',
      key: 'type',
      render: (_, record) => {
        if (record.sessionId) return 'Parking Session';
        if (record.reservationId) return 'Reservation';
        return 'Other';
      }
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <strong style={{ color: '#059669' }}>{amount?.toLocaleString()} ₫</strong>
    },
    {
      title: 'Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (text) => text || '-'
    },
    {
      title: 'Time',
      dataIndex: 'paidAt',
      key: 'paidAt',
      render: (time) => time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '-'
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        let color = 'default';
        let text = status;
        if (status === 'PENDING') { color = 'warning'; text = 'Pending'; }
        if (status === 'SUCCESS') { color = 'success'; text = 'Success'; }
        if (status === 'FAILED') { color = 'error'; text = 'Failed'; }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        record.paymentStatus === 'PENDING' ? (
          <Popconfirm
            title="Confirm Cash Payment"
            description="Are you sure you have received cash for this transaction?"
            onConfirm={() => handleConfirmCash(record.paymentId)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" type="default" icon={<DollarOutlined />}>
              Receive Cash
            </Button>
          </Popconfirm>
        ) : null
      )
    },
  ];

  return (
    <Card title="Payment History">
      <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        <Input 
          placeholder="Search ID, method..." 
          prefix={<SearchOutlined />} 
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: 250 }}
        />
        <Select 
          placeholder="All statuses" 
          style={{ width: 160 }} 
          allowClear 
          onChange={(val) => setFilters({ ...filters, status: val })}
        >
          <Option value="PENDING">Pending</Option>
          <Option value="SUCCESS">Success</Option>
          <Option value="FAILED">Failed</Option>
        </Select>
      </Space>

      <Table 
        columns={columns} 
        dataSource={filteredPayments} 
        rowKey="paymentId" 
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
    </Card>
  );
};

export default PaymentManagement;
