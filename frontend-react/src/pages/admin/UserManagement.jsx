import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Modal, Form, message, Space, Card, Switch, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { userApi, roleApi } from '../../services/api';

const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [form] = Form.useForm();

  const [filters, setFilters] = useState({
    search: '',
    roleId: null,
    isActive: null
  });

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await roleApi.getRoles();
      if (res.data?.success) {
        setRoles(res.data.data);
      } else {
        setRoles(res.data || []); // In case it returns an array directly
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      message.error('Failed to load roles');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userApi.getUsers();
      let usersData = res.data?.success ? res.data.data : res.data;
      if (Array.isArray(usersData)) {
        usersData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setUsers(usersData);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalVisible(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roleId: user.roleId,
      isActive: user.isActive,
    });
    setIsModalVisible(true);
  };

  const handleDeleteUser = (id) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to permanently delete this user?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await userApi.deleteUser(id);
          message.success('User deleted successfully');
          fetchUsers();
        } catch (error) {
          message.error('Deletion failed');
        }
      }
    });
  };

  const handleToggleStatus = async (id, checked) => {
    try {
      await userApi.updateUserStatus(id, checked);
      message.success(`Account has been ${checked ? 'activated' : 'locked'}`);
      fetchUsers();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await userApi.updateUser(editingUser.userId, values);
        message.success('User updated successfully');
      } else {
        await userApi.createUser(values);
        message.success('User added successfully');
      }
      setIsModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || 'An error occurred while saving');
    }
  };

  // Lọc danh sách hiển thị
  const filteredUsers = users.filter(user => {
    const matchSearch = !filters.search || 
      user.fullName?.toLowerCase().includes(filters.search.toLowerCase()) || 
      user.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.phoneNumber?.includes(filters.search);
    const matchRole = !filters.roleId || user.roleId === filters.roleId;
    const matchStatus = filters.isActive === null || user.isActive === filters.isActive;
    return matchSearch && matchRole && matchStatus;
  });

  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone Number',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Role',
      dataIndex: 'roleName',
      key: 'roleName',
      render: (roleName) => (
        <Tag color={roleName === 'Admin' ? 'red' : roleName === 'Manager' ? 'orange' : roleName === 'Staff' ? 'blue' : 'green'}>
          {roleName || 'Driver'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'isActive',
      render: (_, record) => (
        <Popconfirm
          title={record.isActive ? "Are you sure you want to lock this account?" : "Are you sure you want to unlock this account?"}
          onConfirm={() => handleToggleStatus(record.userId, !record.isActive)}
          okText="Yes"
          cancelText="No"
        >
          <Switch 
            checked={record.isActive} 
            checkedChildren="Active" 
            unCheckedChildren="Locked"
          />
        </Popconfirm>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEditUser(record)} style={{ color: '#1890ff' }} />
          <Button type="text" icon={<DeleteOutlined />} onClick={() => handleDeleteUser(record.userId)} danger />
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title="User Management" 
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser} style={{ backgroundColor: '#ea580c' }}>
          Add User
        </Button>
      }
    >
      {/* Thanh bộ lọc */}
      <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        <Input 
          placeholder="Search name, email, phone..." 
          prefix={<SearchOutlined />} 
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: 250 }}
        />
        <Select 
          placeholder="All Roles" 
          style={{ width: 150 }} 
          allowClear 
          onChange={(val) => setFilters({ ...filters, roleId: val })}
        >
          {roles.map(r => (
            <Option key={r.roleId} value={r.roleId}>{r.roleName}</Option>
          ))}
        </Select>
        <Select 
          placeholder="All Statuses" 
          style={{ width: 160 }} 
          allowClear 
          onChange={(val) => setFilters({ ...filters, isActive: val })}
        >
          <Option value={true}>Active</Option>
          <Option value={false}>Locked</Option>
        </Select>
      </Space>

      <Table 
        columns={columns} 
        dataSource={filteredUsers} 
        rowKey="userId" 
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editingUser ? "Edit User" : "Add New User"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true, message: 'Please enter full name' }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="email" label="Email" rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Invalid email format' }
          ]}>
            <Input disabled={!!editingUser} />
          </Form.Item>
          
          <Form.Item name="phoneNumber" label="Phone Number" rules={[{ required: true, message: 'Please enter phone number' }]}>
            <Input />
          </Form.Item>

          {!editingUser && (
            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter password' }]}>
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item name="roleId" label="Role" rules={[{ required: true, message: 'Please select a role' }]}>
            <Select placeholder="Select role">
              {roles.map(r => (
                <Option key={r.roleId} value={r.roleId}>{r.roleName}</Option>
              ))}
            </Select>
          </Form.Item>

          {editingUser && (
            <Form.Item name="isActive" label="Account Status" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Locked" />
            </Form.Item>
          )}

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: 8 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#ea580c' }}>
              {editingUser ? 'Update' : 'Add'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;
