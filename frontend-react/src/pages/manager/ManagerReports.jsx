import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, DatePicker, Button, Statistic, message } from 'antd';
import { DollarOutlined, CarOutlined, DownloadOutlined } from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { reportApi, paymentApi } from '../../services/api';
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

  const handleExportCSV = async () => {
    try {
      const hide = message.loading('Extracting data...', 0);
      const res = await paymentApi.getPayments();
      hide();
      
      let payments = res.data?.data || res.data || [];
      
      const start = dateRange[0].startOf('day');
      const end = dateRange[1].endOf('day');
      
      // Lọc các thanh toán thành công trong khoảng thời gian
      payments = payments.filter(p => {
        if (p.paymentStatus !== 'PAID' && p.paymentStatus !== 'COMPLETED') return false;
        const pDate = dayjs(p.paidAt || p.createdAt || new Date());
        return pDate.isAfter(start) && pDate.isBefore(end);
      });

      if (payments.length === 0) {
        message.warning('No transaction data in this period');
        return;
      }

      const generatedOn = dayjs().format('DD/MM/YYYY HH:mm:ss');
      const totalRev = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const BOM = '\uFEFF';
      
      const metaData = [
        ['PARKSMART - DETAILED REVENUE REPORT'],
        ['=============================================='],
        [],
        ['Report Period:', `${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`],
        ['Generated Date:', generatedOn],
        ['Total Revenue:', `${totalRev.toLocaleString()} VND`],
        ['Number of Transactions:', payments.length],
        [],
        ['----------------------------------------------']
      ];

      const headers = [
        'Transaction Date', 
        'Product/Service Name', 
        'Quantity', 
        'Unit Price', 
        'Revenue', 
        'Incurred Cost', 
        'Net Profit', 
        'Note'
      ];
      
      const tableData = payments.map(p => {
        const date = dayjs(p.paidAt || p.createdAt).format('DD/MM/YYYY');
        let productName = 'Parking Service';
        if (p.session) productName = `Parking Ticket (Plate: ${p.session.licensePlate || 'N/A'})`;
        else if (p.reservation) productName = `Reservation (ID: ${p.reservation.reservationId || 'N/A'})`;
        else if (p.subscription) productName = 'Monthly Subscription';

        const qty = 1;
        const price = Number(p.amount || 0);
        const revenue = price * qty;
        const cost = 0; 
        const profit = revenue - cost;
        const note = p.paymentMethod === 'CASH' ? 'Cash' : (p.paymentMethod || 'Other');

        return [
          date,
          `"${productName}"`,
          qty,
          price,
          revenue,
          cost,
          profit,
          `"${note}"`
        ];
      });

      const csvContent = BOM + 
        metaData.map(e => e.join(',')).join('\n') + '\n' +
        headers.join(',') + '\n' +
        tableData.map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ParkSmart_BaoCaoChiTiet_${dayjs().format('YYYYMMDD')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('File exported successfully!');
    } catch (error) {
      message.error('Error loading transaction data');
      console.error(error);
    }
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
