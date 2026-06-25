import React from 'react';
import { Button, Typography, Row, Col, Card, Steps, Carousel } from 'antd';
import { 
  CheckCircleOutlined, 
  ThunderboltOutlined, 
  EnvironmentOutlined,
  HistoryOutlined,
  MobileOutlined,
  CarOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();

  const carouselImages = [
    'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?q=80&w=1200&auto=format&fit=crop'
  ];

  return (
    <div style={{ backgroundColor: '#fff', overflow: 'hidden' }}>
      
      {/* 1. HERO SECTION */}
      <div style={{ 
        padding: '80px 5%', 
        background: 'linear-gradient(135deg, #fffaf0 0%, #ffffff 100%)',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* Background Decorative Shapes */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: 'rgba(234, 88, 12, 0.05)', borderRadius: '50%', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -50, width: 400, height: 400, background: 'rgba(245, 158, 11, 0.05)', borderRadius: '50%', filter: 'blur(50px)' }} />

        <Row align="middle" gutter={[64, 48]} style={{ zIndex: 1 }}>
          <Col xs={24} lg={11}>
            <div style={{ paddingRight: '20px' }}>
              <div style={{ 
                display: 'inline-block', padding: '6px 20px', background: '#ffedd5', color: '#ea580c', 
                borderRadius: '20px', fontWeight: 600, marginBottom: 24, fontSize: 14, letterSpacing: 0.5 
              }}>
                Smart Parking Solution
              </div>
              
              <Title style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1.15, marginBottom: 24, color: '#111827', letterSpacing: '-1px' }}>
                Find Parking <br />
                <span style={{ color: '#ea580c' }}>Easier</span> than ever
              </Title>
              
              <Paragraph style={{ fontSize: '1.25rem', color: '#4b5563', marginBottom: 40, lineHeight: 1.7 }}>
                No more driving around looking for a spot. Our app helps you check real-time availability, book in advance, and pay cashless with just a few taps.
              </Paragraph>
              
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Button 
                  type="primary" 
                  size="large" 
                  style={{ backgroundColor: '#ea580c', height: 56, padding: '0 40px', fontSize: 16, fontWeight: 700, borderRadius: '12px', boxShadow: '0 10px 20px -5px rgba(234, 88, 12, 0.4)' }} 
                  onClick={() => navigate('/login')}
                >
                  Get Started
                </Button>
                <Button 
                  size="large" 
                  style={{ height: 56, padding: '0 40px', fontSize: 16, fontWeight: 600, borderRadius: '12px', borderColor: '#e5e7eb', color: '#4b5563', backgroundColor: '#fff' }}
                  onClick={() => { document.getElementById('features').scrollIntoView({ behavior: 'smooth' }) }}
                >
                  Explore Features
                </Button>
              </div>
            </div>
          </Col>

          {/* Carousel Image Section */}
          <Col xs={24} lg={13}>
            <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '8px solid white' }}>
              <Carousel autoplay effect="fade" className="hero-carousel" dots={{ className: 'hero-dots' }}>
                {carouselImages.map((src, idx) => (
                  <div key={idx}>
                    <div style={{
                      height: '500px',
                      backgroundImage: `url(${src})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }} />
                  </div>
                ))}
              </Carousel>
              
              {/* Nổi bật tính năng nhỏ góc dưới ảnh */}
              <div style={{ position: 'absolute', bottom: 30, left: 30, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20 }}>
                  <CheckCircleOutlined />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>120+ Spots</div>
                  <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>Available right now</div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* 2. CÁC TÍNH NĂNG NỔI BẬT (Feature Grid) */}
      <div id="features" style={{ padding: '120px 5%', backgroundColor: '#f9fafb' }}>
        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 80px' }}>
          <Text style={{ color: '#ea580c', fontWeight: 700, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' }}>Exceptional Experience</Text>
          <Title level={2} style={{ fontWeight: 900, fontSize: '2.5rem', marginTop: 12, color: '#111827' }}>Everything at your fingertips</Title>
        </div>
        
        <Row gutter={[40, 40]}>
          {[
            { icon: <EnvironmentOutlined />, title: 'Real-time Availability', desc: 'Live parking map updated instantly. Track floors, zones, and suitable vehicle types.' },
            { icon: <CarOutlined />, title: 'Advanced Booking', desc: 'Never worry about running out of spots during rush hours. Reserve your spot and drive with peace of mind.' },
            { icon: <CreditCardOutlined />, title: 'Contactless Payment', desc: 'Automatic fee calculation and e-wallet integration. No more searching for loose change.' },
            { icon: <HistoryOutlined />, title: 'Transparent History', desc: 'Easily look up past parking sessions and export electronic receipts whenever you need.' },
            { icon: <ThunderboltOutlined />, title: 'Instant Support', desc: 'Report incidents directly from the app. Our support team will arrive within 5 minutes.' },
            { icon: <MobileOutlined />, title: 'Mobile First Design', desc: 'Fully optimized for mobile devices, allowing for ultra-fast operation while driving.' },
          ].map((feature, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card 
                bordered={false} 
                hoverable
                style={{ height: '100%', borderRadius: 24, transition: 'all 0.3s', border: '1px solid #f3f4f6' }}
                bodyStyle={{ padding: 40 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ width: 64, height: 64, backgroundColor: '#fff7ed', borderRadius: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ea580c', fontSize: 28, marginRight: 20 }}>
                    {feature.icon}
                  </div>
                  <Text style={{ fontSize: 24, color: '#f59e0b', fontWeight: 900, opacity: 0.5 }}>0{index + 1}</Text>
                </div>
                <Title level={4} style={{ fontWeight: 800, fontSize: 20, color: '#1f2937' }}>{feature.title}</Title>
                <Paragraph style={{ color: '#6b7280', fontSize: 16, lineHeight: 1.6, margin: 0 }}>{feature.desc}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 3. QUY TRÌNH SỬ DỤNG (Process) */}
      <div style={{ padding: '120px 5%', backgroundColor: '#fff' }}>
        <Row align="middle" gutter={[80, 64]}>
          <Col xs={24} lg={10}>
            <Text style={{ color: '#ea580c', fontWeight: 700, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' }}>Simplified</Text>
            <Title level={2} style={{ fontWeight: 900, fontSize: '2.5rem', marginTop: 12, color: '#111827' }}>Just 3 simple steps</Title>
            <Paragraph style={{ color: '#6b7280', fontSize: 18, marginBottom: 40, lineHeight: 1.7 }}>
              We've optimized all unnecessary actions so you can enter and exit the parking lot as fast as possible. Automation technology handles the rest.
            </Paragraph>
          </Col>
          <Col xs={24} lg={14}>
            <Steps
              direction="vertical"
              current={-1}
              size="default"
              items={[
                {
                  title: <span style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>Create a Free Account</span>,
                  description: <span style={{ fontSize: 16, color: '#6b7280', display: 'inline-block', marginTop: 8, paddingBottom: 32 }}>Takes only 30 seconds to register. Manage all your vehicles in a single account.</span>,
                },
                {
                  title: <span style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>Find & Reserve a Spot</span>,
                  description: <span style={{ fontSize: 16, color: '#6b7280', display: 'inline-block', marginTop: 8, paddingBottom: 32 }}>View available slots by zone, compare prices, and hit reserve before you depart.</span>,
                },
                {
                  title: <span style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>Park & Auto-Pay</span>,
                  description: <span style={{ fontSize: 16, color: '#6b7280', display: 'inline-block', marginTop: 8 }}>AI cameras recognize your license plate, barriers open automatically. The fee is deducted when you leave.</span>,
                },
              ]}
            />
          </Col>
        </Row>
      </div>

      {/* 4. BẢNG GIÁ (Pricing) */}
      <div style={{ padding: '100px 5%', background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', color: '#fff', textAlign: 'center' }}>
        <Title level={2} style={{ color: '#fff', fontWeight: 900, fontSize: '3rem', marginBottom: 24 }}>
          Ready to get started?
        </Title>
        <Paragraph style={{ color: '#ffedd5', fontSize: 20, maxWidth: 800, margin: '0 auto 40px', fontWeight: 500 }}>
          Join thousands of drivers using our smart parking solution every day. Register now to get a discount on your first month.
        </Paragraph>
        <Button 
          size="large" 
          style={{ height: 60, padding: '0 48px', fontSize: 18, fontWeight: 800, borderRadius: '30px', color: '#ea580c', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
          onClick={() => navigate('/login')}
        >
          Sign in to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
