import React, { useState, useContext } from 'react';
import { Form, Input, Button, Typography, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ThemeContext } from '../../contexts/ThemeContext';
import logoImg from '../../assets/logo.png';

const { Title, Text } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { isDarkMode } = useContext(ThemeContext) || { isDarkMode: false };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phone,
        password: values.password
      });

      if (response.data.success || response.data.token) {
        message.success('Registration successful! Please login.');
        navigate('/login');
      } else {
        message.error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: isDarkMode ? '#141414' : '#fff' }}>
      
      {/* Left Column: Branding */}
      <div style={{
        flex: 1,
        background: isDarkMode ? 'linear-gradient(135deg, #1f1f1f 0%, #141414 100%)' : 'linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.2)', filter: 'blur(40px)' }} />

        <div style={{ zIndex: 1, textAlign: 'center' }}>
          <img 
            src={logoImg} 
            alt="ParkSmart Join" 
            style={{ 
              maxWidth: '80%', 
              maxHeight: '40vh', 
              marginBottom: '2rem', 
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}
          />
          <Title level={1} style={{ color: '#ea580c', fontWeight: 800, margin: 0 }}>ParkSmart</Title>
          <Text style={{ fontSize: '18px', color: isDarkMode ? '#aaa' : '#666' }}>Smart & Modern Parking Management System</Text>
        </div>
      </div>

      {/* Right Column: Register Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem 10%',
        boxShadow: isDarkMode ? '-20px 0 50px rgba(0,0,0,0.5)' : '-20px 0 50px rgba(0,0,0,0.03)',
        zIndex: 2,
        backgroundColor: isDarkMode ? '#141414' : '#fff',
        overflowY: 'auto'
      }}>
        <div style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
          <Title level={2} style={{ fontWeight: 700, marginBottom: '8px', color: isDarkMode ? '#fff' : '#000' }}>Create an Account 🚀</Title>
          <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '40px', color: isDarkMode ? '#aaa' : undefined }}>
            Register to use our smart parking services
          </Text>

          <Form
            form={form}
            name="register_form"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="fullName"
              label={<span style={{ fontWeight: 600, color: isDarkMode ? '#fff' : undefined }}>Full Name *</span>}
              rules={[{ required: true, message: 'Please enter your full name!' }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#bfbfbf', marginRight: 8 }}/>} 
                placeholder="Ex: John Doe" 
                style={{ borderRadius: '8px', padding: '12px' }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 600, color: isDarkMode ? '#fff' : undefined }}>Email Address *</span>}
              rules={[
                { required: true, message: 'Please enter your email!' },
                { type: 'email', message: 'Invalid email format!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#bfbfbf', marginRight: 8 }}/>} 
                placeholder="Ex: user@parksmart.com" 
                style={{ borderRadius: '8px', padding: '12px' }}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span style={{ fontWeight: 600, color: isDarkMode ? '#fff' : undefined }}>Phone Number *</span>}
              rules={[{ required: true, message: 'Please enter your phone number!' }]}
            >
              <Input 
                prefix={<PhoneOutlined style={{ color: '#bfbfbf', marginRight: 8 }}/>} 
                placeholder="Ex: 0912 345 678" 
                style={{ borderRadius: '8px', padding: '12px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ fontWeight: 600, color: isDarkMode ? '#fff' : undefined }}>Password *</span>}
              rules={[
                { required: true, message: 'Please enter your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#bfbfbf', marginRight: 8 }}/>} 
                placeholder="At least 6 characters" 
                style={{ borderRadius: '8px', padding: '12px' }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span style={{ fontWeight: 600, color: isDarkMode ? '#fff' : undefined }}>Confirm Password *</span>}
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The passwords do not match!'));
                  },
                }),
              ]}
              style={{ marginBottom: '16px' }}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#bfbfbf', marginRight: 8 }}/>} 
                placeholder="Re-enter your password" 
                style={{ borderRadius: '8px', padding: '12px' }}
              />
            </Form.Item>

            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[
                { validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Should accept agreement')) }
              ]}
              style={{ marginBottom: '32px' }}
            >
              <Checkbox style={{ color: isDarkMode ? '#fff' : undefined }}>
                I agree to the <a style={{ color: '#ea580c' }}>Privacy Policy</a> and <a style={{ color: '#ea580c' }}>Terms of Service</a>.
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{ 
                  width: '100%', 
                  height: '52px', 
                  borderRadius: '8px', 
                  backgroundColor: '#ea580c', 
                  fontSize: '16px', 
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
                  marginBottom: '16px'
                }}
              >
                Register
              </Button>
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: '#666' }}>Already have an account? </span>
                <a style={{ color: '#ea580c', fontWeight: 600 }} onClick={() => navigate('/login')}>
                  Sign In here
                </a>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Register;
