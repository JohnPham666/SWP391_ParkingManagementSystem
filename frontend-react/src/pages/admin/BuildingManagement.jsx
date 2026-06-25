import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Modal, Form, Input, InputNumber, Row, Col, Typography, Popconfirm, Space, TimePicker, List, Tag, Empty, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BuildOutlined, ClockCircleOutlined, EnvironmentOutlined, DashboardOutlined } from '@ant-design/icons';
import { buildingApi, floorApi, zoneApi, monitoringApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const formatTime = 'HH:mm:ss';

const BuildingManagement = () => {
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [dashboardData, setDashboardData] = useState([]);
  
  // Selection
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // Cache for floors and zones
  const [floorsMap, setFloorsMap] = useState({});
  const [zonesMap, setZonesMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('BUILDING'); // BUILDING, FLOOR, ZONE
  const [editingRecord, setEditingRecord] = useState(null);
  const [parentRecord, setParentRecord] = useState(null); 
  
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const [res, dashRes] = await Promise.all([
        buildingApi.getBuildings(),
        monitoringApi.getDashboard()
      ]);
      
      let data = res.data?.success ? res.data.data : res.data;
      let dash = dashRes.data?.success ? dashRes.data.data : dashRes.data;
      if (dash && dash.buildings) {
        setDashboardData(dash.buildings);
      }
      
      if (Array.isArray(data)) {
        setBuildings(data);
        if (data.length > 0 && !selectedBuilding) {
          handleSelectBuilding(data[0]);
        }
      }
    } catch (error) {
      message.error('Failed to load buildings or capacity data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFloors = async (buildingId) => {
    setLoadingMap(prev => ({ ...prev, [buildingId]: true }));
    try {
      const res = await floorApi.getFloors(buildingId);
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        setFloorsMap(prev => ({ ...prev, [buildingId]: data }));
      }
    } catch (error) {
      message.error('Failed to load floors');
    } finally {
      setLoadingMap(prev => ({ ...prev, [buildingId]: false }));
    }
  };

  const fetchZones = async (floorId) => {
    setLoadingMap(prev => ({ ...prev, [`zone_${floorId}`]: true }));
    try {
      const res = await zoneApi.getZones(floorId);
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) {
        setZonesMap(prev => ({ ...prev, [floorId]: data }));
      }
    } catch (error) {
      message.error('Failed to load zones');
    } finally {
      setLoadingMap(prev => ({ ...prev, [`zone_${floorId}`]: false }));
    }
  };

  const handleSelectBuilding = (building) => {
    setSelectedBuilding(building);
    if (!floorsMap[building.buildingId]) {
      fetchFloors(building.buildingId);
    }
  };

  const handleExpandFloor = (expanded, record) => {
    if (expanded && !zonesMap[record.floorId]) {
      fetchZones(record.floorId);
    }
  };

  const showModal = (type, parent = null, record = null) => {
    setModalType(type);
    setParentRecord(parent);
    setEditingRecord(record);
    
    if (record) {
      let values = { ...record };
      if (type === 'BUILDING') {
        values.operatingStartTime = record.operatingStartTime ? dayjs(record.operatingStartTime, formatTime) : null;
        values.operatingEndTime = record.operatingEndTime ? dayjs(record.operatingEndTime, formatTime) : null;
      }
      form.setFieldsValue(values);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleDelete = async (type, record, e) => {
    if (e) e.stopPropagation();
    try {
      if (type === 'BUILDING') {
        await buildingApi.deleteBuilding(record.buildingId);
        if (selectedBuilding?.buildingId === record.buildingId) {
          setSelectedBuilding(null);
        }
        fetchBuildings();
      } else if (type === 'FLOOR') {
        await floorApi.deleteFloor(record.floorId);
        fetchFloors(selectedBuilding.buildingId);
      } else {
        await zoneApi.deleteZone(record.zoneId);
        fetchZones(record.floorId); // Actually this needs the floorId
      }
      message.success('Deleted successfully');
    } catch (error) {
      message.error('Failed to delete');
    }
  };

  const handleSave = async (values) => {
    try {
      if (modalType === 'BUILDING') {
        const payload = {
          ...values,
          operatingStartTime: values.operatingStartTime ? values.operatingStartTime.format(formatTime) : null,
          operatingEndTime: values.operatingEndTime ? values.operatingEndTime.format(formatTime) : null,
        };
        if (editingRecord) {
          await buildingApi.updateBuilding(editingRecord.buildingId, payload);
        } else {
          await buildingApi.createBuilding(payload);
        }
        fetchBuildings();
      } else if (modalType === 'FLOOR') {
        const payload = { ...values, buildingId: selectedBuilding.buildingId };
        if (editingRecord) {
          await floorApi.updateFloor(editingRecord.floorId, payload);
        } else {
          await floorApi.createFloor(payload);
        }
        fetchFloors(selectedBuilding.buildingId);
      } else if (modalType === 'ZONE') {
        const payload = { ...values, floorId: parentRecord.floorId };
        if (editingRecord) {
          await zoneApi.updateZone(editingRecord.zoneId, payload);
        } else {
          await zoneApi.createZone(payload);
        }
        fetchZones(parentRecord.floorId);
      }
      message.success('Saved successfully');
      setIsModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const zoneColumns = [
    { title: 'Zone ID', dataIndex: 'zoneId', key: 'id', width: 100 },
    { title: 'Zone Name', dataIndex: 'zoneName', key: 'name', render: text => <Text strong>{text}</Text> },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => showModal('ZONE', { floorId: record.floorId }, record)} />
          <Popconfirm title="Delete this zone?" onConfirm={() => handleDelete('ZONE', record)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const floorColumns = [
    { title: 'Floor ID', dataIndex: 'floorId', key: 'id', width: 100 },
    { title: 'Floor Number', dataIndex: 'floorNumber', key: 'floorNumber', render: text => <Tag color="blue">Level {text}</Tag> },
    { title: 'Floor Name', dataIndex: 'floorName', key: 'name', render: text => <Text strong>{text}</Text> },
    {
      title: 'Capacity & Occupancy',
      key: 'capacity',
      render: (_, record) => {
        // Lấy thông tin từ dashboardData
        const bDash = dashboardData.find(b => b.buildingId === selectedBuilding.buildingId);
        const fDash = bDash?.floors?.find(f => f.floorId === record.floorId);
        if (!fDash || !fDash.summary) return <Text type="secondary">N/A</Text>;
        
        const sum = fDash.summary;
        return (
          <div style={{ width: 160 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>{sum.currentOccupancy} / {sum.totalCapacity} slots</span>
              <span style={{ color: sum.occupancyRate >= 90 ? 'red' : 'inherit' }}>{Math.round(sum.occupancyRate)}%</span>
            </div>
            <Progress percent={sum.occupancyRate} showInfo={false} size="small" status={sum.occupancyRate >= 90 ? 'exception' : 'active'} />
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<PlusOutlined />} onClick={() => showModal('ZONE', record)}>Add Zone</Button>
          <Button type="text" icon={<EditOutlined />} onClick={() => showModal('FLOOR', { buildingId: selectedBuilding.buildingId }, record)} />
          <Popconfirm title="Delete this floor?" onConfirm={() => handleDelete('FLOOR', record)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderModalForm = () => {
    if (modalType === 'BUILDING') {
      return (
        <>
          <Form.Item name="buildingName" label="Building Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Block A" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="totalFloors" label="Total Floors">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="address" label="Address">
                <Input placeholder="e.g. 123 Main St" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="operatingStartTime" label="Operating Start Time" rules={[{ required: true }]}>
                <TimePicker format={formatTime} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="operatingEndTime" label="Operating End Time" rules={[{ required: true }]}>
                <TimePicker format={formatTime} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      );
    } else if (modalType === 'FLOOR') {
      return (
        <>
          <Form.Item name="floorNumber" label="Floor Number" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="e.g. -1 for Basement 1" />
          </Form.Item>
          <Form.Item name="floorName" label="Floor Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Basement Parking" />
          </Form.Item>
        </>
      );
    } else {
      return (
        <>
          <Form.Item name="zoneName" label="Zone Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. VIP Zone" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Zone details..." />
          </Form.Item>
        </>
      );
    }
  };

  return (
    <Row gutter={24}>
      {/* CỘT TRÁI: DANH SÁCH BUILDING */}
      <Col xs={24} md={8} lg={7}>
        <Card 
          title="Buildings" 
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => showModal('BUILDING')} shape="circle" />}
          bodyStyle={{ padding: 0 }}
          style={{ height: '100%', minHeight: '500px' }}
        >
          <List
            loading={loading}
            dataSource={buildings}
            renderItem={item => (
              <List.Item 
                style={{ 
                  padding: '16px 24px', 
                  cursor: 'pointer',
                  backgroundColor: selectedBuilding?.buildingId === item.buildingId ? 'var(--ant-primary-1)' : 'transparent',
                  borderBottom: '1px solid var(--ant-color-border-secondary)',
                  transition: 'all 0.3s'
                }}
                onClick={() => handleSelectBuilding(item)}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 16, color: selectedBuilding?.buildingId === item.buildingId ? 'var(--ant-primary-color)' : 'var(--ant-text-color)' }}>
                      <BuildOutlined style={{ marginRight: 8 }}/>{item.buildingName}
                    </Text>
                    <Space>
                      <Button size="small" type="text" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); showModal('BUILDING', null, item); }} />
                      <Popconfirm title="Delete this building?" onConfirm={(e) => handleDelete('BUILDING', item, e)} onCancel={(e) => e.stopPropagation()}>
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                      </Popconfirm>
                    </Space>
                  </div>
                  <div style={{ color: 'var(--ant-text-color-secondary)', fontSize: 13, marginBottom: 4 }}>
                    <EnvironmentOutlined /> {item.address || 'No address'}
                  </div>
                  <div style={{ color: 'var(--ant-text-color-secondary)', fontSize: 13, marginBottom: 8 }}>
                    <ClockCircleOutlined /> {item.operatingStartTime} - {item.operatingEndTime}
                    <Tag color="cyan" style={{ marginLeft: 8 }}>{item.totalFloors} Floors</Tag>
                  </div>
                  
                  {/* Dashboard Capacity UI */}
                  {(() => {
                    const bDash = dashboardData.find(b => b.buildingId === item.buildingId);
                    if (bDash && bDash.summary) {
                      const sum = bDash.summary;
                      return (
                        <div style={{ backgroundColor: 'var(--ant-color-bg-layout)', padding: '8px 12px', borderRadius: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span><DashboardOutlined /> {sum.currentOccupancy} / {sum.totalCapacity} slots</span>
                            <span style={{ color: sum.occupancyRate >= 90 ? 'var(--ant-error-color)' : 'inherit', fontWeight: 'bold' }}>
                              {Math.round(sum.occupancyRate)}% Full
                            </span>
                          </div>
                          <Progress percent={sum.occupancyRate} showInfo={false} size="small" status={sum.occupancyRate >= 90 ? 'exception' : 'active'} />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </List.Item>
            )}
          />
        </Card>
      </Col>

      {/* CỘT PHẢI: CHI TIẾT FLOOR & ZONE */}
      <Col xs={24} md={16} lg={17}>
        {selectedBuilding ? (
          <Card 
            title={<span style={{ fontSize: 18 }}>{selectedBuilding.buildingName} - Floor & Zone Configuration</span>}
            extra={<Button type="dashed" icon={<PlusOutlined />} onClick={() => showModal('FLOOR')}>Add New Floor</Button>}
          >
            <Table
              columns={floorColumns}
              dataSource={floorsMap[selectedBuilding.buildingId] || []}
              rowKey="floorId"
              pagination={false}
              loading={loadingMap[selectedBuilding.buildingId]}
              expandable={{
                onExpand: handleExpandFloor,
                expandedRowRender: floor => (
                  <div style={{ padding: '0 24px 16px 24px', backgroundColor: '#fafafa' }}>
                    <Table
                      columns={zoneColumns}
                      dataSource={zonesMap[floor.floorId] || []}
                      rowKey="zoneId"
                      pagination={false}
                      loading={loadingMap[`zone_${floor.floorId}`]}
                      size="small"
                      bordered
                    />
                  </div>
                )
              }}
            />
          </Card>
        ) : (
          <Card style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="Select a building to view configurations" />
          </Card>
        )}
      </Col>

      {/* MODAL */}
      <Modal
        title={
          <Title level={4}>
            {editingRecord ? `Edit ${modalType}` : `Create New ${modalType}`}
          </Title>
        }
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        okText="Save"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {renderModalForm()}
        </Form>
      </Modal>
    </Row>
  );
};

export default BuildingManagement;
