import React, { useState, useContext } from 'react';
import { Form, Input, Button, Typography, Checkbox, message, Modal } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api, { authApi } from '../../services/api';
import { getDefaultRouteByRole } from '../../utils/authUtils';
import { ThemeContext } from '../../contexts/ThemeContext';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotForm] = Form.useForm();
  
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext) || { isDarkMode: false };

  const handleForgotPassword = async (values) => {
    setForgotLoading(true);
    try {
      await authApi.forgotPassword({ email: values.email });
      message.success('A password reset link has been sent to your email!');
      setIsForgotModalVisible(false);
      forgotForm.resetFields();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setForgotLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: values.email,
        password: values.password
      });

      if (response.data.success || response.data.token) {
        message.success('Login successful!');
        const resData = response.data.data || response.data;
        localStorage.setItem('parking_auth', JSON.stringify(resData));
        const extractedRole = resData.role || 'UNKNOWN';
        const route = getDefaultRouteByRole(resData);

        console.log('LOGIN USER:', resData);
        console.log('LOGIN ROLE:', extractedRole);
        console.log('REDIRECT TO:', route);

        navigate(route);
      } else {
        message.error(response.data.message || 'Login failed');
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
      
      {/* Cột trái: Hình ảnh Branding */}
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
        {/* Hình tròn trang trí */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.2)', filter: 'blur(40px)' }} />

        <div style={{ zIndex: 1, textAlign: 'center' }}>
          <img 
            src="/images/signinImg.svg" 
            alt="ParkSmart Welcome" 
            style={{ maxWidth: '80%', maxHeight: '60vh', marginBottom: '2rem', filter: 'drop-shadow(0px 20px 30px rgba(234,88,12,0.15))' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <Title level={1} style={{ color: '#ea580c', fontWeight: 800, margin: 0 }}>ParkSmart</Title>
          <Text style={{ fontSize: '18px', color: isDarkMode ? '#aaa' : '#666' }}>Smart & Modern Parking Management System</Text>
        </div>
      </div>

      {/* Cột phải: Form Đăng Nhập */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem 10%',
        boxShadow: isDarkMode ? '-20px 0 50px rgba(0,0,0,0.5)' : '-20px 0 50px rgba(0,0,0,0.03)',
        zIndex: 2,
        backgroundColor: isDarkMode ? '#141414' : '#fff'
      }}>
        <div style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
          <Title level={2} style={{ fontWeight: 700, marginBottom: '8px', color: isDarkMode ? '#fff' : '#000' }}>Welcome Back 👋</Title>
          <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '40px', color: isDarkMode ? '#aaa' : undefined }}>
            Please login to your account to continue
          </Text>

          <Form
            name="login_form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 600 }}>Email Address</span>}
              rules={[
                { required: true, message: 'Please enter your email!' },
                { type: 'email', message: 'Invalid email format!' }
              ]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#bfbfbf', marginRight: 8 }}/>} 
                placeholder="Ex: admin@parksmart.com" 
                style={{ borderRadius: '8px', padding: '12px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ fontWeight: 600 }}>Password</span>}
              rules={[{ required: true, message: 'Please enter your password!' }]}
              style={{ marginBottom: '16px' }}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#bfbfbf', marginRight: 8 }}/>} 
                placeholder="Enter password" 
                style={{ borderRadius: '8px', padding: '12px' }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
                <a 
                  style={{ color: '#ea580c', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setIsForgotModalVisible(true)}
                >
                  Forgot password?
                </a>
              </div>
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
                Sign In
              </Button>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Button 
                  style={{ flex: 1, height: '48px', borderRadius: '8px' }} 
                  onClick={() => navigate('/register')}
                >
                  Register
                </Button>
                <Button 
                  type="text"
                  style={{ flex: 1, height: '48px', borderRadius: '8px', color: '#ea580c' }} 
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
      {/* Modal Quên mật khẩu */}
      <Modal
        title="Reset Password"
        open={isForgotModalVisible}
        onCancel={() => {
          setIsForgotModalVisible(false);
          forgotForm.resetFields();
        }}
        footer={null}
      >
        <Typography.Paragraph type="secondary">
          Enter your email address and we will send you a link to reset your password.
        </Typography.Paragraph>
        <Form form={forgotForm} layout="vertical" onFinish={handleForgotPassword}>
          <Form.Item
            name="email"
            label={<span style={{ fontWeight: 600 }}>Email Address</span>}
            rules={[
              { required: true, message: 'Please enter your email!' },
              { type: 'email', message: 'Invalid email format!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />} 
              placeholder="Ex: admin@parksmart.com" 
              style={{ borderRadius: '8px', padding: '12px' }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={forgotLoading} 
              style={{ width: '100%', height: '48px', borderRadius: '8px', backgroundColor: '#ea580c', fontWeight: 600 }}
            >
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;
