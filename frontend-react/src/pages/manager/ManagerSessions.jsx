import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Modal, Form, message, Space, Card, Upload, Row, Col, Typography, Divider } from 'antd';
import { SearchOutlined, CarOutlined, CreditCardOutlined, UploadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { sessionApi, paymentApi, vehicleApi } from '../../services/api';
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
      
      // CREATE Payment to get final fee
      const pRes = await paymentApi.createPayment({ sessionId: targetSession.sessionId, paymentMethod: 'CASH' });
      let paymentId = pRes.data?.data?.paymentId;
      let finalFee = pRes.data?.data?.amount || targetSession.estimatedFee || 0;

      // Store checkout image to upload later
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
         // handle existing payment if needed, for simplicity we skip it or show error
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
      
      // Step 1: Upload Exit Image
      if (checkoutSessionData.exitImageFile) {
        await sessionApi.uploadSessionImage(sessionId, checkoutSessionData.exitImageFile, 'exit');
      }

      // Step 2: Confirm Payment (CASH) or VNPay
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
      fetchSessions();
    } catch (error) {
      message.error(error.response?.data?.message || 'Check-out failed');
    }
  };

  // Filter
  const filteredSessions = sessions.filter(session => {
    const searchMatch = !filters.search || 
      session.licensePlate?.toLowerCase().includes(filters.search.toLowerCase()) ||
      session.sessionId?.toString().includes(filters.search);
    const statusMatch = !filters.status || session.status === filters.status;
    return searchMatch && statusMatch;
  });

  const columns = [
    { title: 'ID', dataIndex: 'sessionId', key: 'sessionId', render: (text) => <strong>#{text}</strong> },
    { title: 'License Plate', dataIndex: 'licensePlate', key: 'licensePlate', render: (text) => <Tag color="blue" style={{ fontSize: 14, fontWeight: 'bold' }}>{text || 'N/A'}</Tag> },
    { title: 'Slot', dataIndex: 'slotCode', key: 'slotCode', render: text => text || '-' },
    { title: 'Entry Time', dataIndex: 'checkInTime', key: 'checkInTime', render: (time) => time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '-' },
    { title: 'Gate', dataIndex: 'entryGate', key: 'entryGate', render: text => text || '-' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : status === 'COMPLETED' ? 'default' : 'red'}>
          {status === 'ACTIVE' ? 'Active' : status === 'COMPLETED' ? 'Completed' : status}
        </Tag>
      )
    },
  ];

  if (!isStaff) {
    columns.push({
      title: 'Total Fee',
      dataIndex: 'totalFee',
      key: 'totalFee',
      render: (fee) => fee ? <strong style={{ color: '#ea580c' }}>{fee.toLocaleString()} ₫</strong> : '-'
    });
    columns.push({
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'ACTIVE' && (
            <Button type="primary" danger size="small" onClick={() => {
              // Quick check-out trigger for Manager
              setCheckoutSessionData({ ...record, exitTime: new Date().toISOString() });
              setCheckOutStep(1);
              setIsCheckOutVisible(true);
              checkOutSearchForm.setFieldsValue({ licensePlate: record.licensePlate });
            }} icon={<CreditCardOutlined />}>
              Check-out
            </Button>
          )}
          <Button type="default" size="small" onClick={() => {
            setSummaryData({
              plate: record.licensePlate,
              type: record.vehicleTypeName || 'N/A',
              time: dayjs(record.checkInTime).format('DD/MM/YYYY HH:mm:ss'),
              gate: record.entryGate,
              image: record.entryImage || null
            });
            setIsSummaryVisible(true);
          }}>
            Details
          </Button>
        </Space>
      ),
    });
  }

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
            <Title level={4} style={{ margin: 0 }}>Session Management</Title>
          )}
          <Space style={{ flexWrap: 'wrap' }}>
            <Input 
            placeholder="Search plate..." 
            prefix={<SearchOutlined />} 
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 250 }}
            size="large"
          />
          <Select 
            placeholder="All Statuses" 
            style={{ width: 160 }} 
            allowClear 
            size="large"
            onChange={(val) => setFilters({ ...filters, status: val })}
          >
            <Option value="ACTIVE">Active</Option>
            <Option value="COMPLETED">Completed</Option>
          </Select>
          {!isStaff && (
             <Button type="primary" icon={<CarOutlined />} onClick={() => setIsWalkInVisible(true)} style={{ backgroundColor: '#10b981' }}>
                Add Walk-in
             </Button>
          )}
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

export default SessionManagement;
