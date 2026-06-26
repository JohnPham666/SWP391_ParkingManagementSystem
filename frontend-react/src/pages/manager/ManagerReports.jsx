import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, DatePicker, Button, Statistic, message } from 'antd';
import { DollarOutlined, CarOutlined, DownloadOutlined } from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { reportApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#ea580c'];

const ManagerReports = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'days'), dayjs()]);
  
  const [revenueData, setRevenueData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [floorOccupancyData, setFloorOccupancyData] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const start = dateRange[0].format('YYYY-MM-DD');
      const end = dateRange[1].format('YYYY-MM-DD');
      
      const revRes = await reportApi.getRevenueTrend(start, end);
      const occRes = await reportApi.getOccupancyBreakdown();
      const floorOccRes = await reportApi.getFloorOccupancyBreakdown();
      
      if (revRes.data?.success) {
        setRevenueData(revRes.data.data);
      }
      if (occRes.data?.success) {
        setOccupancyData(occRes.data.data);
      }
      if (floorOccRes.data?.success) {
        setFloorOccupancyData(floorOccRes.data.data);
      }
      
    } catch (error) {
      message.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!revenueData || revenueData.length === 0) {
      message.warning('No data to export');
      return;
    }
    const headers = ['Date', 'Revenue (VND)'];
    const csvContent = [
      headers.join(','),
      ...revenueData.map(row => `${row.date},${row.revenue}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `revenue_report_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Statistical Reports</Title>
        <div style={{ display: 'flex', gap: '16px' }}>
          <RangePicker 
            value={dateRange} 
            onChange={dates => setDateRange(dates)} 
            allowClear={false}
          />
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCSV}>
            Export Revenue CSV
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Revenue Trend" loading={loading} style={{ height: '100%' }}>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <RechartsTooltip formatter={(value) => `${value.toLocaleString()} ₫`} />
                  <Area type="monotone" dataKey="revenue" stroke="#ea580c" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Occupancy by Floor" loading={loading} style={{ height: '100%' }}>
            <div style={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={floorOccupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#1677ff"
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {floorOccupancyData.map((entry, index) => (
                      <Cell key={`cell-floor-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Occupancy by Zone" loading={loading} style={{ height: '100%' }}>
            <div style={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Daily Breakdown" loading={loading}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => `${value.toLocaleString()} ₫`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#1677ff" name="Revenue (VND)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ManagerReports;
