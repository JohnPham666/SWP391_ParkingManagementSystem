import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, message, Spin, DatePicker, Typography, Radio } from 'antd';
import { driverService } from '../services/driverService';
import { subscriptionApi, paymentApi, zoneApi, pricingApi } from '../../../services/api';
import dayjs from 'dayjs';

const { Text } = Typography;

const SubscriptionRegistrationModal = ({ visible, onCancel, onSuccess, initialVehicleId }) => {
    const [form] = Form.useForm();
    const [vehicles, setVehicles] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [monthlyFee, setMonthlyFee] = useState(null);

    useEffect(() => {
        if (visible) {
            fetchData();
            form.resetFields();
            form.setFieldsValue({
                startDate: dayjs(),
                vehicleId: initialVehicleId
            });
        }
    }, [visible, initialVehicleId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [vehiclesData, zonesData] = await Promise.all([
                driverService.loadMyVehicles(),
                zoneApi.getZones().catch(() => ({ data: [] }))
            ]);
            
            const vRes = vehiclesData?.data || vehiclesData;
            setVehicles(Array.isArray(vRes) ? vRes : []);

            const zRes = zonesData?.data?.success ? zonesData.data.data : (zonesData?.data || []);
            setZones(Array.isArray(zRes) ? zRes : []);

            if (initialVehicleId && Array.isArray(vRes)) {
                handleVehicleChange(initialVehicleId, vRes);
            }

        } catch (error) {
            message.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleVehicleChange = async (vehicleId, currentVehicles = vehicles) => {
        const vehicle = currentVehicles.find(v => (v.vehicleId || v.id) === vehicleId);
        if (vehicle && vehicle.vehicleTypeId) {
            try {
                const res = await pricingApi.getPricingPoliciesByVehicleType(vehicle.vehicleTypeId);
                const policies = res.data?.data || res.data || [];
                if (policies.length > 0) {
                    const now = new Date();
                    const activePolicy = policies.find(p => {
                        const from = p.effectiveFrom ? new Date(p.effectiveFrom) : null;
                        const to = p.effectiveTo ? new Date(p.effectiveTo) : null;
                        return (!from || from <= now) && (!to || to >= now);
                    }) || policies[policies.length - 1];
                    setMonthlyFee(activePolicy.monthlyPrice);
                } else {
                    setMonthlyFee(null);
                }
            } catch (err) {
                console.error("Failed to fetch pricing policy", err);
                setMonthlyFee(null);
            }
        } else {
            setMonthlyFee(null);
        }
    };

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const auth = JSON.parse(localStorage.getItem('parking_auth') || '{}');
            const userId = auth.userId || auth.user?.userId || auth.user?.id;
            
            if (!userId) {
                message.error("Cannot find User ID. Please login again.");
                return;
            }

            // 1. Create Subscription
            const subRes = await subscriptionApi.createSubscription({
                userId: userId,
                vehicleId: values.vehicleId,
                startDate: values.startDate.toISOString(),
                monthlyFee: 0 // backend will calculate
            });

            message.success("Registration successful! Redirecting to payment page...");

            // 2. Redirect to VNPay
            const paymentId = subRes.data?.data?.paymentId || subRes.data?.paymentId;
            if (paymentId) {
                try {
                    const payRes = await paymentApi.createVnPayUrl(paymentId);
                    const paymentUrl = payRes.data?.data?.paymentUrl || payRes.data?.paymentUrl;
                    if (paymentUrl) {
                        window.open(paymentUrl, '_blank');
                        if (onSuccess) onSuccess();
                        onCancel();
                    } else {
                        message.warning("Could not retrieve payment URL. Please try paying again in Subscription Management.");
                        if (onSuccess) onSuccess();
                        onCancel();
                    }
                } catch (payErr) {
                    console.error("Error creating payment URL:", payErr);
                    message.error("Cannot connect to VNPay. Please try paying again later.");
                    if (onSuccess) onSuccess();
                    onCancel();
                }
            } else {
                if (onSuccess) onSuccess();
                onCancel();
            }

        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Register Monthly Subscription"
            open={visible}
            onCancel={onCancel}
            onOk={() => form.submit()}
            confirmLoading={submitting}
            okText="Register"
            destroyOnClose
        >
            <Spin spinning={loading}>
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item 
                        name="vehicleId" 
                        label="Select Vehicle" 
                        rules={[{ required: true, message: 'Please select a vehicle' }]}
                    >
                        <Select 
                            placeholder="Select your vehicle" 
                            disabled={vehicles.length === 0}
                            onChange={(val) => handleVehicleChange(val)}
                        >
                            {vehicles.map(v => (
                                <Select.Option key={v.vehicleId || v.id} value={v.vehicleId || v.id}>
                                    {v.licensePlate} ({v.brand} {v.color})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    
                    {vehicles.length === 0 && !loading && (
                        <div style={{ marginBottom: 16 }}>
                            <Text type="danger">You don't have any vehicles yet. Please add a vehicle first in the Vehicles page.</Text>
                        </div>
                    )}

                    <Form.Item 
                        name="startDate" 
                        label="Start Date" 
                        rules={[{ required: true }]}
                    >
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current < dayjs().startOf('day')} />
                    </Form.Item>

                    {monthlyFee !== null && (
                        <div style={{ margin: '16px 0', padding: '16px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <Text strong>Monthly Subscription Fee:</Text>
                                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                                    {monthlyFee.toLocaleString()} VND
                                </Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Note: After clicking Register, you will be redirected to the VNPay payment page. The subscription will be automatically activated upon successful payment.
                            </Text>
                        </div>
                    )}
                </Form>
            </Spin>
        </Modal>
    );
};

export default SubscriptionRegistrationModal;
