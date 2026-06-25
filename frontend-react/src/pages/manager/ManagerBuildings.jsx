import React, { useState, useEffect } from 'react';
import { Card, Table, Breadcrumb, Button, message, Modal, Form, Input, InputNumber, Select } from 'antd';
import { HomeOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { buildingApi, floorApi, zoneApi } from '../../services/api';

const { Option } = Select;

const ManagerBuildings = () => {
  const [loading, setLoading] = useState(false);
  
  // View states
  const [currentView, setCurrentView] = useState('BUILDINGS'); // BUILDINGS, FLOORS, ZONES
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  
  // Data states
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const res = await buildingApi.getBuildings();
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) setBuildings(data);
    } catch (error) {
      message.error('Failed to load buildings');
    } finally {
      setLoading(false);
    }
  };

  const fetchFloors = async (buildingId) => {
    setLoading(true);
    try {
      const res = await floorApi.getFloors(buildingId);
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) setFloors(data);
    } catch (error) {
      message.error('Failed to load floors');
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async (floorId) => {
    setLoading(true);
    try {
      const res = await zoneApi.getZones(floorId);
      let data = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(data)) setZones(data);
    } catch (error) {
      message.error('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  // Navigations
  const goToBuildings = () => {
    setCurrentView('BUILDINGS');
    setSelectedBuilding(null);
    setSelectedFloor(null);
    fetchBuildings();
  };

  const goToFloors = (building) => {
    const targetBuilding = building || selectedBuilding;
    if (targetBuilding) {
      setSelectedBuilding(targetBuilding);
    }
    setCurrentView('FLOORS');
    setSelectedFloor(null);
    fetchFloors(targetBuilding.buildingId);
  };

  const goToZones = (floor) => {
    setSelectedFloor(floor);
    setCurrentView('ZONES');
    fetchZones(floor.floorId);
  };

  // CRUD Actions
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (record) => {
    try {
      if (currentView === 'BUILDINGS') {
        await buildingApi.deleteBuilding(record.buildingId);
        fetchBuildings();
      } else if (currentView === 'FLOORS') {
        await floorApi.deleteFloor(record.floorId);
        fetchFloors(selectedBuilding.buildingId);
      } else {
        await zoneApi.deleteZone(record.zoneId);
        fetchZones(selectedFloor.floorId);
      }
      message.success('Deleted successfully');
    } catch (error) {
      message.error('Failed to delete');
    }
  };

  const handleSave = async (values) => {
    try {
      if (currentView === 'BUILDINGS') {
        if (editingRecord) {
          await buildingApi.updateBuilding(editingRecord.buildingId, values);
        } else {
          await buildingApi.createBuilding(values);
        }
        fetchBuildings();
      } else if (currentView === 'FLOORS') {
        if (editingRecord) {
          await floorApi.updateFloor(editingRecord.floorId, { ...values, buildingId: selectedBuilding.buildingId });
        } else {
          await floorApi.createFloor({ ...values, buildingId: selectedBuilding.buildingId });
        }
        fetchFloors(selectedBuilding.buildingId);
      } else {
        if (editingRecord) {
          await zoneApi.updateZone(editingRecord.zoneId, { ...values, floorId: selectedFloor.floorId });
        } else {
          await zoneApi.createZone({ ...values, floorId: selectedFloor.floorId });
        }
        fetchZones(selectedFloor.floorId);
      }
      message.success('Saved successfully');
      setIsModalVisible(false);
    } catch (error) {
      message.error('Failed to save');
    }
  };

  const renderActionButtons = (record) => (
    <>
      <Button type="link" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>Edit</Button>
      <Button type="link" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDelete(record); }}>Delete</Button>
    </>
  );

  const buildingColumns = [
    { title: 'ID', dataIndex: 'buildingId', key: 'id', width: 80 },
    { title: 'Building Name', dataIndex: 'buildingName', key: 'name', render: text => <strong>{text}</strong> },
    { title: 'Total Floors', dataIndex: 'totalFloors', key: 'totalFloors' },
    { title: 'Location', dataIndex: 'address', key: 'address' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <>
          <Button type="primary" size="small" onClick={() => goToFloors(record)} style={{ marginRight: 8 }}>
            View Floors
          </Button>
          {renderActionButtons(record)}
        </>
      ),
    },
  ];

  const floorColumns = [
    { title: 'ID', dataIndex: 'floorId', key: 'id', width: 80 },
    { title: 'Floor Name', dataIndex: 'floorName', key: 'name', render: text => <strong>{text}</strong> },
    { title: 'Level', dataIndex: 'level', key: 'level' },
    { title: 'Max Capacity', dataIndex: 'capacity', key: 'capacity' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <>
          <Button type="primary" size="small" onClick={() => goToZones(record)} style={{ marginRight: 8 }}>
            View Zones
          </Button>
          {renderActionButtons(record)}
        </>
      ),
    },
  ];

  const zoneColumns = [
    { title: 'ID', dataIndex: 'zoneId', key: 'id', width: 80 },
    { title: 'Zone Name', dataIndex: 'zoneName', key: 'name', render: text => <strong>{text}</strong> },
    { title: 'Vehicle Type', dataIndex: 'vehicleType', key: 'vehicleType' },
    { title: 'Capacity', dataIndex: 'capacity', key: 'capacity' },
    { title: 'Available Slots', dataIndex: 'availableSlots', key: 'availableSlots' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => renderActionButtons(record),
    },
  ];

  const renderBreadcrumb = () => {
    return (
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item onClick={goToBuildings} style={{ cursor: 'pointer' }}>
          <HomeOutlined /> Buildings
        </Breadcrumb.Item>
        {(currentView === 'FLOORS' || currentView === 'ZONES') && (
          <Breadcrumb.Item onClick={() => goToFloors()} style={{ cursor: 'pointer' }}>
            {selectedBuilding?.buildingName}
          </Breadcrumb.Item>
        )}
        {currentView === 'ZONES' && (
          <Breadcrumb.Item>
            {selectedFloor?.floorName}
          </Breadcrumb.Item>
        )}
      </Breadcrumb>
    );
  };

  const renderModalForm = () => {
    if (currentView === 'BUILDINGS') {
      return (
        <>
          <Form.Item name="buildingName" label="Building Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="totalFloors" label="Total Floors" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input />
          </Form.Item>
        </>
      );
    } else if (currentView === 'FLOORS') {
      return (
        <>
          <Form.Item name="floorName" label="Floor Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="level" label="Level" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="capacity" label="Capacity">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </>
      );
    } else {
      return (
        <>
          <Form.Item name="zoneName" label="Zone Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="vehicleType" label="Vehicle Type" rules={[{ required: true }]}>
            <Select>
              <Option value="CAR">Car</Option>
              <Option value="MOTORBIKE">Motorbike</Option>
              <Option value="BICYCLE">Bicycle</Option>
            </Select>
          </Form.Item>
          <Form.Item name="capacity" label="Capacity" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </>
      );
    }
  };

  return (
    <div>
      {renderBreadcrumb()}
      <Card 
        title={
          currentView === 'BUILDINGS' ? 'Building Management' : 
          currentView === 'FLOORS' ? `Floors in ${selectedBuilding?.buildingName}` :
          `Zones in ${selectedFloor?.floorName}`
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Create New {currentView === 'BUILDINGS' ? 'Building' : currentView === 'FLOORS' ? 'Floor' : 'Zone'}
          </Button>
        }
      >
        {currentView === 'BUILDINGS' && (
          <Table columns={buildingColumns} dataSource={buildings} rowKey="buildingId" loading={loading} />
        )}
        {currentView === 'FLOORS' && (
          <Table columns={floorColumns} dataSource={floors} rowKey="floorId" loading={loading} />
        )}
        {currentView === 'ZONES' && (
          <Table columns={zoneColumns} dataSource={zones} rowKey="zoneId" loading={loading} />
        )}
      </Card>

      <Modal
        title={editingRecord ? 'Edit' : 'Create'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {renderModalForm()}
        </Form>
      </Modal>
    </div>
  );
};

export default ManagerBuildings;
