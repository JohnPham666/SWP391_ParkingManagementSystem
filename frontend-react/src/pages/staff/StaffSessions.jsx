import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Tag, Modal, Form, message, Space, Card, Upload, Row, Col, Typography } from 'antd';
import { SearchOutlined, CarOutlined, CreditCardOutlined, UploadOutlined, SafetyCertificateOutlined, EyeOutlined } from '@ant-design/icons';
import { sessionApi, paymentApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

/**
 * StaffSessions - Trang quản lý phiên gửi xe dành cho Staff
 * Chuyển đổi từ staff/js/pages/sessions.js sang React
 * 
 * Tính năng:
 * - Danh sách phiên gửi xe với tìm kiếm biển số, lọc trạng thái, sắp xếp thời gian
 * - Modal chi tiết phiên (biển số, chỗ đỗ, loại xe, giờ vào/ra, phí)
 * - Walk-in Check-in, Reservation Check-in, Check-out & Payment
 * - Auto-refresh mỗi 10 giây (silent polling)
 */
const StaffSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: null });

  // Modal States
  const [isWalkInVisible, setIsWalkInVisible] = useState(false);
  const [isResCheckInVisible, setIsResCheckInVisible] = useState(false);
  const [isCheckOutVisible, setIsCheckOutVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);

  const [checkOutStep, setCheckOutStep] = useState(1);
  const [checkoutSessionData, setCheckoutSessionData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const [walkInForm] = Form.useForm();
  const [resCheckInForm] = Form.useForm();
  const [checkOutSearchForm] = Form.useForm();
  const [checkOutConfirmForm] = Form.useForm();

  // === Fetch Sessions ===
  const fetchSessions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await sessionApi.getSessions();
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        data.sort((a, b) => new Date(b.checkInTime || b.entryTime || 0) - new Date(a.checkInTime || a.entryTime || 0));
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

  // === Walk-in Check-in ===
  const handleWalkInSubmit = async (values) => {
    try {
      const payload = {
        licensePlate: values.licensePlate,
        vehicleTypeId: parseInt(values.vehicleType, 10),
        entryGate: values.entryGate,
      };
      const res = await sessionApi.walkIn(payload);
      const sessionData = res.data.data;

      if (values.entryImage?.fileList?.length > 0) {
        const file = values.entryImage.fileList[0].originFileObj;
        await sessionApi.uploadSessionImage(sessionData.sessionId, file, 'entry');
      }

      message.success('Check-in Vãng lai thành công!');
      setIsWalkInVisible(false);
      walkInForm.resetFields();

      setSummaryData({
        ...sessionData,
        plate: values.licensePlate,
        type: values.vehicleType === '1' ? 'Ô tô' : values.vehicleType === '2' ? 'Xe máy' : 'Xe đạp',
        gate: values.entryGate,
        time: new Date().toLocaleString('vi-VN'),
        image: values.entryImage ? URL.createObjectURL(values.entryImage.fileList[0].originFileObj) : null
      });
      setIsSummaryVisible(true);
      fetchSessions();
    } catch (error) {
      message.error(error.response?.data?.message || 'Check-in thất bại');
    }
  };

  // === Reservation Check-in ===
  const handleResCheckInSubmit = async (values) => {
    try {
      const payload = {
        reservationId: parseInt(values.reservationId, 10),
        entryGate: values.entryGate,
      };
      await sessionApi.checkIn(payload);
      message.success('Check-in theo đặt chỗ thành công!');
      setIsResCheckInVisible(false);
      resCheckInForm.resetFields();
      fetchSessions();
    } catch (error) {
      message.error(error.response?.data?.message || 'Check-in thất bại');
    }
  };

  // === Check-out Search ===
  const handleCheckOutSearch = async (values) => {
    try {
      const res = await sessionApi.getActiveByPlate(values.licensePlate);
      if (!res.data?.data) {
        message.error('Không tìm thấy phiên đang hoạt động cho biển số này');
        return;
      }
      const targetSession = res.data.data;
      const pRes = await paymentApi.createPayment({ sessionId: targetSession.sessionId, paymentMethod: 'CASH' });
      let paymentId = pRes.data?.data?.paymentId;
      let finalFee = pRes.data?.data?.amount || targetSession.estimatedFee || 0;

      let exitImageUrl = null, exitImageFile = null;
      if (values.exitImage?.fileList?.length > 0) {
        exitImageFile = values.exitImage.fileList[0].originFileObj;
        exitImageUrl = URL.createObjectURL(exitImageFile);
      }

      setCheckoutSessionData({
        ...targetSession, paymentId, exitImageFile, exitImageUrl,
        exitTime: new Date().toISOString(), totalFee: finalFee
      });
      setCheckOutStep(2);
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi tìm xe');
    }
  };

  // === Check-out Confirm ===
  const handleCheckOutConfirm = async (values) => {
    try {
      const { sessionId, paymentId, exitImageFile } = checkoutSessionData;
      if (exitImageFile) await sessionApi.uploadSessionImage(sessionId, exitImageFile, 'exit');

      if (values.paymentMethod === 'CASH') {
        await paymentApi.confirmCash(paymentId);
        message.success('Check-out & Thanh toán thành công!');
      } else {
        const vnRes = await paymentApi.createVnPayUrl(paymentId);
        if (vnRes.data?.data?.paymentUrl) {
          window.open(vnRes.data.data.paymentUrl, '_blank');
          message.info('Đã mở cổng thanh toán VNPay');
        }
      }
      setIsCheckOutVisible(false);
      setCheckOutStep(1);
      checkOutSearchForm.resetFields();
      checkOutConfirmForm.resetFields();
      fetchSessions();
    } catch (error) {
      message.error(error.response?.data?.message || 'Check-out thất bại');
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

  // === Filtered Data ===
  const filteredSessions = sessions.filter(s => {
    const searchMatch = !filters.search ||
      s.licensePlate?.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.sessionId?.toString().includes(filters.search);
    const statusMatch = !filters.status || s.status === filters.status;
    return searchMatch && statusMatch;
  });

  // === Table Columns ===
  const columns = [
    { title: 'ID', dataIndex: 'sessionId', key: 'sessionId', width: 80, render: (t) => <strong style={{ color: '#1677ff' }}>#{t}</strong> },
    { title: 'Biển số', dataIndex: 'licensePlate', key: 'licensePlate', render: (t) => <Tag color="blue" style={{ fontSize: 14, fontWeight: 'bold', padding: '4px 8px' }}>{t || '-'}</Tag> },
    { title: 'Chỗ đỗ', dataIndex: 'slotCode', key: 'slotCode', render: t => t || '-' },
    { title: 'Loại xe', dataIndex: 'vehicleTypeName', key: 'vehicleTypeName', render: t => t || '-' },
    { title: 'Giờ vào', dataIndex: 'checkInTime', key: 'checkInTime', render: (t) => t ? dayjs(t).format('DD/MM/YYYY HH:mm:ss') : '-' },
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
      {/* === Action Bar === */}
      <Card style={{ marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>Danh sách phiên gửi xe</Title>
            <Text type="secondary">Quản lý các xe đang đỗ trong bãi và lịch sử ra vào</Text>
          </div>
          <Space wrap>
            <Button type="primary" size="large" icon={<CarOutlined />}
              style={{ backgroundColor: '#10b981', minWidth: 160, fontWeight: 'bold', borderRadius: 8 }}
              onClick={() => setIsWalkInVisible(true)}>
              Check-in Vãng lai
            </Button>
            <Button size="large" icon={<SafetyCertificateOutlined />}
              style={{ borderColor: '#3b82f6', color: '#3b82f6', minWidth: 160, fontWeight: 'bold', borderRadius: 8 }}
              onClick={() => setIsResCheckInVisible(true)}>
              Check-in Đặt chỗ
            </Button>
            <Button type="primary" danger size="large" icon={<CreditCardOutlined />}
              style={{ minWidth: 160, fontWeight: 'bold', borderRadius: 8 }}
              onClick={() => setIsCheckOutVisible(true)}>
              Check-out
            </Button>
          </Space>
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
            <div><strong>Giờ vào:</strong> {detailData.checkInTime ? dayjs(detailData.checkInTime).format('DD/MM/YYYY HH:mm:ss') : '-'}</div>
            <div><strong>Cổng vào:</strong> {detailData.entryGate || '-'}</div>
            <div><strong>Giờ ra:</strong> {detailData.checkOutTime ? dayjs(detailData.checkOutTime).format('DD/MM/YYYY HH:mm:ss') : '-'}</div>
            <div><strong>Cổng ra:</strong> {detailData.exitGate || '-'}</div>
            <div><strong>Phí dự kiến:</strong> <span style={{ color: '#ea580c', fontWeight: 600 }}>{detailData.estimatedFee != null ? detailData.estimatedFee.toLocaleString('vi-VN') + ' đ' : '-'}</span></div>
            <div><strong>Phí thực tế:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>{detailData.finalFee != null ? detailData.finalFee.toLocaleString('vi-VN') + ' đ' : '-'}</span></div>
          </div>
        )}
      </Modal>

      {/* === WALK-IN MODAL === */}
      <Modal title="Check-in Vãng lai" open={isWalkInVisible}
        onCancel={() => { setIsWalkInVisible(false); walkInForm.resetFields(); }} footer={null}>
        <Form form={walkInForm} layout="vertical" onFinish={handleWalkInSubmit} size="large">
          <Form.Item name="entryImage" label="Ảnh xe vào" rules={[{ required: true, message: 'Vui lòng chụp ảnh' }]}>
            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
              <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="licensePlate" label="Biển số xe" rules={[{ required: true, message: 'Nhập biển số' }]}>
            <Input placeholder="VD: 29A-12345" style={{ textTransform: 'uppercase', fontSize: 18, fontWeight: 'bold' }} />
          </Form.Item>
          <Form.Item name="vehicleType" label="Loại xe" rules={[{ required: true }]}>
            <Select><Option value="1">Ô tô</Option><Option value="2">Xe máy</Option><Option value="3">Xe đạp</Option></Select>
          </Form.Item>
          <Form.Item name="entryGate" label="Cổng vào" initialValue="Gate A">
            <Select><Option value="Gate A">Gate A</Option><Option value="Gate B">Gate B</Option></Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block style={{ height: 50, fontSize: 16, fontWeight: 'bold', backgroundColor: '#10b981' }}>
            Xác nhận Check-in
          </Button>
        </Form>
      </Modal>

      {/* === RESERVATION CHECK-IN MODAL === */}
      <Modal title="Check-in theo Đặt chỗ" open={isResCheckInVisible}
        onCancel={() => { setIsResCheckInVisible(false); resCheckInForm.resetFields(); }} footer={null}>
        <Form form={resCheckInForm} layout="vertical" onFinish={handleResCheckInSubmit} size="large">
          <Form.Item name="reservationId" label="Mã đặt chỗ (Reservation ID)" rules={[{ required: true, message: 'Nhập mã đặt chỗ' }]}>
            <Input type="number" placeholder="VD: 12345" />
          </Form.Item>
          <Form.Item name="entryGate" label="Cổng vào" initialValue="Gate A">
            <Select><Option value="Gate A">Gate A</Option><Option value="Gate B">Gate B</Option></Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block style={{ height: 50, fontSize: 16, fontWeight: 'bold' }}>
            Xác nhận Check-in
          </Button>
        </Form>
      </Modal>

      {/* === SUMMARY MODAL === */}
      <Modal title="Tóm tắt phiên" open={isSummaryVisible} onCancel={() => setIsSummaryVisible(false)}
        footer={[<Button key="close" type="primary" onClick={() => setIsSummaryVisible(false)}>Đóng</Button>]} width={400}>
        {summaryData && (
          <div style={{ textAlign: 'center' }}>
            {summaryData.image && <img src={summaryData.image} alt="Entry" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />}
            <p><strong>Biển số:</strong> <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1677ff' }}>{summaryData.plate}</span></p>
            <p><strong>Loại xe:</strong> {summaryData.type}</p>
            <p><strong>Giờ vào:</strong> {summaryData.time}</p>
            <p><strong>Cổng:</strong> {summaryData.gate}</p>
          </div>
        )}
      </Modal>

      {/* === CHECK-OUT MODAL === */}
      <Modal title="Check-out & Thanh toán" open={isCheckOutVisible}
        onCancel={() => { setIsCheckOutVisible(false); setCheckOutStep(1); checkOutSearchForm.resetFields(); checkOutConfirmForm.resetFields(); }}
        footer={null} width={700}>
        {checkOutStep === 1 && (
          <Form form={checkOutSearchForm} layout="vertical" onFinish={handleCheckOutSearch} size="large">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="exitImage" label="Ảnh xe ra" rules={[{ required: true, message: 'Tải ảnh lên' }]}>
                  <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                    <Button icon={<UploadOutlined />} block>Tải ảnh lên</Button>
                  </Upload>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="licensePlate" label="Biển số xe" rules={[{ required: true, message: 'Nhập biển số' }]}>
                  <Input placeholder="VD: 29A-12345" style={{ textTransform: 'uppercase' }} />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" htmlType="submit" block style={{ height: 50, fontSize: 16, fontWeight: 'bold' }}>Tìm xe</Button>
          </Form>
        )}
        {checkOutStep === 2 && checkoutSessionData && (
          <Form form={checkOutConfirmForm} layout="vertical" onFinish={handleCheckOutConfirm} size="large">
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={12} style={{ textAlign: 'center' }}>
                <p><strong>Ảnh vào</strong></p>
                <div style={{ height: 150, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                  <Text type="secondary">Không có ảnh</Text>
                </div>
              </Col>
              <Col span={12} style={{ textAlign: 'center' }}>
                <p><strong>Ảnh ra</strong></p>
                {checkoutSessionData.exitImageUrl
                  ? <img src={checkoutSessionData.exitImageUrl} alt="Exit" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8 }} />
                  : <div style={{ height: 150, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}><Text type="secondary">Không có ảnh</Text></div>}
              </Col>
            </Row>
            <Card style={{ backgroundColor: '#f8fafc', marginBottom: 20 }} bodyStyle={{ padding: 16 }}>
              <Row>
                <Col span={12}>
                  <p><strong>Biển số:</strong> <Text strong style={{ color: '#1677ff', fontSize: 16 }}>{checkoutSessionData.licensePlate}</Text></p>
                  <p><strong>Giờ vào:</strong> {dayjs(checkoutSessionData.checkInTime).format('DD/MM/YYYY HH:mm:ss')}</p>
                </Col>
                <Col span={12}>
                  <p><strong>Giờ ra:</strong> {dayjs(checkoutSessionData.exitTime).format('DD/MM/YYYY HH:mm:ss')}</p>
                  <p><strong>Phí:</strong> <Text strong style={{ color: '#ea580c', fontSize: 18 }}>{checkoutSessionData.totalFee?.toLocaleString()} ₫</Text></p>
                </Col>
              </Row>
            </Card>
            <Form.Item name="paymentMethod" label="Phương thức thanh toán" initialValue="CASH" rules={[{ required: true }]}>
              <Select><Option value="CASH">Tiền mặt</Option><Option value="BANK_TRANSFER">Chuyển khoản</Option><Option value="E_WALLET">Ví điện tử</Option></Select>
            </Form.Item>
            <div style={{ display: 'flex', gap: 16 }}>
              <Button block onClick={() => setCheckOutStep(1)} style={{ height: 50 }}>Quay lại</Button>
              <Button type="primary" htmlType="submit" block style={{ height: 50, fontSize: 16, fontWeight: 'bold', backgroundColor: '#10b981' }}>Xác nhận thanh toán</Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default StaffSessions;
