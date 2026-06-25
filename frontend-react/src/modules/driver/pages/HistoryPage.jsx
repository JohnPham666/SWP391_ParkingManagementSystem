import React from 'react';
import { Card, Timeline, Typography, Empty } from 'antd';
import { CarOutlined, DollarOutlined, CalendarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const HistoryPage = () => {
    // Empty state for now since we don't have a merged history API
    const historyEvents = [];

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Activity History</Title>
                <Text type="secondary">Timeline of all your interactions with the parking system</Text>
            </div>

            <Card className="saas-card">
                {historyEvents.length === 0 ? (
                    <Empty 
                        image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                        imageStyle={{ height: 120 }}
                        description={<Text type="secondary">Your activity feed is currently empty. Start by making a reservation or adding a vehicle!</Text>}
                        style={{ padding: '60px 0' }}
                    />
                ) : (
                    <Timeline mode="left">
                        {/* Example structure for when data is connected */}
                        <Timeline.Item color="green" dot={<CalendarOutlined style={{ fontSize: 16 }} />}>
                            <div style={{ marginBottom: 16 }}>
                                <Text strong style={{ display: 'block', fontSize: 16 }}>Reservation Confirmed</Text>
                                <Text type="secondary">Slot A1 - 2024-06-25 10:00 AM</Text>
                            </div>
                        </Timeline.Item>
                        <Timeline.Item color="blue" dot={<CarOutlined style={{ fontSize: 16 }} />}>
                            <div style={{ marginBottom: 16 }}>
                                <Text strong style={{ display: 'block', fontSize: 16 }}>Vehicle Registered</Text>
                                <Text type="secondary">Toyota Camry (29A-123.45)</Text>
                            </div>
                        </Timeline.Item>
                        <Timeline.Item color="orange" dot={<DollarOutlined style={{ fontSize: 16 }} />}>
                            <div style={{ marginBottom: 16 }}>
                                <Text strong style={{ display: 'block', fontSize: 16 }}>Payment Completed</Text>
                                <Text type="secondary">$5.00 for Reservation #102</Text>
                            </div>
                        </Timeline.Item>
                    </Timeline>
                )}
            </Card>
        </div>
    );
};

export default HistoryPage;
