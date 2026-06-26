import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Modal, Form, message, Space, Card, Upload, Row, Col, Typography, Divider, DatePicker } from 'antd';
import { SearchOutlined, CarOutlined, CreditCardOutlined, UploadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { sessionApi, paymentApi, vehicleApi, pricingApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    status: null,
  });

  // Role Detection
  const auth = JSON.parse(localStorage.getItem('parking_auth') || '{}');
  const userRole = auth.user?.roleName || auth.role || auth.user?.role || 'ParkingStaff';
  const isStaff = userRole === 'ParkingStaff';

  // Modal States
  const [isWalkInVisible, setIsWalkInVisible] = useState(false);
  const [isResCheckInVisible, setIsResCheckInVisible] = useState(false);
  const [isCheckOutVisible, setIsCheckOutVisible] = useState(false);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  
  const [checkOutStep, setCheckOutStep] = useState(1); // 1: Search, 2: Confirm
  const [checkoutSessionData, setCheckoutSessionData] = useState(null);
  
  const [walkInForm] = Form.useForm();
  const [resCheckInForm] = Form.useForm();
  const [checkOutSearchForm] = Form.useForm();
  const [checkOutConfirmForm] = Form.useForm();

  // Summary Data
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    fetchSessions();
    fetchVehicleTypes();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      const res = await vehicleApi.getVehicles(); 
      // Note: we should actually call getVehicleTypes but the existing backend might serve it under /vehicle-types. 
      // If we don't have vehicleTypes api mapped, we can hardcode for now or map it.
    } catch (e) {}
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await sessionApi.getSessions();
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        data.sort((a, b) => new Date(b.checkInTime || 0) - new Date(a.checkInTime || 0));
        setSessions(data);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      message.error('Failed to load parking sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleWalkInSubmit = async (values) => {
    try {
      // Step 1: WalkIn api
      const payload = {
        licensePlate: values.licensePlate,
        vehicleTypeId: parseInt(values.vehicleType, 10),
        entryGate: values.entryGate,
      };
      const res = await sessionApi.walkIn(payload);
      const sessionData = res.data.data;
      
      // Step 2: Upload Image if provided
      if (values.entryImage && values.entryImage.fileList.length > 0) {
        const file = values.entryImage.fileList[0].originFileObj;
        await sessionApi.uploadSessionImage(sessionData.sessionId, file, 'entry');
      }

      message.success('Walk-in Check-in Successful!');
      setIsWalkInVisible(false);
      walkInForm.resetFields();
      
      // Show Summary
      setSummaryData({
        ...sessionData,
        plate: values.licensePlate,
        type: values.vehicleType,
        gate: values.entryGate,
        time: new Date().toLocaleString(),
        image: values.entryImage ? URL.createObjectURL(values.entryImage.fileList[0].originFileObj) : null
      });
      setIsSummaryVisible(true);
      fetchSessions();
    } catch (error) {
      message.error(error.response?.data?.message || 'Check-in failed');
    }
  };

  const handleResCheckInSubmit = async (values) => {
    try {
      const payload = {
        reservationId: parseInt(values.reservationId, 10),
        entryGate: values.entryGate,
      };
      const res = await sessionApi.walkIn(payload); // Usually walkIn maps to check-in
      const sessionData = res.data.data;

      message.success('Reservation Check-in Successful!');
      setIsResCheckInVisible(false);
      resCheckInForm.resetFields();
      fetchSessions();
    } catch (error) {
      message.error(error.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOutSearch = async (values) => {
    try {
      const res = await sessionApi.getActiveByPlate(values.licensePlate);
      if (!res.data || !res.data.data) {
        message.error('No active session found for this license plate');
        return;
      }
      
      const targetSession = res.data.data;
      
      let exitImageUrl = null;
      let exitImageFile = null;
      if (values.exitImage && values.exitImage.fileList.length > 0) {
        exitImageFile = values.exitImage.fileList[0].originFileObj;
        exitImageUrl = URL.createObjectURL(exitImageFile);
      }

      const exitTimeIso = new Date().toISOString();
      let calculatedFee = 0;
      
      if (!targetSession.hasActiveSubscription) {
         try {
             const feeRes = await pricingApi.calculateFee({
                vehicleTypeId: targetSession.vehicleTypeId,
                entryTime: dayjs(targetSession.entryTime).format('YYYY-MM-DDTHH:mm:ss'),
                exitTime: dayjs(exitTimeIso).format('YYYY-MM-DDTHH:mm:ss')
             });
             calculatedFee = feeRes.data.data.finalFee;
         } catch (e) {
             console.error("Fee calculation failed", e);
             message.error("Lỗi tính phí từ Backend: " + (e.response?.data?.message || e.message));
         }
      }

      setCheckoutSessionData({
        ...targetSession,
        exitImageFile,
        exitImageUrl,
        exitTime: exitTimeIso,
        totalFee: calculatedFee
      });

      setCheckOutStep(2);
    } catch (error) {
      if (error.response?.data?.message?.includes('already has a PENDING payment')) {
         message.error('Vehicle already in checkout process');
      } else {
         message.error(error.response?.data?.message || 'Error finding vehicle');
      }
    }
  };

  const handleCheckOutConfirm = async (values) => {
    try {
      const sessionId = checkoutSessionData.sessionId;
      
      // 1. Check out to finalize the fee and change status to UNPAID or COMPLETED
      const checkOutRes = await sessionApi.checkOut(sessionId, { exitGate: 'Gate A' });
      const updatedSession = checkOutRes.data?.data || checkOutRes.data;

      if (checkoutSessionData.exitImageFile) {
        await sessionApi.uploadSessionImage(sessionId, checkoutSessionData.exitImageFile, 'exit');
      }

      if (updatedSession.status === 'COMPLETED' || updatedSession.finalFee === 0) {
         message.success('Check-out Successful (Pre-paid / Zero Fee)');
         setIsCheckOutVisible(false);
         setCheckOutStep(1);
         checkOutSearchForm.resetFields();
         checkOutConfirmForm.resetFields();
         fetchSessions();
         return;
      }
      
      // 2. Create Payment
      const pRes = await paymentApi.createPayment({ sessionId: sessionId, paymentMethod: values.paymentMethod });
      const paymentId = pRes.data?.data?.paymentId;

      if (values.paymentMethod === 'CASH' || checkoutSessionData.totalFee === 0) {
         await paymentApi.confirmCash(paymentId);
         message.success('Check-out & Payment Successful!');
         setIsCheckOutVisible(false);
         setCheckOutStep(1);
         checkOutSearchForm.resetFields();
         checkOutConfirmForm.resetFields();
         fetchSessions();
      } else {
         const vnRes = await paymentApi.createVnPayUrl(paymentId);
         if (vnRes.data?.data?.paymentUrl) {
            window.open(vnRes.data.data.paymentUrl, '_blank');
            message.info('Opened VNPay Payment Gateway');
            setCheckoutSessionData({ ...checkoutSessionData, paymentId });
            setCheckOutStep(3);
         }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Check-out failed');
    }
  };

  // Extract unique vehicle types from sessions
  const uniqueVehicleTypes = Array.from(new Set(sessions.map(s => s.vehicleTypeName || s.vehicleType?.typeName || 'Ô tô')));

  // Filter
  const filteredSessions = sessions.filter(session => {
    const searchMatch = !filters.search || 
      session.licensePlate?.toLowerCase().includes(filters.search.toLowerCase()) ||
      session.sessionId?.toString().includes(filters.search);
    const statusMatch = !filters.status || session.status === filters.status || (filters.status === 'ACTIVE' && session.status === 'PARKING');
    const typeMatch = !filters.vehicleType || (session.vehicleTypeName || session.vehicleType?.typeName || 'Ô tô') === filters.vehicleType;
    const dateMatch = !filters.date || dayjs(session.checkInTime || session.checkinTime || session.entryTime).format('MM/DD/YYYY') === filters.date;
    return searchMatch && statusMatch && typeMatch && dateMatch;
  });

  const columns = [
    { title: 'ID', dataIndex: 'sessionId', key: 'sessionId', render: (text) => <strong>#{text}</strong> },
    { title: 'LICENSE PLATE', dataIndex: 'licensePlate', key: 'licensePlate', render: (text) => <strong style={{ fontSize: 14 }}>{text || 'N/A'}</strong> },
    { title: 'SLOT', dataIndex: 'slotCode', key: 'slotCode', render: text => text || '-' },
    { title: 'VEHICLE TYPE', key: 'vehicleType', render: (_, record) => record.vehicleTypeName || record.vehicleType?.typeName || 'Car' },
    { title: 'ENTRY TIME', key: 'checkInTime', render: (_, record) => {
        const time = record.checkInTime || record.checkinTime || record.entryTime;
        return time ? dayjs(time).format('HH:mm:ss DD/MM/YYYY') : '-';
    }},
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = status;
        if (status === 'ACTIVE' || status === 'PARKING') { color = 'error'; text = 'Parking'; }
        else if (status === 'COMPLETED') { color = 'success'; text = 'Completed'; }
        else if (status === 'UNPAID') { color = 'warning'; text = 'Unpaid'; }
        else if (status === 'LOST_TICKET') { color = 'purple'; text = 'Lost Ticket'; }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'ACTION',
      key: 'action',
      render: (_, record) => (
        <Button 
          style={{ borderRadius: 6, padding: '4px 16px', height: 'auto', borderColor: '#d9d9d9' }} 
          onClick={() => {
            setSummaryData({
              sessionId: record.sessionId,
              status: record.status,
              plate: record.licensePlate,
              type: record.vehicleTypeName || record.vehicleType?.typeName || 'N/A',
              time: record.checkInTime || record.checkinTime || record.entryTime ? dayjs(record.checkInTime || record.checkinTime || record.entryTime).format('HH:mm:ss DD/MM/YYYY') : '-',
              exitTime: record.checkOutTime ? dayjs(record.checkOutTime).format('HH:mm:ss DD/MM/YYYY') : '-',
              gate: record.entryGate,
              exitGate: record.exitGate,
              slot: record.slotCode,
              entryImage: record.entryImage || null,
              exitImage: record.exitImage || null
            });
            setIsSummaryVisible(true);
          }}
        >
          View
        </Button>
      ),
    }
  ];

  return (
    <div>
      {isStaff && (
        <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>Parking Sessions</Title>
            <Text type="secondary">Staff Operations Panel</Text>
          </div>
          <Space>
            <Button 
              type="primary" 
              size="large"
              icon={<CarOutlined />} 
              style={{ backgroundColor: '#10b981', minWidth: '160px', fontWeight: 'bold' }}
              onClick={() => setIsWalkInVisible(true)}
            >
              Walk-in Check-in
            </Button>
            <Button 
              type="default" 
              size="large"
              icon={<SafetyCertificateOutlined />} 
              style={{ borderColor: '#3b82f6', color: '#3b82f6', minWidth: '160px', fontWeight: 'bold' }}
              onClick={() => setIsResCheckInVisible(true)}
            >
              Reservation Check-in
            </Button>
            <Button 
              type="primary" 
              danger 
              size="large"
              icon={<CreditCardOutlined />} 
              style={{ minWidth: '160px', fontWeight: 'bold' }}
              onClick={() => setIsCheckOutVisible(true)}
            >
              Check-out
            </Button>
          </Space>
        </div>
      </Card>
      )}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '16px' }}>
          {!isStaff && (
            <Title level={4} style={{ margin: 0 }}>Parking Sessions</Title>
          )}
          <Space style={{ flexWrap: 'wrap' }}>
            <Input 
              placeholder="Search plate..." 
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ width: 180 }}
            />
            <Select 
              defaultValue=""
              style={{ width: 160 }} 
              onChange={(val) => setFilters({ ...filters, status: val })}
            >
              <Option value="">All Statuses</Option>
              <Option value="ACTIVE">Parking</Option>
              <Option value="COMPLETED">Completed</Option>
              <Option value="UNPAID">Unpaid</Option>
              <Option value="LOST_TICKET">Lost Ticket</Option>
            </Select>
            <Select 
              defaultValue=""
              style={{ width: 150 }} 
              onChange={(val) => setFilters({ ...filters, vehicleType: val })}
            >
              <Option value="">All Vehicle Types</Option>
              {uniqueVehicleTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
            <DatePicker 
              format="MM/DD/YYYY" 
              placeholder="mm/dd/yyyy" 
              onChange={(date, dateString) => setFilters({ ...filters, date: dateString })}
              style={{ width: 130 }}
            />
          </Space>
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredSessions} 
          rowKey="sessionId" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>

      {/* WALK-IN MODAL */}
      <Modal
        title="Walk-in Check-in"
        open={isWalkInVisible}
        onCancel={() => { setIsWalkInVisible(false); walkInForm.resetFields(); }}
        footer={null}
      >
        <Form form={walkInForm} layout="vertical" onFinish={handleWalkInSubmit} size="large">
          <Form.Item name="entryImage" label="Entry Image (Camera)" rules={[{ required: true, message: 'Please upload image' }]}>
            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="licensePlate" label="License Plate" rules={[{ required: true, message: 'Please enter license plate' }]}>
            <Input placeholder="e.g. 29A-12345" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="vehicleType" label="Vehicle Type" rules={[{ required: true }]}>
            <Select>
              <Option value="1">Car</Option>
              <Option value="2">Motorbike</Option>
              <Option value="3">Bicycle</Option>
            </Select>
          </Form.Item>
          <Form.Item name="entryGate" label="Entry Gate" initialValue="Gate A">
            <Select>
              <Option value="Gate A">Gate A</Option>
              <Option value="Gate B">Gate B</Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block style={{ height: '50px', fontSize: '16px', fontWeight: 'bold' }}>
            Confirm Check-in
          </Button>
        </Form>
      </Modal>

      {/* RESERVATION CHECK-IN MODAL */}
      <Modal
        title="Reservation Check-in"
        open={isResCheckInVisible}
        onCancel={() => { setIsResCheckInVisible(false); resCheckInForm.resetFields(); }}
        footer={null}
      >
        <Form form={resCheckInForm} layout="vertical" onFinish={handleResCheckInSubmit} size="large">
          <Form.Item name="reservationId" label="Reservation ID" rules={[{ required: true, message: 'Please enter reservation ID' }]}>
            <Input type="number" placeholder="e.g. 12345" />
          </Form.Item>
          <Form.Item name="entryGate" label="Entry Gate" initialValue="Gate A">
            <Select>
              <Option value="Gate A">Gate A</Option>
              <Option value="Gate B">Gate B</Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block style={{ height: '50px', fontSize: '16px', fontWeight: 'bold' }}>
            Confirm Check-in
          </Button>
        </Form>
      </Modal>

      {/* SUMMARY MODAL */}
      <Modal
        title="Session Summary"
        open={isSummaryVisible}
        onCancel={() => setIsSummaryVisible(false)}
        footer={null}
        width={600}
      >
        {summaryData && (
          <div>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">Session ID</Text>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>#{summaryData.sessionId || '-'}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Status</Text>
                <div>
                   {(() => {
                      let sColor = 'default';
                      let sText = summaryData.status;
                      if (sText === 'ACTIVE' || sText === 'PARKING') { sColor = 'error'; sText = 'Parking'; }
                      else if (sText === 'COMPLETED') { sColor = 'success'; sText = 'Completed'; }
                      else if (sText === 'UNPAID') { sColor = 'warning'; sText = 'Unpaid'; }
                      else if (sText === 'LOST_TICKET') { sColor = 'purple'; sText = 'Lost Ticket'; }
                      return <Tag color={sColor} style={{ borderRadius: 12 }}>{sText}</Tag>;
                   })()}
                </div>
              </Col>
              
              <Col span={12}>
                <Text type="secondary">License Plate</Text>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{summaryData.plate || '-'}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Vehicle Type</Text>
                <div style={{ fontSize: 16 }}>{summaryData.type || '-'}</div>
              </Col>
              
              <Col span={12}>
                <Text type="secondary">Entry Time</Text>
                <div style={{ fontSize: 16 }}>{summaryData.time || '-'}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Entry Gate</Text>
                <div style={{ fontSize: 16 }}>{summaryData.gate || '-'}</div>
              </Col>
              
              <Col span={12}>
                <Text type="secondary">Exit Time</Text>
                <div style={{ fontSize: 16 }}>{summaryData.exitTime || '-'}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Exit Gate</Text>
                <div style={{ fontSize: 16 }}>{summaryData.exitGate || '-'}</div>
              </Col>

              <Col span={12}>
                <Text type="secondary">Parking Slot</Text>
                <div style={{ fontSize: 16 }}>{summaryData.slot || '-'}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Staff (In/Out)</Text>
                <div style={{ fontSize: 16 }}>- / -</div>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0', borderBlockColor: 'transparent' }} />
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: '8px', fontWeight: 600 }}>Entry Image</Text>
                <div style={{ textAlign: 'center' }}>
                  {summaryData.entryImage ? (
                    <img src={summaryData.entryImage} alt="Entry" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e8e8e8' }} />
                  ) : (
                    <div style={{ height: '200px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                      <Text type="secondary" italic>No image available</Text>
                    </div>
                  )}
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: '8px', fontWeight: 600 }}>Exit Image</Text>
                <div style={{ textAlign: 'center' }}>
                  {summaryData.exitImage ? (
                    <img src={summaryData.exitImage} alt="Exit" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e8e8e8' }} />
                  ) : (
                    <div style={{ height: '200px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                      <Text type="secondary" italic>No image available</Text>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* CHECK-OUT MODAL */}
      <Modal
        title="Check-out & Payment"
        open={isCheckOutVisible}
        onCancel={() => { 
          setIsCheckOutVisible(false); 
          setCheckOutStep(1); 
          checkOutSearchForm.resetFields(); 
          checkOutConfirmForm.resetFields(); 
        }}
        footer={null}
        width={700}
      >
        {checkOutStep === 1 && (
          <Form form={checkOutSearchForm} layout="vertical" onFinish={handleCheckOutSearch} size="large">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="exitImage" label="Exit Image" rules={[{ required: true, message: 'Upload image' }]}>
                  <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                    <Button icon={<UploadOutlined />} block>Upload Image</Button>
                  </Upload>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="licensePlate" label="License Plate" rules={[{ required: true, message: 'Enter plate' }]}>
                  <Input placeholder="e.g. 29A-12345" style={{ textTransform: 'uppercase' }} />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" htmlType="submit" block style={{ height: '50px', fontSize: '16px', fontWeight: 'bold' }}>
              Search Vehicle
            </Button>
          </Form>
        )}

        {checkOutStep === 2 && checkoutSessionData && (
          <Form form={checkOutConfirmForm} layout="vertical" onFinish={handleCheckOutConfirm} size="large">
            <Row gutter={16} style={{ marginBottom: '20px' }}>
              <Col span={12} style={{ textAlign: 'center' }}>
                <p><strong>Entry Image</strong></p>
                <div style={{ height: '150px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                  <Text type="secondary">No Image</Text>
                </div>
              </Col>
              <Col span={12} style={{ textAlign: 'center' }}>
                <p><strong>Exit Image</strong></p>
                {checkoutSessionData.exitImageUrl ? (
                   <img src={checkoutSessionData.exitImageUrl} alt="Exit" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                   <div style={{ height: '150px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <Text type="secondary">No Image</Text>
                  </div>
                )}
              </Col>
            </Row>

            <Card style={{ backgroundColor: '#f8fafc', marginBottom: '20px' }} bodyStyle={{ padding: '16px' }}>
              <Row>
                <Col span={12}>
                  <p><strong>Plate:</strong> <Text strong style={{ color: '#1677ff', fontSize: '16px' }}>{checkoutSessionData.licensePlate}</Text></p>
                  <p><strong>Entry:</strong> {dayjs(checkoutSessionData.checkInTime).format('DD/MM/YYYY HH:mm:ss')}</p>
                </Col>
                <Col span={12}>
                  <p><strong>Exit:</strong> {dayjs(checkoutSessionData.exitTime).format('DD/MM/YYYY HH:mm:ss')}</p>
                  <div style={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}>
                    Fee: {checkoutSessionData.totalFee.toLocaleString()} ₫
                  </div>
                </Col>
              </Row>
            </Card>

            <Form.Item name="paymentMethod" label="Payment Method" initialValue="CASH" rules={[{ required: true }]}>
              <Select>
                <Option value="CASH">Cash</Option>
                <Option value="BANK_TRANSFER">Bank Transfer</Option>
                <Option value="E_WALLET">E-Wallet</Option>
              </Select>
            </Form.Item>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Button block onClick={() => setCheckOutStep(1)} style={{ height: '50px' }}>Cancel</Button>
              <Button type="primary" htmlType="submit" block style={{ height: '50px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#10b981', borderColor: '#10b981' }}>
                Confirm Payment
              </Button>
            </div>
          </Form>
        )}
      </Modal>

    </div>
  );
};

export default SessionManagement;
