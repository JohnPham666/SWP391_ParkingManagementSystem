import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Button, Empty, Skeleton, theme, message } from 'antd';
import { DollarOutlined, ClockCircleOutlined, FallOutlined, DownloadOutlined } from '@ant-design/icons';
import { driverService } from '../services/driverService';

const { Title, Text } = Typography;

const PaymentPage = () => {
    const { token } = theme.useToken();
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({ totalPaid: '0 VND', pending: '0', monthly: '0 VND' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await driverService.loadReservations();
            const rData = res?.data || res;
            if (Array.isArray(rData)) {
                let tPaid = 0;
                let pendingCount = 0;
                let tMonthly = 0;
                const currentMonth = new Date().getMonth();

                const pList = rData.map(r => {
                    const status = String(r.paymentStatus || 'UNPAID').toUpperCase();
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
            message.error('Failed to load payments history');
        } finally {
            setLoading(false);
        }
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
                if (status === 'FAILED') color = 'red';
                return <Tag color={color} style={{ borderRadius: 10 }}>{status}</Tag>
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                const isUnpaid = record.status === 'PENDING' || record.status === 'UNPAID' || record.status === 'FAILED';
                if (record.reservationStatus === 'CANCELLED') return <Text type="secondary">Cancelled</Text>;
                if (isUnpaid) {
                    return <Button type="primary" size="small" onClick={() => handlePayment(record.rawReservation)}>Pay Now</Button>;
                }
                return <Button type="link" icon={<DownloadOutlined />} size="small">Receipt</Button>;
            }
        }
    ];

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
                    <Card className="saas-card" style={{ background: token.colorWarningBg, borderColor: token.colorBorder }}>
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
                {payments.length === 0 ? (
                    <Empty 
                        image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                        imageStyle={{ height: 120 }}
                        description={<Text type="secondary">No payment history found. Once you make a booking and complete payment, it will appear here.</Text>}
                        style={{ padding: '60px 0' }}
                    />
                ) : (
                    <Table columns={columns} dataSource={payments} pagination={{ pageSize: 10 }} />
                )}
            </Card>
        </div>
    );
};

export default PaymentPage;
