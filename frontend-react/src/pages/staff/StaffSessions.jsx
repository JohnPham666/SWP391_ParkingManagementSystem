import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Modal, Form, message, Space, Card, Upload, Row, Col, Typography, Divider, DatePicker, Alert, Spin } from 'antd';
import { SearchOutlined, CarOutlined, CreditCardOutlined, UploadOutlined, SafetyCertificateOutlined, CheckCircleFilled } from '@ant-design/icons';
import { sessionApi, paymentApi, vehicleApi, pricingApi, cardApi, subscriptionApi } from '../../services/api';
import { getImageUrl } from '../../utils/helpers';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

const StaffSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [activeCards, setActiveCards] = useState([]);
  const [activeSubPlates, setActiveSubPlates] = useState(new Map());
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

  const [checkOutStep, setCheckOutStep] = useState(1); // 1: Search, 2: Confirm, 3: Paid, 4: Done
  const [checkoutSessionData, setCheckoutSessionData] = useState(null);

  const [walkInForm] = Form.useForm();
  const [resCheckInForm] = Form.useForm();
  const [checkOutSearchForm] = Form.useForm();
  const [checkOutConfirmForm] = Form.useForm();

  // =====================================================================
  // HOOK LẮNG NGHE TRẠNG THÁI THANH TOÁN VNPAY (POLLING)
  // - Mục đích: Liên tục gọi API lên server để kiểm tra xem khách hàng đã chuyển khoản/quét mã VNPay thành công hay chưa.
  // - Điều kiện chạy: Chỉ chạy khi đang ở Bước 3 (checkOutStep === 3) VÀ đã có mã giao dịch paymentId.
  // - Cơ chế hoạt động: Dùng hàm setInterval của JavaScript để tự động lặp lại hành động kiểm tra mỗi 3 giây.
  // =====================================================================
  useEffect(() => {
    let interval = null;
    if (checkOutStep === 3 && checkoutSessionData?.paymentId) {
      // Thiết lập vòng lặp thời gian: Cứ mỗi 3 giây (3000ms) sẽ tự động thực thi khối lệnh bên trong
      interval = setInterval(async () => {
        try {
          // Gọi API để lấy thông tin mới nhất của giao dịch thanh toán
          const res = await paymentApi.getPayment(checkoutSessionData.paymentId);
          const paymentData = res.data?.data || res.data;

          // Nếu Backend trả về trạng thái là 'PAID' (Đã thanh toán thành công)
          if (paymentData.paymentStatus === 'PAID') {
            // Dừng việc gọi API liên tục
            clearInterval(interval);

            // Chuyển sang Bước 4 (Hiển thị màn hình báo thành công)
            setCheckOutStep(4);

            // Cập nhật lại danh sách xe đang hiển thị trên bảng
            fetchSessions();

            // Đợi 3 giây để người dùng nhìn thấy thông báo thành công, sau đó tự động đóng Modal
            setTimeout(() => {
              setIsCheckOutVisible(false);
              setCheckOutStep(1); // Reset lại bước về ban đầu
              checkOutSearchForm.resetFields(); // Xoá trắng form tìm kiếm
              checkOutConfirmForm.resetFields(); // Xoá trắng form xác nhận
            }, 3000);
          }
        } catch (e) {
          console.error("Error polling VNPay status", e);
        }
      }, 3000);
    }

    // Cleanup function: Đảm bảo dừng bộ đếm thời gian khi component bị huỷ hoặc khi đổi trạng thái bước
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkOutStep, checkoutSessionData]);

  // Summary Data
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    fetchSessions();
    fetchVehicleTypes();
    fetchActiveCards();
    fetchSubscriptions();
    // eslint-disable-next-line
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await subscriptionApi.getSubscriptions();
      const allSubs = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(allSubs)) {
        const subMap = new Map();
        allSubs.forEach(sub => {
          if (sub.licensePlate) {
            subMap.set(sub.licensePlate.trim().toUpperCase(), sub.status);
          }
        });
        setActiveSubPlates(subMap);
      }
    } catch (e) {
      console.error('Failed to fetch subscriptions', e);
    }
  };

  const fetchActiveCards = async () => {
    try {
      const res = await cardApi.getAllCards();
      const allCards = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(allCards)) {
        setActiveCards(allCards.filter(c => c.status === 'ACTIVE'));
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    }
  };

  const fetchVehicleTypes = async () => {
    try {
      const res = await vehicleApi.getVehicles();
      // Note: we should actually call getVehicleTypes but the existing backend might serve it under /vehicle-types. 
      // If we don't have vehicleTypes api mapped, we can hardcode for now or map it.
    } catch (e) { }
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
        cardId: values.cardId,
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
        cardId: values.cardId,
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

  // =====================================================================
  // HÀM XỬ LÝ BƯỚC 1 CHECK-OUT: TÌM KIẾM THÔNG TIN XE ĐANG ĐỖ TRONG BÃI
  // - Sự kiện kích hoạt: Nhân viên điền biển số xe, hình ảnh và bấm nút "Search Vehicle".
  // - Nhiệm vụ chính: 
  //   1. Kiểm tra xem xe này có đang đỗ hợp lệ trong bãi không.
  //   2. Lưu giữ hình ảnh xe lúc ra (nếu nhân viên có upload/chụp ảnh).
  //   3. Tính toán trước số tiền cước phí đỗ xe mà khách hàng cần phải trả.
  // =====================================================================
  const handleCheckOutSearch = async (values) => {
    try {
      const res = await sessionApi.verifyCheckout({
        licensePlate: values.licensePlate,
        cardId: values.cardId
      });
      
      const resultData = res.data?.data;
      if (!resultData) {
        message.error('Verification failed: No data returned');
        return;
      }

      // Nguồn sự thật để thanh toán là thẻ từ
      const targetSession = resultData.sessionFromCard;
      if (!targetSession) {
         message.error('No session found from Card ID');
         return;
      }

      let exitImageUrl = null;
      let exitImageFile = null;

      // 2. Xử lý hình ảnh xe lúc đi ra (nếu nhân viên có chụp/tải ảnh lên)
      if (values.exitImage && values.exitImage.fileList.length > 0) {
        exitImageFile = values.exitImage.fileList[0].originFileObj;
        exitImageUrl = URL.createObjectURL(exitImageFile); // Tạo đường dẫn tạm để hiển thị preview
      }

      // 3. Lấy thời gian hiện tại làm thời gian xe ra
      const exitTimeIso = new Date().toISOString();
      let calculatedFee = 0;

      // 4. Nếu xe không có vé tháng (hasActiveSubscription = false) thì mới cần tính phí đỗ xe
      if (!targetSession.hasActiveSubscription) {
        try {
          // Gọi API tính phí dựa vào loại xe, giờ vào và giờ ra
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

      // 5. Lưu trữ tất cả thông tin (gồm thông tin xe, hình ra, giờ ra, phí phải trả) vào state chung
      setCheckoutSessionData({
        ...targetSession, // source of truth for checking out
        matchStatus: resultData.matchStatus,
        messageStatus: resultData.message,
        sessionFromPlate: resultData.sessionFromPlate,
        exitImageFile,
        exitImageUrl,
        exitTime: exitTimeIso,
        totalFee: calculatedFee
      });

      // 6. Chuyển sang Bước 2 (Hiển thị form xác nhận, hiển thị tiền phí đỗ và chọn cách thanh toán)
      setCheckOutStep(2);
    } catch (error) {
      // Bắt lỗi nếu xe đang trong quá trình thanh toán dở dang ở một phiên khác
      if (error.response?.data?.message?.includes('already has a PENDING payment')) {
        message.error('Vehicle already in checkout process');
      } else {
        message.error(error.response?.data?.message || 'Error verifying check-out');
      }
    }
  };

  // =====================================================================
  // HÀM XỬ LÝ BƯỚC 2 CHECK-OUT: XÁC NHẬN CHO XE RA & TẠO GIAO DỊCH THANH TOÁN
  // - Sự kiện kích hoạt: Nhân viên chọn phương thức thanh toán (Tiền mặt/VNPay...) và bấm "Confirm Payment".
  // - Nhiệm vụ chính:
  //   1. Gọi API chốt thời gian xe ra và tính phí chính thức trên Backend.
  //   2. Upload ảnh xe lúc ra lên hệ thống lưu trữ (nếu có).
  //   3. Chuyển hướng thanh toán tùy theo phương thức mà nhân viên đã chọn.
  // =====================================================================
  const handleCheckOutConfirm = async (values) => {
    try {
      const sessionId = checkoutSessionData.sessionId;

      // Bước 2.1: Gọi API Check-out để thông báo cho Backend cập nhật thời gian xe ra.
      // Backend sẽ tính phí cuối cùng và đổi trạng thái xe thành UNPAID (nếu có phí) hoặc COMPLETED (nếu miễn phí/đã đóng tiền).
      const checkOutRes = await sessionApi.checkOut(sessionId, { exitGate: 'Gate A' });
      const updatedSession = checkOutRes.data?.data || checkOutRes.data;

      // 2. Upload hình ảnh xe lúc ra lên server (nếu nhân viên có đính kèm ảnh)
      if (checkoutSessionData.exitImageFile) {
        await sessionApi.uploadSessionImage(sessionId, checkoutSessionData.exitImageFile, 'exit');
      }

      // 3. Xử lý trường hợp không cần thanh toán thêm:
      // (a) Trạng thái đã là COMPLETED (đã thanh toán từ trước)
      // (b) finalFee bằng 0 (khách sử dụng vé tháng, được miễn phí...)
      if (updatedSession.status === 'COMPLETED' || updatedSession.finalFee === 0) {
        message.success('Check-out Successful (Pre-paid / Zero Fee)');
        // Bắn popup xanh lá báo thành công

        setIsCheckOutVisible(false); // Đóng cửa sổ popup check-out
        setCheckOutStep(1); // Reset lại bước check-out về ban đầu
        checkOutSearchForm.resetFields(); // Xóa trắng ô nhập liệu form tìm kiếm
        checkOutConfirmForm.resetFields(); // Xóa trắng form thanh toán

        // QUAN TRỌNG: Gọi API lấy lại danh sách xe mới nhất để cập nhật lại giao diện
        fetchSessions();
        return;
      }

      // 4. Nếu có phát sinh phí đỗ xe, tiến hành gọi API tạo giao dịch thanh toán trên Backend
      const pRes = await paymentApi.createPayment({ sessionId: sessionId, paymentMethod: values.paymentMethod });
      const paymentId = pRes.data?.data?.paymentId;

      // 5. Xử lý kịch bản dựa theo phương thức thanh toán nhân viên đã chọn
      if (values.paymentMethod === 'CASH' || checkoutSessionData.totalFee === 0) {
        // Nếu chọn thanh toán tiền mặt (CASH), gọi API báo cáo đã thu tiền mặt luôn
        await paymentApi.confirmCash(paymentId);
        message.success('Check-out & Payment Successful!');
        setIsCheckOutVisible(false);
        setCheckOutStep(1);
        checkOutSearchForm.resetFields();
        checkOutConfirmForm.resetFields();
        fetchSessions();
      } else {
        // Nếu chọn VNPay (hoặc online), gọi API sinh ra đường link trỏ tới cổng thanh toán VNPay
        const vnRes = await paymentApi.createVnPayUrl(paymentId);
        if (vnRes.data?.data?.paymentUrl) {
          // Mở 1 tab mới trên trình duyệt trỏ tới trang thanh toán của VNPay
          window.open(vnRes.data.data.paymentUrl, '_blank');
          message.info('Opened VNPay Payment Gateway');

          // Cập nhật paymentId vào state và chuyển sang Bước 3 (Chờ thanh toán online từ khách hàng)
          setCheckoutSessionData({ ...checkoutSessionData, paymentId });
          setCheckOutStep(3);
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Check-out failed');
    }
  };

  // Extract unique vehicle types from sessions
  const uniqueVehicleTypes = Array.from(new Set(['Motorbike', 'Car', 'Small Truck', 'Bicycle', 'Large Truck', ...sessions.map(s => s.vehicleTypeName || s.vehicleType?.typeName).filter(Boolean)]));

  // Filter
  const filteredSessions = sessions.filter(session => {
    const searchMatch = !filters.search ||
      session.licensePlate?.toLowerCase().includes(filters.search.toLowerCase()) ||
      session.sessionId?.toString().includes(filters.search);
    const statusMatch = !filters.status || session.status === filters.status || (filters.status === 'ACTIVE' && session.status === 'PARKING');
    const typeMatch = !filters.vehicleType || (session.vehicleTypeName || session.vehicleType?.typeName || 'Ã” tÃ´') === filters.vehicleType;
    const dateMatch = !filters.date || dayjs(session.checkInTime || session.checkinTime || session.entryTime).format('MM/DD/YYYY') === filters.date;
    return searchMatch && statusMatch && typeMatch && dateMatch;
  });

  const columns = [
    { title: 'ID', dataIndex: 'sessionId', key: 'sessionId', render: (text) => <strong>#{text}</strong> },
    { title: 'LICENSE PLATE', dataIndex: 'licensePlate', key: 'licensePlate', render: (text) => <strong style={{ fontSize: 14 }}>{text || 'N/A'}</strong> },
    { title: 'SLOT', dataIndex: 'slotCode', key: 'slotCode', render: text => text || '-' },
    { title: 'VEHICLE TYPE', key: 'vehicleType', render: (_, record) => record.vehicleTypeName || record.vehicleType?.typeName || 'Car' },
    { title: 'CARD ID', dataIndex: 'cardId', key: 'cardId', render: text => text || '-' },
    {
      title: 'ENTRY TIME', key: 'entryTime', render: (_, record) => {
        const time = record.checkInTime || record.checkinTime || record.entryTime;
        return time ? dayjs(time).format('HH:mm:ss DD/MM/YYYY') : '-';
      }
    },
    {
      title: 'EXIT TIME', key: 'exitTime', render: (_, record) => {
        const time = record.checkOutTime || record.checkoutTime || record.exitTime;
        return time ? dayjs(time).format('HH:mm:ss DD/MM/YYYY') : '-';
      }
    },
    { title: 'ENTRY GATE', dataIndex: 'entryGate', key: 'entryGate', render: text => text || '-' },
    { title: 'EXIT GATE', dataIndex: 'exitGate', key: 'exitGate', render: text => text || '-' },
    { title: 'FINAL FEE', dataIndex: 'finalFee', key: 'finalFee', render: text => text != null ? `${text.toLocaleString()} VNĐ` : '-' },
    { title: 'CUSTOMER', key: 'customer', render: (_, record) => record.customerName || record.userFullName || '-' },
    { title: 'PHONE', key: 'phone', render: (_, record) => record.customerPhone || record.userPhone || '-' },
    { title: 'MONTHLY PASS?', dataIndex: 'hasActiveSubscription', key: 'hasActiveSubscription', render: text => text ? <Tag color="green">Yes</Tag> : <Tag color="default">No</Tag> },
    { title: 'CREATED BY', dataIndex: 'createdBy', key: 'createdBy', render: text => text || '-' },
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
              cardId: record.cardId,
              plate: record.licensePlate,
              type: record.vehicleTypeName || record.vehicleType?.typeName || 'N/A',
              time: record.checkInTime || record.checkinTime || record.entryTime ? dayjs(record.checkInTime || record.checkinTime || record.entryTime).format('HH:mm:ss DD/MM/YYYY') : '-',
              exitTime: (record.checkOutTime || record.checkoutTime || record.exitTime) ? dayjs(record.checkOutTime || record.checkoutTime || record.exitTime).format('HH:mm:ss DD/MM/YYYY') : '-',
              gate: record.entryGate,
              exitGate: record.exitGate,
              slot: record.slotCode,
              entryImage: record.entryImage || null,
              exitImage: record.exitImage || null,
              createdBy: record.createdBy || '-',
              finalFee: record.finalFee != null ? record.finalFee : (record.estimatedFee != null ? record.estimatedFee : 0)
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
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '16px' }}>
          <Title level={4} style={{ margin: 0 }}>Parking Sessions</Title>
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
          dataSource={[...filteredSessions].sort((a, b) => b.sessionId - a.sessionId)}
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
          <Form.Item name="licensePlate" label="License Plate (Optional for Bicycle)">
            <Input placeholder="e.g. 29A-12345" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item
            shouldUpdate={(prevValues, currentValues) => prevValues.licensePlate !== currentValues.licensePlate}
            noStyle
          >
            {({ getFieldValue }) => {
              const currentPlate = (getFieldValue('licensePlate') || '').trim().toUpperCase();
              const subStatus = activeSubPlates.get(currentPlate);
              const hasSub = subStatus === 'ACTIVE';

              return (
                <div style={{ marginBottom: 24 }}>
                  {subStatus === 'ACTIVE' && (
                    <div style={{ marginBottom: 16 }}>
                      <Tag color="green" icon={<SafetyCertificateOutlined />} style={{ fontSize: '14px', padding: '6px 12px' }}>
                        Xe cÃ³ vÃ© thÃ¡ng ACTIVE - KhÃ´ng cáº§n quáº¹t tháº»
                      </Tag>
                    </div>
                  )}
                  {subStatus === 'PENDING' && (
                    <div style={{ marginBottom: 16 }}>
                      <Tag color="warning" style={{ fontSize: '14px', padding: '6px 12px' }}>
                        VÃ© thÃ¡ng xe nÃ y ÄANG CHá»œ DUYá»†T (Cáº§n duyá»‡t trÆ°á»›c)
                      </Tag>
                    </div>
                  )}
                  {subStatus === 'CANCELLED' && (
                    <div style={{ marginBottom: 16 }}>
                      <Tag color="error" style={{ fontSize: '14px', padding: '6px 12px' }}>
                        VÃ© thÃ¡ng xe nÃ y ÄÃƒ Bá»Š HUá»¶
                      </Tag>
                    </div>
                  )}

                  <Form.Item
                    name="cardId"
                    label="Card ID"
                    rules={[{ required: !hasSub, message: 'Please select Card ID' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      showSearch
                      placeholder="Select an available Card ID"
                      optionFilterProp="children"
                      disabled={hasSub}
                      allowClear
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={activeCards.map(c => ({ value: c.cardId, label: c.cardId }))}
                    />
                  </Form.Item>
                </div>
              );
            }}
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
                <Text type="secondary">Card ID</Text>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{summaryData.cardId || '-'}</div>
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
                <div style={{ fontSize: 16 }}>{summaryData.createdBy} / -</div>
              </Col>

              <Col span={24} style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  {summaryData.status === 'PARKING' ? 'Estimated Fee' : 'Final Fee'}
                </Text>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ef4444' }}>
                  {summaryData.finalFee.toLocaleString()} VNĐ
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0', borderBlockColor: 'transparent' }} />
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: '8px', fontWeight: 600 }}>Entry Image</Text>
                <div style={{ textAlign: 'center' }}>
                  {summaryData.entryImage ? (
                    <img src={getImageUrl(summaryData.entryImage)} alt="Entry" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e8e8e8' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '1/1', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                      <Text type="secondary" italic>No image available</Text>
                    </div>
                  )}
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: '8px', fontWeight: 600 }}>Exit Image</Text>
                <div style={{ textAlign: 'center' }}>
                  {summaryData.exitImage ? (
                    <img src={getImageUrl(summaryData.exitImage)} alt="Exit" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e8e8e8' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '1/1', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                      <Text type="secondary" italic>No image available</Text>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* ============================================================================== */}
      {/* CHECK-OUT MODAL - POPUP CHÍNH QUẢN LÝ TOÀN BỘ QUY TRÌNH CHO XE RA (CHECK-OUT)   */}
      {/* Modal này được kiểm soát bởi biến trạng thái 'checkOutStep' để thay đổi nội dung: */}
      {/* - Bước 1 (checkOutStep = 1): Form Tìm kiếm xe bằng biển số xe.                    */}
      {/* - Bước 2 (checkOutStep = 2): Form Xác nhận thông tin, tính phí và chọn cách thanh toán. */}
      {/* - Bước 3 (checkOutStep = 3): Màn hình chờ hệ thống tự động kiểm tra trạng thái VNPay.   */}
      {/* - Bước 4 (checkOutStep = 4): Màn hình thông báo hoàn tất toàn bộ quy trình.         */}
      {/* ============================================================================== */}
      <Modal
        title="Check-out & Payment"
        open={isCheckOutVisible}
        onCancel={() => {
          // Khi người dùng ấn nút X hoặc bấm ra ngoài để thoát, reset toàn bộ state của tiến trình
          setIsCheckOutVisible(false);
          setCheckOutStep(1);
          checkOutSearchForm.resetFields();
          checkOutConfirmForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        {/* BƯỚC 1: TÌM KIẾM XE MUỐN CHO RA (Nhập biển số & Hình ảnh lúc ra) */}
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
                <Form.Item name="licensePlate" label="License Plate (Optional for Bicycle)" rules={[{ required: false }]}>
                  <Input placeholder="e.g. 29A-12345" style={{ textTransform: 'uppercase' }} />
                </Form.Item>
                <Form.Item name="cardId" label="Card ID" rules={[{ required: true, message: 'Enter Card ID' }]}>
                  <Input placeholder="e.g. 001" style={{ textTransform: 'uppercase' }} />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" htmlType="submit" block style={{ height: '50px', fontSize: '16px', fontWeight: 'bold' }}>
              Search Vehicle
            </Button>
          </Form>
        )}

        {/* BƯỚC 2: HIỂN THỊ THÔNG TIN XE, CHI TIẾT TÍNH PHÍ VÀ CHỌN CÁCH THANH TOÁN */}
        {checkOutStep === 2 && checkoutSessionData && (
          <Form form={checkOutConfirmForm} layout="vertical" onFinish={handleCheckOutConfirm} size="large">
            {checkoutSessionData.matchStatus === 'MATCH' && (
              <Alert message="Verification Match" description={checkoutSessionData.messageStatus} type="success" showIcon style={{ marginBottom: 16 }} />
            )}
            {checkoutSessionData.matchStatus === 'MISMATCH' && (
              <Alert message="SECURITY WARNING" description={checkoutSessionData.messageStatus} type="error" showIcon style={{ marginBottom: 16 }} />
            )}
            {checkoutSessionData.matchStatus === 'MANUAL_VERIFICATION' && (
              <Alert message="Manual Verification Required" description={checkoutSessionData.messageStatus} type="warning" showIcon style={{ marginBottom: 16 }} />
            )}

            <Row gutter={16} style={{ marginBottom: '20px' }}>
              <Col span={12} style={{ textAlign: 'center' }}>
                <p><strong>Entry Image</strong></p>
                {checkoutSessionData.entryImage ? (
                  <img src={getImageUrl(checkoutSessionData.entryImage)} alt="Entry" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                  <div style={{ height: '150px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <Text type="secondary">No Image</Text>
                  </div>
                )}
              </Col>
              <Col span={12} style={{ textAlign: 'center' }}>
                <p><strong>Exit Image</strong></p>
                {/* Hiển thị ảnh biển số xe lúc đi ra mà người dùng vừa tải lên ở Bước 1 */}
                {checkoutSessionData.exitImageUrl ? (
                  <img src={checkoutSessionData.exitImageUrl} alt="Exit" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                  <div style={{ height: '150px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <Text type="secondary">No Image</Text>
                  </div>
                )}
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Card title="Card ID Info (Source of Truth)" style={{ backgroundColor: '#f8fafc', marginBottom: '20px', height: '100%' }} bodyStyle={{ padding: '16px' }}>
                  <p><strong>Card ID:</strong> <Text strong style={{ color: '#1677ff', fontSize: '16px' }}>{checkoutSessionData.cardId}</Text></p>
                  <p><strong>Associated Plate:</strong> <Text strong style={{ color: '#1677ff', fontSize: '16px' }}>{checkoutSessionData.licensePlate}</Text></p>
                  <p><strong>Slot:</strong> <Text strong>{checkoutSessionData.slotCode || '-'}</Text></p>
                  {checkoutSessionData.hasActiveSubscription && (
                    <div style={{ marginTop: '4px', marginBottom: '4px' }}>
                      <Tag color="success" style={{ padding: '2px 8px', fontSize: '12px', borderRadius: '4px' }}>
                        <CheckCircleFilled style={{ marginRight: '4px' }} />
                        Active Monthly Subscription
                      </Tag>
                    </div>
                  )}
                  <p><strong>Entry:</strong> {dayjs(checkoutSessionData.entryTime).format('DD/MM/YYYY HH:mm:ss')}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="License Plate Info" style={{ backgroundColor: '#f8fafc', marginBottom: '20px', height: '100%' }} bodyStyle={{ padding: '16px' }}>
                  {checkoutSessionData.sessionFromPlate ? (
                     <>
                        <p><strong>Plate:</strong> <Text strong style={{ color: '#1677ff', fontSize: '16px' }}>{checkoutSessionData.sessionFromPlate.licensePlate}</Text></p>
                        <p><strong>Slot:</strong> <Text strong>{checkoutSessionData.sessionFromPlate.slotCode || '-'}</Text></p>
                        <p><strong>Entry:</strong> {dayjs(checkoutSessionData.sessionFromPlate.entryTime).format('DD/MM/YYYY HH:mm:ss')}</p>
                     </>
                  ) : (
                     <Text type="secondary">No plate session found or missing plate input.</Text>
                  )}
                </Card>
              </Col>
            </Row>

            <Card style={{ backgroundColor: '#f8fafc', marginBottom: '20px' }} bodyStyle={{ padding: '16px', textAlign: 'center' }}>
                <p><strong>Exit Time:</strong> {dayjs(checkoutSessionData.exitTime).format('DD/MM/YYYY HH:mm:ss')}</p>
                <div style={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}>
                  Fee: {checkoutSessionData.totalFee.toLocaleString()} VNĐ
                </div>
            </Card>

            <Form.Item name="paymentMethod" label="Payment Method" initialValue="CASH" rules={[{ required: true }]}>
              <Select>
                <Option value="CASH">Cash</Option>
                <Option value="BANK_TRANSFER">Bank Transfer</Option>
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

        {/* BƯỚC 3: MÀN HÌNH CHỜ THANH TOÁN VNPay ONLINE */}
        {checkOutStep === 3 && checkoutSessionData && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Spin size="large" />
            {/* Note: React hook ở trên (useEffect) đang ngầm tự động gọi API kiểm tra trạng thái thanh toán liên tục ngầm định ở dưới */}
            <Title level={4} style={{ marginTop: 24, color: '#1677ff' }}>Waiting for VNPay payment...</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
              Please complete the payment in the VNPay tab. The system will automatically close this popup upon successful payment.
            </Text>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Button onClick={() => {
                // Cho phép nhân viên đóng modal để huỷ giao dịch chờ thanh toán này, đưa xe về lại trạng thái ban đầu
                setIsCheckOutVisible(false);
                setCheckOutStep(1);
                checkOutSearchForm.resetFields();
                checkOutConfirmForm.resetFields();
                fetchSessions();
              }}>Close (Cancel Payment)</Button>

              <Button type="primary" danger onClick={async () => {
                try {
                  // Fallback: Chuyển sang thanh toán bằng tiền mặt nếu khách hàng gặp lỗi hoặc đổi ý không thanh toán online VNPay nữa
                  await paymentApi.confirmCash(checkoutSessionData.paymentId);
                  message.success('Switched to cash payment. Check-out successful!');
                  setIsCheckOutVisible(false);
                  setCheckOutStep(1);
                  checkOutSearchForm.resetFields();
                  checkOutConfirmForm.resetFields();
                  fetchSessions();
                } catch (e) {
                  message.error('Failed to switch to cash');
                }
              }}>
                Switch to Cash (CASH)
              </Button>
            </div>
          </div>
        )}

        {/* BƯỚC 4: MÀN HÌNH THÔNG BÁO HOÀN TẤT THÀNH CÔNG SAU KHI VNPAY HOẶC CÁC PHƯƠNG THỨC XÁC NHẬN THÀNH CÔNG */}
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

export default StaffSessions;

