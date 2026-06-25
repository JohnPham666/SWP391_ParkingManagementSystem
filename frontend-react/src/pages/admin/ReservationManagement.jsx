import React, { useState, useEffect } from 'react';
import { Table, Select, Tag, message, Card, Space, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { reservationApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: null });

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
    const searchMatch = !filters.search || 
      r.userName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      r.licensePlate?.toLowerCase().includes(filters.search.toLowerCase()) ||
      r.reservationId?.toString().includes(filters.search);
    const statusMatch = !filters.status || r.status === filters.status;
    return searchMatch && statusMatch;
  });

  const columns = [
    {
      title: 'Reservation ID',
      dataIndex: 'reservationId',
      key: 'reservationId',
      render: (text) => <strong>#{text}</strong>
    },
    {
      title: 'Customer',
      dataIndex: 'userName',
      key: 'userName',
      render: (text) => text || 'N/A'
    },
    {
      title: 'License Plate',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      render: (text) => text ? <Tag color="blue" style={{ fontSize: 14, fontWeight: 'bold' }}>{text}</Tag> : 'N/A'
    },
    {
      title: 'Parking Slot',
      dataIndex: 'slotCode',
      key: 'slotCode',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time) => time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '-'
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time) => time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select 
          value={status} 
          onChange={(val) => handleStatusChange(record.reservationId, val)}
          style={{ width: 130, fontWeight: 600 }}
          bordered={false}
          className={`status-select ${status}`}
        >
          <Option value="PENDING" style={{ color: '#d97706' }}>Pending</Option>
          <Option value="CONFIRMED" style={{ color: '#059669' }}>Confirmed</Option>
          <Option value="COMPLETED" style={{ color: '#2563eb' }}>Completed</Option>
          <Option value="CANCELLED" style={{ color: '#dc2626' }}>Cancelled</Option>
        </Select>
      )
    },
  ];

  return (
    <Card title="Reservation Management">
      <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        <Input 
          placeholder="Search name, plate, ID..." 
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
          <Option value="CONFIRMED">Confirmed</Option>
          <Option value="COMPLETED">Completed</Option>
          <Option value="CANCELLED">Cancelled</Option>
        </Select>
      </Space>

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

export default ReservationManagement;
