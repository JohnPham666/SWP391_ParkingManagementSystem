import React, { useState, useEffect, useCallback } from 'react';
import { Table, Input, Select, Tag, Modal, Button, message, Space, Card, Typography } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { sessionApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

/**
 * StaffSessions - Trang quản lý phiên gửi xe dành cho Staff
 * 
 * Tính năng:
 * - Danh sách phiên gửi xe với tìm kiếm biển số, lọc trạng thái, loại xe, cổng vào
 * - Modal chi tiết phiên (biển số, chỗ đỗ, loại xe, giờ vào/ra, phí)
 * - Auto-refresh mỗi 10 giây (silent polling)
 */
const StaffSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: null, vehicleType: null, entryGate: null });

  // Modal States
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // === Fetch Sessions ===
  const fetchSessions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await sessionApi.getSessions();
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        data.sort((a, b) => new Date(b.entryTime || 0) - new Date(a.entryTime || 0));
        setSessions(data);
      } else {
        setSessions([]);
      }
    } catch (error) {
      if (!silent) message.error('Failed to load parking sessions');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Auto-refresh polling mỗi 10 giây
  useEffect(() => {
    fetchSessions();
    const interval = setInterval(() => fetchSessions(true), 10000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // === Show Session Detail Modal ===
  const showSessionDetail = async (id) => {
    setIsDetailVisible(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await sessionApi.getSession(id);
      const s = res.data?.success ? res.data.data : res.data;
      setDetailData(s);
    } catch {
      message.error('Lỗi tải chi tiết phiên');
    } finally {
      setDetailLoading(false);
    }
  };

  // === Status Badge Helper ===
  const getStatusTag = (status) => {
    const map = {
      'ACTIVE': { color: 'blue', label: 'Đang đỗ' },
      'PARKING': { color: 'blue', label: 'Đang đỗ' },
      'COMPLETED': { color: 'green', label: 'Hoàn thành' },
      'UNPAID': { color: 'orange', label: 'Chưa thanh toán' },
      'LOST_TICKET': { color: 'red', label: 'Mất vé' },
    };
    const s = map[status] || { color: 'default', label: status };
    return <Tag color={s.color} style={{ fontWeight: 600 }}>{s.label}</Tag>;
  };

  // === Extract unique vehicle types & entry gates for filter options ===
  const vehicleTypes = [...new Set(sessions.map(s => s.vehicleTypeName).filter(Boolean))];
  const entryGates = [...new Set(sessions.map(s => s.entryGate).filter(Boolean))];

  // === Filtered Data ===
  const filteredSessions = sessions.filter(s => {
    const searchMatch = !filters.search ||
      s.licensePlate?.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.sessionId?.toString().includes(filters.search);
    const statusMatch = !filters.status || s.status === filters.status;
    const vehicleTypeMatch = !filters.vehicleType || s.vehicleTypeName === filters.vehicleType;
    const entryGateMatch = !filters.entryGate || s.entryGate === filters.entryGate;
    return searchMatch && statusMatch && vehicleTypeMatch && entryGateMatch;
  });

  // === Table Columns ===
  const columns = [
    { title: 'ID', dataIndex: 'sessionId', key: 'sessionId', width: 80, render: (t) => <strong style={{ color: '#1677ff' }}>#{t}</strong> },
    { title: 'Biển số', dataIndex: 'licensePlate', key: 'licensePlate', render: (t) => <Tag color="blue" style={{ fontSize: 14, fontWeight: 'bold', padding: '4px 8px' }}>{t || '-'}</Tag> },
    { title: 'Chỗ đỗ', dataIndex: 'slotCode', key: 'slotCode', render: t => t || '-' },
    { title: 'Loại xe', dataIndex: 'vehicleTypeName', key: 'vehicleTypeName', render: t => t || '-' },
    { title: 'Giờ vào', dataIndex: 'entryTime', key: 'entryTime', render: (t) => t ? dayjs(t).format('DD/MM/YYYY HH:mm:ss') : '-' },
    { title: 'Cổng vào', dataIndex: 'entryGate', key: 'entryGate', render: t => t || '-' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => getStatusTag(status) },
    {
      title: 'Chi tiết', key: 'action', width: 90,
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => showSessionDetail(record.sessionId)}>Xem</Button>
      )
    },
  ];

  return (
    <div>
      {/* === Header === */}
      <Card style={{ marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Danh sách phiên gửi xe</Title>
          <Text type="secondary">Quản lý các xe đang đỗ trong bãi và lịch sử ra vào</Text>
        </div>
      </Card>

      {/* === Table === */}
      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }} size="middle">
          <Input placeholder="Tìm biển số xe..." prefix={<SearchOutlined />}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 250 }} size="large" allowClear />
          <Select placeholder="Tất cả trạng thái" style={{ width: 180 }} allowClear size="large"
            onChange={(val) => setFilters({ ...filters, status: val })}>
            <Option value="ACTIVE">Đang đỗ</Option>
            <Option value="PARKING">Đang đỗ (PARKING)</Option>
            <Option value="COMPLETED">Hoàn thành</Option>
            <Option value="UNPAID">Chưa thanh toán</Option>
            <Option value="LOST_TICKET">Mất vé</Option>
          </Select>
          <Select placeholder="Tất cả loại xe" style={{ width: 160 }} allowClear size="large"
            onChange={(val) => setFilters({ ...filters, vehicleType: val })}>
            {vehicleTypes.map(vt => (
              <Option key={vt} value={vt}>{vt}</Option>
            ))}
          </Select>
          <Select placeholder="Tất cả cổng vào" style={{ width: 160 }} allowClear size="large"
            onChange={(val) => setFilters({ ...filters, entryGate: val })}>
            {entryGates.map(g => (
              <Option key={g} value={g}>{g}</Option>
            ))}
          </Select>
        </Space>
        <Table columns={columns} dataSource={filteredSessions} rowKey="sessionId"
          loading={loading} pagination={{ pageSize: 15 }} scroll={{ x: 900 }} size="middle" />
      </Card>

      {/* === SESSION DETAIL MODAL === */}
      <Modal title={<span style={{ fontSize: 18 }}>Chi tiết phiên gửi xe {detailData ? `#${detailData.sessionId}` : ''}</span>}
        open={isDetailVisible} onCancel={() => setIsDetailVisible(false)}
        footer={[<Button key="close" type="primary" onClick={() => setIsDetailVisible(false)}>Đóng</Button>]}
        width={550}>
        {detailLoading ? <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div> : detailData && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', lineHeight: 2 }}>
            <div><strong>Biển số xe:</strong> <Tag color="blue" style={{ fontWeight: 'bold' }}>{detailData.licensePlate || '-'}</Tag></div>
            <div><strong>Trạng thái:</strong> {getStatusTag(detailData.status)}</div>
            <div><strong>Chỗ đỗ:</strong> {detailData.slotCode || '-'}</div>
            <div><strong>Loại xe:</strong> {detailData.vehicleTypeName || '-'}</div>
            <div><strong>Khách hàng:</strong> {detailData.customerName || '-'}</div>
            <div><strong>Số điện thoại:</strong> {detailData.customerPhone || '-'}</div>
            <div><strong>Giờ vào:</strong> {detailData.entryTime ? dayjs(detailData.entryTime).format('DD/MM/YYYY HH:mm:ss') : '-'}</div>
            <div><strong>Cổng vào:</strong> {detailData.entryGate || '-'}</div>
            <div><strong>Giờ ra:</strong> {detailData.exitTime ? dayjs(detailData.exitTime).format('DD/MM/YYYY HH:mm:ss') : '-'}</div>
            <div><strong>Cổng ra:</strong> {detailData.exitGate || '-'}</div>
            <div><strong>Phí dự kiến:</strong> <span style={{ color: '#ea580c', fontWeight: 600 }}>{detailData.estimatedFee != null ? detailData.estimatedFee.toLocaleString('vi-VN') + ' đ' : '-'}</span></div>
            <div><strong>Phí thực tế:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>{detailData.finalFee != null ? detailData.finalFee.toLocaleString('vi-VN') + ' đ' : '-'}</span></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StaffSessions;
