import React, { useState, useEffect } from 'react';
import { Table, Select, Tag, message, Card, Space, Input, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { reservationApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const ManagerReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ plate: '', name: '', status: '' });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await reservationApi.getReservations();
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        // Sort descending by startTime
        data.sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));
        setReservations(data);
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      message.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await reservationApi.updateReservationStatus(id, status);
      message.success('Reservation status updated successfully');
      fetchReservations();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredReservations = reservations.filter(r => {
    const plateMatch = !filters.plate || r.licensePlate?.toLowerCase().includes(filters.plate.toLowerCase());
    const nameMatch = !filters.name || (r.userFullName || r.guestName || '').toLowerCase().includes(filters.name.toLowerCase());
    const statusMatch = !filters.status || r.status === filters.status;
    return plateMatch && nameMatch && statusMatch;
  });

  const columns = [
    { title: 'RESERVATION ID', dataIndex: 'reservationId', key: 'reservationId', render: (text) => <strong>#{text}</strong> },
    { title: 'CUSTOMER', key: 'customer', render: (_, record) => <strong>{record.userFullName || record.guestName || 'N/A'}</strong> },
    { title: 'LICENSE PLATE', dataIndex: 'licensePlate', key: 'licensePlate', render: (text) => text || 'N/A' },
    { title: 'PARKING SLOT', dataIndex: 'slotCode', key: 'slotCode', render: (text) => text || 'N/A' },
    { title: 'START TIME', key: 'startTime', render: (_, record) => { const time = record.reservationStart || record.startTime; return time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '-'; } },
    { title: 'END TIME', key: 'endTime', render: (_, record) => { const time = record.reservationEnd || record.endTime; return time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '-'; } },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        let color = '#d9d9d9'; let bgColor = 'transparent';
        if (status === 'PENDING') { color = '#d97706'; bgColor = '#fef3c7'; }
        if (status === 'CONFIRMED') { color = '#059669'; bgColor = '#d1fae5'; }
        if (status === 'COMPLETED') { color = '#2563eb'; bgColor = '#dbeafe'; }
        if (status === 'CANCELLED') { color = '#dc2626'; bgColor = '#fee2e2'; }
        if (status === 'EXPIRED') { color = '#6b7280'; bgColor = '#f3f4f6'; }

        return (
          <div style={{ backgroundColor: bgColor, borderRadius: 20, padding: '0px 4px', display: 'inline-block' }}>
            <Select 
              value={status} 
              onChange={(val) => handleStatusChange(record.reservationId, val)}
              style={{ width: 135, fontWeight: 600 }}
              bordered={false}
              suffixIcon={<span style={{ color, fontSize: 10 }}>▼</span>}
            >
              <Option value="PENDING"><span style={{ color: '#d97706' }}>Pending</span></Option>
              <Option value="CONFIRMED"><span style={{ color: '#059669' }}>Confirmed</span></Option>
              <Option value="COMPLETED"><span style={{ color: '#2563eb' }}>Completed</span></Option>
              <Option value="CANCELLED"><span style={{ color: '#dc2626' }}>Cancelled</span></Option>
              <Option value="EXPIRED"><span style={{ color: '#6b7280' }}>Expired</span></Option>
            </Select>
          </div>
        );
      }
    },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '16px' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Reservation Management</Typography.Title>
        <Space style={{ flexWrap: 'wrap' }}>
          <Input 
            placeholder="Search plate..." 
            onChange={(e) => setFilters({ ...filters, plate: e.target.value })}
            style={{ width: 150 }}
          />
          <Input 
            placeholder="Search customer..." 
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            style={{ width: 180 }}
          />
          <Select 
            defaultValue=""
            style={{ width: 160 }} 
            onChange={(val) => setFilters({ ...filters, status: val })}
          >
            <Option value="">All Statuses</Option>
            <Option value="PENDING">Pending</Option>
            <Option value="CONFIRMED">Confirmed</Option>
            <Option value="COMPLETED">Completed</Option>
            <Option value="CANCELLED">Cancelled</Option>
            <Option value="EXPIRED">Expired</Option>
          </Select>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredReservations} 
        rowKey="reservationId" 
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 900 }}
      />
    </Card>
  );
};

export default ManagerReservations;
