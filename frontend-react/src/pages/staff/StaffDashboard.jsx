import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Button, Spin, message, Modal, Form, Input, Select, Upload, Tag, Progress } from 'antd';
import { 
  CarOutlined, 
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  LogoutOutlined,
  ScanOutlined,
  UploadOutlined,
  CheckCircleFilled
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { monitoringApi, reservationApi, sessionApi, paymentApi, vehicleApi, pricingApi } from '../../services/api';
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

  // --- Poll VNPay Status ---
  useEffect(() => {
    let interval = null;
    if (checkOutStep === 3 && checkoutSessionData?.paymentId) {
      interval = setInterval(async () => {
        try {
          const res = await paymentApi.getPayment(checkoutSessionData.paymentId);
          const paymentData = res.data?.data || res.data;
          if (paymentData.paymentStatus === 'PAID') {
             clearInterval(interval);
             setCheckOutStep(4);
             fetchData();
             setTimeout(() => {
                setIsCheckOutVisible(false);
                setCheckOutStep(1);
                checkOutSearchForm.resetFields();
                checkOutConfirmForm.resetFields();
             }, 3000);
          }
        } catch (e) {
          console.error("Error polling VNPay status", e);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkOutStep, checkoutSessionData]);
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
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
          r.reservationStart && dayjs(r.reservationStart).format('YYYY-MM-DD') === todayStr && (r.status === 'CONFIRMED' || r.status === 'PENDING')
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
      const now = dayjs();
      const match = todayReservationList.find(r => 
        r.licensePlate && r.licensePlate.toUpperCase() === plate && r.status === 'CONFIRMED' && 
        now.isAfter(dayjs(r.reservationStart).subtract(30, 'minute')) && 
        now.isBefore(dayjs(r.reservationEnd))
      );
      setMatchedReservation(match || null);
    } else {
      setMatchedReservation(null);
    }
  };

  const handleFallbackSearch = () => {
    if (!searchFallback) return;
    const now = dayjs();
    const match = todayReservationList.find(r => 
      (r.reservationId.toString() === searchFallback || 
      (r.userFullName && r.userFullName.toLowerCase().includes(searchFallback.toLowerCase()))) && 
      r.status === 'CONFIRMED' &&
      now.isAfter(dayjs(r.reservationStart).subtract(30, 'minute')) && 
      now.isBefore(dayjs(r.reservationEnd))
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
         fetchData();
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
         fetchData();
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

  const handleSwitchToCash = async () => {
    try {
      if (!checkoutSessionData?.paymentId) return;
      setLoading(true);
      await paymentApi.confirmCash(checkoutSessionData.paymentId);
      message.success('Check-out & Payment Successful (Switched to Cash)!');
      setIsCheckOutVisible(false);
      setCheckOutStep(1);
      checkOutSearchForm.resetFields();
      checkOutConfirmForm.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to switch to cash');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  if (!dashboardData) return <div style={{ textAlign: 'center', padding: '50px' }}>Error loading data</div>;

  const sum = dashboardData.summary;

  // Calculate vehicle type stats
  const vTypeStats = {};
  if (dashboardData?.buildings) {
    dashboardData.buildings.forEach(b => {
      b.floors?.forEach(f => {
        f.zones?.forEach(z => {
          z.slots?.forEach(s => {
            const vType = s.vehicleTypeName || s.vehicleType?.typeName || 'Other';
            if (!vTypeStats[vType]) vTypeStats[vType] = { capacity: 0, current: 0 };
            vTypeStats[vType].capacity += (s.capacity || 1);
            vTypeStats[vType].current += (s.currentOccupancy || 0);
          });
        });
      });
    });
  }

  // Icons mapping for vehicle types
  const getTypeIcon = (type) => {
    const t = type.toLowerCase();
    if (t.includes('car') || t.includes('ô tô')) return <CarOutlined />;
    if (t.includes('motor') || t.includes('máy')) return <span>🏍️</span>;
    if (t.includes('bike') || t.includes('đạp')) return <span>🚲</span>;
    if (t.includes('tải') || t.includes('truck')) return <span>🚚</span>;
    return <CarOutlined />;
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Staff Dashboard</Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            hoverable
            onClick={() => navigate('/staff/slots')}
            style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
              borderRadius: '12px',
              height: '100%',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <Progress 
                  type="circle" 
                  percent={sum.totalCapacity > 0 ? parseFloat((sum.currentOccupancy / sum.totalCapacity * 100).toFixed(1)) : 0} 
                  strokeColor={sum.occupancyRate < 50 ? '#10b981' : (sum.occupancyRate < 80 ? '#f59e0b' : '#ef4444')}
                  size={160}
                  strokeWidth={8}
                />
                <div style={{ marginTop: '12px', fontWeight: 'bold', color: '#6b7280' }}>Occupancy Rate</div>
              </div>
              
              <div style={{ flex: 1, minWidth: '250px', textAlign: 'center' }}>
                <Title level={4} style={{ marginBottom: 20, color: '#6b7280' }}>Parking Status</Title>
                
                <div style={{ 
                  background: 'rgba(14,165,233,.08)', 
                  borderRadius: '16px', 
                  padding: '24px', 
                  marginBottom: '20px', 
                  border: '2px solid rgba(14,165,233,.2)', 
                  display: 'inline-block',
                  minWidth: '200px'
                }}>
                  <div style={{ fontSize: '16px', color: '#0ea5e9', fontWeight: 'bold', marginBottom: '8px' }}>Current / Capacity</div>
                  <div style={{ fontSize: '48px', fontWeight: '900', color: '#0369a1', lineHeight: 1 }}>
                    {sum.currentOccupancy} <span style={{ fontSize: '24px', color: '#94a3b8' }}>/ {sum.totalCapacity}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {Object.entries(vTypeStats).map(([type, stats]) => (
                    <div key={type} style={{ background: '#f8fafc', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px', color: '#64748b' }}>{getTypeIcon(type)}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{type}</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{stats.current} <span style={{ color: '#94a3b8', fontSize: '14px' }}>/ {stats.capacity}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Card 2: Reservations */}
        <Col xs={24} lg={8}>
          <Card 
            hoverable 
            onClick={() => navigate('/staff/reservations?date=today')}
            style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              color: 'white',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              border: 'none'
            }}
            bodyStyle={{ width: '100%' }}
          >
            <SafetyCertificateOutlined style={{ fontSize: '48px', color: 'rgba(255,255,255,0.9)', marginBottom: '16px' }} />
            <h3 style={{ color: 'white', fontSize: '20px', margin: '0 0 8px 0' }}>Reservation</h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '16px' }}>Pending Arrivals Today</p>
            <div style={{ fontSize: '64px', fontWeight: '900', lineHeight: 1 }}>{todayReservationList.length}</div>
          </Card>
        </Col>
      </Row>

      {/* 3 Big Buttons */}
      <div style={{ marginTop: 24 }}>
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
            <Upload beforeUpload={() => false} maxCount={1} listType="picture-card">
              <div>
                <UploadOutlined style={{ fontSize: '24px', color: '#8c8c8c' }} />
                <div style={{ marginTop: 8, color: '#8c8c8c' }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
          
          <Form.Item name="licensePlate" label="License Plate" rules={[{ required: true, message: 'Please enter license plate' }]}>
            <Input 
              placeholder="e.g. 29A-12345" 
              style={{ textTransform: 'uppercase', fontSize: '18px', fontWeight: 'bold' }} 
              onChange={handleLicensePlateChange}
              onPressEnter={(e) => e.preventDefault()}
            />
          </Form.Item>

          {matchedReservation ? (
            <div style={{ padding: '16px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <SafetyCertificateOutlined style={{ color: '#10b981', fontSize: '20px' }} />
                <Text strong style={{ color: '#065f46', fontSize: '16px' }}>Reservation Found!</Text>
              </div>
              <p style={{ margin: 0 }}><strong>ID:</strong> #{matchedReservation.reservationId}</p>
              <p style={{ margin: 0 }}><strong>Customer:</strong> {matchedReservation.userFullName || 'Guest'}</p>
              <p style={{ margin: 0 }}><strong>License Plate:</strong> {matchedReservation.licensePlate}</p>
              <p style={{ margin: 0 }}><strong>Vehicle Type:</strong> {matchedReservation.vehicleTypeName || 'N/A'}</p>
              <p style={{ margin: 0 }}><strong>Time:</strong> {dayjs(matchedReservation.reservationStart).format('HH:mm')} - {dayjs(matchedReservation.reservationEnd).format('HH:mm')}</p>
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
            <p><strong>Assigned Slot:</strong> <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{summaryData.slotCode || 'N/A'}</span></p>
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
                  <Upload beforeUpload={() => false} maxCount={1} listType="picture-card">
                    <div>
                      <UploadOutlined style={{ fontSize: '24px', color: '#8c8c8c' }} />
                      <div style={{ marginTop: 8, color: '#8c8c8c' }}>Upload</div>
                    </div>
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
                {checkoutSessionData.entryImage ? (
                  <img src={`http://localhost:8080${checkoutSessionData.entryImage}`} alt="Entry" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1/1', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <Text type="secondary">No Image</Text>
                  </div>
                )}
              </Col>
              <Col span={12} style={{ textAlign: 'center' }}>
                <p><strong>Exit Image</strong></p>
                {checkoutSessionData.exitImageUrl ? (
                   <img src={checkoutSessionData.exitImageUrl} alt="Exit" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                   <div style={{ width: '100%', aspectRatio: '1/1', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <Text type="secondary">No Image</Text>
                  </div>
                )}
              </Col>
            </Row>

            <Card style={{ backgroundColor: '#f8fafc', marginBottom: '20px' }} bodyStyle={{ padding: '16px' }}>
              <Row>
                <Col span={12}>
                  <p><strong>Plate:</strong> <Text strong style={{ color: '#1677ff', fontSize: '16px' }}>{checkoutSessionData.licensePlate}</Text></p>
                  <p><strong>Entry:</strong> {dayjs(checkoutSessionData.entryTime || checkoutSessionData.checkInTime).format('DD/MM/YYYY HH:mm:ss')}</p>
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

        {checkOutStep === 3 && checkoutSessionData && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Spin size="large" />
            <Title level={4} style={{ marginTop: 24, color: '#1677ff' }}>Waiting for VNPay payment...</Title>
            <Spin size="large" style={{ margin: '20px 0' }} />
            <Text type="secondary" style={{ display: 'block' }}>
              Please complete the payment in the VNPay tab. The system will automatically close this popup upon successful payment.
            </Text>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Button type="default" danger onClick={() => {
                setIsCheckOutVisible(false);
                setCheckOutStep(1);
                checkOutSearchForm.resetFields();
                checkOutConfirmForm.resetFields();
                fetchData();
              }}>Close (Cancel Payment)</Button>
              <Button type="primary" onClick={handleSwitchToCash} loading={loading}>
                Switch to Cash (CASH)
              </Button>
            </div>
          </div>
        )}

        {checkOutStep === 4 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckCircleFilled style={{ fontSize: 72, color: '#52c41a' }} />
            <Title level={3} style={{ marginTop: 24, color: '#52c41a' }}>Payment Successful!</Title>
            <Text type="secondary">The gate is open. Please proceed to exit...</Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StaffDashboard;
