import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Button, Empty, Skeleton, theme, message, Modal } from 'antd';
import { DollarOutlined, ClockCircleOutlined, FallOutlined, DownloadOutlined } from '@ant-design/icons';
import { driverService } from '../services/driverService';

const { Title, Text } = Typography;

const getReservationId = (reservation) => reservation?.reservationId || reservation?.id;
const getPaymentStatus = (reservation) => {
    const reservationStatus = String(reservation?.status || reservation?.reservationStatus || '').toUpperCase();
    if (reservationStatus === 'CANCELLED') return 'CANCELLED';
    return String(reservation?.paymentStatus || reservation?.status || 'UNPAID').toUpperCase();
};
const canPayReservation = (reservation) => {
    const reservationStatus = String(reservation?.status || reservation?.reservationStatus || '').toUpperCase();
    const paymentStatus = getPaymentStatus(reservation);
    return ['PENDING', 'PENDING_PAYMENT'].includes(reservationStatus) && ['UNPAID', 'PENDING', 'FAILED'].includes(paymentStatus);
};
const getResponseData = (response) => response?.data || response;

const PaymentPage = () => {
    const { token } = theme.useToken();
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({ totalPaid: '0 VND', pending: '0', monthly: '0 VND' });
    const [isPendingModalVisible, setIsPendingModalVisible] = useState(false);

    // Payment State
    const [payingReservationId, setPayingReservationId] = useState(null);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let interval;
        if (paymentModalVisible && payingReservationId) {
            interval = setInterval(() => {
                fetchData(true);
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [paymentModalVisible, payingReservationId]);

    useEffect(() => {
        if (paymentModalVisible && payingReservationId) {
            const currentRes = payments.find(r => (r.reservationId || r.id) === payingReservationId);
            if (currentRes) {
                const pStatus = String(currentRes.status || '').toUpperCase();
                if (pStatus === 'PAID' || pStatus === 'COMPLETED') {
                    setPaymentModalVisible(false);
                    setPayingReservationId(null);
                    message.success({ content: 'Payment completed successfully!', key: 'payment_success', duration: 4 });
                } else if (pStatus === 'FAILED') {
                    setPaymentModalVisible(false);
                    setPayingReservationId(null);
                    message.error({ content: 'Payment failed or was cancelled.', key: 'payment_failed' });
                }
            }
        }
    }, [payments, paymentModalVisible, payingReservationId]);

    const fetchData = async (isPolling = false) => {
        if (!isPolling) setLoading(true);
        try {
            const res = await driverService.loadReservations();
            const rData = res?.data || res;
            if (Array.isArray(rData)) {
                let tPaid = 0;
                let pendingCount = 0;
                let tMonthly = 0;
                const currentMonth = new Date().getMonth();

                const pList = rData.map(r => {
                    const status = getPaymentStatus(r);
                    const amount = r.amount || r.estimatedFee || 0;
                    if (status === 'PAID') {
                        tPaid += amount;
                        const rDate = new Date(r.createdAt || r.reservationStart);
                        if (rDate.getMonth() === currentMonth) tMonthly += amount;
                    } else if (status === 'PENDING' || status === 'UNPAID' || status === 'FAILED') {
                        if (String(r.status).toUpperCase() !== 'CANCELLED') {
                            pendingCount++;
                        }
                    }

                    return {
                        id: r.paymentId || r.reservationId || r.id,
                        reservationId: r.reservationId || r.id,
                        date: r.createdAt || r.reservationStart,
                        description: `Reservation for ${r.vehicle?.licensePlate || 'Vehicle'}`,
                        amount: amount,
                        status: status,
                        reservationStatus: String(r.status).toUpperCase(),
                        rawReservation: r
                    };
                });
                
                pList.sort((a, b) => new Date(b.date) - new Date(a.date));
                setPayments(pList);
                setStats({
                    totalPaid: `${tPaid.toLocaleString()} VND`,
                    pending: pendingCount.toString(),
                    monthly: `${tMonthly.toLocaleString()} VND`
                });
            }
        } catch (error) {
            console.error('Failed to load payments', error);
            if (!isPolling) message.error('Failed to load payments history');
        } finally {
            if (!isPolling) setLoading(false);
        }
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
            title: 'Transaction ID',
            dataIndex: 'id',
            key: 'id',
            render: (text) => <Text strong>#{text}</Text>
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (text) => text ? new Date(text).toLocaleDateString() : 'N/A'
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description'
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (text) => <Text strong>{text ? `${text.toLocaleString()} VND` : '0 VND'}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = status === 'PAID' ? 'green' : 'gold';
                if (status === 'FAILED' || status === 'CANCELLED') color = 'red';
                return <Tag color={color} style={{ borderRadius: 10 }}>{status}</Tag>
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                if (record.reservationStatus === 'CANCELLED') return <Text type="secondary">Cancelled</Text>;
                if (canPayReservation(record.rawReservation)) {
                    return <Button type="primary" size="small" onClick={() => handlePayment(record.rawReservation)}>Pay Now</Button>;
                }
                return <Button type="link" icon={<DownloadOutlined />} size="small">Receipt</Button>;
            }
        }
    ];

    const paidPayments = payments.filter(p => p.status === 'PAID');
    const pendingPayments = payments.filter(p => p.status !== 'PAID' && p.reservationStatus !== 'CANCELLED');

    if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Payments & Billing</Title>
                <Text type="secondary">Manage your parking payments and billing history</Text>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                    <Card className="saas-card" style={{ background: token.colorFillSecondary, color: token.colorText, border: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Total Paid</Text>
                                <Title level={2} style={{ color: token.colorText, margin: 0 }}>{stats.totalPaid}</Title>
                            </div>
                            <DollarOutlined style={{ fontSize: 48, opacity: 0.5 }} />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card 
                        className="saas-card" 
                        style={{ background: token.colorWarningBg, borderColor: token.colorBorder, cursor: 'pointer' }}
                        onClick={() => setIsPendingModalVisible(true)}
                        hoverable
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Text type="secondary">Pending Payments</Text>
                                <Title level={2} style={{ color: token.colorWarning, margin: 0 }}>{stats.pending}</Title>
                            </div>
                            <ClockCircleOutlined style={{ fontSize: 48, color: '#fcd34d', opacity: 0.5 }} />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="saas-card" style={{ background: token.colorFillAlter }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Text type="secondary">This Month</Text>
                                <Title level={2} style={{ margin: 0 }}>{stats.monthly}</Title>
                            </div>
                            <FallOutlined style={{ fontSize: 48, color: '#cbd5e1', opacity: 0.5 }} />
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card className="saas-card" title={<Title level={4} style={{ margin: 0 }}>Payment History</Title>} styles={{ body: { padding: 0 } }}>
                {paidPayments.length === 0 ? (
                    <Empty 
                        image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                        imageStyle={{ height: 120 }}
                        description={<Text type="secondary">No completed payments found. Once you make a booking and complete payment, it will appear here.</Text>}
                        style={{ padding: '60px 0' }}
                    />
                ) : (
                    <Table columns={columns} dataSource={paidPayments} pagination={{ pageSize: 10 }} />
                )}
            </Card>

            <Modal
                title={<Title level={4} style={{ margin: 0 }}>Pending Payments</Title>}
                open={isPendingModalVisible}
                onOk={() => setIsPendingModalVisible(false)}
                onCancel={() => setIsPendingModalVisible(false)}
                footer={<Button onClick={() => setIsPendingModalVisible(false)}>Close</Button>}
                width={800}
                destroyOnHidden
            >
                {pendingPayments.length === 0 ? (
                    <Empty description={<Text type="secondary">You have no pending payments.</Text>} style={{ padding: '40px 0' }} />
                ) : (
                    <Table 
                        columns={columns} 
                        dataSource={pendingPayments} 
                        pagination={false} 
                        scroll={{ y: 400 }}
                    />
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
                        This window will automatically close and update your payment status once successful.
                    </Text>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </Modal>
        </div>
    );
};

export default PaymentPage;
