import React, { useState, useContext } from 'react';
import { Form, Input, Button, Typography, Checkbox, message, Modal, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api, { authApi } from '../../services/api';
import { getDefaultRouteByRole } from '../../utils/authUtils';
import { ThemeContext } from '../../contexts/ThemeContext';
import logoImg from '../../assets/logo.png';
import { GoogleLogin } from '@react-oauth/google';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotForm] = Form.useForm();

  // Google Login Phone Requirement State
  const [isPhoneModalVisible, setIsPhoneModalVisible] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [googleCredential, setGoogleCredential] = useState(null);
  const [phoneForm] = Form.useForm();

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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const response = await api.post('/auth/google', { credential });

      if (response.data.data?.status === 'REQUIRE_PHONE') {
        setGoogleCredential(credential);
        setIsPhoneModalVisible(true);
        message.info('Vui lòng cung cấp số điện thoại để hoàn tất.');
      } else if (response.data.success || response.data.data?.token || response.data.token) {
        handleSuccessfulLogin(response.data.data || response.data);
      }
    } catch (error) {
      console.error(error);
      setLoginError(error.response?.data?.message || 'Google Login Failed');
    }
  };

  const handlePhoneSubmit = async (values) => {
    setPhoneLoading(true);
    try {
      const response = await api.post('/auth/google/register', {
        credential: googleCredential,
        phoneNumber: values.phoneNumber
      });
      if (response.data.success || response.data.data?.token || response.data.token) {
        setIsPhoneModalVisible(false);
        handleSuccessfulLogin(response.data.data || response.data);
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Failed to complete registration');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSuccessfulLogin = (resData) => {
    message.success('Login successful!');
    localStorage.setItem('parking_auth', JSON.stringify(resData));
    const extractedRole = resData.role || 'UNKNOWN';
    const route = getDefaultRouteByRole(resData);
    navigate(route);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: values.email,
        password: values.password
      });

      if (response.data.success || response.data.data?.token || response.data.token) {
        handleSuccessfulLogin(response.data.data || response.data);
      } else {
        setLoginError(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error(error);
      setLoginError(error.response?.data?.message || 'Error connecting to the server');
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
            src={logoImg}
            alt="ParkSmart Welcome"
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
              label={<span style={{ fontWeight: 600, color: isDarkMode ? '#fff' : undefined }}>Email Address</span>}
              rules={[
                { required: true, message: 'Please enter your email!' },
                { type: 'email', message: 'Invalid email format!' }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />}
                placeholder="Ex: admin@parksmart.com"
                style={{ borderRadius: '8px', padding: '12px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ fontWeight: 600, color: isDarkMode ? '#fff' : undefined }}>Password</span>}
              rules={[{ required: true, message: 'Please enter your password!' }]}
              style={{ marginBottom: '16px' }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />}
                placeholder="Enter password"
                style={{ borderRadius: '8px', padding: '12px' }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox style={{ color: isDarkMode ? '#fff' : undefined }}>Remember me</Checkbox>
                </Form.Item>
                <a
                  style={{ color: '#ea580c', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setIsForgotModalVisible(true)}
                >
                  Forgot password?
                </a>
              </div>
            </Form.Item>

            {loginError && <div style={{ color: '#ea580c', marginBottom: '16px', textAlign: 'center', fontWeight: 600, padding: '10px', backgroundColor: '#fff7ed', borderRadius: '8px' }}>{loginError}</div>}
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
              <Divider style={{ color: isDarkMode ? '#aaa' : '#888' }}>Or continue with</Divider>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setLoginError('Google Login Failed');
                  }}
                  shape="rectangular"
                  size="large"
                  theme={isDarkMode ? 'filled_black' : 'outline'}
                />
              </div>
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
            label={<span style={{ fontWeight: 600, color: isDarkMode ? '#fff' : undefined }}>Email Address</span>}
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

      {/* Modal Cập nhật Số điện thoại cho Google Login */}
      <Modal
        title="Complete Your Profile"
        open={isPhoneModalVisible}
        onCancel={() => {
          setIsPhoneModalVisible(false);
          setGoogleCredential(null);
          phoneForm.resetFields();
        }}
        footer={null}
      >
        <Typography.Paragraph type="secondary">
          We need your phone number to complete the registration process.
        </Typography.Paragraph>
        <Form form={phoneForm} layout="vertical" onFinish={handlePhoneSubmit}>
          <Form.Item
            name="phoneNumber"
            label={<span style={{ fontWeight: 600, color: isDarkMode ? '#fff' : undefined }}>Phone Number</span>}
            rules={[{ required: true, message: 'Please enter your phone number!' }]}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />}
              placeholder="Ex: 0912345678"
              style={{ borderRadius: '8px', padding: '12px' }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={phoneLoading}
              style={{ width: '100%', height: '48px', borderRadius: '8px', backgroundColor: '#ea580c', fontWeight: 600 }}
            >
              Complete Registration
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;
