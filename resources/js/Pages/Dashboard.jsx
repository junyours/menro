import { Head } from "@inertiajs/react";
import { useState, useMemo } from "react";
import {
  Layout,
  Typography,
  Row,
  Col,
  Card,
  Select,
  Table,
  Badge,
  Progress,
  Divider,
  Empty,
  DatePicker,
} from "antd";
import {
  UserOutlined,
  CarOutlined,
  HomeOutlined,
  CalendarOutlined,
  TrophyOutlined,
  BarChartOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { Line } from "@ant-design/charts";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";
import dayjs from "dayjs";
import { motion } from "framer-motion";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function Dashboard({
  auth,
  driverCount,
  truckCount,
  barangayCount,
  scheduleAnalytics,
  feedbackTrend,
  leaderboard,
  barangaySegregationAccuracy,
  overallSegregationAccuracy,
}) {
  const [collapsed, setCollapsed] = useState(true);

  // Existing filters
  const [trendYear, setTrendYear] = useState(dayjs().year());
  const [trendMonth, setTrendMonth] = useState(null);

  // NEW: Date Range Filters
  const [dateRange, setDateRange] = useState(null);
  const [useRangeFilter, setUseRangeFilter] = useState(false);

  const allYears = useMemo(() => {
    const currentYear = dayjs().year();

    if (feedbackTrend?.length) {
      const years = feedbackTrend
        .map((item) => dayjs(item.date).year())
        .filter((y) => !isNaN(y));

      const minYear = Math.min(...years, 2020);
      return Array.from(
        { length: currentYear - minYear + 1 },
        (_, i) => minYear + i
      );
    }

    return Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i);
  }, [feedbackTrend]);

  // NEW: advanced trend filter
  const filteredTrend = useMemo(() => {
    if (!feedbackTrend) return [];

    // When DateRange is enabled
    if (useRangeFilter && dateRange && dateRange.length === 2) {
      return feedbackTrend.filter((item) => {
        const d = dayjs(item.date);
        return (
          d.isAfter(dayjs(dateRange[0]).subtract(1, "day")) &&
          d.isBefore(dayjs(dateRange[1]).add(1, "day"))
        );
      });
    }

    // Default: Year + Month
    return feedbackTrend.filter((item) => {
      const d = dayjs(item.date);

      const matchYear = d.year() === trendYear;
      const matchMonth = trendMonth ? d.month() + 1 === trendMonth : true;

      return matchYear && matchMonth;
    });
  }, [feedbackTrend, trendYear, trendMonth, dateRange, useRangeFilter]);

  const analyticsData = [
    { label: "Drivers", value: driverCount, color: "#1677ff", border: "#003a8c", icon: <UserOutlined /> },
    { label: "Trucks", value: truckCount, color: "#52c41a", border: "#237804", icon: <CarOutlined /> },
    { label: "Barangays", value: barangayCount, color: "#eb2f96", border: "#9e1068", icon: <HomeOutlined /> },
    { label: "Schedules", value: scheduleAnalytics?.total ?? 0, color: "#fa8c16", border: "#ad4e00", icon: <CalendarOutlined /> },
  ];

  const feedbackTrendConfig = {
    data: filteredTrend,
    xField: "date",
    yField: "total",
    smooth: true,
    autoFit: true,
    height: 300,

    color: "#1677ff",
    lineStyle: { lineWidth: 2 },
    point: {
      size: 4,
      shape: "circle",
      style: { fill: "#1677ff", stroke: "#fff" },
    },
    area: {
      style: { fill: "l(270) 0:#1677ff33 1:#1677ff11" },
    },
  };

  const leaderboardColumns = [
    {
      title: "Rank",
      key: "rank",
      render: (_, __, index) => {
        const rank = index + 1;
        if (rank === 1) return <TrophyOutlined style={{ color: "#FFD700", fontSize: 18 }} />;
        if (rank === 2) return <TrophyOutlined style={{ color: "#C0C0C0", fontSize: 18 }} />;
        if (rank === 3) return <TrophyOutlined style={{ color: "#cd7f32", fontSize: 18 }} />;
        return <Text>{rank}</Text>;
      },
    },
    {
      title: "Driver Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong style={{ fontSize: 14 }}>{text}</Text>,
    },
    {
      title: "On-time Routes",
      dataIndex: "ontime_routes",
      key: "ontime_routes",
      render: (value) => <Badge count={value} style={{ backgroundColor: "#52c41a" }} />,
    },
    {
      title: "Delayed Routes",
      dataIndex: "delayed_routes",
      key: "delayed_routes",
      render: (value) => <Badge count={value} style={{ backgroundColor: "#ff4d4f" }} />,
    },
    {
      title: "On-time Accuracy",
      key: "accuracy",
      render: (_, record) => {
        const total = record.ontime_routes + record.delayed_routes;
        const accuracy = total > 0 ? Math.round((record.ontime_routes / total) * 100) : 0;
        return <Progress percent={accuracy} size="small" showInfo />;
      },
    },
  ];

  const segregationColumns = [
    {
      title: "Rank",
      key: "rank",
      render: (_, __, index) => {
        const rank = index + 1;
        if (rank === 1) return <CrownOutlined style={{ color: "#FFD700", fontSize: 20 }} />;
        if (rank === 2) return <CrownOutlined style={{ color: "#C0C0C0", fontSize: 20 }} />;
        if (rank === 3) return <CrownOutlined style={{ color: "#cd7f32", fontSize: 20 }} />;
        return <Text>{rank}</Text>;
      },
    },
    {
      title: "Barangay",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong style={{ fontSize: 14 }}>{text}</Text>,
    },
    {
      title: "Accuracy (%)",
      dataIndex: "accuracy_percentage",
      key: "accuracy_percentage",
      render: (value) => (
        <Progress
          percent={Number(value)}
          size="small"
          strokeColor={value >= 80 ? "#52c41a" : value >= 50 ? "#faad14" : "#ff4d4f"}
        />
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Head title="Dashboard" />
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <Layout style={{ background: "transparent" }}>
        <Navbar collapsed={collapsed} setCollapsed={setCollapsed} auth={auth} />
        <Content style={{ margin: "24px", padding: 0 }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Card
              style={{
                borderRadius: 16,
                marginBottom: 24,
                background: "linear-gradient(135deg, #001529, #003a8c)",
                color: "#fff",
                boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <Title level={3} style={{ color: "#fff", marginBottom: 2 }}>
                Welcome back, {auth.user.name} 👋
              </Title>
              <Text style={{ color: "#e0e7ff", fontSize: 15 }}>
                Here’s your analytics and performance summary.
              </Text>
            </Card>
          </motion.div>

          {/* Analytics Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {analyticsData.map((item, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 16,
                    background: "#fff",
                    padding: "16px 20px",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${item.color}, ${item.border})`,
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 24,
                      }}
                    >
                      {item.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <Title level={4} style={{ margin: 0, color: "#111827" }}>
                        {item.value}
                      </Title>
                      <Text style={{ color: "#6b7280", fontSize: 14 }}>{item.label}</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Barangay Accuracy */}
          <Divider orientation="left" style={{ fontWeight: 600, fontSize: 16 }}>
            Barangay Segregation Accuracy
          </Divider>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={16}>
              <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                {barangaySegregationAccuracy?.length ? (
                  <Table
                    dataSource={barangaySegregationAccuracy}
                    columns={segregationColumns}
                    pagination={false}
                    rowKey="id"
                    size="small"
                  />
                ) : (
                  <Empty description="No data available" />
                )}
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                style={{
                  borderRadius: 16,
                  textAlign: "center",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              >
                <BarChartOutlined style={{ fontSize: 32, color: "#1677ff", marginBottom: 8 }} />
                <Title level={5}>Overall Accuracy</Title>
                <Progress
                  type="circle"
                  percent={overallSegregationAccuracy ?? 0}
                  strokeColor={{ "0%": "#1677ff", "100%": "#52c41a" }}
                  width={120}
                />
                <Text type="secondary" style={{ marginTop: 6, fontSize: 13 }}>
                  Average barangay segregation accuracy
                </Text>
              </Card>
            </Col>
          </Row>

          {/* Driver Leaderboard */}
          <Divider orientation="left" style={{ fontWeight: 600, fontSize: 16 }}>
            Driver Leaderboard
          </Divider>

          <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", marginBottom: 24 }}>
            <Table
              dataSource={leaderboard}
              columns={leaderboardColumns}
              rowKey="driver_id"
              pagination={false}
              size="small"
            />
          </Card>

          {/* Feedback Trend with Date Range */}
          <Divider orientation="left" style={{ fontWeight: 600, fontSize: 16 }}>
            Feedback Trend
          </Divider>

          <Card
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              marginBottom: 24,
              padding: 16,
            }}
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              {/* Year Filter */}
              <Col xs={24} md={6}>
                <Select
                  style={{ width: "100%" }}
                  value={trendYear}
                  placeholder="Select Year"
                  disabled={useRangeFilter}
                  onChange={setTrendYear}
                >
                  {allYears.map((y) => (
                    <Option key={y} value={y}>
                      {y}
                    </Option>
                  ))}
                </Select>
              </Col>

              {/* Month Filter */}
              <Col xs={24} md={6}>
                <Select
                  style={{ width: "100%" }}
                  value={trendMonth}
                  placeholder="Select Month"
                  allowClear
                  disabled={useRangeFilter}
                  onChange={setTrendMonth}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <Option key={i + 1} value={i + 1}>
                      {dayjs().month(i).format("MMMM")}
                    </Option>
                  ))}
                </Select>
              </Col>

              {/* Filter Mode */}
              <Col xs={24} md={6}>
                <Select
                  style={{ width: "100%" }}
                  value={useRangeFilter ? "range" : "ym"}
                  onChange={(v) => {
                    setUseRangeFilter(v === "range");
                    if (v === "ym") setDateRange(null);
                  }}
                >
                  <Option value="ym">Filter by Year/Month</Option>
                  <Option value="range">Filter by Date Range</Option>
                </Select>
              </Col>

              {/* Date Range Picker */}
              <Col xs={24} md={6}>
                <RangePicker
                  style={{ width: "100%" }}
                  value={dateRange}
                  disabled={!useRangeFilter}
                  onChange={setDateRange}
                />
              </Col>
            </Row>

            {/* Trend Chart */}
            {filteredTrend.length ? (
              <div style={{ width: "100%", height: 320 }}>
                <Line
                  key={
                    useRangeFilter
                      ? `range-${dateRange?.[0]}-${dateRange?.[1]}`
                      : `${trendYear}-${trendMonth}`
                  }
                  {...feedbackTrendConfig}
                  height={300}
                  padding={[40, 40, 60, 60]}
                />
              </div>
            ) : (
              <Empty description="No feedback data found" />
            )}
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
