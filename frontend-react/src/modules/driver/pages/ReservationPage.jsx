import React, { useEffect, useReducer, useState } from 'react';
import { Card, Table, Modal, Form, DatePicker, Select, Button, Tag, Space, Popconfirm, Alert, message, Row, Col, Typography, Skeleton, Empty, theme, Descriptions } from 'antd';
import { CalendarOutlined, PlusOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { driverService } from '../services/driverService';
import { reservationStore } from '../store/reservationStore';
import { vehicleStore } from '../store/vehicleStore';
import { parkingStore } from '../store/parkingStore';

const { Title, Text } = Typography;

const ReservationPage = () => {
    const { token } = theme.useToken();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [errorAlert, setErrorAlert] = useState(null);
    const [, forceRender] = useReducer(x => x + 1, 0);
    const [form] = Form.useForm();
    const [selectedVehicleType, setSelectedVehicleType] = useState(null);
    
    // Details Modal State
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [viewingReservation, setViewingReservation] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

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
            reservationStore.reservations = Array.isArray(rRes) ? rRes : [];

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

    const handleViewDetails = (record) => {
        setViewingReservation(record);
        setIsDetailsVisible(true);
    };

    const handlePayment = async (reservation) => {
        try {
            message.loading({ content: 'Initializing payment...', key: 'payment' });
            let paymentId = reservation.paymentId;
            
            if (!paymentId) {
                const payRes = await driverService.createPayment({
                    reservationId: reservation.reservationId || reservation.id,
                    paymentMethod: 'VNPAY'
                });
                paymentId = payRes.data?.paymentId || payRes.paymentId || payRes.id;
            }
            
            const urlRes = await driverService.createVnPayUrl(paymentId);
            const paymentUrl = urlRes.data?.paymentUrl || urlRes.paymentUrl || urlRes.url;
            
            if (paymentUrl) {
                message.success({ content: 'Redirecting to VNPay...', key: 'payment' });
                window.location.href = paymentUrl;
            } else {
                message.error({ content: 'Failed to get payment URL', key: 'payment' });
            }
        } catch (error) {
            message.error({ content: 'Payment initialization failed', key: 'payment' });
        }
    };

    const columns = [
        {
            title: 'Ref ID',
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
            render: (_, record) => <Text strong>{record.slot?.slotName || record.parkingSlot?.slotName || record.slotId || 'N/A'}</Text>,
        },
        {
            title: 'Duration',
            key: 'duration',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text>{record.reservationStart ? new Date(record.reservationStart).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>to {record.reservationEnd ? new Date(record.reservationEnd).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</Text>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const s = String(status).toUpperCase();
                let color = 'default';
                if (s === 'CONFIRMED' || s === 'COMPLETED') color = 'success';
                else if (s === 'PENDING') color = 'warning';
                else if (s === 'CANCELLED') color = 'error';
                return <Tag color={color} style={{ padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{s}</Tag>;
            }
        },
        {
            title: 'Payment',
            key: 'paymentStatus',
            render: (_, record) => {
                const pStatus = record.paymentStatus || record.payment?.status || record.payment?.paymentStatus;
                if (!pStatus) return <Text type="secondary">Unpaid</Text>;
                const ps = String(pStatus).toUpperCase();
                return <Tag color={ps === 'PAID' || ps === 'COMPLETED' ? 'green' : 'gold'}>{ps}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, record) => {
                const s = String(record.status).toUpperCase();
                const canCancel = s === 'PENDING' || s === 'CONFIRMED';
                const pStatus = String(record.paymentStatus || '').toUpperCase();
                const isUnpaid = !record.paymentStatus || pStatus === 'PENDING' || pStatus === 'FAILED';
                
                return (
                    <Space size="middle">
                        {s !== 'CANCELLED' && isUnpaid && (
                            <Button type="primary" size="small" style={{ borderRadius: 4 }} onClick={() => handlePayment(record)}>Pay Now</Button>
                        )}
                        <Button type="default" ghost={false} size="small" style={{ borderRadius: 4 }} onClick={() => handleViewDetails(record)}>Details</Button>
                        {canCancel && (
                            <Popconfirm title="Cancel this reservation?" onConfirm={() => handleDelete(record.reservationId || record.id)}>
                                <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                            </Popconfirm>
                        )}
                    </Space>
                );
            },
        },
    ];

    const safeReservations = Array.isArray(reservationStore.reservations) ? reservationStore.reservations : [];
    const safeVehicles = Array.isArray(vehicleStore.vehicles) ? vehicleStore.vehicles : [];
    const safeSlots = Array.isArray(parkingStore.slots) ? parkingStore.slots : [];

    const stats = {
        total: safeReservations.length,
        pending: safeReservations.filter(r => String(r.status).toUpperCase() === 'PENDING').length,
        confirmed: safeReservations.filter(r => ['CONFIRMED', 'COMPLETED'].includes(String(r.status).toUpperCase())).length,
        cancelled: safeReservations.filter(r => String(r.status).toUpperCase() === 'CANCELLED').length,
    };

    const filteredSlots = safeSlots.filter(s => {
        const sType = (s.vehicleTypeName || '').toLowerCase();
        return !sType.includes('motor') && !sType.includes('xe máy');
    });

    const handleVehicleChange = (vehicleId) => {
        const vehicle = safeVehicles.find(v => (v.vehicleId || v.id) === vehicleId);
        if (vehicle) {
            const vTypeName = (vehicle.vehicleType?.typeName || vehicle.vehicleType?.name || vehicle.vehicleTypeName || '').toLowerCase();
            setSelectedVehicleType(vTypeName);
            
            const isMotorbike = vTypeName.includes('motor') || vTypeName.includes('xe máy');
            if (!isMotorbike) {
                // Auto fill the first available car slot
                const firstAvailable = filteredSlots.find(s => s.status === 'AVAILABLE');
                if (firstAvailable) {
                    form.setFieldsValue({ slotId: firstAvailable.slotId || firstAvailable.id });
                } else {
                    form.setFieldsValue({ slotId: undefined });
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
                    viewingReservation && String(viewingReservation.status).toUpperCase() !== 'CANCELLED' && (!viewingReservation.paymentStatus || String(viewingReservation.paymentStatus).toUpperCase() === 'PENDING') && (
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
                            <Descriptions.Item label="Ref ID"><Text strong>#{viewingReservation.reservationId || viewingReservation.id}</Text></Descriptions.Item>
                            <Descriptions.Item label="Vehicle">
                                <Tag color="blue">{viewingReservation.vehicle?.licensePlate || viewingReservation.licensePlate || 'N/A'}</Tag>
                                <Text type="secondary">({viewingReservation.vehicleType?.typeName || viewingReservation.vehicleTypeName || 'N/A'})</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Slot">{viewingReservation.slot?.slotName || viewingReservation.parkingSlot?.slotName || viewingReservation.slotId || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Start Time">{viewingReservation.reservationStart || viewingReservation.startTime ? new Date(viewingReservation.reservationStart || viewingReservation.startTime).toLocaleString() : 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="End Time">{viewingReservation.reservationEnd || viewingReservation.endTime ? new Date(viewingReservation.reservationEnd || viewingReservation.endTime).toLocaleString() : 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={String(viewingReservation.status).toUpperCase() === 'CONFIRMED' || String(viewingReservation.status).toUpperCase() === 'COMPLETED' ? 'success' : String(viewingReservation.status).toUpperCase() === 'CANCELLED' ? 'error' : 'warning'}>
                                    {String(viewingReservation.status).toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Payment Status">
                                <Tag color={String(viewingReservation.paymentStatus || 'UNPAID').toUpperCase() === 'PAID' ? 'green' : 'gold'}>
                                    {String(viewingReservation.paymentStatus || 'UNPAID').toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Estimated Fee">
                                {viewingReservation.estimatedFee ? `${viewingReservation.estimatedFee.toLocaleString()} VND` : 'N/A'}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ReservationPage;
