import React, { useState, useEffect } from 'react';
import { Table, Card, Space, Input, Select, Tag, message, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { reservationApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const StaffReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: null });
  const location = useLocation();

  useEffect(() => {
    fetchReservations();
  }, [location.search]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await reservationApi.getReservations();
      let data = res.data?.success ? res.data.data : res.data;
      if (!Array.isArray(data) && data && Array.isArray(data.content)) {
        data = data.content;
      }
      
      if (Array.isArray(data)) {
        // Handle ?date=today parameter
        const searchParams = new URLSearchParams(location.search);
        const isToday = searchParams.get('date') === 'today';
        
        if (isToday) {
          const todayStr = dayjs().format('YYYY-MM-DD');
          data = data.filter(r => r.reservationStart && dayjs(r.reservationStart).format('YYYY-MM-DD') === todayStr);
        }

        data.sort((a, b) => b.reservationId - a.reservationId);
        setReservations(data);
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      message.error('Failed to load reservations: ' + (error.response?.data?.message || error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter(r => {
    const searchMatch = !filters.search || 
      r.userFullName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      r.licensePlate?.toLowerCase().includes(filters.search.toLowerCase()) ||
      r.reservationId?.toString().includes(filters.search);
    const statusMatch = !filters.status || r.status === filters.status;
    return searchMatch && statusMatch;
  });

  const columns = [
    {
      title: 'Res ID',
      dataIndex: 'reservationId',
      key: 'reservationId',
      render: (text) => <strong>#{text}</strong>
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div>{record.userFullName || 'Guest'}</div>
        </div>
      )
    },
    {
      title: 'License Plate',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      render: (text) => <strong style={{ color: '#ea580c' }}>{text || '-'}</strong>
    },
    {
      title: 'Reserved Slot',
      dataIndex: 'slotCode',
      key: 'slotCode',
      render: (text) => text || 'Any Available'
    },
    {
      title: 'Expected Arrival',
      dataIndex: 'reservationStart',
      key: 'reservationStart',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'CONFIRMED') color = 'success';
        if (status === 'COMPLETED') color = 'processing';
        if (status === 'CANCELLED') color = 'error';
        if (status === 'PENDING') color = 'warning';
        return <Tag color={color}>{status || '-'}</Tag>;
      }
    }
  ];

  const searchParams = new URLSearchParams(location.search);
  const isToday = searchParams.get('date') === 'today';

  return (
    <Card 
      title={isToday ? "Today's Reservations" : "All Reservations"}
    >
      <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        <Input 
          placeholder="Search by ID, Name, Phone, Plate..." 
          prefix={<SearchOutlined />} 
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: 300 }}
        />
        <Select 
          placeholder="All statuses" 
          style={{ width: 160 }} 
          allowClear 
          onChange={(val) => setFilters({ ...filters, status: val })}
        >
          <Option value="CONFIRMED">Confirmed</Option>
          <Option value="COMPLETED">Completed</Option>
          <Option value="PENDING">Pending</Option>
          <Option value="CANCELLED">Cancelled</Option>
        </Select>
      </Space>

      <Table 
        columns={columns} 
        dataSource={filteredReservations} 
        rowKey="reservationId" 
        loading={loading}
        pagination={{ pageSize: 15 }}
        scroll={{ x: 800 }}
      />
    </Card>
  );
};

export default StaffReservations;
