import React, { useEffect, useReducer, useState } from 'react';
import { Card, Table, Modal, Form, DatePicker, Select, Button, Tag, Space, Popconfirm, Alert, message, Row, Col, Typography, Skeleton, Empty, theme, Descriptions } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarOutlined, PlusOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, AlertOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { driverService } from '../services/driverService';
import { reservationStore } from '../store/reservationStore';
import { vehicleStore } from '../store/vehicleStore';
import { parkingStore } from '../store/parkingStore';

const { Title, Text } = Typography;

const getReservationId = (reservation) => reservation?.reservationId || reservation?.id;
const isReservationExpired = (reservation) => {
    if (String(reservation?.status || '').toUpperCase() !== 'PENDING') return false;
    if (!reservation?.createdAt) return false;
    const createdTime = new Date(reservation.createdAt).getTime();
    const expireTime = createdTime + 15 * 60 * 1000;
    return new Date().getTime() > expireTime;
};

const getPaymentStatus = (reservation) => {
    const reservationStatus = String(reservation?.status || '').toUpperCase();
    if (reservationStatus === 'CANCELLED') return 'CANCELLED';
    if (reservationStatus === 'EXPIRED' || isReservationExpired(reservation)) return 'UNPAID';
    return String(reservation?.paymentStatus || reservation?.payment?.status || reservation?.payment?.paymentStatus || 'UNPAID').toUpperCase();
};

const canPayReservation = (reservation) => {
    if (isReservationExpired(reservation)) return false;
    const reservationStatus = String(reservation?.status || '').toUpperCase();
    const paymentStatus = getPaymentStatus(reservation);
    return ['PENDING', 'PENDING_PAYMENT'].includes(reservationStatus) && ['UNPAID', 'PENDING', 'FAILED'].includes(paymentStatus);
};
const getResponseData = (response) => response?.data || response;

