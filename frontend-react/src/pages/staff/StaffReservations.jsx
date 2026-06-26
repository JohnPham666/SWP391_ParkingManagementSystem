import React, { useState, useEffect } from 'react';
import { Table, Card, Space, Input, Select, Tag, message, Typography, DatePicker } from 'antd';
import { SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import { reservationApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

const StaffReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: null });
  const [selectedDate, setSelectedDate] = useState(dayjs()); // Default: today

  useEffect(() => {
    fetchReservations();
    const interval = setInterval(() => {
      fetchReservations(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const fetchReservations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await reservationApi.getReservations();
      let data = res.data?.success ? res.data.data : res.data;
      if (!Array.isArray(data) && data && Array.isArray(data.content)) {
        data = data.content;
      }
      
      if (Array.isArray(data)) {
        // Filter by selected date
        if (selectedDate) {
          const dateStr = selectedDate.format('YYYY-MM-DD');
          data = data.filter(r => r.startTime && dayjs(r.startTime).format('YYYY-MM-DD') === dateStr);
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
      r.userName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      r.licensePlate?.toLowerCase().includes(filters.search.toLowerCase()) ||
      r.userPhone?.includes(filters.search) ||
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
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div>{record.userName || 'Guest'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.userPhone || 'No Phone'}</div>
        </div>
      )
    },
    {
      title: 'Biển số',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      render: (text) => <strong style={{ color: '#ea580c' }}>{text || '-'}</strong>
    },
    {
      title: 'Chỗ đỗ',
      dataIndex: 'slotCode',
      key: 'slotCode',
      render: (text) => text || 'Bất kỳ'
    },
    {
      title: 'Dự kiến đến',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let label = status || '-';
        if (status === 'CONFIRMED') { color = 'success'; label = 'Đã xác nhận'; }
        if (status === 'COMPLETED') { color = 'processing'; label = 'Hoàn thành'; }
        if (status === 'CANCELLED') { color = 'error'; label = 'Đã hủy'; }
        if (status === 'PENDING') { color = 'warning'; label = 'Chờ duyệt'; }
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
            Đặt chỗ — {selectedDate ? selectedDate.format('DD/MM/YYYY') : 'Tất cả'}
          </span>
          <DatePicker
            value={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            format="DD/MM/YYYY"
            allowClear
            placeholder="Chọn ngày"
            style={{ width: 160 }}
          />
        </div>
      }
    >
      <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        <Input 
          placeholder="Tìm theo ID, tên, SĐT, biển số..." 
          prefix={<SearchOutlined />} 
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: 300 }}
        />
        <Select 
          placeholder="Tất cả trạng thái" 
          style={{ width: 160 }} 
          allowClear 
          onChange={(val) => setFilters({ ...filters, status: val })}
        >
          <Option value="CONFIRMED">Đã xác nhận</Option>
          <Option value="COMPLETED">Hoàn thành</Option>
          <Option value="PENDING">Chờ duyệt</Option>
          <Option value="CANCELLED">Đã hủy</Option>
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
