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
      // Chuyển đổi dữ liệu từ form sang định dạng request của backend
      const requestData = {
        vehicleTypeId: values.vehicleTypeId,
        policyName: values.policyName,
        basePrice: values.basePrice,
        rushHourPrice: values.rushHourPrice || values.basePrice,
        offPeakPrice: values.offPeakPrice || values.basePrice,
        monthlyPrice: values.monthlyPrice,
        rushHourStart: "07:00:00",
        rushHourEnd: "19:00:00",
        maxDailyRate: values.maxDailyRate || 0,
        lostTicketFee: 200000,
        overtimeFeePerHour: 0,
        effectiveFrom: new Date().toISOString()
      };

      if (editingRule) {
        await pricingApi.updatePricingRule(editingRule.pricingPolicyId, requestData);
        message.success('Pricing rule updated successfully');
      } else {
        await pricingApi.createPricingRule(requestData);
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
    { title: 'Base Hourly Rate', dataIndex: 'basePrice', key: 'basePrice', render: (val) => `${val?.toLocaleString() || 0} VND` },
    { title: 'Monthly Price', dataIndex: 'monthlyPrice', key: 'monthlyPrice', render: (val) => `${val?.toLocaleString() || 0} VND` },
    { title: 'Max Daily Rate', dataIndex: 'maxDailyRate', key: 'maxDailyRate', render: (val) => `${val?.toLocaleString() || 0} VND` },
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
          <Form.Item name="policyName" label="Policy Name" rules={[{ required: true }]}>
            <Input placeholder="E.g. Standard Car Policy" />
          </Form.Item>
          <Form.Item name="vehicleTypeId" label="Vehicle Type" rules={[{ required: true }]}>
            <Select>
              <Option value={1}>Car</Option>
              <Option value={2}>Motorbike</Option>
              <Option value={3}>Bicycle</Option>
            </Select>
          </Form.Item>
          <Form.Item name="basePrice" label="Base Hourly Rate (VND)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Form.Item name="monthlyPrice" label="Monthly Subscription Price (VND)" rules={[{ required: true }]}>
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
