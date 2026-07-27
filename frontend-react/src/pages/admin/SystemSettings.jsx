import React, { useState, useEffect } from 'react';
import { Card, Table, message, Button, Input, Modal, Form } from 'antd';
import { EditOutlined } from '@ant-design/icons';
// import api from '../../services/api';

const SystemSettings = () => {
  const [settings, setSettings] = useState([
    { key: 'maintenance_mode', value: 'false', description: 'Enable system maintenance mode' },
    { key: 'max_reservation_hours', value: '24', description: 'Maximum hours for a reservation' },
    { key: 'grace_period_minutes', value: '15', description: 'Grace period for late checkout' },
    { key: 'payment_timeout_minutes', value: '10', description: 'Time allowed for a driver to complete payment before it expires' },
    { key: 'night_shift_start_time', value: '22:00', description: 'Start time for night shift pricing (HH:mm)' },
    { key: 'night_shift_end_time', value: '06:00', description: 'End time for night shift pricing (HH:mm)' },
    { key: 'allow_guest_parking', value: 'true', description: 'Allow unregistered drivers to park' },
    { key: 'max_vehicles_per_user', value: '3', description: 'Maximum number of vehicles a regular user can register' },
    { key: 'system_contact_email', value: 'support@parksmart.com', description: 'Support email for driver inquiries' }
  ]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);

  // useEffect(() => {
  //   fetchSettings();
  // }, []);

  // const fetchSettings = async () => {
  //   setLoading(true);
  //   try {
  //     const res = await api.get('/settings');
  //     setSettings(res.data.data);
  //   } catch (error) {
  //     message.error('Failed to load settings');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleEdit = (record) => {
    setEditingKey(record.key);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      // await api.put(`/settings/${editingKey}`, { value: values.value });
      
      const newSettings = settings.map(s => s.key === editingKey ? { ...s, value: values.value } : s);
      setSettings(newSettings);
      
      message.success('Setting updated successfully');
      setIsModalVisible(false);
    } catch (error) {
      message.error('Failed to update setting');
    }
  };

  const columns = [
    { title: 'Configuration Key', dataIndex: 'key', key: 'key', render: (val) => <strong>{val}</strong> },
    { title: 'Value', dataIndex: 'value', key: 'value' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
      ),
    },
  ];

  return (
    <Card title="System Settings">
      <Table columns={columns} dataSource={settings} rowKey="key" loading={loading} pagination={false} />
      
      <Modal
        title="Edit Configuration"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="key" label="Configuration Key">
            <Input disabled />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input disabled />
          </Form.Item>
          <Form.Item name="value" label="Value" rules={[{ required: true, message: 'Value is required' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SystemSettings;
