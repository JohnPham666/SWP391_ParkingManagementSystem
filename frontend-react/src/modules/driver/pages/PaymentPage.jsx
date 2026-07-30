import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Button, Empty, Skeleton, theme, message, Modal, Space } from 'antd';
import { DollarOutlined, ClockCircleOutlined, FallOutlined, DownloadOutlined } from '@ant-design/icons';
import { driverService } from '../services/driverService';

const { Title, Text } = Typography;

// Các hàm tiện ích hỗ trợ trích xuất thông tin ID, Trạng thái Thanh toán và Kiểm tra xem có thể thanh toán hay không
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

// Khởi tạo component quản lý Thanh toán (PaymentPage)
const PaymentPage = () => {
    const { token } = theme.useToken();
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({ totalPaid: '0 VND', pending: '0', monthly: '0 VND' });
    const [isPendingModalVisible, setIsPendingModalVisible] = useState(false);

    // Detail Modal State
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [detailRecord, setDetailRecord] = useState(null);

    const handleViewDetail = (record) => {
        setDetailRecord(record);
        setIsDetailModalVisible(true);
    };

    // Payment State
    const [payingReservationId, setPayingReservationId] = useState(null);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);

    // Gọi API để tải danh sách thanh toán khi component vừa render
    useEffect(() => {
        fetchData();
    }, []);

    // Hook tạo vòng lặp (polling) kiểm tra trạng thái thanh toán mỗi 3 giây khi có modal thanh toán đang mở
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

    // Hook theo dõi danh sách thanh toán, tự động đóng modal và thông báo kết quả khi phát hiện trạng thái đã được cập nhật thành PAID/COMPLETED hoặc FAILED
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

    // Hàm gọi API lấy danh sách đặt chỗ và vé tháng từ backend và tính toán các chỉ số thống kê
    const fetchData = async (isPolling = false) => {
        if (!isPolling) setLoading(true);
        try {
            const [resData, subData] = await Promise.all([
                driverService.loadReservations().catch(() => ({ data: [] })),
                driverService.loadSubscriptions().catch(() => ({ data: [] }))
            ]);
            
            let rData = resData?.success ? resData.data : (resData?.data || resData);
            if (!Array.isArray(rData) && rData?.content) rData = rData.content;
            
            let sData = subData?.success ? subData.data : (subData?.data || subData);
            if (!Array.isArray(sData) && sData?.content) sData = sData.content;
            
            let tPaid = 0;
            let pendingCount = 0;
            let tMonthly = 0;
            const currentMonth = new Date().getMonth();
            const pList = [];

            // Xử lý Reservations
            if (Array.isArray(rData)) {
                rData.forEach(r => {
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

                    pList.push({
                        id: r.paymentId || r.reservationId || r.id,
                        reservationId: r.reservationId || r.id,
                        date: r.createdAt || r.reservationStart,
                        description: `Reservation for ${r.vehicle?.licensePlate || 'Vehicle'}`,
                        amount: amount,
                        status: status,
                        reservationStatus: String(r.status).toUpperCase(),
                        rawReservation: r,
                        type: 'RESERVATION'
                    });
                });
            }

            // Xử lý Subscriptions
            if (Array.isArray(sData)) {
                sData.forEach(s => {
                    // Subscription payment mapping
                    // Đối với Subscription, status của Payment phụ thuộc vào status của Subscription hoặc paymentId
                    let paymentStatus = s.status === 'ACTIVE' ? 'PAID' : (s.status === 'PENDING' ? 'PENDING' : s.status);
                    const amount = s.monthlyFee || 0;
                    
                    if (paymentStatus === 'PAID') {
                        tPaid += amount;
                        const sDate = new Date(s.createdAt);
                        if (sDate.getMonth() === currentMonth) tMonthly += amount;
                    } else if (paymentStatus === 'PENDING') {
                        pendingCount++;
                    }

                    if (s.status !== 'REJECTED' && s.status !== 'CANCELLED') {
                        pList.push({
                            id: s.paymentId || `sub_${s.subscriptionId}`,
                            reservationId: s.subscriptionId, // Dùng tạm ID của subscription để xử lý row key
                            paymentId: s.paymentId,
                            date: s.createdAt,
                            description: `Monthly Subscription for ${s.licensePlate || 'Vehicle'}`,
                            amount: amount,
                            status: paymentStatus,
                            reservationStatus: s.status,
                            rawReservation: s,
                            type: 'SUBSCRIPTION'
                        });
                    }
                });
            }

            pList.sort((a, b) => new Date(b.date) - new Date(a.date));
            setPayments(pList);
            setStats({
                totalPaid: `${tPaid.toLocaleString()} VND`,
                pending: pendingCount.toString(),
                monthly: `${tMonthly.toLocaleString()} VND`
            });
        } catch (error) {
            console.error('Failed to load payments', error);
            if (!isPolling) message.error('Failed to load payments history');
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    // Xử lý tạo phiên thanh toán mới với VNPay khi tài xế nhấn nút "Pay Now"
    const handlePayment = async (item) => {
        try {
            const itemId = getReservationId(item);
            if (!itemId) {
                message.warning({ content: 'Invalid payment target.', key: 'payment' });
                return;
            }

            // Với Reservation
            if (item.type === 'RESERVATION') {
                if (!canPayReservation(item.rawReservation)) {
                    message.warning({ content: 'This reservation is not available for payment.', key: 'payment' });
                    return;
                }
                message.loading({ content: 'Initializing payment...', key: 'payment' });
                const payRes = await driverService.createPayment({
                    reservationId: itemId,
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
                    fetchData(); // Optionally reload after opening
                } else {
                    message.error({ content: 'Failed to get payment URL', key: 'payment' });
                }
            } 
            // Với Subscription
            else if (item.type === 'SUBSCRIPTION') {
                if (item.status !== 'PENDING' || !item.paymentId) {
                    message.warning({ content: 'This subscription does not have a pending payment.', key: 'payment' });
                    return;
                }
                message.loading({ content: 'Redirecting to VNPay...', key: 'payment' });
                
                const urlRes = await driverService.createVnPayUrl(item.paymentId);
                const urlData = getResponseData(urlRes);
                const paymentUrl = urlData?.paymentUrl || urlData?.url;
                
                if (paymentUrl) {
                    window.open(paymentUrl, '_blank');
                    fetchData(); // Optionally reload after opening
                } else {
                    message.error({ content: 'Failed to get payment URL', key: 'payment' });
                }
            }

        } catch (error) {
            console.error('Payment initialization failed:', error);
            message.error({ content: 'Failed to initialize payment.', key: 'payment' });
        }
    };

    const handleCancel = (item) => {
        Modal.confirm({
            title: 'Cancel Transaction',
            content: `Are you sure you want to cancel this ${item.type === 'SUBSCRIPTION' ? 'subscription' : 'reservation'}?`,
            okText: 'Yes, Cancel',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                try {
                    const itemId = getReservationId(item);
                    if (item.type === 'RESERVATION') {
                        await driverService.cancelReservation(itemId);
                    } else if (item.type === 'SUBSCRIPTION') {
                        await driverService.cancelSubscriptionByUser(itemId);
                    }
                    message.success('Transaction cancelled successfully');
                    fetchData();
                } catch (error) {
                    console.error('Cancel failed', error);
                    message.error('Failed to cancel transaction');
                }
            }
        });
    };

    // Khởi tạo các cột dữ liệu cho bảng lịch sử giao dịch
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
            title: 'Detail',
            key: 'detail',
            render: (_, record) => {
                let showPayNow = false;
                if (record.type === 'RESERVATION' && canPayReservation(record.rawReservation)) {
                    showPayNow = true;
                } else if (record.type === 'SUBSCRIPTION' && record.status === 'PENDING') {
                    showPayNow = true;
                }

                return (
                    <Space size="small" wrap>
                        <Button type="default" size="small" onClick={() => handleViewDetail(record)}>
                            View Detail
                        </Button>
                        {showPayNow && (
                            <>
                                <Button type="primary" size="small" onClick={() => handlePayment(record)}>Pay Now</Button>
                                <Button danger size="small" onClick={() => handleCancel(record)}>Cancel</Button>
                            </>
                        )}
                        {!showPayNow && record.reservationStatus === 'CANCELLED' && (
                            <Text type="secondary">Cancelled</Text>
                        )}
                    </Space>
                );
            }
        }
    ];

    const paidPayments = payments.filter(p => p.status === 'PAID');
    const pendingPayments = payments.filter(p => p.status !== 'PAID' && p.reservationStatus !== 'CANCELLED');

    if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;

    // Render phần giao diện thống kê và bảng lịch sử giao dịch của trang thanh toán
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

            <Modal
                title={<Title level={4} style={{ margin: 0 }}>Transaction Details</Title>}
                open={isDetailModalVisible}
                onOk={() => setIsDetailModalVisible(false)}
                onCancel={() => setIsDetailModalVisible(false)}
                footer={<Button onClick={() => setIsDetailModalVisible(false)}>Close</Button>}
                destroyOnHidden
            >
                {detailRecord && (
                    <div style={{ padding: '16px 0' }}>
                        <Row gutter={[16, 16]}>
                            <Col span={8}><Text type="secondary">Transaction ID:</Text></Col>
                            <Col span={16}><Text strong>#{detailRecord.id}</Text></Col>
                            
                            <Col span={8}><Text type="secondary">Type:</Text></Col>
                            <Col span={16}><Tag color="blue">{detailRecord.type}</Tag></Col>

                            <Col span={8}><Text type="secondary">Date:</Text></Col>
                            <Col span={16}><Text>{new Date(detailRecord.date).toLocaleString()}</Text></Col>

                            <Col span={8}><Text type="secondary">Description:</Text></Col>
                            <Col span={16}><Text>{detailRecord.description}</Text></Col>

                            <Col span={8}><Text type="secondary">Amount:</Text></Col>
                            <Col span={16}>
                                <Text strong style={{ color: '#faad14' }}>
                                    {detailRecord.amount ? `${detailRecord.amount.toLocaleString()} VND` : '0 VND'}
                                </Text>
                            </Col>

                            <Col span={8}><Text type="secondary">Payment Status:</Text></Col>
                            <Col span={16}>
                                <Tag color={detailRecord.status === 'PAID' ? 'green' : (detailRecord.status === 'FAILED' ? 'red' : 'gold')}>
                                    {detailRecord.status}
                                </Tag>
                            </Col>

                            <Col span={8}><Text type="secondary">System Status:</Text></Col>
                            <Col span={16}>
                                <Tag>
                                    {detailRecord.reservationStatus}
                                </Tag>
                            </Col>

                            {detailRecord.type === 'RESERVATION' && detailRecord.rawReservation?.slot && (
                                <>
                                    <Col span={8}><Text type="secondary">Slot Info:</Text></Col>
                                    <Col span={16}>
                                        <Text>
                                            {detailRecord.rawReservation.slot.name} 
                                            ({detailRecord.rawReservation.slot.zone?.name}, {detailRecord.rawReservation.slot.zone?.floor?.name})
                                        </Text>
                                    </Col>
                                </>
                            )}
                        </Row>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PaymentPage;
