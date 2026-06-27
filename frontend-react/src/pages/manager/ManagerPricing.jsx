import React, { useState, useEffect } from 'react';
import { Card, Table, message, Button, Modal, Form, InputNumber, Input, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { pricingApi } from '../../services/api';

const { Option } = Select;

const ManagerPricing = () => {
  const [pricingRules, setPricingRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form] = Form.useForm();

  const auth = JSON.parse(localStorage.getItem('parking_auth') || '{}');
  const isAdmin = auth.role === 'Admin' || auth.user?.roleName === 'Admin' || auth.user?.role?.roleName === 'Admin';

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await pricingApi.getPricingRules();
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        setPricingRules(data);
      }
    } catch (error) {
      message.error('Failed to load pricing policies');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRule(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await pricingApi.deletePricingRule(id);
      message.success('Pricing rule deleted successfully');
      fetchPricing();
    } catch (error) {
      message.error('Failed to delete pricing rule');
    }
  };

  const handleSave = async (values) => {
    try {
      if (editingRule) {
        await pricingApi.updatePricingRule(editingRule.pricingPolicyId, values);
        message.success('Pricing rule updated successfully');
      } else {
        await pricingApi.createPricingRule(values);
        message.success('Pricing rule created successfully');
      }
      setIsModalVisible(false);
      fetchPricing();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save pricing rule');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'pricingPolicyId', key: 'id' },
    { title: 'Policy Name', dataIndex: 'policyName', key: 'policyName', render: text => <strong>{text}</strong> },
    { title: 'Base Hourly Rate', dataIndex: 'basePrice', key: 'basePrice', render: (val) => `${val?.toLocaleString() || 0} ₫` },
    { title: 'Max Daily Rate', dataIndex: 'maxDailyRate', key: 'maxDailyRate', render: (val) => `${val?.toLocaleString() || 0} ₫` },
  ];

  if (isAdmin) {
    columns.push({
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.pricingPolicyId)}>Delete</Button>
        </>
      ),
    });
  }

  return (
    <Card 
      title="Pricing Policies"
      extra={isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Create Policy</Button>}
    >
      <Table columns={columns} dataSource={pricingRules} rowKey="pricingPolicyId" loading={loading} />

      <Modal
        title={editingRule ? "Edit Pricing Policy" : "Create Pricing Policy"}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="vehicleType" label="Vehicle Type" rules={[{ required: true }]}>
            <Select>
              <Option value="CAR">Car</Option>
              <Option value="MOTORBIKE">Motorbike</Option>
              <Option value="BICYCLE">Bicycle</Option>
            </Select>
          </Form.Item>
          <Form.Item name="baseHourlyRate" label="Base Hourly Rate (VND)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Form.Item name="maxDailyRate" label="Max Daily Rate (VND)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ManagerPricing;
