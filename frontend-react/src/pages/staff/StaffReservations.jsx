import React, { useState, useEffect } from 'react';
import { Table, Card, Space, Input, Select, Tag, message, Typography, DatePicker } from 'antd';
import { SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import { reservationApi, buildingApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

const StaffReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: null });
  const [selectedDate, setSelectedDate] = useState(null); // Default: all
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const res = await buildingApi.getBuildings();
      setBuildings(res.data?.data || []);
    } catch (e) {
      console.error('Failed to fetch buildings', e);
    }
  };

  useEffect(() => {
    fetchReservations();
    const interval = setInterval(() => {
      fetchReservations(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedDate, selectedBuilding]);

  const fetchReservations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await reservationApi.getReservations(selectedBuilding);
      let data = res.data?.success ? res.data.data : res.data;
      if (!Array.isArray(data) && data && Array.isArray(data.content)) {
        data = data.content;
      }
      
      if (Array.isArray(data)) {
        // Filter by selected date
        if (selectedDate) {
          const dateStr = selectedDate.format('YYYY-MM-DD');
          data = data.filter(r => r.reservationStart && dayjs(r.reservationStart).format('YYYY-MM-DD') === dateStr);
        }

        data.sort((a, b) => b.reservationId - a.reservationId);
        setReservations(data);
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      if (!silent) message.error('Failed to load reservations: ' + (error.response?.data?.message || error.message || String(error)));
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
      title: 'Customer Name',
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
      title: 'Slot',
      dataIndex: 'slotCode',
      key: 'slotCode',
      render: (text) => text || 'Any'
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
        let label = status || '-';
        if (status === 'CONFIRMED') { color = 'success'; label = 'Confirmed'; }
        if (status === 'COMPLETED') { color = 'processing'; label = 'Completed'; }
        if (status === 'CANCELLED') { color = 'error'; label = 'Cancelled'; }
        if (status === 'PENDING') { color = 'warning'; label = 'Pending'; }
        return <Tag color={color}>{label}</Tag>;
      }
    }
  ];

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span>
            <CalendarOutlined style={{ marginRight: 8 }} />
            Reservations — {selectedDate ? selectedDate.format('DD/MM/YYYY') : 'All'}
          </span>
          <DatePicker
            value={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            format="DD/MM/YYYY"
            allowClear
            placeholder="Select date"
            style={{ width: 160 }}
          />
        </div>
      }
    >
      <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        <Input 
          placeholder="Search by ID, name, phone, plate..." 
          prefix={<SearchOutlined />} 
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: 300 }}
        />
        <Select 
          placeholder="All statuses" 
          style={{ width: 150 }} 
          allowClear 
          onChange={(val) => setFilters({ ...filters, status: val })}
        >
          <Option value="PENDING">Pending</Option>
          <Option value="CONFIRMED">Confirmed</Option>
          <Option value="CHECKED_IN">Checked-in</Option>
          <Option value="CANCELLED">Cancelled</Option>
        </Select>
        <Select
          allowClear
          placeholder="Filter by Building"
          style={{ width: 180 }}
          value={selectedBuilding}
          onChange={(value) => setSelectedBuilding(value)}
        >
          {buildings.map(b => (
            <Option key={b.buildingId} value={b.buildingId}>{b.buildingName}</Option>
          ))}
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
