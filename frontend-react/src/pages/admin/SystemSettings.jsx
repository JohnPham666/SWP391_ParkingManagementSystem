import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Modal, Form, Tag, Tabs, App, Typography, Divider } from 'antd';
import { EditOutlined, SettingOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;

const SystemSettingsContent = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);
  const { message } = App.useApp();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data && res.data.success) {
        setSettings(res.data.data);
      }
    } catch (error) {
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingKey(record.configKey);
    form.setFieldsValue({
      configKey: record.configKey,
      description: record.description,
      configValue: record.configValue,
    });
    setIsModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      const res = await api.put(`/settings/${editingKey}`, { value: values.configValue });
      if (res.data && res.data.success) {
        message.success('Setting updated successfully');
        fetchSettings();
        setIsModalVisible(false);
      } else {
        message.error(res.data.message || 'Failed to update setting');
      }
    } catch (error) {
      message.error('Failed to update setting');
    }
  };

  const columns = [
    { 
      title: 'Config Key', 
      dataIndex: 'configKey', 
      key: 'configKey', 
      width: '25%',
      render: (val) => <Text strong style={{ color: '#1890ff' }}>{val}</Text> 
    },
    { 
      title: 'Value', 
      dataIndex: 'configValue', 
      key: 'configValue',
      width: '15%',
      render: (val) => <Tag color="blue" style={{ fontSize: '14px', padding: '4px 10px' }}>{val}</Tag>
    },
    { 
      title: 'Description', 
      dataIndex: 'description', 
      key: 'description',
      width: '50%'
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_, record) => (
        <Button type="primary" ghost icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small">
          Edit
        </Button>
      ),
    },
  ];

  // Group settings by category
  const groupedSettings = settings.reduce((acc, curr) => {
    const category = curr.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(curr);
    return acc;
  }, {});

  const tabItems = Object.keys(groupedSettings).map((category) => {
    return {
      key: category,
      label: (
        <span>
          <SettingOutlined />
          {category}
        </span>
      ),
      children: (
        <div style={{ padding: '10px 0' }}>
          <Title level={4} style={{ marginTop: 0, color: '#262626' }}>{category} Configuration</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Manage all system configurations related to {category.toLowerCase()}.
          </Text>
          <Table 
            columns={columns} 
            dataSource={groupedSettings[category]} 
            rowKey="configKey" 
            pagination={false} 
            bordered
            size="middle"
          />
        </div>
      ),
    };
  });

  return (
    <Card 
      title={<Title level={3} style={{ margin: 0 }}>System Settings</Title>} 
      bordered={false} 
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '8px' }}
      loading={loading}
    >
      {Object.keys(groupedSettings).length > 0 ? (
        <Tabs defaultActiveKey={Object.keys(groupedSettings)[0]} items={tabItems} size="large" />
      ) : (
        <Table columns={columns} dataSource={[]} />
      )}
      
      <Modal
        title={<div><SettingOutlined /> Edit Configuration</div>}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        okText="Save Changes"
        cancelText="Cancel"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 20 }}>
          <Form.Item name="configKey" label="Configuration Key">
            <Input disabled size="large" style={{ backgroundColor: '#f5f5f5' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea disabled rows={2} style={{ backgroundColor: '#f5f5f5' }} />
          </Form.Item>
          <Divider dashed />
          <Form.Item name="configValue" label="New Value" rules={[{ required: true, message: 'Value is required' }]}>
            <Input size="large" autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

const SystemSettings = () => (
  <App>
    <SystemSettingsContent />
  </App>
);

export default SystemSettings;
