import React, { useState, useEffect, useCallback } from 'react';
import { Button, Typography, Row, Col, Card, Steps, Skeleton, Result, theme } from 'antd';
import { 
  ThunderboltOutlined, 
  EnvironmentOutlined,
  HistoryOutlined,
  MobileOutlined,
  CarOutlined,
  CreditCardOutlined,
  LeftOutlined,
  RightOutlined,
  LoginOutlined,
  FormOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { buildingApi, slotApi } from '../../services/api';
import { motion, useScroll, useTransform } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;

// --- Framer Motion Premium Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      ease: 'easeOut',
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { 
      duration: 0.8, 
      ease: [0.16, 1, 0.3, 1] // Custom premium ease-out curve (similar to Apple/Stripe)
    } 
  }
};

const LandingPage = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [buildingsData, setBuildingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // State for true 3D circular carousel
  const [rotationCount, setRotationCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Parallax effects
  const { scrollY } = useScroll();
  const yHeroBg = useTransform(scrollY, [0, 800], [0, 150]); // Subtly moves background slower than scroll
  const yDashboard = useTransform(scrollY, [0, 800], [0, -40]); // Subtly shifts the dashboard upwards while scrolling down

  // 1. LOAD REAL DATA FROM BACKEND
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [buildingsRes, slotsRes] = await Promise.all([
          buildingApi.getBuildings(),
          slotApi.getSlots()
        ]);
        
        if (!isMounted) return;

        const buildingsList = buildingsRes.data?.data || buildingsRes.data || [];
        const slotsList = slotsRes.data?.data || slotsRes.data || [];

        const defaultImages = [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?q=80&w=1200&auto=format&fit=crop'
        ];

        const mapped = buildingsList.map((b, idx) => {
          const bSlots = slotsList.filter(s => s.buildingId === b.buildingId);
          
          const availableCarSlots = bSlots
            .filter(s => {
              const typeName = (s.vehicleType?.name || s.vehicleTypeName || '').toLowerCase();
              return typeName.includes('car') || typeName.includes('ô tô') || typeName.includes('xe hơi');
            })
            .reduce((sum, s) => {
              const cap = s.capacity || 1;
              const occ = s.currentOccupancy || 0;
              return sum + Math.max(0, cap - occ);
            }, 0);
          
          const availableMotorSlots = bSlots
            .filter(s => {
              const typeName = (s.vehicleType?.name || s.vehicleTypeName || '').toLowerCase();
              return typeName.includes('motor') || typeName.includes('xe máy');
            })
            .reduce((sum, s) => {
              const cap = s.capacity || 1;
              const occ = s.currentOccupancy || 0;
              return sum + Math.max(0, cap - occ);
            }, 0);

          return {
            id: b.buildingId,
            name: b.buildingName,
            image: b.image || defaultImages[idx % defaultImages.length],
            carSlots: availableCarSlots,
            motorSlots: availableMotorSlots
          };
        });

        if (mapped.length > 0) {
          setBuildingsData(mapped);
        } else {
          setError(true);
          setErrorMessage("No buildings found in the database.");
        }
        setLoading(false);
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load buildings", err);
          setError(true);
          setErrorMessage(err.message || JSON.stringify(err));
          setLoading(false);
        }
      }
    };
    
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const totalBuildings = buildingsData.length;

  // 2. AUTO ROTATION (Restarts on manual interaction due to rotationCount dependency)
  useEffect(() => {
    if (totalBuildings <= 1 || isHovered) return;
    
    const timer = setInterval(() => {
      // Do not rotate if the user is not actively viewing the tab to prevent animation queueing/spinning
      if (document.hidden) return;
      setRotationCount(prev => prev + 1);
    }, 6000);

    return () => clearInterval(timer);
  }, [isHovered, totalBuildings, rotationCount]);

  // 3. MANUAL CONTROL
  const handleNext = useCallback(() => {
    if (totalBuildings <= 1) return;
    setRotationCount(prev => prev + 1);
  }, [totalBuildings]);

  const handlePrev = useCallback(() => {
    if (totalBuildings <= 1) return;
    setRotationCount(prev => prev - 1);
  }, [totalBuildings]);

  // Calculate normalized index (always positive 0 to totalBuildings - 1)
  const normalizedActive = totalBuildings > 0 
    ? ((rotationCount % totalBuildings) + totalBuildings) % totalBuildings 
    : 0;

  // Preload next image for performance
  useEffect(() => {
    if (totalBuildings > 0) {
      const nextIndex = (normalizedActive + 1) % totalBuildings;
      const img = new Image();
      img.src = buildingsData[nextIndex].image;
    }
  }, [normalizedActive, totalBuildings, buildingsData]);

  const renderBuildingDashboard = () => {
    if (loading) {
      return (
        <div style={{ width: '100%', maxWidth: '600px', backgroundColor: token.colorBgContainer, borderRadius: '24px', padding: '32px 20px', border: `1px solid ${token.colorBorderSecondary}` }}>
          <Skeleton.Button active style={{ width: '160px', height: '44px', borderRadius: '24px', margin: '0 auto 20px', display: 'block' }} />
          <Skeleton.Image active style={{ width: '100%', height: '280px', borderRadius: '16px', marginBottom: '24px' }} />
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      );
    }

    if (error || totalBuildings === 0) {
      return (
        <div style={{ width: '100%', maxWidth: '600px', backgroundColor: token.colorBgContainer, borderRadius: '24px', padding: '40px 20px', border: `1px solid ${token.colorBorderSecondary}` }}>
          <Result status="error" title="Parking Data Unavailable" subTitle={`We couldn't connect to the live parking database right now. Details: ${errorMessage}`} />
        </div>
      );
    }

    const currentBuilding = buildingsData[normalizedActive];
    const theta = 360 / totalBuildings;
    const radius = totalBuildings <= 1 ? 0 : 160;

    return (
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '600px',
          backgroundColor: token.colorBgContainer, 
          borderRadius: '24px', 
          padding: '24px 20px 20px 20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        {/* CURRENT BUILDING NAME BADGE */}
        <div style={{ position: 'relative', height: '44px', display: 'flex', justifyContent: 'center', marginBottom: '24px', zIndex: 20 }}>
          {buildingsData.map((b, idx) => (
            <div key={b.id} style={{ 
              position: 'absolute', 
              transition: 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
              opacity: normalizedActive === idx ? 1 : 0,
              transform: normalizedActive === idx ? 'translateY(0) scale(1)' : 
                         ( (idx - normalizedActive + totalBuildings) % totalBuildings === 1 ? 'translateY(20px) scale(0.9)' : 'translateY(-20px) scale(0.9)' ),
              pointerEvents: normalizedActive === idx ? 'auto' : 'none',
              padding: '10px 32px', 
              borderRadius: '24px', 
              backgroundColor: '#ea580c', 
              color: '#fff', 
              fontWeight: 800, 
              fontSize: '16px',
              letterSpacing: '0.5px',
              boxShadow: '0 8px 16px rgba(234, 88, 12, 0.3)',
              textAlign: 'center',
              minWidth: '200px'
            }}>
              {b.name}
            </div>
          ))}
        </div>

        {/* 3D CIRCULAR BUILDING CAROUSEL */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '280px', 
          marginBottom: '24px',
        }}>
          {/* 3D Scene Wrapper */}
          <div style={{ 
            position: 'absolute', 
            top: 0, left: 0, 
            width: '100%', height: '100%',
            perspective: '1200px',
            transformStyle: 'preserve-3d',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {buildingsData.map((b, idx) => {
              const currentAngle = (idx * theta) - (rotationCount * theta);
              
              // Normalize angle between -180 and 180 to determine true front/back
              let normAngle = currentAngle % 360;
              if (normAngle > 180) normAngle -= 360;
              if (normAngle < -180) normAngle += 360;

              // Distance from front (0 to 1)
              const dist = Math.abs(normAngle) / 180; 
              const isFront = dist < 0.05;

              return (
                <div 
                  key={b.id}
                  style={{
                    position: 'absolute',
                    width: '100%', 
                    height: '100%',
                    // Circular path logic: Rotate -> Push out -> Rotate back to face camera
                    transform: `rotateY(${currentAngle}deg) translateZ(${radius}px) rotateY(${-currentAngle}deg) scale(${1 - dist * 0.15})`,
                    zIndex: Math.round((1 - dist) * 100), // Ensure front cards overlap back cards
                    transition: 'all 1s cubic-bezier(0.25, 1, 0.5, 1)',
                    opacity: 1 - dist * 0.6,
                    filter: `brightness(${1 - dist * 0.5}) blur(${dist * 4}px)`,
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${b.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '16px',
                    boxShadow: isFront ? '0 20px 40px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.1)',
                  }} />
                </div>
              );
            })}
          </div>
          
          {/* UI OVERLAYS (Outside 3D scene to prevent glitches) */}
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', color: '#10b981', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', marginRight: 6, animation: 'pulse 2s infinite' }}></span>
            Live Updates
          </div>

          {totalBuildings > 1 && (
            <>
              <Button 
                shape="circle" 
                icon={<LeftOutlined />} 
                onClick={handlePrev} 
                style={{ position: 'absolute', top: '50%', left: '-20px', transform: 'translateY(-50%)', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}
              />
              <Button 
                shape="circle" 
                icon={<RightOutlined />} 
                onClick={handleNext} 
                style={{ position: 'absolute', top: '50%', right: '-20px', transform: 'translateY(-50%)', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}
              />
            </>
          )}
        </div>

        {/* PARKING STATISTICS */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          
          <div className="stat-card" style={{ flex: '1 1 200px', backgroundColor: token.colorFillQuaternary, padding: '16px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${token.colorBorderSecondary}`, transition: 'all 0.3s ease' }}>
            <div style={{ width: 52, height: 52, borderRadius: '14px', backgroundColor: '#e0f2fe', color: '#0ea5e9', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
              <CarOutlined />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', color: token.colorTextSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Car Slots</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: token.colorTextHeading, transition: 'all 0.3s' }}>
                  {currentBuilding?.carSlots ?? 0}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>Available</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card" style={{ flex: '1 1 200px', backgroundColor: token.colorFillQuaternary, padding: '16px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${token.colorBorderSecondary}`, transition: 'all 0.3s ease' }}>
            <div style={{ width: 52, height: 52, borderRadius: '14px', backgroundColor: '#fef3c7', color: '#f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
              <span style={{ fontSize: '24px', lineHeight: 1 }}>🛵</span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', color: token.colorTextSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Motorcycle Slots</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: token.colorTextHeading, transition: 'all 0.3s' }}>
                  {currentBuilding?.motorSlots ?? 0}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>Available</span>
              </div>
            </div>
          </div>

        </div>

        {/* RESERVE BUTTON */}
        <Button 
          type="primary"
          block
          size="large"
          style={{ 
            height: '56px', 
            backgroundColor: '#ea580c', 
            borderRadius: '16px', 
            fontSize: '17px', 
            fontWeight: 700,
            border: 'none',
            zIndex: 10
          }}
          onClick={() => navigate('/login')}
          className="hero-btn-hover"
        >
          Reserve Now
        </Button>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: '#111827', overflow: 'hidden' }}>
      
      {/* 1. HERO SECTION */}
      <div style={{ 
        padding: '80px 5%', 
        background: `linear-gradient(135deg, ${token.colorBgLayout} 0%, ${token.colorBgContainer} 100%)`,
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* PARALLAX BG ELEMENTS */}
        <motion.div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: 'rgba(234, 88, 12, 0.05)', borderRadius: '50%', filter: 'blur(50px)', y: yHeroBg }} />
        <motion.div style={{ position: 'absolute', bottom: -100, left: -50, width: 400, height: 400, background: 'rgba(245, 158, 11, 0.05)', borderRadius: '50%', filter: 'blur(50px)', y: yHeroBg }} />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, margin: "0px" }}
          style={{ zIndex: 1, width: '100%' }}
        >
          <Row align="middle" gutter={[64, 48]}>
            <Col xs={24} lg={11}>
              <div style={{ paddingRight: '20px' }}>
                <motion.div variants={itemVariants} style={{ 
                  display: 'inline-block', padding: '6px 20px', background: '#ffedd5', color: '#ea580c', 
                  borderRadius: '20px', fontWeight: 700, marginBottom: 24, fontSize: 13, letterSpacing: 0.5 
                }}>
                  Smart Parking Solution
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <Title style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.15, marginBottom: 24, color: token.colorTextHeading, letterSpacing: '-1px' }}>
                    Find Parking <br />
                    <span style={{ color: '#ea580c' }}>Easier</span> than ever
                  </Title>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <Paragraph style={{ fontSize: '1.15rem', color: token.colorTextSecondary, marginBottom: 40, lineHeight: 1.6 }}>
                    No more driving around looking for a spot. Our app helps you check real-time availability, book in advance, and pay cashless with just a few taps.
                  </Paragraph>
                </motion.div>
                
                <motion.div variants={itemVariants} style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Button 
                    type="primary" 
                    size="large" 
                    style={{ backgroundColor: '#ea580c', height: 56, padding: '0 40px', fontSize: 16, fontWeight: 700, borderRadius: '12px', boxShadow: '0 10px 20px -5px rgba(234, 88, 12, 0.4)' }} 
                    onClick={() => navigate('/login')}
                    className="hero-btn-hover"
                  >
                    Get Started
                  </Button>
                  <Button 
                    size="large" 
                    style={{ height: 56, padding: '0 40px', fontSize: 16, fontWeight: 600, borderRadius: '12px', borderColor: '#e5e7eb', color: '#4b5563', backgroundColor: '#fff' }}
                    onClick={() => { document.getElementById('booking-steps')?.scrollIntoView({ behavior: 'smooth' }) }}
                  >
                    View feature
                  </Button>
                </motion.div>
              </div>
            </Col>

            <Col xs={24} lg={13}>
              <motion.div 
                variants={itemVariants} 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', y: yDashboard }}
              >
                {renderBuildingDashboard()}
              </motion.div>
            </Col>
          </Row>
        </motion.div>
      </div>

      {/* 2. CÁC TÍNH NĂNG NỔI BẬT */}
      <div id="features" style={{ padding: '120px 5%', backgroundColor: token.colorBgLayout }}>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, margin: "-50px" }}
          style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 80px' }}
        >
          <motion.div variants={itemVariants}>
            <Text style={{ color: '#ea580c', fontWeight: 700, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' }}>Exceptional Experience</Text>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Title level={2} style={{ fontWeight: 900, fontSize: '2.5rem', marginTop: 12, color: token.colorTextHeading }}>Everything at your fingertips</Title>
          </motion.div>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, margin: "-50px" }}
        >
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
                <motion.div variants={itemVariants} style={{ height: '100%' }}>
                  <Card 
                    bordered={false} 
                    hoverable
                    style={{ height: '100%', borderRadius: 24, transition: 'all 0.3s', border: '1px solid #f3f4f6' }}
                    bodyStyle={{ padding: 40 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                      <div style={{ width: 64, height: 64, backgroundColor: token.colorFillQuaternary, borderRadius: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ea580c', fontSize: 28, marginRight: 20 }}>
                        {feature.icon}
                      </div>
                      <Text style={{ fontSize: 24, color: '#f59e0b', fontWeight: 900, opacity: 0.5 }}>0{index + 1}</Text>
                    </div>
                    <Title level={4} style={{ fontWeight: 800, fontSize: 20, color: token.colorTextHeading }}>{feature.title}</Title>
                    <Paragraph style={{ color: token.colorTextSecondary, fontSize: 16, lineHeight: 1.6, margin: 0 }}>{feature.desc}</Paragraph>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>
      </div>

      {/* 3. QUY TRÌNH SỬ DỤNG */}
      <div id="booking-steps" style={{ padding: '120px 5%', backgroundColor: token.colorBgContainer }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.1 }}
        >
          <Row justify="center" align="middle" gutter={[0, 64]}>
            <Col xs={24} style={{ textAlign: 'center' }}>
              <motion.div variants={itemVariants}>
                <Text style={{ color: '#ea580c', fontWeight: 700, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' }}>How to Book</Text>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Title level={2} style={{ fontWeight: 900, fontSize: '2.5rem', marginTop: 12, color: token.colorTextHeading }}>Detailed Booking Steps</Title>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Paragraph style={{ color: token.colorTextSecondary, fontSize: 18, marginBottom: 40, lineHeight: 1.7, maxWidth: 600, margin: '0 auto 40px' }}>
                  Follow these 5 simple steps to book a parking spot for your car effortlessly.
                </Paragraph>
              </motion.div>
            </Col>
            <Col xs={24}>
              <motion.div variants={itemVariants}>
                <Steps
                  direction="horizontal"
                  labelPlacement="vertical"
                  current={-1}
                  size="default"
                  items={[
                    {
                      title: <span style={{ fontSize: 20, fontWeight: 800, color: token.colorTextHeading }}>Login</span>,
                      icon: <LoginOutlined style={{ color: '#ea580c', fontSize: 28 }} />,
                      description: <span style={{ fontSize: 14, color: token.colorTextSecondary, display: 'inline-block', marginTop: 8 }}>Log in to the system.</span>,
                    },
                    {
                      title: <span style={{ fontSize: 20, fontWeight: 800, color: token.colorTextHeading }}>Register Vehicle</span>,
                      icon: <FormOutlined style={{ color: '#ea580c', fontSize: 28 }} />,
                      description: <span style={{ fontSize: 14, color: token.colorTextSecondary, display: 'inline-block', marginTop: 8 }}>Add your vehicle details.</span>,
                    },
                    {
                      title: <span style={{ fontSize: 20, fontWeight: 800, color: token.colorTextHeading }}>Select Slot</span>,
                      icon: <CarOutlined style={{ color: '#ea580c', fontSize: 28 }} />,
                      description: <span style={{ fontSize: 14, color: token.colorTextSecondary, display: 'inline-block', marginTop: 8 }}>Select a suitable position.</span>,
                    },
                    {
                      title: <span style={{ fontSize: 20, fontWeight: 800, color: token.colorTextHeading }}>Create Booking</span>,
                      icon: <CheckCircleOutlined style={{ color: '#ea580c', fontSize: 28 }} />,
                      description: <span style={{ fontSize: 14, color: token.colorTextSecondary, display: 'inline-block', marginTop: 8 }}>Confirm booking details.</span>,
                    },
                    {
                      title: <span style={{ fontSize: 20, fontWeight: 800, color: token.colorTextHeading }}>Payment</span>,
                      icon: <CreditCardOutlined style={{ color: '#ea580c', fontSize: 28 }} />,
                      description: <span style={{ fontSize: 14, color: token.colorTextSecondary, display: 'inline-block', marginTop: 8 }}>Pay online to complete.</span>,
                    },
                  ]}
                />
              </motion.div>
            </Col>
          </Row>
        </motion.div>
      </div>

      {/* 4. BẢNG GIÁ */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.1 }}
        style={{ padding: '100px 5%', background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', color: '#fff', textAlign: 'center' }}
      >
        <motion.div variants={itemVariants}>
          <Title level={2} style={{ color: '#fff', fontWeight: 900, fontSize: '3rem', marginBottom: 24 }}>
            Ready to get started?
          </Title>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Paragraph style={{ color: '#ffedd5', fontSize: 20, maxWidth: 800, margin: '0 auto 40px', fontWeight: 500 }}>
            Join thousands of drivers using our smart parking solution every day. Register now to get a discount on your first month.
          </Paragraph>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button 
            size="large" 
            style={{ height: 60, padding: '0 48px', fontSize: 18, fontWeight: 800, borderRadius: '30px', color: '#ea580c', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            onClick={() => navigate('/login')}
          >
            Sign in to Dashboard
          </Button>
        </motion.div>
      </motion.div>

      {/* 5. FOOTER */}
      <div style={{ backgroundColor: '#111827', color: '#fff', padding: '60px 5% 40px' }}>
        <Row gutter={[40, 40]}>
          <Col xs={24} md={8}>
            <Title level={3} style={{ color: '#fff', fontWeight: 800, margin: '0 0 24px 0' }}>ParkSmart</Title>
            <Paragraph style={{ color: '#9ca3af', fontSize: 16, lineHeight: 1.8 }}>
              Leading smart parking solution. Fast, safe, and convenient.
            </Paragraph>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: '#fff', fontWeight: 700, margin: '0 0 24px 0' }}>Contact Us</Title>
            <div style={{ color: '#9ca3af', fontSize: 16, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>📞 <strong>Phone:</strong> 0123 456 789</div>
              <div>💬 <strong>Zalo:</strong> 0123 456 789</div>
              <div>✉️ <strong>Email:</strong> contact@parksmart.vn</div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: '#fff', fontWeight: 700, margin: '0 0 24px 0' }}>Address</Title>
            <Paragraph style={{ color: '#9ca3af', fontSize: 16, lineHeight: 1.8 }}>
              Hoa Lac Hi-Tech Park, <br />
              Thach That, Hanoi, Vietnam
            </Paragraph>
          </Col>
        </Row>
        <div style={{ borderTop: '1px solid #374151', marginTop: 40, paddingTop: 20, textAlign: 'center', color: '#6b7280' }}>
          © {new Date().getFullYear()} ParkSmart. All Rights Reserved.
        </div>
      </div>

      <style>{`
        .hero-btn-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hero-btn-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 20px -3px rgba(234, 88, 12, 0.4) !important;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
          border-color: #e2e8f0 !important;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
