import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Button, Spin, message, Modal, Form, Input, Select, Upload, Tag } from 'antd';
import { 
  CarOutlined, 
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  LogoutOutlined,
  ScanOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { monitoringApi, reservationApi, sessionApi, paymentApi, vehicleApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const StaffDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [todayReservationList, setTodayReservationList] = useState([]);
  const navigate = useNavigate();

  // --- Modal States ---
  const [isCheckInVisible, setIsCheckInVisible] = useState(false);
  const [isCheckOutVisible, setIsCheckOutVisible] = useState(false);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  
  const [checkOutStep, setCheckOutStep] = useState(1);
  const [checkoutSessionData, setCheckoutSessionData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  const [matchedReservation, setMatchedReservation] = useState(null);
  const [searchFallback, setSearchFallback] = useState('');

  const [checkInForm] = Form.useForm();
  const [checkOutSearchForm] = Form.useForm();
  const [checkOutConfirmForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, resRes] = await Promise.all([
        monitoringApi.getDashboard().catch(() => ({ data: { data: null } })),
        reservationApi.getReservations().catch(() => ({ data: { data: [] } }))
      ]);

      if (dashRes.data?.success) {
        setDashboardData(dashRes.data.data);
      }

      let resList = resRes.data?.data || resRes.data || [];
      if (Array.isArray(resList)) {
        const todayStr = dayjs().format('YYYY-MM-DD');
        const todayRes = resList.filter(r => 
          r.startTime && dayjs(r.startTime).format('YYYY-MM-DD') === todayStr && r.status === 'CONFIRMED'
        );
        setTodayReservationList(todayRes);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // --- Modal Actions ---
  const handleLicensePlateChange = (e) => {
    const plate = e.target.value.toUpperCase();
    if (plate.length >= 4) {
      const match = todayReservationList.find(r => r.licensePlate && r.licensePlate.toUpperCase() === plate);
      setMatchedReservation(match || null);
    } else {
      setMatchedReservation(null);
    }
  };

  const handleFallbackSearch = () => {
    if (!searchFallback) return;
    const match = todayReservationList.find(r => 
      r.reservationId.toString() === searchFallback || 
      (r.userPhone && r.userPhone.includes(searchFallback))
    );
    if (match) {
      setMatchedReservation(match);
      checkInForm.setFieldsValue({ licensePlate: match.licensePlate, vehicleType: '1' }); // Set default to car if found
      message.success('Found matching reservation!');
    } else {
      message.error('No reservation found for this ID/Phone today.');
    }
  };

  const handleCheckInSubmit = async (values) => {
    try {
      let sessionData = null;
      if (matchedReservation) {
        // Reservation Check-in Flow
        const payload = {
          reservationId: matchedReservation.reservationId,
          entryGate: values.entryGate,
        };
        const res = await sessionApi.checkIn(payload); // Ensure checkIn matches Reservation checkin endpoint
        sessionData = res.data?.data || { sessionId: matchedReservation.reservationId }; // Mock fallback if API differs
      } else {
        // Walk-in Flow
        const payload = {
          licensePlate: values.licensePlate,
          vehicleTypeId: parseInt(values.vehicleType, 10),
          entryGate: values.entryGate,
        };
        const res = await sessionApi.walkIn(payload);
        sessionData = res.data?.data;
      }
      
      if (values.entryImage && values.entryImage.fileList.length > 0 && sessionData?.sessionId) {
        const file = values.entryImage.fileList[0].originFileObj;
        await sessionApi.uploadSessionImage(sessionData.sessionId, file, 'entry');
      }

      message.success('Check-in Successful!');
      setIsCheckInVisible(false);
      checkInForm.resetFields();
      setMatchedReservation(null);
      setSearchFallback('');
      
      setSummaryData({
        ...sessionData,
        plate: values.licensePlate,
        type: matchedReservation ? 'Reservation' : values.vehicleType,
        gate: values.entryGate,
        time: new Date().toLocaleString(),
        image: values.entryImage ? URL.createObjectURL(values.entryImage.fileList[0].originFileObj) : null
      });
      setIsSummaryVisible(true);
      fetchData(); // Refresh dashboard stats
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
      
      const pRes = await paymentApi.createPayment({ sessionId: targetSession.sessionId, paymentMethod: 'CASH' });
      let paymentId = pRes.data?.data?.paymentId;
      let finalFee = pRes.data?.data?.amount || targetSession.estimatedFee || 0;

      let exitImageUrl = null;
      let exitImageFile = null;
      if (values.exitImage && values.exitImage.fileList.length > 0) {
        exitImageFile = values.exitImage.fileList[0].originFileObj;
        exitImageUrl = URL.createObjectURL(exitImageFile);
      }

      setCheckoutSessionData({
        ...targetSession,
        paymentId,
        exitImageFile,
        exitImageUrl,
        exitTime: new Date().toISOString(),
        totalFee: finalFee
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
      const paymentId = checkoutSessionData.paymentId;
      
      if (checkoutSessionData.exitImageFile) {
        await sessionApi.uploadSessionImage(sessionId, checkoutSessionData.exitImageFile, 'exit');
      }

      if (values.paymentMethod === 'CASH') {
         await paymentApi.confirmCash(paymentId);
         message.success('Check-out & Payment Successful!');
      } else {
         const vnRes = await paymentApi.createVnPayUrl(paymentId);
         if (vnRes.data?.data?.paymentUrl) {
            window.open(vnRes.data.data.paymentUrl, '_blank');
            message.info('Opened VNPay Payment Gateway');
         }
      }
      
      setIsCheckOutVisible(false);
      setCheckOutStep(1);
      checkOutSearchForm.resetFields();
      checkOutConfirmForm.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Check-out failed');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  if (!dashboardData) return <div style={{ textAlign: 'center', padding: '50px' }}>Error loading data</div>;

  const sum = dashboardData.summary;

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Staff Dashboard</Title>

      <Row gutter={[24, 24]}>
        {/* Card 1: Capacity */}
        <Col xs={24} sm={12}>
          <Card 
            hoverable 
            onClick={() => navigate('/staff/slots')}
            style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
              borderRadius: '12px',
              borderLeft: '6px solid #1677ff'
            }}
          >
            <Statistic
              title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Current / Total Capacity</span>}
              value={`${sum.currentOccupancy} / ${sum.totalCapacity}`}
              prefix={<CarOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1f2937', fontWeight: 800, fontSize: '32px' }}
            />
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">View Building & Slots Details</Text>
              <ArrowRightOutlined style={{ color: '#1677ff' }} />
            </div>
          </Card>
        </Col>

        {/* Card 2: Reservations */}
        <Col xs={24} sm={12}>
          <Card 
            hoverable 
            onClick={() => navigate('/staff/reservations?date=today')}
            style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
              borderRadius: '12px',
              borderLeft: '6px solid #ea580c'
            }}
          >
            <Statistic
              title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Today's Reservations</span>}
              value={todayReservationList.length}
              prefix={<SafetyCertificateOutlined style={{ color: '#ea580c' }} />}
              valueStyle={{ color: '#1f2937', fontWeight: 800, fontSize: '32px' }}
            />
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">Manage Reservations</Text>
              <ArrowRightOutlined style={{ color: '#ea580c' }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3 Big Buttons */}
      <div style={{ marginTop: 40 }}>
        <Title level={4} style={{ marginBottom: 16 }}>Quick Actions</Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Button 
              type="primary" 
              block 
              style={{ 
                height: '100px', 
                fontSize: '22px', 
                fontWeight: 'bold', 
                backgroundColor: '#10b981', 
                borderColor: '#10b981',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                borderRadius: '12px'
              }}
              icon={<ScanOutlined style={{ fontSize: '28px' }} />}
              onClick={() => setIsCheckInVisible(true)}
            >
              Smart Check-in
            </Button>
          </Col>

          <Col xs={24} md={12}>
            <Button 
              type="primary" 
              danger
              block 
              style={{ 
                height: '100px', 
                fontSize: '20px', 
                fontWeight: 'bold', 
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                borderRadius: '12px'
              }}
              icon={<LogoutOutlined style={{ fontSize: '24px' }} />}
              onClick={() => setIsCheckOutVisible(true)}
            >
              Check-out
            </Button>
          </Col>
        </Row>
      </div>

      {/* SMART CHECK-IN MODAL */}
      <Modal
        title={
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            <ScanOutlined /> Smart Check-in
          </div>
        }
        open={isCheckInVisible}
        onCancel={() => { 
          setIsCheckInVisible(false); 
          checkInForm.resetFields(); 
          setMatchedReservation(null); 
          setSearchFallback(''); 
        }}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: '24px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>Fallback: Search if license plate changed</Text>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Input 
              placeholder="Enter Reservation ID or Phone..." 
              value={searchFallback}
              onChange={(e) => setSearchFallback(e.target.value)}
              onPressEnter={handleFallbackSearch}
            />
            <Button onClick={handleFallbackSearch}>Search</Button>
          </div>
        </div>

        <Form form={checkInForm} layout="vertical" onFinish={handleCheckInSubmit} size="large">
          <Form.Item name="entryImage" label="Entry Image (Camera)" rules={[{ required: true, message: 'Please upload image' }]}>
            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
              <Button icon={<UploadOutlined />} block>Upload Vehicle Image</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item name="licensePlate" label="License Plate" rules={[{ required: true, message: 'Please enter license plate' }]}>
            <Input 
              placeholder="e.g. 29A-12345" 
              style={{ textTransform: 'uppercase', fontSize: '18px', fontWeight: 'bold' }} 
              onChange={handleLicensePlateChange}
            />
          </Form.Item>

          {matchedReservation ? (
            <div style={{ padding: '16px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <SafetyCertificateOutlined style={{ color: '#10b981', fontSize: '20px' }} />
                <Text strong style={{ color: '#065f46', fontSize: '16px' }}>Reservation Found!</Text>
              </div>
              <p style={{ margin: 0 }}><strong>ID:</strong> #{matchedReservation.reservationId}</p>
              <p style={{ margin: 0 }}><strong>Customer:</strong> {matchedReservation.userName || 'Guest'}</p>
              <p style={{ margin: 0 }}><strong>Slot:</strong> {matchedReservation.slotCode || 'Any'}</p>
            </div>
          ) : (
            <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '24px' }}>
              <Text type="secondary">No reservation found for this plate. Proceeding as <strong style={{ color: '#1e293b' }}>Walk-in</strong>.</Text>
            </div>
          )}

          {!matchedReservation && (
            <Form.Item name="vehicleType" label="Vehicle Type" rules={[{ required: true }]}>
              <Select>
                <Option value="1">Car</Option>
                <Option value="2">Motorbike</Option>
                <Option value="3">Bicycle</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item name="entryGate" label="Entry Gate" initialValue="Gate A">
            <Select>
              <Option value="Gate A">Gate A</Option>
              <Option value="Gate B">Gate B</Option>
            </Select>
          </Form.Item>

          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            style={{ 
              height: '50px', 
              fontSize: '18px', 
              fontWeight: 'bold',
              backgroundColor: matchedReservation ? '#3b82f6' : '#10b981',
              borderColor: matchedReservation ? '#3b82f6' : '#10b981'
            }}
          >
            {matchedReservation ? 'Apply Reservation & Check-in' : 'Confirm Walk-in'}
          </Button>
        </Form>
      </Modal>

      {/* SUMMARY MODAL */}
      <Modal
        title="Session Summary"
        open={isSummaryVisible}
        onCancel={() => setIsSummaryVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsSummaryVisible(false)}>Close</Button>
        ]}
        width={400}
      >
        {summaryData && (
          <div style={{ textAlign: 'center' }}>
            {summaryData.image && (
              <img src={summaryData.image} alt="Entry" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} />
            )}
            <p><strong>Plate:</strong> <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1677ff' }}>{summaryData.plate}</span></p>
            <p><strong>Type:</strong> {summaryData.type}</p>
            <p><strong>Entry:</strong> {summaryData.time}</p>
            <p><strong>Gate:</strong> {summaryData.gate}</p>
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
                  <p><strong>Fee:</strong> <Text strong style={{ color: '#ea580c', fontSize: '18px' }}>{checkoutSessionData.totalFee.toLocaleString()} ₫</Text></p>
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

export default StaffDashboard;
