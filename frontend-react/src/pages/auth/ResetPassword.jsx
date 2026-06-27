import React, { useState, useContext, useEffect } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/api';
import { ThemeContext } from '../../contexts/ThemeContext';

const { Title, Text } = Typography;

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext) || { isDarkMode: false };
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      message.error("Invalid or missing reset token.");
      navigate('/login');
    }
  }, [token, navigate]);

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match!');
      return;
    }
    
    setLoading(true);
    try {
      await authApi.resetPassword({
        token: token,
        newPassword: values.password
      });

      message.success('Password has been successfully reset! Please login.');
      navigate('/login');
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Failed to reset password. The link might be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: isDarkMode ? '#141414' : '#fff' }}>
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
        </div>
      </div>

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
          <Title level={2} style={{ fontWeight: 700, marginBottom: '8px', color: isDarkMode ? '#fff' : '#000' }}>Reset Password 🔒</Title>
          <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '40px', color: isDarkMode ? '#aaa' : undefined }}>
            Please enter your new password
          </Text>

          <Form
            name="reset_password_form"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="password"
              label={<span style={{ fontWeight: 600 }}>New Password</span>}
              rules={[{ required: true, message: 'Please enter your new password!' }]}
              style={{ marginBottom: '24px' }}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#bfbfbf', marginRight: 8 }}/>} 
                placeholder="Enter new password" 
                style={{ borderRadius: '8px', padding: '12px' }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span style={{ fontWeight: 600 }}>Confirm New Password</span>}
              rules={[{ required: true, message: 'Please confirm your new password!' }]}
              style={{ marginBottom: '32px' }}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#bfbfbf', marginRight: 8 }}/>} 
                placeholder="Re-enter new password" 
                style={{ borderRadius: '8px', padding: '12px' }}
              />
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
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
