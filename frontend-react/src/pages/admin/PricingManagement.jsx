import React, { useState, useEffect } from 'react';
import { Card, Table, message, Button, Modal, Form, InputNumber, Input, Select, Tag, Space, DatePicker, TimePicker, Row, Col, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, CarOutlined, ThunderboltOutlined, CoffeeOutlined } from '@ant-design/icons';
import { pricingApi } from '../../services/api';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { Option } = Select;

const VEHICLE_TYPES = {
  1: 'Car',
  2: 'Motorbike',
  3: 'Bicycle'
};

const PricingManagement = () => {
  const [pricingPolicies, setPricingPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [form] = Form.useForm();
  
  const [filters, setFilters] = useState({ vehicleTypeId: null, status: null });

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await pricingApi.getPricingRules();
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        // Sort descending by effectiveFrom
        data.sort((a, b) => dayjs(b.effectiveFrom).valueOf() - dayjs(a.effectiveFrom).valueOf());
        setPricingPolicies(data);
      }
    } catch (error) {
      message.error('Failed to load pricing policies');
    } finally {
      setLoading(false);
    }
  };

  const getPolicyStatus = (record) => {
    const now = dayjs();
    const from = dayjs(record.effectiveFrom);
    const to = record.effectiveTo ? dayjs(record.effectiveTo) : null;

    if (now.isBefore(from)) return 'FUTURE';
    if (to && now.isAfter(to)) return 'EXPIRED';
    return 'ACTIVE';
  };

  const handleAdd = () => {
    setEditingPolicy(null);
    form.resetFields();
    form.setFieldsValue({
      effectiveFrom: dayjs(),
      rushHourStart: dayjs('07:00:00', 'HH:mm:ss'),
      rushHourEnd: dayjs('19:00:00', 'HH:mm:ss'),
    });
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingPolicy(record);
    form.setFieldsValue({
      ...record,
      effectiveFrom: record.effectiveFrom ? dayjs(record.effectiveFrom) : null,
      rushHourStart: record.rushHourStart ? dayjs(record.rushHourStart, 'HH:mm:ss') : null,
      rushHourEnd: record.rushHourEnd ? dayjs(record.rushHourEnd, 'HH:mm:ss') : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await pricingApi.deletePricingRule(id);
      message.success('Policy deleted successfully');
      fetchPricing();
    } catch (error) {
      message.error('Failed to delete policy');
    }
  };

  const handleSave = async (values) => {
    try {
      const payload = {
        ...values,
        rushHourStart: values.rushHourStart ? values.rushHourStart.format('HH:mm:ss') : null,
        rushHourEnd: values.rushHourEnd ? values.rushHourEnd.format('HH:mm:ss') : null,
        effectiveFrom: values.effectiveFrom ? values.effectiveFrom.toISOString() : null,
        effectiveTo: null // Always null when creating via UI to keep it active infinitely
      };

      if (editingPolicy) {
        // Just update existing
        await pricingApi.updatePricingRule(editingPolicy.pricingPolicyId, payload);
        message.success('Policy updated successfully');
      } else {
        // CREATE NEW POLICY LOGIC
        // 1. Find currently ACTIVE policy for this vehicle type
        const activePolicy = pricingPolicies.find(p => 
          p.vehicleTypeId === values.vehicleTypeId && getPolicyStatus(p) === 'ACTIVE'
        );

        if (activePolicy) {
          // 2. Terminate old policy exactly when the new one starts
          const terminatePayload = {
            ...activePolicy,
            effectiveTo: payload.effectiveFrom
          };
          await pricingApi.updatePricingRule(activePolicy.pricingPolicyId, terminatePayload);
        }

        // 3. Create the new policy
        await pricingApi.createPricingRule(payload);
        message.success('New active policy created successfully. Old policy (if any) was terminated.');
      }
      
      setIsModalVisible(false);
      fetchPricing();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save pricing policy');
    }
  };

  const filteredPolicies = pricingPolicies.filter(p => {
    const matchVehicle = !filters.vehicleTypeId || p.vehicleTypeId === filters.vehicleTypeId;
    const matchStatus = !filters.status || getPolicyStatus(p) === filters.status;
    return matchVehicle && matchStatus;
  });

  const columns = [
    { title: 'ID', dataIndex: 'pricingPolicyId', key: 'id', width: 60 },
    { 
      title: 'Policy Name', 
      dataIndex: 'policyName', 
      key: 'name',
      render: text => <strong style={{ color: 'var(--ant-primary-color, #1677ff)' }}>{text}</strong>
    },
    { 
      title: 'Vehicle', 
      dataIndex: 'vehicleTypeId', 
      key: 'type',
      width: 120,
      render: (id) => {
        let icon = null;
        let color = 'default';
        if (id === 1) { icon = <CarOutlined />; color = 'blue'; }
        if (id === 2) { icon = <ThunderboltOutlined />; color = 'orange'; }
        if (id === 3) { icon = <CoffeeOutlined />; color = 'green'; }
        return <Tag color={color} icon={icon}>{VEHICLE_TYPES[id] || `Type ${id}`}</Tag>;
      }
    },
    { 
      title: 'Base Price', 
      dataIndex: 'basePrice',
      key: 'basePrice',
      render: val => <strong style={{ color: 'var(--ant-success-color, #52c41a)' }}>{val?.toLocaleString() || 0} ₫</strong>
    },
    { 
      title: 'Rush Hour', 
      dataIndex: 'rushHourPrice',
      key: 'rushHourPrice',
      render: val => <strong>{val?.toLocaleString() || 0} ₫/h</strong>
    },
    { 
      title: 'Off-peak', 
      dataIndex: 'offPeakPrice',
      key: 'offPeakPrice',
      render: val => <strong>{val?.toLocaleString() || 0} ₫/h</strong>
    },
    { 
      title: 'Max Daily', 
      dataIndex: 'maxDailyRate',
      key: 'maxDailyRate',
      render: val => <strong>{val?.toLocaleString() || 0} ₫</strong>
    },
    { 
      title: 'Overtime', 
      dataIndex: 'overtimeFeePerHour',
      key: 'overtimeFeePerHour',
      render: val => <strong>{val?.toLocaleString() || 0} ₫/h</strong>
    },
    { 
      title: 'Lost Ticket', 
      dataIndex: 'lostTicketFee',
      key: 'lostTicketFee',
      render: val => <strong style={{ color: 'var(--ant-error-color, red)' }}>{val?.toLocaleString() || 0} ₫</strong>
    },
    { 
      title: 'Status / Timeline', 
      key: 'status',
      render: (_, record) => {
        const status = getPolicyStatus(record);
        let color = status === 'ACTIVE' ? 'success' : status === 'EXPIRED' ? 'default' : 'processing';
        return (
          <div>
            <Tag color={color} style={{ marginBottom: 4 }}>{status}</Tag>
            <div style={{ fontSize: '11px', color: 'var(--ant-color-text-secondary, #8c8c8c)' }}>
              From: {dayjs(record.effectiveFrom).format('DD/MM/YYYY HH:mm')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ant-color-text-secondary, #8c8c8c)' }}>
              To: {record.effectiveTo ? dayjs(record.effectiveTo).format('DD/MM/YYYY HH:mm') : 'Indefinite'}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title="Pricing Policies Configuration"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Create New Policy
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <Select 
          placeholder="Filter by Vehicle Type" 
          style={{ width: 200 }} 
          allowClear 
          value={filters.vehicleTypeId}
          onChange={(val) => setFilters({ ...filters, vehicleTypeId: val })}
        >
          {Object.entries(VEHICLE_TYPES).map(([id, name]) => (
            <Option key={id} value={parseInt(id)}>{name}</Option>
          ))}
        </Select>
        <Select 
          placeholder="Filter by Status" 
          style={{ width: 160 }} 
          allowClear 
          value={filters.status}
          onChange={(val) => setFilters({ ...filters, status: val })}
        >
          <Option value="ACTIVE">Active</Option>
          <Option value="FUTURE">Future</Option>
          <Option value="EXPIRED">Expired</Option>
        </Select>
        <Button onClick={() => setFilters({ vehicleTypeId: null, status: null })}>Reset Filters</Button>
      </Space>

      <Table 
        columns={columns} 
        dataSource={filteredPolicies} 
        rowKey="pricingPolicyId" 
        loading={loading} 
        pagination={{ pageSize: 8 }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editingPolicy ? "Edit Pricing Policy" : "Create Pricing Policy"}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        width={700}
        destroyOnClose
      >
        <Alert 
          message={<><strong>Business Rule:</strong> Creating a new policy for a Vehicle Type will automatically terminate its current Active policy.</>} 
          type="info" 
          showIcon 
          style={{ marginBottom: 16 }} 
        />

        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="policyName" label="Policy Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Standard Car Policy 2026" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vehicleTypeId" label="Vehicle Type" rules={[{ required: true }]}>
                <Select disabled={!!editingPolicy}>
                  {Object.entries(VEHICLE_TYPES).map(([id, name]) => (
                    <Option key={id} value={parseInt(id)}>{name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="basePrice" label="Base Price (VND)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="rushHourPrice" label="Rush Hour Price/h (VND)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="offPeakPrice" label="Off-peak Price/h (VND)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="rushHourStart" label="Rush Hour Start" rules={[{ required: true }]}>
                <TimePicker format="HH:mm:ss" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="rushHourEnd" label="Rush Hour End" rules={[{ required: true }]}>
                <TimePicker format="HH:mm:ss" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="maxDailyRate" label="Max Daily Rate (VND)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="overtimeFeePerHour" label="Overtime Fee/h (VND)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lostTicketFee" label="Lost Ticket Fee (VND)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="effectiveFrom" label="Effective From (Activation Date)" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} disabled={!!editingPolicy} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

export default PricingManagement;
