import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Card, Space, Input, Select, DatePicker } from 'antd';
import { SearchOutlined, DollarOutlined } from '@ant-design/icons';
import { paymentApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const StaffPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: null, dateRange: null });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getPayments();
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        data.sort((a, b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0));
        setPayments(data);
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
      p.reservationId?.toString().includes(filters.search) ||
      p.licensePlate?.toLowerCase().includes(filters.search.toLowerCase());
    const statusMatch = !filters.status || p.paymentStatus === filters.status;
    
    let dateMatch = true;
    if (filters.dateRange && filters.dateRange.length === 2) {
      const pDate = dayjs(p.paidAt || p.createdAt || p.paymentId);
      if (p.paidAt || p.createdAt) {
         dateMatch = pDate.isAfter(filters.dateRange[0].startOf('day')) && pDate.isBefore(filters.dateRange[1].endOf('day'));
      }
    }

    return searchMatch && statusMatch && dateMatch;
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
      title: 'Biển số xe',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      render: (text) => text ? <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px', fontWeight: 'bold' }}>{text}</Tag> : '-'
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
        if (record.paymentStatus === 'PAID') color = 'success';
        if (record.paymentStatus === 'FAILED') color = 'error';

        return <Tag color={color}>{record.paymentStatus}</Tag>;
      }
    }
  ];

  return (
    <Card 
      title={<span style={{ fontSize: '18px' }}>Transactions History (Read-only)</span>}
    >
      <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        <Input 
          placeholder="Search ID or License Plate..." 
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
          <Option value="PAID">Paid</Option>
          <Option value="FAILED">Failed</Option>
        </Select>
        <DatePicker.RangePicker 
          onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
          style={{ width: 250 }}
          size="large"
        />
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
