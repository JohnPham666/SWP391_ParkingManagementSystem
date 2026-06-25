import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Card, Space, Input, Select } from 'antd';
import { SearchOutlined, DollarOutlined } from '@ant-design/icons';
import { paymentApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const StaffPayments = () => {
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
        // Filter only today's payments
        const todayStr = dayjs().format('YYYY-MM-DD');
        const todayPayments = data.filter(p => {
          if (!p.paidAt && !p.createdAt) return false;
          // safely format to string, dayjs handles arrays and timestamps too
          const dateStr = dayjs(p.paidAt || p.createdAt).format('YYYY-MM-DD');
          return dateStr === todayStr;
        });
        
        todayPayments.sort((a, b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0));
        setPayments(todayPayments);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      message.error('Failed to load payments: ' + (error.response?.data?.message || error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const searchMatch = !filters.search || 
      p.paymentId?.toString().includes(filters.search) ||
      p.sessionId?.toString().includes(filters.search) ||
      p.reservationId?.toString().includes(filters.search);
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
      title: 'Payment Type',
      key: 'type',
      render: (_, record) => record.sessionId ? 'Parking Session' : (record.reservationId ? 'Reservation' : 'Other')
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <span style={{ fontWeight: 700, color: '#16a34a' }}>{amount.toLocaleString('vi-VN')} ₫</span>
    },
    {
      title: 'Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (text) => text || '-'
    },
    {
      title: 'Time',
      key: 'time',
      render: (_, record) => record.paidAt ? dayjs(record.paidAt).format('DD/MM/YYYY HH:mm:ss') : '-'
    },
    {
      title: 'Status',
      key: 'statusActions',
      render: (_, record) => {
        let color = 'default';
        if (record.paymentStatus === 'PENDING') color = 'warning';
        if (record.paymentStatus === 'SUCCESS' || record.paymentStatus === 'PAID') color = 'success';
        if (record.paymentStatus === 'FAILED') color = 'error';

        return <Tag color={color}>{record.paymentStatus}</Tag>;
      }
    }
  ];

  return (
    <Card 
      title={<span style={{ fontSize: '18px' }}>Today's Transactions (Read-only)</span>}
    >
      <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        <Input 
          placeholder="Search ID..." 
          prefix={<SearchOutlined />} 
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: 280 }}
          size="large"
        />
        <Select 
          placeholder="All Statuses" 
          style={{ width: 160 }} 
          allowClear 
          size="large"
          onChange={(val) => setFilters({ ...filters, status: val })}
        >
          <Option value="PENDING">Pending</Option>
          <Option value="SUCCESS">Success / Paid</Option>
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

export default StaffPayments;
