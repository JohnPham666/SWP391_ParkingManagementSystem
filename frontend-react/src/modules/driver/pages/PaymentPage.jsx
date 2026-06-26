import React from 'react';
import { Card, Row, Col, Typography, Table, Tag, Button, Empty, Skeleton , theme } from 'antd';
import { DollarOutlined, ClockCircleOutlined, FallOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PaymentPage = () => {
    const { token } = theme.useToken();
    // Placeholder data for aesthetic purposes (since we don't fetch payments yet)
    const loading = false;
    const payments = [];

    const stats = {
        totalPaid: '$0.00',
        pending: '0',
        monthly: '$0.00'
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
            key: 'date'
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
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = status === 'PAID' ? 'green' : 'gold';
                return <Tag color={color} style={{ borderRadius: 10 }}>{status}</Tag>
            }
        },
        {
            title: 'Receipt',
            key: 'action',
            render: () => <Button type="link" icon={<DownloadOutlined />} size="small">Download</Button>
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
