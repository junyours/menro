// resources/js/Pages/Drivers/CreateDriverAccount.jsx
import React, { useState } from 'react';
import {
  message,
  Layout,
  Button,
  Typography,
  Form,
  Input,
  Table,
  Tag,
  Card,
  Row,
  Col,
  Space,
  Switch,
  Modal,
  Select,
  Spin,
  Divider,
  Progress,
  Statistic,
  Avatar,
  DatePicker,
} from 'antd';
import { useForm, router, Head } from '@inertiajs/react';
import { PlusCircleOutlined, EditOutlined, BarChartOutlined } from '@ant-design/icons';
import Sidebar from '@/Components/Sidebar';
import Navbar from '@/Components/Navbar';
import EditDriverModal from '@/modal/EditDriverModal';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function CreateDriverAccount({ auth, drivers = [], trucks = [], schedules = [] }) {
  const [collapsed, setCollapsed] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const [isStatsModalVisible, setIsStatsModalVisible] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [wasteData, setWasteData] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [selectedScheduleForStats, setSelectedScheduleForStats] = useState(null);

  const [dateRange, setDateRange] = useState([null, null]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const form = useForm({
    name: '',
    email: '',
    password: '',
  });

  const handleFinish = () => {
    form.post(route('drivers.store'), {
      onSuccess: () => {
        message.success('Driver account created successfully');
        form.reset();
        router.reload({ only: ['drivers'] });
      },
      onError: () => message.error('Please check the form for errors.'),
    });
  };

  const handleEdit = (driver) => {
    setSelectedDriver(driver);
    setIsEditModalVisible(true);
  };

  const handleToggleActive = (driverProfileId, checked) => {
    router.put(route('drivers.toggleActive', driverProfileId), { is_active: checked }, {
      onSuccess: () => {
        message.success(`Driver marked as ${checked ? 'Active' : 'Inactive'}`);
        router.reload({ only: ['drivers'] });
      },
      onError: () => message.error('Failed to update driver status'),
    });
  };

  const formatSeconds = (sec) => {
    if (sec === null || sec === undefined || Number.isNaN(Number(sec))) return '-';
    const s = Math.round(Number(sec));
    if (s < 60) return `${s}s`;
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
  };

  // Fetch both performance and waste stats
  const fetchDriverStats = async (driver, scheduleId = null) => {
    setStatsLoading(true);
    setStatsError(null);
    setStatsData(null);
    setWasteData(null);

    try {
      const params = new URLSearchParams();
      params.append('driver_id', driver.id);
      if (scheduleId) params.append('schedule_id', scheduleId);
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('start_date', dayjs(dateRange[0]).format('YYYY-MM-DD'));
        params.append('end_date', dayjs(dateRange[1]).format('YYYY-MM-DD'));
      }

      const [statsRes, wasteRes] = await Promise.all([
        fetch(`${route('drivers.stats')}?${params.toString()}`, {
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        }),
        fetch(`${route('drivers.stats.data')}?${params.toString()}`, {
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        }),
      ]);

      if (!statsRes.ok) throw new Error(`Stats: ${statsRes.statusText}`);
      if (!wasteRes.ok) throw new Error(`Waste: ${wasteRes.statusText}`);

      const statsJson = await statsRes.json();
      const wasteJson = await wasteRes.json();

      setStatsData(statsJson);
      setWasteData(wasteJson);
    } catch (err) {
      console.error('Stats fetch error:', err);
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const openStatsModal = (driver) => {
    setSelectedDriver(driver);
    setSelectedScheduleForStats(null);
    setDateRange([null, null]);
    setCurrentPage(1);
    setPageSize(5);
    setIsStatsModalVisible(true);
    fetchDriverStats(driver, null);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    setCurrentPage(1);
    if (selectedDriver) fetchDriverStats(selectedDriver, selectedScheduleForStats);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { title: 'License No.', key: 'license_number', render: (_, r) => r.driver_profile?.license_number || <Tag>N/A</Tag> },
    { title: 'Contact No.', key: 'contact_number', render: (_, r) => r.driver_profile?.contact_number || <Tag>N/A</Tag> },
    { title: 'Truck', key: 'truck', render: (_, r) => r.driver_profile?.truck ? <Tag color="blue">{r.driver_profile.truck.model}</Tag> : <Tag>Not Assigned</Tag> },
    { title: 'Status', key: 'status', render: (_, r) => r.driver_profile?.is_active ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag> },
    {
  title: 'Actions',
  key: 'actions',
  render: (_, record) => (
    <Space size="middle" align="center">
      {/* Edit Icon Button */}
      <Button
        icon={<EditOutlined style={{ color: "#003a8c", fontWeight: "bold" }} />}
        onClick={() => handleEdit(record)}
        type="text"
      />

      {/* View Stats Icon Button */}
      <Button
        icon={<BarChartOutlined style={{ color: "#237804", fontWeight: "bold" }} />}
        onClick={() => openStatsModal(record)}
        type="text"
      />

      {/* Floating Switch */}
      <div style={{
        padding: 4,
        borderRadius: 20,
        background: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        display: "inline-block",
      }}>
        <Switch
          checked={record.driver_profile?.is_active}
          onChange={(checked) => handleToggleActive(record.driver_profile?.id, checked)}
        />
      </div>
    </Space>
  ),
}

  ];

  // 💅 Enhanced visual design for modal content
  const renderStatsContent = () => {
    if (statsLoading)
      return <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>;
    if (statsError)
      return <Typography.Text type="danger">{statsError}</Typography.Text>;
    if (!statsData)
      return <Typography.Text type="secondary">No data yet</Typography.Text>;

    const total = statsData.total_routes ?? 0;
    const ontime = statsData.ontime ?? 0;
    const delayed = statsData.delayed ?? 0;
    const ontimePercent = total > 0 ? Math.round((ontime / total) * 100) : 0;
    const waste = wasteData ?? { biodegradable: 0, non_biodegradable: 0, recyclable: 0 };

    return (
      <div style={{ background: '#fafafa', padding: 16, borderRadius: 12 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ borderRadius: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
              <Statistic title="Total Routes" value={total} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ borderRadius: 10, background: '#f6ffed', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
              <Statistic title="On Time" value={ontime} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ borderRadius: 10, background: '#fff2f0', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
              <Statistic title="Delayed" value={delayed} valueStyle={{ color: '#cf1322' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ borderRadius: 10, background: 'linear-gradient(145deg,#f0f5ff,#e6f7ff)', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={ontimePercent}
                width={85}
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
              />
              <div style={{ marginTop: 8, color: '#555' }}>On-time rate</div>
            </Card>
          </Col>
        </Row>

        <Divider style={{ fontWeight: 600, color: '#1890ff', margin: '12px 0' }}>Waste Collections</Divider>
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={8}>
            <Card hoverable style={{ borderRadius: 10, background: '#f6ffed' }}>
              <Statistic title="Biodegradable (sacks)" value={waste.biodegradable} valueStyle={{ color: '#389e0d' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card hoverable style={{ borderRadius: 10, background: '#fffbe6' }}>
              <Statistic title="Non-Biodegradable (sacks)" value={waste.non_biodegradable} valueStyle={{ color: '#d46b08' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card hoverable style={{ borderRadius: 10, background: '#e6f7ff' }}>
              <Statistic title="Recyclable (sacks)" value={waste.recyclable} valueStyle={{ color: '#096dd9' }} />
            </Card>
          </Col>
        </Row>

        <Divider style={{ fontWeight: 600, color: '#722ed1', margin: '12px 0 18px' }}>Schedules / Routes</Divider>
        <Table
          dataSource={statsData.routes || []}
          rowKey="id"
          size="small"
          bordered
          pagination={{
            current: currentPage,
            pageSize,
            total: (statsData.routes || []).length,
            onChange: (p, s) => {
              setCurrentPage(p);
              setPageSize(s);
            },
          }}
          columns={[
            {
              title: 'Type',
              dataIndex: 'type',
              render: (t) => (
                <Tag color={t === 'regular' ? 'blue' : 'orange'}>{t}</Tag>
              ),
            },
            { title: 'Start Time', dataIndex: 'start_time', key: 'start_time', render: (v) => v ? <div style={{ whiteSpace: 'nowrap' }}>{v}</div> : '-' },
                { title: 'Completed At', dataIndex: 'completed_at', key: 'completed_at', render: (v) => v ? <div style={{ whiteSpace: 'nowrap' }}>{v}</div> : '-' },
                { title: 'Allowed', dataIndex: 'duration_min', key: 'duration_min', render: (_, row) => row.duration_min !== null && row.duration_min !== undefined ? <div style={{ fontWeight: 600 }}>{String(row.duration_min)} <span style={{ color: '#888', fontWeight: 400 }}>min</span></div> : row.allowed ? <div style={{ fontWeight: 600 }}>{(row.allowed/60).toFixed(2)} <span style={{ color: '#888', fontWeight: 400 }}>min</span></div> : '-' },
                { title: 'Actual', dataIndex: 'actual', key: 'actual', render: (v) => <div style={{ fontWeight: 600 }}>{formatSeconds(v)}</div> },
                { title: 'Status', key: 'status', render: (_, row) => {
                    const status = row.status || (row.actual <= row.allowed ? 'ontime' : 'delayed');
                    return status === 'ontime' ? <Tag style={{ borderRadius: 999 }} color="success">On-time</Tag> : <Tag style={{ borderRadius: 999 }} color="error">Delayed</Tag>;
                  }
                },
          ]}
        />
      </div>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f4f6f9' }}>
      <Head title="Driver Management" />
      <Sidebar collapsible collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />
      <Layout>
        <Navbar collapsed={collapsed} setCollapsed={setCollapsed} auth={auth} />
          <Content style={{ margin: '24px', overflow: 'auto' }}>
          <Card title="Create New Driver" style={{ marginBottom: 24, borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', backgroundColor: '#fff' }} headStyle={{ fontWeight: 700, fontSize: '1.3rem', color: '#001529' }}>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>Add a new driver to your fleet. All fields are required.</Typography.Text>
            <Form layout="vertical" onFinish={handleFinish}>
              <Row gutter={24}>
                <Col xs={24} sm={8}>
                  <Form.Item label="Name" validateStatus={form.errors.name && 'error'} help={form.errors.name || 'Enter driver name'}>
                    <Input placeholder="Driver Name" value={form.data.name} onChange={e => form.setData('name', e.target.value)} size="large" style={{ borderRadius: 12, padding: '10px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', transition: 'all 0.2s' }} onFocus={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'} onBlur={(e) => e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="Email" validateStatus={form.errors.email && 'error'} help={form.errors.email || 'Email will be used for login'}>
                    <Input placeholder="jessther@gmail.com" value={form.data.email} onChange={e => form.setData('email', e.target.value)} size="large" style={{ borderRadius: 12, padding: '10px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', transition: 'all 0.2s' }} onFocus={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'} onBlur={(e) => e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="Password" validateStatus={form.errors.password && 'error'} help={form.errors.password || 'Set a secure password'}>
                    <Input.Password placeholder="••••••••" value={form.data.password} onChange={e => form.setData('password', e.target.value)} size="large" style={{ borderRadius: 12, padding: '10px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', transition: 'all 0.2s' }} onFocus={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'} onBlur={(e) => e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
                <Button type="primary" htmlType="submit" icon={<PlusCircleOutlined />} size="large">Create Driver</Button>
              </Form.Item>
            </Form>
          </Card>

          <Card title="Driver Management">
            <Table dataSource={drivers} columns={columns} rowKey="id" pagination={{ pageSize: 6 }} />
          </Card>

          <EditDriverModal visible={isEditModalVisible} onCancel={() => setIsEditModalVisible(false)} driver={selectedDriver} trucks={trucks} />

          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="small" style={{ backgroundColor: '#1890ff' }} icon={<BarChartOutlined />} />
                <div>
                  <div style={{ fontWeight: 700 }}>Driver Stats</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{selectedDriver?.name}</div>
                </div>
              </div>
            }
            open={isStatsModalVisible}
            onCancel={() => setIsStatsModalVisible(false)}
            footer={[
              <Button key="close" type="primary" onClick={() => setIsStatsModalVisible(false)}>
                Close
              </Button>,
            ]}
            width={980}
            bodyStyle={{
              padding: 24,
              background: '#fff',
              borderRadius: 12,
            }}
            destroyOnClose
          >
            <Row align="middle" gutter={16} style={{ marginBottom: 16 }}>
              <Col flex="auto">
                <Typography.Text strong type="secondary">
                  Filter by Date Range (optional)
                </Typography.Text>
              </Col>
              <Col>
                <RangePicker allowClear value={dateRange} onChange={handleDateRangeChange} />
              </Col>
            </Row>
            {renderStatsContent()}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
}
