import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, DatePicker, Space, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
// import api from '../../services/api';

const { RangePicker } = DatePicker;

const SystemLogs = () => {
  const [logs, setLogs] = useState([
    { id: 1, timestamp: '2023-11-20 14:30:00', level: 'INFO', action: 'USER_LOGIN', user: 'Admin', ip: '192.168.1.5' },
    { id: 2, timestamp: '2023-11-20 15:45:12', level: 'WARN', action: 'PAYMENT_FAILED', user: 'System', ip: '-' },
    { id: 3, timestamp: '2023-11-20 16:10:05', level: 'INFO', action: 'UPDATE_PRICING', user: 'Admin', ip: '192.168.1.5' },
  ]);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   fetchLogs();
  // }, []);

  // const fetchLogs = async () => {
  //   setLoading(true);
  //   try {
  //     const res = await api.get('/logs');
  //     setLogs(res.data.data);
  //   } catch (error) {
  //     message.error('Failed to load system logs');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const columns = [
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
    { 
      title: 'Level', 
      dataIndex: 'level', 
      key: 'level', 
      width: 100,
      render: (level) => {
        let color = level === 'ERROR' ? 'red' : level === 'WARN' ? 'orange' : 'blue';
        return <Tag color={color}>{level}</Tag>;
      }
    },
    { title: 'Action', dataIndex: 'action', key: 'action', render: val => <strong>{val}</strong> },
    { title: 'User', dataIndex: 'user', key: 'user', width: 120 },
    { title: 'IP Address', dataIndex: 'ip', key: 'ip', width: 150 },
  ];

  return (
    <Card title="System Audit Logs">
      <div style={{ marginBottom: 16 }}>
        <Space>
          <RangePicker />
          <Button type="primary" icon={<SearchOutlined />}>Filter</Button>
        </Space>
      </div>
      <Table 
        columns={columns} 
        dataSource={logs} 
        rowKey="id" 
        loading={loading}
        size="small"
      />
    </Card>
  );
};

export default SystemLogs;
