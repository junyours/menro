import React, { useState, useMemo, useRef } from "react";
import { Head } from "@inertiajs/react";
import {
  Layout,
  Table,
  Card,
  Typography,
  Row,
  Col,
  DatePicker,
  Space,
  Divider,
  Tag,
  Button,
  Select,
} from "antd";
import {
  BarChartOutlined,
  PieChartOutlined,
  CalendarOutlined,
  LineChartOutlined,
  EnvironmentOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
} from "recharts";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const RoutesReport = ({ auth, routes, analytics }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [dateRange, setDateRange] = useState([]);
  const [filterYear, setFilterYear] = useState(null);
  const [filterMonth, setFilterMonth] = useState(null);
  const chartsRef = useRef(null);

  // Available years and months for filtering
  const years = useMemo(() => {
    const allYears = routes.map((r) => dayjs(r.created_at).year());
    return [...new Set(allYears)].sort((a, b) => b - a);
  }, [routes]);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Filter routes based on year/month and/or date range
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      const routeDate = dayjs(r.created_at);

      let matchesDateRange = true;
      if (dateRange && dateRange.length === 2) {
        const [start, end] = dateRange;
        matchesDateRange =
          routeDate.isAfter(start.startOf("day")) &&
          routeDate.isBefore(end.endOf("day"));
      }

      let matchesYear = true;
      if (filterYear) {
        matchesYear = routeDate.year() === filterYear;
      }

      let matchesMonth = true;
      if (filterMonth) {
        matchesMonth = routeDate.month() + 1 === filterMonth;
      }

      return matchesDateRange && matchesYear && matchesMonth;
    });
  }, [routes, dateRange, filterYear, filterMonth]);

  // Chart data based on filtered routes
  const statusData = useMemo(() => {
    const counts = { completed: 0, rescheduled: 0, missed: 0 };
    filteredRoutes.forEach((r) => {
      if (r.status === "completed") counts.completed += 1;
      else if (r.status === "rescheduled") counts.rescheduled += 1;
      else if (r.status === "missed") counts.missed += 1;
    });
    return [
      { name: "Completed", value: counts.completed },
      { name: "Rescheduled", value: counts.rescheduled },
      { name: "Missed", value: counts.missed },
    ];
  }, [filteredRoutes]);

  const onTimeDelayedData = useMemo(() => {
    let onTime = 0;
    let delayed = 0;
    filteredRoutes.forEach((r) => {
      if (!r.start_time || !r.completed_at) return;
      const expected = parseFloat(r.duration_min);
      const start = dayjs(r.start_time);
      const end = dayjs(r.completed_at);
      const actualMinutes = end.diff(start, "second") / 60;
      if (actualMinutes <= expected) onTime += 1;
      else delayed += 1;
    });
    return [
      { name: "On Time", value: onTime },
      { name: "Delayed", value: delayed },
    ];
  }, [filteredRoutes]);

  const COLORS = ["#4CAF50", "#FFC107", "#F44336"];

  const lineChartData = useMemo(() => {
    const grouped = {};
    filteredRoutes.forEach((r) => {
      const pickup = r.schedule?.pickup_datetime;
      if (!pickup) return;
      if (!grouped[pickup]) {
        grouped[pickup] = {
          pickup_datetime: pickup,
          completed: 0,
          missed: 0,
          rescheduled: 0,
          total_segments: 0,
        };
      }
      if (r.status === "completed") grouped[pickup].completed += 1;
      else if (r.status === "missed") grouped[pickup].missed += 1;
      else if (r.status === "rescheduled") grouped[pickup].rescheduled += 1;
      grouped[pickup].total_segments += 1;
    });
    return Object.values(grouped).sort(
      (a, b) => new Date(a.pickup_datetime) - new Date(b.pickup_datetime)
    );
  }, [filteredRoutes]);

  const renderNA = (text) => (
    <Text style={{ color: "#999", fontStyle: "italic" }}>{text || "N/A"}</Text>
  );

  const columns = [
    {
      title: "Barangay",
      dataIndex: ["schedule", "barangay", "name"],
      key: "barangay",
      render: (val, record) => {
        if (!record.schedule) return renderNA();
        return record.schedule.barangay?.name || record.schedule.barangay_id || "N/A";
      },
    },
    {
      title: "From Zone",
      dataIndex: ["from_zone", "name"],
      key: "from_zone",
      render: renderNA,
    },
    {
      title: "From Terminal",
      dataIndex: ["from_terminal", "name"],
      key: "from_terminal",
      render: renderNA,
    },
    {
      title: "To Zone",
      dataIndex: ["to_zone", "name"],
      key: "to_zone",
      render: renderNA,
    },
    {
      title: "To Terminal",
      dataIndex: ["to_terminal", "name"],
      key: "to_terminal",
      render: renderNA,
    },
    {
      title: "Distance (km)",
      dataIndex: "distance_km",
      key: "distance_km",
      sorter: (a, b) => a.distance_km - b.distance_km,
      render: (val) => (val !== null ? `${val} km` : renderNA()),
    },
    {
      title: "Duration",
      dataIndex: "duration_min",
      key: "duration_min",
      sorter: (a, b) => a.duration_min - b.duration_min,
      render: (val) => {
        if (val === null) return renderNA();
        if (val < 1) return `${Math.round(val * 60)} sec`;
        if (val < 60) return `${val} min`;
        const hours = Math.floor(val / 60);
        const minutes = Math.round(val % 60);
        return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
      },
    },
    {
      title: "Speed (km/h)",
      dataIndex: "speed_kmh",
      key: "speed_kmh",
      render: (val) => (val !== null ? `${val} km/h` : renderNA()),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color =
          status === "completed"
            ? "green"
            : status === "missed"
            ? "red"
            : status === "rescheduled"
            ? "gold"
            : "gray";
        return (
          <Tag
            color={color}
            style={{ textTransform: "capitalize", fontWeight: 600 }}
          >
            {status || "N/A"}
          </Tag>
        );
      },
    },
    {
      title: "On Time",
      key: "on_time",
      render: (record) => {
        if (!record.start_time || !record.completed_at) return renderNA();
        const expected = parseFloat(record.duration_min);
        const start = dayjs(record.start_time);
        const end = dayjs(record.completed_at);
        const actualMinutes = end.diff(start, "second") / 60;
        const isOnTime = actualMinutes <= expected;
        return (
          <Tag
            color={isOnTime ? "#388E3C" : "#E0E0E0"}
            style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
          >
            {isOnTime ? <FaCheck /> : <FaExclamationTriangle />}
          </Tag>
        );
      },
    },
    {
      title: "Delayed",
      key: "delayed",
      render: (record) => {
        if (!record.start_time || !record.completed_at) return renderNA();
        const expected = parseFloat(record.duration_min);
        const start = dayjs(record.start_time);
        const end = dayjs(record.completed_at);
        const actualMinutes = end.diff(start, "second") / 60;
        const isDelayed = actualMinutes > expected;
        return (
          <Tag
            color={isDelayed ? "#D32F2F" : "#E0E0E0"}
            style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
          >
            {isDelayed ? <FaExclamationTriangle /> : <FaCheck />}
          </Tag>
        );
      },
    },
    {
      title: "Pickup Datetime",
      dataIndex: ["schedule", "pickup_datetime"],
      key: "pickup_datetime",
      render: (date) =>
        date ? dayjs(date).format("YYYY-MM-DD HH:mm") : renderNA(),
    },
    {
      title: "Date Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
  ];

  const handlePrintPDF = async () => {
    const doc = new jsPDF("p", "pt", "a4");
    doc.setFontSize(18);
    doc.text("Routes Analytics Report", 40, 40);
    doc.setFontSize(12);
    doc.text(`Total Schedules: ${analytics.total_schedules}`, 40, 60);
    doc.text(`Total Segments: ${analytics.total_segments}`, 40, 75);
    doc.text(`Completed: ${analytics.completed}`, 40, 90);
    doc.text(`Missed: ${analytics.missed}`, 40, 105);
    doc.text(`Rescheduled: ${analytics.rescheduled}`, 40, 120);
    doc.text(`On Time: ${analytics.on_time}`, 40, 135);
    doc.text(`Delayed: ${analytics.delayed}`, 40, 150);

    let currentY = 170;

    if (chartsRef.current) {
      const canvas = await html2canvas(chartsRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", 40, currentY, 515, 250);
      currentY += 270;
    }

    const tableData = filteredRoutes.map((r) => [
      r.schedule?.barangay?.name || r.schedule?.barangay_id || "N/A",
      r.from_zone?.name || "N/A",
      r.from_terminal?.name || "N/A",
      r.to_zone?.name || "N/A",
      r.to_terminal?.name || "N/A",
      r.distance_km || "N/A",
      r.duration_min || "N/A",
      r.speed_kmh || "N/A",
      r.status || "N/A",
      r.schedule?.pickup_datetime
        ? dayjs(r.schedule.pickup_datetime).format("YYYY-MM-DD HH:mm")
        : "N/A",
      dayjs(r.created_at).format("YYYY-MM-DD HH:mm"),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          "Barangay",
          "From Zone",
          "From Terminal",
          "To Zone",
          "To Terminal",
          "Distance",
          "Duration",
          "Speed",
          "Status",
          "Pickup",
          "Created At",
        ],
      ],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8 },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(`Page ${pageCount}`, data.settings.margin.left, 820);
      },
      margin: { top: 20, bottom: 30 },
    });

    doc.save(`routes-report-${dayjs().format("YYYYMMDD_HHmm")}.pdf`);
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <Head title="Routes Report" />
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout>
        <Navbar collapsed={collapsed} setCollapsed={setCollapsed} auth={auth} />

        <Content style={{ margin: "24px 16px" }}>
          <Space
            align="center"
            style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}
          >
            <Title
              level={3}
              style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: 0 }}
            >
              <BarChartOutlined style={{ color: "#1890ff", marginRight: 10 }} />
              Route Details Report
            </Title>

            <Space wrap>
              <RangePicker
                onChange={(dates) => setDateRange(dates)}
                format="YYYY-MM-DD"
                style={{ borderRadius: 8 }}
                suffixIcon={<CalendarOutlined />}
              />

              <Select
                placeholder="Select Year"
                allowClear
                style={{ width: 120 }}
                value={filterYear}
                onChange={(val) => setFilterYear(val)}
              >
                {years.map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Select Month"
                allowClear
                style={{ width: 140 }}
                value={filterMonth}
                onChange={(val) => setFilterMonth(val)}
              >
                {months.map((m) => (
                  <Option key={m.value} value={m.value}>
                    {m.label}
                  </Option>
                ))}
              </Select>
            </Space>
          </Space>

          <Divider />

          <Row style={{ marginBottom: 16 }}>
            <Col>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handlePrintPDF}
              >
                Save PDF
              </Button>
            </Col>
          </Row>

          {/* Charts Section */}
          <div ref={chartsRef}>
            <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
              <Col xs={24} md={12}>
                <Card style={chartCardStyle}>
                  <Title level={4} style={chartTitleStyle}>
                    <PieChartOutlined style={{ color: "#ff9800", marginRight: 8 }} />
                    Route Status Breakdown
                  </Title>
                  <Text type="secondary" style={descriptionStyle}>
                    Displays the proportion of routes by their status.
                  </Text>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card style={chartCardStyle}>
                  <Title level={4} style={chartTitleStyle}>
                    <LineChartOutlined style={{ color: "#1890ff", marginRight: 8 }} />
                    On-Time & Delayed Overview
                  </Title>
                  <Text type="secondary" style={descriptionStyle}>
                    Compares the total number of on-time and delayed routes.
                  </Text>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={onTimeDelayedData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#555" }} axisLine={{ stroke: "#ccc" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#555" }} axisLine={{ stroke: "#ccc" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          borderRadius: 8,
                          border: "1px solid #ccc",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />

                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {onTimeDelayedData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.name === "On Time" ? "#388E3C" : "#D32F2F"}
                            fillOpacity={0.7}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>

            <Row style={{ marginTop: 32 }}>
              <Col xs={24}>
                <Card style={chartCardStyle}>
                  <Title level={4} style={chartTitleStyle}>
                    <LineChartOutlined style={{ color: "#4caf50", marginRight: 8 }} />
                    Segments per Pickup Datetime
                  </Title>
                  <Text type="secondary" style={descriptionStyle}>
                    Shows segments per pickup datetime with status breakdown.
                  </Text>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={lineChartData}>
                      <defs>
                        <linearGradient id="colorSegments" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4caf50" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="pickup_datetime" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div
                              style={{
                                background: "white",
                                border: "1px solid #ccc",
                                padding: "10px",
                                borderRadius: 8,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              }}
                            >
                              <strong>{dayjs(label).format("YYYY-MM-DD HH:mm")}</strong>
                              <br />
                              <span style={{ color: "#4caf50" }}>
                                ● Completed: {data.completed}
                              </span>
                              <br />
                              <span style={{ color: "#f44336" }}>
                                ● Missed: {data.missed}
                              </span>
                              <br />
                              <span style={{ color: "#ffc107" }}>
                                ● Rescheduled: {data.rescheduled}
                              </span>
                              <br />
                              <strong>Total Segments: {data.total_segments}</strong>
                            </div>
                          );
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total_segments"
                        stroke="#4caf50"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        fillOpacity={1}
                        fill="url(#colorSegments)"
                      />
                      <Area
                        type="monotone"
                        dataKey="total_segments"
                        stroke="none"
                        fill="url(#colorSegments)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Table Section */}
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
              padding: 16,
              marginTop: 32,
              background: "#fff",
            }}
          >
            <Title level={4} style={chartTitleStyle}>
              <EnvironmentOutlined style={{ color: "#673ab7", marginRight: 8 }} />
              Route Details
            </Title>
            <Table
              columns={columns}
              dataSource={filteredRoutes}
              pagination={{ pageSize: 10 }}
              rowKey="id"
              bordered={false}
              size="middle"
              style={{ marginTop: 12 }}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

const chartCardStyle = {
  borderRadius: 12,
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  padding: 20,
  background: "#fff",
};

const chartTitleStyle = {
  marginBottom: 8,
  fontWeight: 600,
  color: "#3f51b5",
};

const descriptionStyle = {
  fontSize: 13,
  color: "#777",
  display: "block",
  marginBottom: 16,
};

export default RoutesReport;