const CountdownTimer = ({ createdAt, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState('');
    
    useEffect(() => {
        let hasExpired = false;
        const calculateTimeLeft = () => {
            if (!createdAt) return null;
            const createdTime = new Date(createdAt).getTime();
            const expireTime = createdTime + 15 * 60 * 1000;
            const now = new Date().getTime();
            const diff = expireTime - now;
            
            if (diff <= 0) {
                return '00:00';
            }
            
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };
        
        const initialTl = calculateTimeLeft();
        setTimeLeft(initialTl);
        if (initialTl === '00:00') {
             hasExpired = true;
             if (onExpire) setTimeout(onExpire, 0);
        }

        const timer = setInterval(() => {
            if (hasExpired) {
                 clearInterval(timer);
                 return;
            }
            const tl = calculateTimeLeft();
            setTimeLeft(tl);
            if (tl === '00:00') {
                clearInterval(timer);
                hasExpired = true;
                if (onExpire) onExpire();
            }
        }, 1000);
        
        return () => clearInterval(timer);
    }, [createdAt, onExpire]);
    
    if (!timeLeft || timeLeft === '00:00') return null;
    return <Text type="danger" style={{ fontSize: 13, fontWeight: 'bold' }}>{timeLeft}</Text>;
};

const ReservationPage = () => {
    const { token } = theme.useToken();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [errorAlert, setErrorAlert] = useState(null);
    const [, forceRender] = useReducer(x => x + 1, 0);
    const [form] = Form.useForm();
    const [selectedVehicleType, setSelectedVehicleType] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    
    // Details Modal State
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [viewingReservation, setViewingReservation] = useState(null);

    // Payment State
    const [payingReservationId, setPayingReservationId] = useState(null);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);

    // Cancellation and Refund State
    const [cancelPaidModalVisible, setCancelPaidModalVisible] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState(null);
    const [refundInstructionModalVisible, setRefundInstructionModalVisible] = useState(false);
    const [cancelledReservationId, setCancelledReservationId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let interval;
        if (paymentModalVisible && payingReservationId) {
            interval = setInterval(() => {
                pollPaymentStatus();
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [paymentModalVisible, payingReservationId]);

    const pollPaymentStatus = async () => {
        try {
            const reservationsRes = await driverService.loadReservations();
            const rRes = reservationsRes?.data || reservationsRes;
            if (Array.isArray(rRes)) {
                reservationStore.reservations = rRes;
                forceRender();
            }
        } catch (error) {
            // Ignore polling errors
        }
    };

    useEffect(() => {
        if (paymentModalVisible && payingReservationId) {
            const safeReservations = Array.isArray(reservationStore.reservations) ? reservationStore.reservations : [];
            const currentRes = safeReservations.find(r => (r.reservationId || r.id) === payingReservationId);
            if (currentRes) {
                const pStatus = String(currentRes.paymentStatus || '').toUpperCase();
                if (pStatus === 'PAID' || pStatus === 'COMPLETED') {
                    setPaymentModalVisible(false);
                    setPayingReservationId(null);
                    message.success({ content: 'Payment completed successfully! Your reservation is confirmed.', key: 'payment_success', duration: 4 });
                    if (viewingReservation && (viewingReservation.reservationId || viewingReservation.id) === payingReservationId) {
                        setViewingReservation(currentRes);
                    }
                } else if (pStatus === 'FAILED') {
                    setPaymentModalVisible(false);
                    setPayingReservationId(null);
                    message.error({ content: 'Payment failed or was cancelled.', key: 'payment_failed' });
                }
            }
        }
    }, [reservationStore.reservations, paymentModalVisible, payingReservationId, viewingReservation]);

    const fetchData = async () => {
        reservationStore.loading = true;
        forceRender();
        try {
            const [reservationsRes, vehiclesRes, slotsRes] = await Promise.all([
                driverService.loadReservations(),
                driverService.loadMyVehicles(),
                driverService.loadSlots()
            ]);

            const rRes = reservationsRes?.data || reservationsRes;
            const resArray = Array.isArray(rRes) ? rRes : [];
            resArray.sort((a, b) => {
                const idA = a.reservationId || a.id || 0;
                const idB = b.reservationId || b.id || 0;
                return idB - idA;
            });
            reservationStore.reservations = resArray;

            const vRes = vehiclesRes?.data || vehiclesRes;
            vehicleStore.vehicles = Array.isArray(vRes) ? vRes : [];

            const sRes = slotsRes?.data || slotsRes;
            parkingStore.slots = Array.isArray(sRes) ? sRes : [];
        } catch (error) {
            message.error('Failed to load data');
            reservationStore.reservations = [];
            vehicleStore.vehicles = [];
            parkingStore.slots = [];
        } finally {
            reservationStore.loading = false;
            forceRender();
        }
    };

    const safeReservations = Array.isArray(reservationStore.reservations) ? reservationStore.reservations : [];
    const safeVehicles = Array.isArray(vehicleStore.vehicles) ? vehicleStore.vehicles : [];
    const safeSlots = Array.isArray(parkingStore.slots) ? parkingStore.slots : [];

    useEffect(() => {
        if (safeSlots.length > 0 && location.state?.prefilledSlot) {
            const slot = location.state.prefilledSlot;
            setErrorAlert(null);
            form.resetFields();
            const now = dayjs().add(5, 'minute');
            
            form.setFieldsValue({
                startTime: now,
                endTime: now.add(1, 'day'),
                slotId: slot.slotId || slot.id
            });
            setIsModalVisible(true);
            
            // clear state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [safeSlots.length, location.state, navigate]);

    const handleCreate = () => {
        setErrorAlert(null);
        form.resetFields();
        const now = dayjs().add(5, 'minute');
        form.setFieldsValue({
            startTime: now,
            endTime: now.add(1, 'day')
        });
        setSelectedVehicleType(null);
        setIsModalVisible(true);
    };

    const handleModalOk = async () => {
        try {
            setErrorAlert(null);
            const values = await form.validateFields();
            
            if (values.startTime.valueOf() >= values.endTime.valueOf()) {
                setErrorAlert('End Time must be after Start Time');
                return;
            }

            const vehicle = safeVehicles.find(v => (v.vehicleId || v.id) === values.vehicleId);
            const vTypeId = vehicle ? (vehicle.vehicleType?.vehicleTypeId || vehicle.vehicleTypeId || vehicle.vehicleType?.id) : null;

            const authStr = localStorage.getItem('parking_auth');
            let userId = null;
            if (authStr) {
                try {
                    const parsedUser = JSON.parse(authStr);
                    userId = parsedUser.userId || parsedUser.id;
                } catch (e) {}
            }

            const payload = {
                ...values,
                slotId: values.slotId || null,
                vehicleTypeId: vTypeId,
                userId: userId,
                reservationStart: values.startTime.format('YYYY-MM-DDTHH:mm:ss'),
                reservationEnd: values.endTime.format('YYYY-MM-DDTHH:mm:ss'),
            };

            delete payload.startTime;
            delete payload.endTime;

            await driverService.createReservation(payload);
            message.success('Reservation created successfully');
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            if (error.errorFields) return;
            
            let errorMsg = 'Failed to create reservation';
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
                if (error.response.data.data && typeof error.response.data.data === 'object') {
                    const validationErrors = Object.values(error.response.data.data).join(', ');
                    if (validationErrors) {
                        errorMsg += `: ${validationErrors}`;
                    }
                }
            } else if (error.message) {
                errorMsg = error.message;
            }
            
            setErrorAlert(errorMsg);
        }
    };

    const handleDelete = async (id) => {
        try {
            await driverService.cancelReservation(id);
            message.success('Reservation cancelled successfully');
            fetchData();
        } catch (error) {
            message.error('Failed to cancel reservation');
        }
    };

    const handleCancelPaidClick = (record) => {
        setReservationToCancel(record);
        setCancelPaidModalVisible(true);
    };

    const confirmCancelPaid = async () => {
        if (!reservationToCancel) return;
        const id = reservationToCancel.reservationId || reservationToCancel.id;
        try {
            await driverService.cancelReservation(id);
            message.success('Reservation cancelled successfully');
            fetchData();
            setCancelPaidModalVisible(false);
            setCancelledReservationId(id);
            setRefundInstructionModalVisible(true);
        } catch (error) {
            message.error('Failed to cancel reservation');
        }
    };

    const handleViewDetails = (record) => {
        setViewingReservation(record);
        setIsDetailsVisible(true);
    };

    const handlePayment = async (reservation) => {
        try {
            const reservationId = getReservationId(reservation);
            if (!reservationId || !canPayReservation(reservation)) {
                message.warning({ content: 'This reservation is not available for payment.', key: 'payment' });
                return;
            }

            message.loading({ content: 'Initializing payment...', key: 'payment' });

            const payRes = await driverService.createPayment({
                reservationId,
                paymentMethod: 'VNPAY'
            });
            const paymentData = getResponseData(payRes);
            const paymentId = paymentData?.paymentId || paymentData?.id;

            if (!paymentId) {
                message.error({ content: 'Failed to create payment', key: 'payment' });
                return;
            }
            
            const urlRes = await driverService.createVnPayUrl(paymentId);
            const urlData = getResponseData(urlRes);
            const paymentUrl = urlData?.paymentUrl || urlData?.url;
            
            if (paymentUrl) {
                message.success({ content: 'Redirecting to VNPay...', key: 'payment' });
                window.open(paymentUrl, '_blank');
                setPayingReservationId(reservationId);
                setPaymentModalVisible(true);
            } else {
                message.error({ content: 'Failed to get payment URL', key: 'payment' });
            }
        } catch (error) {
            message.error({ content: 'Payment initialization failed', key: 'payment' });
        }
    };

    const columns = [
        {
            title: 'ReservationID',
            dataIndex: 'reservationId',
            key: 'reservationId',
            render: (text, record) => <Text strong>#{record.reservationId || record.id || text}</Text>,
        },
        {
            title: 'Vehicle',
            key: 'vehicle',
            render: (_, record) => (
                <Space>
                    <Tag color="blue" style={{ borderRadius: 4 }}>{record.vehicle?.licensePlate || record.licensePlate || 'N/A'}</Tag>
                </Space>
            )
        },
        {
            title: 'Slot',
            key: 'slot',
            render: (_, record) => <Text strong>{record.slotCode || record.slot?.slotCode || record.slot?.slotName || record.parkingSlot?.slotName || record.slotId || 'N/A'}</Text>,
        },
        {
            title: 'Duration',
            key: 'duration',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: 6, whiteSpace: 'nowrap' }}>
                    <Text>{record.reservationStart ? new Date(record.reservationStart).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</Text>
                    <Text type="secondary">→</Text>
                    <Text>{record.reservationEnd ? new Date(record.reservationEnd).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</Text>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => {
                let s = String(status).toUpperCase();
                const expired = isReservationExpired(record);
                if (s === 'PENDING' && expired) {
                    s = 'EXPIRED';
                }
                
                let color = 'default';
                if (s === 'CONFIRMED' || s === 'COMPLETED') color = 'success';
                else if (s === 'PENDING') color = 'warning';
                else if (s === 'CANCELLED' || s === 'EXPIRED') color = 'error';
                return (
                    <Space size="small">
                        <Tag color={color} style={{ padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{s}</Tag>
                        {s === 'PENDING' && <CountdownTimer createdAt={record.createdAt} onExpire={forceRender} />}
                    </Space>
                );
            }
        },
        {
            title: 'Payment',
            key: 'paymentStatus',
            render: (_, record) => {
                const ps = getPaymentStatus(record);
                if (ps === 'UNPAID') return <Text type="secondary">Unpaid</Text>;
                let color = 'gold';
                if (ps === 'PAID' || ps === 'COMPLETED') color = 'green';
                if (ps === 'FAILED' || ps === 'CANCELLED') color = 'red';
                return <Tag color={color}>{ps}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, record) => {
                const s = String(record.status).toUpperCase();
                const expired = isReservationExpired(record);
                const canCancel = (s === 'PENDING' || s === 'CONFIRMED') && !expired;
                
                return (
                    <Space size="middle">
                        {canPayReservation(record) && (
                            <Button type="primary" size="small" style={{ borderRadius: 4 }} onClick={() => handlePayment(record)}>Pay Now</Button>
                        )}
                        <Button type="default" ghost={false} size="small" style={{ borderRadius: 4 }} onClick={() => handleViewDetails(record)}>Details</Button>
                        {canCancel && (
                            (getPaymentStatus(record) === 'PAID' || getPaymentStatus(record) === 'COMPLETED') ? (
                                <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleCancelPaidClick(record)} />
                            ) : (
                                <Popconfirm title="Cancel this reservation?" onConfirm={() => handleDelete(record.reservationId || record.id)}>
                                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                                </Popconfirm>
                            )
                        )}
                    </Space>
                );
            },
        },
    ];

    const stats = {
        total: safeReservations.length,
        pending: safeReservations.filter(r => String(r.status).toUpperCase() === 'PENDING').length,
        confirmed: safeReservations.filter(r => ['CONFIRMED', 'COMPLETED'].includes(String(r.status).toUpperCase())).length,
        cancelled: safeReservations.filter(r => String(r.status).toUpperCase() === 'CANCELLED').length,
    };

    const filteredSlots = safeSlots.filter(s => {
        const sType = (s.vehicleTypeName || '').toLowerCase();
        return !sType.includes('motor') && !sType.includes('xe máy') && String(s.status).toUpperCase() === 'AVAILABLE';
    });

    const handleVehicleChange = (vehicleId) => {
        const vehicle = safeVehicles.find(v => (v.vehicleId || v.id) === vehicleId);
        if (vehicle) {
            const vTypeName = (vehicle.vehicleType?.typeName || vehicle.vehicleType?.name || vehicle.vehicleTypeName || '').toLowerCase();
            setSelectedVehicleType(vTypeName);
            
            const isMotorbike = vTypeName.includes('motor') || vTypeName.includes('xe máy');
            if (!isMotorbike) {
                const currentSlotId = form.getFieldValue('slotId');
                const isValidSlot = currentSlotId && filteredSlots.some(s => (s.slotId || s.id) === currentSlotId);
                
                if (!isValidSlot) {
                    const firstAvailable = filteredSlots.find(s => s.status === 'AVAILABLE');
                    if (firstAvailable) {
                        form.setFieldsValue({ slotId: firstAvailable.slotId || firstAvailable.id });
                    } else {
                        form.setFieldsValue({ slotId: undefined });
                    }
                }
            } else {
                form.setFieldsValue({ slotId: undefined });
            }
        }
    };

    if (reservationStore.loading) {
        return <Skeleton active paragraph={{ rows: 10 }} />;
    }

    return (
        <div>
            {/* Statistics Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card className="saas-card" style={{ background: token.colorFillAlter }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 12, background: token.colorFillAlter, borderRadius: '50%', color: token.colorTextSecondary }}><CalendarOutlined style={{ fontSize: 20 }} /></div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 13 }}>Total</Text>
                                <Title level={3} style={{ margin: 0 }}>{stats.total}</Title>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="saas-card" style={{ background: token.colorWarningBg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 12, background: token.colorWarningBg, borderRadius: '50%', color: token.colorWarning }}><ClockCircleOutlined style={{ fontSize: 20 }} /></div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 13 }}>Pending</Text>
                                <Title level={3} style={{ margin: 0 }}>{stats.pending}</Title>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="saas-card" style={{ background: token.colorSuccessBg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 12, background: token.colorSuccessBg, borderRadius: '50%', color: token.colorSuccess }}><CheckCircleOutlined style={{ fontSize: 20 }} /></div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 13 }}>Confirmed</Text>
                                <Title level={3} style={{ margin: 0 }}>{stats.confirmed}</Title>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="saas-card" style={{ background: token.colorErrorBg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 12, background: token.colorErrorBg, borderRadius: '50%', color: token.colorError }}><CloseCircleOutlined style={{ fontSize: 20 }} /></div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 13 }}>Cancelled</Text>
                                <Title level={3} style={{ margin: 0 }}>{stats.cancelled}</Title>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card 
                className="saas-card" 
                title={<Title level={4} style={{ margin: 0 }}>Reservation History</Title>} 
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ borderRadius: 8 }}>Book a Slot</Button>}
                styles={{ body: { padding: 0 } }}
            >
                {safeReservations.length === 0 ? (
                    <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE} 
                        description={<Text type="secondary">You don't have any reservations yet.</Text>} 
                        style={{ padding: '40px 0' }}
                    >
                        <Button type="primary" onClick={handleCreate}>Create your first reservation</Button>
                    </Empty>
                ) : (
                    <Table
                        columns={columns}
                        dataSource={safeReservations}
                        rowKey={(record) => record.reservationId || record.id}
                        pagination={{ pageSize: 10 }}
                        style={{ margin: 0 }}
                    />
                )}
            </Card>

            <Modal
                title={<Title level={4} style={{ margin: 0 }}>Book Parking Slot</Title>}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                okText="Confirm Booking"
                cancelText="Cancel"
                destroyOnHidden
            >
                {errorAlert && <Alert message={errorAlert} type="error" showIcon style={{ marginBottom: 16 }} closable onClose={() => setErrorAlert(null)} />}
                <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                    <Form.Item name="vehicleId" label="Select Vehicle" rules={[{ required: true }]}>
                        <Select size="large" placeholder="Choose your vehicle" onChange={handleVehicleChange}>
                            {safeVehicles.map(v => <Select.Option key={v.vehicleId || v.id} value={v.vehicleId || v.id}>{v.licensePlate} ({v.brand || 'N/A'})</Select.Option>)}
                        </Select>
                    </Form.Item>
                    
                    <Form.Item 
                        name="slotId" 
                        label="Select Slot" 
                        rules={[{ 
                            required: selectedVehicleType && !selectedVehicleType.includes('motor') && !selectedVehicleType.includes('xe máy'), 
                            message: 'Please select a parking slot' 
                        }]}
                    >
                        <Select 
                            size="large" 
                            placeholder={selectedVehicleType && (selectedVehicleType.includes('motor') || selectedVehicleType.includes('xe máy')) ? "Motorbikes do not require a specific slot" : "Choose a parking slot"}
                            disabled={selectedVehicleType && (selectedVehicleType.includes('motor') || selectedVehicleType.includes('xe máy'))}
                        >
                            <Select.Option value="">-- Auto-assign (Any available) --</Select.Option>
                            {filteredSlots.map(s => (
                                <Select.Option key={s.slotId || s.id} value={s.slotId || s.id}>
                                    {s.slotCode || s.slotName || s.id} - {s.buildingName} ({s.vehicleTypeName})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="startTime" label="Start Time" rules={[{ required: true }]}>
                                <DatePicker showTime size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="endTime" label="End Time" rules={[{ required: true }]}>
                                <DatePicker showTime size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal
                title={<Title level={4} style={{ margin: 0 }}>Reservation Details</Title>}
                open={isDetailsVisible}
                onOk={() => setIsDetailsVisible(false)}
                onCancel={() => setIsDetailsVisible(false)}
                footer={[
                    viewingReservation && canPayReservation(viewingReservation) && (
                        <Button key="pay" type="primary" onClick={() => handlePayment(viewingReservation)}>
                            Pay Now
                        </Button>
                    ),
                    <Button key="close" onClick={() => setIsDetailsVisible(false)}>
                        Close
                    </Button>
                ]}
                destroyOnHidden
            >
                {viewingReservation && (
                    <div style={{ marginTop: 24 }}>
                        <Descriptions column={1} bordered size="middle" styles={{ label: { width: '130px', background: token.colorFillAlter, fontWeight: 600 } }}>
                            <Descriptions.Item label="ReservationID"><Text strong>#{viewingReservation.reservationId || viewingReservation.id}</Text></Descriptions.Item>
                            <Descriptions.Item label="Vehicle">
                                <Tag color="blue">{viewingReservation.vehicle?.licensePlate || viewingReservation.licensePlate || 'N/A'}</Tag>
                                <Text type="secondary">({viewingReservation.vehicleType?.typeName || viewingReservation.vehicleTypeName || 'N/A'})</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Slot">{viewingReservation.slot?.slotName || viewingReservation.parkingSlot?.slotName || viewingReservation.slotId || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Start Time">{viewingReservation.reservationStart || viewingReservation.startTime ? new Date(viewingReservation.reservationStart || viewingReservation.startTime).toLocaleString() : 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="End Time">{viewingReservation.reservationEnd || viewingReservation.endTime ? new Date(viewingReservation.reservationEnd || viewingReservation.endTime).toLocaleString() : 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={String(viewingReservation.status).toUpperCase() === 'CONFIRMED' || String(viewingReservation.status).toUpperCase() === 'COMPLETED' ? 'success' : String(viewingReservation.status).toUpperCase() === 'CANCELLED' || isReservationExpired(viewingReservation) ? 'error' : 'warning'}>
                                    {isReservationExpired(viewingReservation) ? 'EXPIRED' : String(viewingReservation.status).toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Payment Status">
                                <Tag color={getPaymentStatus(viewingReservation) === 'PAID' || getPaymentStatus(viewingReservation) === 'COMPLETED' ? 'green' : getPaymentStatus(viewingReservation) === 'CANCELLED' || getPaymentStatus(viewingReservation) === 'FAILED' ? 'red' : 'gold'}>
                                    {getPaymentStatus(viewingReservation)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Estimated Fee">
                                {viewingReservation.estimatedFee ? `${viewingReservation.estimatedFee.toLocaleString()} VND` : 'N/A'}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>

            <Modal
                title={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><ClockCircleOutlined style={{ color: token.colorPrimary, fontSize: 24 }} /><Title level={4} style={{ margin: 0 }}>Waiting for Payment</Title></div>}
                open={paymentModalVisible}
                closable={false}
                footer={[
                    <Button key="cancel" onClick={() => {
                        setPaymentModalVisible(false);
                        setPayingReservationId(null);
                    }}>
                        Close
                    </Button>
                ]}
                centered
            >
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div className="spinner" style={{ border: `4px solid ${token.colorFillSecondary}`, borderTop: `4px solid ${token.colorPrimary}`, borderRadius: '50%', width: 48, height: 48, margin: '0 auto 24px', animation: 'spin 1s linear infinite' }} />
                    <Title level={5}>A new tab was opened for VNPay</Title>
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                        Please complete your transaction securely in the newly opened tab.<br />
                        This window will automatically close and update your reservation once the payment is successful.
                    </Text>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </Modal>

            <Modal
                title={<Title level={4} style={{ margin: 0, color: token.colorError }}><AlertOutlined /> Confirm Cancellation</Title>}
                open={cancelPaidModalVisible}
                onOk={confirmCancelPaid}
                onCancel={() => setCancelPaidModalVisible(false)}
                okText="Yes, Cancel"
                cancelText="No, Keep it"
                okButtonProps={{ danger: true }}
                centered
                width={500}
            >
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <CloseCircleOutlined style={{ fontSize: 48, color: token.colorError, marginBottom: 16 }} />
                    <Title level={4}>Reservation already paid!</Title>
                    <Title level={5}>Are you sure you want to cancel it?</Title>
                </div>
            </Modal>

            <Modal
                title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><InfoCircleOutlined style={{ color: token.colorInfo, fontSize: 24 }} /><Title level={4} style={{ margin: 0 }}>Refund Instructions</Title></div>}
                open={refundInstructionModalVisible}
                closable={false}
                footer={[
                    <Button key="understood" onClick={() => setRefundInstructionModalVisible(false)}>
                        Understood
                    </Button>,
                    <Button key="report" type="primary" onClick={() => {
                        setRefundInstructionModalVisible(false);
                        navigate('/driver/incidents', {
                            state: {
                                autoOpen: true,
                                incidentType: 'OTHER',
                                description: `I cancelled the reservation that I already paid, I want a refund.\nReservation ID: ${cancelledReservationId}`
                            }
                        });
                    }}>
                        Report
                    </Button>
                ]}
                centered
                width={600}
            >
                <div style={{ padding: '16px 0' }}>
                    <Text style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
                        To receive a refund for your cancelled reservation, please follow these steps:
                    </Text>
                    <ul style={{ fontSize: 15, lineHeight: '1.8', marginBottom: 24, paddingLeft: 24 }}>
                        <li>Click the <strong>Report</strong> button below to go to the Incident Report page.</li>
                        <li>A form with the title <strong>Other issue</strong> and pre-filled content will appear.</li>
                        <li>Please upload an image of your <strong>Bank Account QR code</strong> or provide your bank account details.</li>
                        <li><em>Note: The bank account owner name must match your registered name in the system.</em></li>
                    </ul>
                    <div style={{ padding: '12px 16px', background: token.colorFillAlter, borderRadius: 8, border: `1px solid ${token.colorBorder}` }}>
                        <Text strong>Your Reservation ID: </Text> <Text type="danger" strong>{cancelledReservationId}</Text>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ReservationPage;
