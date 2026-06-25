import React, { useEffect, useReducer, useState } from 'react';
import { Card, Table, Modal, Form, DatePicker, Select, Button, Tag, Space, Popconfirm, Alert, message } from 'antd';
import { driverService } from '../services/driverService';
import { reservationStore } from '../store/reservationStore';
import { vehicleStore } from '../store/vehicleStore';
import { parkingStore } from '../store/parkingStore';

const ReservationPage = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [errorAlert, setErrorAlert] = useState(null);
    const [, forceRender] = useReducer(x => x + 1, 0);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        reservationStore.loading = true;
        forceRender();
        try {
            const [reservationsRes, vehiclesRes, slotsRes] = await Promise.all([
                driverService.loadReservations(),
                driverService.loadMyVehicles(),
                driverService.loadSlots()
            ]);

            reservationStore.reservations = reservationsRes?.data || reservationsRes || [];
            vehicleStore.vehicles = vehiclesRes?.data || vehiclesRes || [];
            parkingStore.slots = slotsRes?.data || slotsRes || [];
        } catch (error) {
            message.error('Failed to load data');
        } finally {
            reservationStore.loading = false;
            forceRender();
        }
    };

    const handleCreate = () => {
        setErrorAlert(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleModalOk = async () => {
        try {
            setErrorAlert(null);
            const values = await form.validateFields();
            
            if (values.startTime.valueOf() >= values.endTime.valueOf()) {
                setErrorAlert('End Time must be after Start Time');
                return;
            }

            const payload = {
                ...values,
                startTime: values.startTime.toISOString(),
                endTime: values.endTime.toISOString(),
            };

            await driverService.createReservation(payload);
            message.success('Reservation created successfully');
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            if (error.errorFields) {
                return;
            }
            message.error('Failed to create reservation');
        }
    };

    const handleDelete = async (id) => {
        try {
            await driverService.cancelReservation(id);
            message.success('Reservation cancelled successfully');
            fetchData();
        } catch (error) {
            message.error('Failed to cancel reservation');
        }
    };

    const columns = [
        {
            title: 'Reservation ID',
            dataIndex: 'reservationId',
            key: 'reservationId',
            render: (text, record) => record.reservationId || record.id || text,
        },
        {
            title: 'Vehicle',
            key: 'vehicle',
            render: (_, record) => record.vehicle?.licensePlate || record.licensePlate || 'N/A',
        },
        {
            title: 'Slot',
            key: 'slot',
            render: (_, record) => record.slot?.slotName || record.parkingSlot?.slotName || record.slotId || 'N/A',
        },
        {
            title: 'Start Time',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (time) => time ? new Date(time).toLocaleString() : 'N/A',
        },
        {
            title: 'End Time',
            dataIndex: 'endTime',
            key: 'endTime',
            render: (time) => time ? new Date(time).toLocaleString() : 'N/A',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const s = String(status).toUpperCase();
                let color = 'default';
                if (s === 'CONFIRMED' || s === 'COMPLETED') color = 'green';
                else if (s === 'PENDING') color = 'gold';
                else if (s === 'CANCELLED') color = 'volcano';
                return <Tag color={color}>{s || 'UNKNOWN'}</Tag>;
            }
        },
        {
            title: 'Payment Status',
            key: 'paymentStatus',
            render: (_, record) => {
                const pStatus = record.paymentStatus || record.payment?.status || record.payment?.paymentStatus;
                if (!pStatus) return 'N/A';
                const ps = String(pStatus).toUpperCase();
                return <Tag color={ps === 'PAID' || ps === 'COMPLETED' ? 'green' : 'gold'}>{ps}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Popconfirm
                        title="Are you sure you want to cancel this reservation?"
                        onConfirm={() => handleDelete(record.reservationId || record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger style={{ padding: 0 }}>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card title="Reservations" extra={<Button type="primary" onClick={handleCreate}>Create Reservation</Button>}>
            <Table
                columns={columns}
                dataSource={reservationStore.reservations}
                rowKey={(record) => record.reservationId || record.id}
                loading={reservationStore.loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title="Create Reservation"
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                okText="Submit"
                cancelText="Cancel"
            >
                {errorAlert && <Alert message={errorAlert} type="error" showIcon style={{ marginBottom: 16 }} closable onClose={() => setErrorAlert(null)} />}
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="vehicleId"
                        label="Vehicle"
                        rules={[{ required: true, message: 'Please select a vehicle' }]}
                    >
                        <Select placeholder="Select a vehicle">
                            {vehicleStore.vehicles.map(v => (
                                <Select.Option key={v.vehicleId || v.id} value={v.vehicleId || v.id}>
                                    {v.licensePlate}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="slotId"
                        label="Slot"
                        rules={[{ required: true, message: 'Please select a slot' }]}
                    >
                        <Select placeholder="Select a slot">
                            {parkingStore.slots.map(s => (
                                <Select.Option key={s.slotId || s.id} value={s.slotId || s.id}>
                                    {s.slotName || s.id}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="startTime"
                        label="Start Time"
                        rules={[{ required: true, message: 'Please select start time' }]}
                    >
                        <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="endTime"
                        label="End Time"
                        rules={[{ required: true, message: 'Please select end time' }]}
                    >
                        <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default ReservationPage;
