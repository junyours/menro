// resources/js/Pages/Reports/GarbageCollectionsReport.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import {
  Layout,
  Table,
  Card,
  Typography,
  Row,
  Col,
  Space,
  DatePicker,
  Tag,
  Button,
  Select,
  Tooltip,
} from "antd";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LabelList,
} from "recharts";
import {
  TruckOutlined,
  CalendarOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  FilterOutlined,
  LineChartOutlined,
  PrinterOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * GarbageCollectionsReport
 */
const GarbageCollectionsReport = ({ collections = [], analytics = {} }) => {
  const [collapsed, setCollapsed] = useState(true);
  const { auth } = usePage().props;

  const [filtersCollapsed, setFiltersCollapsed] = useState(true);

  const [dateRange, setDateRange] = useState([]);
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [selectedZone, setSelectedZone] = useState("");

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const chartsRef = useRef(null);

  const barangays = useMemo(
    () =>
      [...new Set(collections.map((c) => c.barangay_name).filter(Boolean))],
    [collections]
  );
  const zones = useMemo(
    () => [...new Set(collections.map((c) => c.to_zone_name).filter(Boolean))],
    [collections]
  );

  const years = useMemo(() => {
    const ys = collections
      .map((c) => {
        try {
          return dayjs(c.pickup_datetime).year();
        } catch {
          return null;
        }
      })
      .filter((y) => y != null);
    return [...new Set(ys)].sort((a, b) => b - a);
  }, [collections]);

  const resetFilters = () => {
    setDateRange([]);
    setSelectedBarangay("");
    setSelectedZone("");
    setSelectedYear(null);
    setSelectedMonth(null);
  };

  const handleRangeChange = (dates) => {
    setDateRange(dates || []);
    if (dates && dates.length === 2) {
      setSelectedYear(null);
      setSelectedMonth(null);
    }
  };

  const handleYearChange = (y) => {
    setSelectedYear(y);
    setDateRange([]);
    if (!y) {
      setSelectedMonth(null);
    }
  };

  const handleMonthChange = (m) => {
    setSelectedMonth(m);
    setDateRange([]);
  };

  const filteredCollections = useMemo(() => {
    return collections.filter((item) => {
      let match = true;
      const raw = item.pickup_datetime;
      const dateObj = dayjs(raw);
      const time = dateObj.valueOf();

      if (dateRange && dateRange.length === 2) {
        const start = dayjs(dateRange[0]).startOf("day").valueOf();
        const end = dayjs(dateRange[1]).endOf("day").valueOf();
        match = match && time >= start && time <= end;
      } else {
        if (selectedYear) {
          match = match && dateObj.year() === selectedYear;
        }
        if (selectedMonth) {
          match = match && dateObj.month() + 1 === selectedMonth;
        }
      }

      if (selectedBarangay) {
        match = match && item.barangay_name === selectedBarangay;
      }

      if (selectedZone) {
        match = match && item.to_zone_name === selectedZone;
      }

      return match;
    });
  }, [
    collections,
    dateRange,
    selectedYear,
    selectedMonth,
    selectedBarangay,
    selectedZone,
  ]);

  const routeTotalSacks = filteredCollections
    .filter((c) => c.route_detail_id)
    .reduce(
      (sum, c) =>
        sum +
        (c.biodegradable_sacks || 0) +
        (c.non_biodegradable_sacks || 0) +
        (c.recyclable_sacks || 0),
      0
    );

  const rescheduledTotalSacks = filteredCollections
    .filter((c) => c.reschedule_detail_id)
    .reduce(
      (sum, c) =>
        sum +
        (c.biodegradable_sacks || 0) +
        (c.non_biodegradable_sacks || 0) +
        (c.recyclable_sacks || 0),
      0
    );

  const wasteData = [
    {
      name: "Biodegradable",
      value: filteredCollections.reduce(
        (s, c) => s + (c.biodegradable_sacks || 0),
        0
      ),
    },
    {
      name: "Non-Biodegradable",
      value: filteredCollections.reduce(
        (s, c) => s + (c.non_biodegradable_sacks || 0),
        0
      ),
    },
    {
      name: "Recyclable",
      value: filteredCollections.reduce(
        (s, c) => s + (c.recyclable_sacks || 0),
        0
      ),
    },
  ];

  const typeData = [
    { name: "Route Collections", value: routeTotalSacks },
    { name: "Rescheduled", value: rescheduledTotalSacks },
  ];

  const lineData = useMemo(() => {
    const grouped = {};
    filteredCollections.forEach((c) => {
      const date = dayjs(c.pickup_datetime).format("YYYY-MM-DD");
      const total =
        (c.biodegradable_sacks || 0) +
        (c.non_biodegradable_sacks || 0) +
        (c.recyclable_sacks || 0);
      grouped[date] = (grouped[date] || 0) + total;
    });
    return Object.keys(grouped)
      .sort()
      .map((date) => ({ date, totalSacks: grouped[date] }));
  }, [filteredCollections]);

  const COLORS = ["#6A9CFD", "#F9B940", "#9BD46A", "#E57373"];

  const columns = [
    {
      title: "Pickup Date",
      dataIndex: "pickup_datetime",
      key: "pickup_datetime",
      sorter: (a, b) =>
        new Date(a.pickup_datetime) - new Date(b.pickup_datetime),
      render: (date) =>
        new Date(date).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    { title: "Barangay", dataIndex: "barangay_name", key: "barangay_name" },
    { title: "Zone", dataIndex: "to_zone_name", key: "to_zone_name" },
    { title: "Terminal", dataIndex: "to_terminal_name", key: "to_terminal_name" },
    { title: "Truck", dataIndex: "truck_name", key: "truck_name" },

    // NEW: Driver column
    {
      title: "Driver",
      dataIndex: "driver_name",
      key: "driver_name",
      render: (val) => val || "N/A",
    },

    {
      title: "Biodegradable (sacks)",
      dataIndex: "biodegradable_sacks",
      key: "biodegradable_sacks",
      render: (val) => val ?? 0,
    },
    {
      title: "Non-Biodegradable (sacks)",
      dataIndex: "non_biodegradable_sacks",
      key: "non_biodegradable_sacks",
      render: (val) => val ?? 0,
    },
    {
      title: "Recyclable (sacks)",
      dataIndex: "recyclable_sacks",
      key: "recyclable_sacks",
      render: (val) => val ?? 0,
    },
    {
      title: "Type",
      key: "type",
      render: (record) =>
        record.reschedule_detail_id ? (
          <Tag color="gold">Rescheduled</Tag>
        ) : (
          <Tag color="blue">Route</Tag>
        ),
    },
  ];

  const handlePrintPDF = async () => {
    const doc = new jsPDF("p", "pt", "a4");
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Garbage Collections Report", 40, 50);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    let filterSummary = "Filters: ";
    const parts = [];
    if (dateRange && dateRange.length === 2) {
      parts.push(
        `Date Range: ${dayjs(dateRange[0]).format("MMM D, YYYY")} - ${dayjs(
          dateRange[1]
        ).format("MMM D, YYYY")}`
      );
    } else {
      if (selectedYear) {
        parts.push(`Year: ${selectedYear}`);
      }
      if (selectedMonth) {
        parts.push(`Month: ${dayjs().month(selectedMonth - 1).format("MMMM")}`);
      }
    }
    if (selectedBarangay) parts.push(`Barangay: ${selectedBarangay}`);
    if (selectedZone) parts.push(`Zone: ${selectedZone}`);

    if (parts.length === 0) {
      filterSummary += "None (All records)";
    } else {
      filterSummary += parts.join(" | ");
    }

    doc.text(`Generated on: ${dayjs().format("MMMM D, YYYY h:mm A")}`, 40, 70);
    doc.text(`Filtered Records: ${filteredCollections.length}`, 40, 85);
    doc.text(filterSummary, 40, 100);

    const summary = [
      { label: "Route Collections", value: routeTotalSacks },
      { label: "Rescheduled Collections", value: rescheduledTotalSacks },
      {
        label: "Total Sacks Collected",
        value: routeTotalSacks + rescheduledTotalSacks,
      },
    ];

    let y = 120;
    doc.text("Summary", 40, y);
    y += 15;
    summary.forEach((s) => {
      doc.text(`${s.label}: ${s.value}`, 50, y);
      y += 15;
    });

    if (chartsRef.current) {
      try {
        const canvas = await html2canvas(chartsRef.current, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        doc.addImage(imgData, "PNG", 40, y, 515, 250);
        y += 270;
      } catch (err) {
        console.warn("html2canvas failed:", err);
      }
    }

    const tableData = filteredCollections.map((c) => [
      new Date(c.pickup_datetime).toLocaleString(),
      c.barangay_name || "N/A",
      c.to_terminal_name || "N/A",
      c.to_zone_name || "N/A",
      c.truck_name || "N/A",
      c.driver_name || "N/A", // NEW
      c.biodegradable_sacks || 0,
      c.non_biodegradable_sacks || 0,
      c.recyclable_sacks || 0,
      c.reschedule_detail_id ? "Rescheduled" : "Route",
    ]);

    autoTable(doc, {
      startY: y + 10,
      head: [
        [
          "Pickup Date",
          "Barangay",
          "Terminal",
          "Zone",
          "Truck",
          "Driver", // NEW
          "Biodegradable",
          "Non-Biodegradable",
          "Recyclable",
          "Type",
        ],
      ],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [26, 115, 232], textColor: 255 },
      margin: { top: 20, bottom: 30 },
    });

    doc.save(`garbage-collections-report-${dayjs().format("YYYYMMDD_HHmm")}.pdf`);
  };

  useEffect(() => {}, [
    dateRange,
    selectedYear,
    selectedMonth,
    selectedBarangay,
    selectedZone,
  ]);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Head title="Garbage Collections Report" />
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout style={{ background: "transparent" }}>
        <Navbar collapsed={collapsed} setCollapsed={setCollapsed} auth={auth} />
        <Content style={{ margin: "24px 16px" }}>
          {/* Header & toggle */}
          <Card
            style={{
              borderRadius: 12,
              marginBottom: 16,
              padding: "12px 16px",
              background: "#eef2ff",
              border: "1px solid #c7d2fe",
            }}
            bodyStyle={{ padding: 0 }}
          >
            <Space
              style={{
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
              }}
            >
              <Title level={4} style={{ margin: 0, color: "#1e3a8a" }}>
                <FilterOutlined style={{ marginRight: 8, color: "#4f46e5" }} />
                Filter Garbage Collections
              </Title>
              <Button
                size="small"
                type="default"
                icon={<FilterOutlined />}
                onClick={() => setFiltersCollapsed((v) => !v)}
              >
                {filtersCollapsed ? "Show Filters" : "Hide Filters"}
              </Button>
            </Space>
          </Card>

          {/* Filters Section */}
          {!filtersCollapsed && (
            <Card style={{ borderRadius: 12, marginBottom: 24, padding: 20 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={6}>
                  <Text strong>Year:</Text>
                  <Select
                    allowClear
                    placeholder="Select Year"
                    value={selectedYear}
                    onChange={handleYearChange}
                    style={{ width: "100%" }}
                  >
                    {years.map((y) => (
                      <Option key={y} value={y}>
                        {y}
                      </Option>
                    ))}
                  </Select>
                </Col>

                <Col xs={24} sm={6}>
                  <Text strong>Month:</Text>
                  <Select
                    allowClear
                    placeholder="Select Month"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    style={{ width: "100%" }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <Option key={i + 1} value={i + 1}>
                        {dayjs().month(i).format("MMMM")}
                      </Option>
                    ))}
                  </Select>
                </Col>

                <Col xs={24} sm={6}>
                  <Text strong>Barangay:</Text>
                  <Select
                    allowClear
                    placeholder="Select Barangay"
                    value={selectedBarangay}
                    onChange={setSelectedBarangay}
                    style={{ width: "100%" }}
                  >
                    {barangays.map((b) => (
                      <Option key={b} value={b}>
                        {b}
                      </Option>
                    ))}
                  </Select>
                </Col>

                <Col xs={24} sm={6}>
                  <Text strong>Pickup Date (Range):</Text>
                  <RangePicker
                    onChange={handleRangeChange}
                    value={dateRange && dateRange.length === 2 ? dateRange : []}
                    style={{ width: "100%" }}
                  />
                  <Text
                    type="secondary"
                    style={{ display: "block", marginTop: 6 }}
                  >
                    Selecting a date range will clear Year/Month filters.
                  </Text>
                </Col>

                <Col xs={24} sm={6}>
                  <Text strong>Zone:</Text>
                  <Select
                    allowClear
                    placeholder="Select Zone"
                    value={selectedZone}
                    onChange={setSelectedZone}
                    style={{ width: "100%" }}
                  >
                    {zones.map((z) => (
                      <Option key={z} value={z}>
                        {z}
                      </Option>
                    ))}
                  </Select>
                </Col>

                <Col xs={24} style={{ textAlign: "right", marginTop: 8 }}>
                  <Space>
                    <Tooltip title="Reset all filters">
                      <Button icon={<UndoOutlined />} onClick={resetFilters}>
                        Reset Filters
                      </Button>
                    </Tooltip>
                    <Button
                      type="primary"
                      icon={<PrinterOutlined />}
                      onClick={handlePrintPDF}
                    >
                      Print / Save PDF
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          )}

          <hr style={{ border: "1px solid #e0e0e0", margin: "32px 0" }} />

          <Space
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Title level={3} style={{ fontWeight: 700, color: "#1a237e" }}>
              <BarChartOutlined style={{ marginRight: 10, color: "#1a73e8" }} />
              Garbage Collections Reports
            </Title>
            <div>
              <Button
                style={{ marginRight: 8 }}
                onClick={() => {
                  setDateRange([]);
                }}
              >
                Clear Range
              </Button>
              <Button
                onClick={() => {
                  setSelectedYear(null);
                  setSelectedMonth(null);
                }}
              >
                Clear Year/Month
              </Button>
            </div>
          </Space>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {[
              {
                icon: <TruckOutlined style={{ fontSize: 28, color: "#1a73e8" }} />,
                label: "Total Collections",
                value: filteredCollections.length,
              },
              {
                icon: <CalendarOutlined style={{ fontSize: 28, color: "#009688" }} />,
                label: "Route Collections",
                value: routeTotalSacks,
              },
              {
                icon: <ReloadOutlined style={{ fontSize: 28, color: "#f9b940" }} />,
                label: "Rescheduled",
                value: rescheduledTotalSacks,
              },
              {
                icon: <ShoppingOutlined style={{ fontSize: 28, color: "#673ab7" }} />,
                label: "Total Sacks",
                value: routeTotalSacks + rescheduledTotalSacks,
              },
            ].map((card, i) => (
              <Col xs={24} sm={12} md={6} key={i}>
                <Card
                  style={{
                    borderRadius: 12,
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                  }}
                >
                  <Space direction="vertical" align="center">
                    {card.icon}
                    <Text strong>{card.label}</Text>
                    <Title level={3} style={{ margin: 0, color: "#1a73e8" }}>
                      {card.value}
                    </Title>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <hr style={{ border: "1px solid #e0e0e0", margin: "32px 0" }} />

          <div ref={chartsRef}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card
                  style={{
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                  }}
                >
                  <Title level={4}>Waste Type Breakdown</Title>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={wasteData}
                      margin={{ top: 24, right: 16, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <ReTooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        <LabelList
                          dataKey="value"
                          position="top"
                          offset={6}
                          style={{
                            fontSize: 12,
                            fill: "#111827",
                            fontWeight: 600,
                          }}
                          formatter={(v) => (v && v > 0 ? v : "")}
                        />
                        {wasteData.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={COLORS[idx % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card
                  style={{
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                  }}
                >
                  <Title level={4}>Route vs Rescheduled (Sacks)</Title>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={typeData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        label
                      >
                        {typeData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ReTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              <Col xs={24}>
                <Card
                  style={{
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                  }}
                >
                  <Title level={4}>
                    <LineChartOutlined style={{ marginRight: 6 }} />
                    Collection Trend (Total Sacks)
                  </Title>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ReTooltip />
                      <Area
                        type="monotone"
                        dataKey="totalSacks"
                        stroke="#1a73e8"
                        fill="#1a73e8"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </div>

          <hr style={{ border: "1px solid #e0e0e0", margin: "32px 0" }} />

          <Card style={{ borderRadius: 12, marginTop: 32 }}>
            <Title level={4}>Detailed Waste Collection Records</Title>
            <Table
              columns={columns}
              dataSource={filteredCollections}
              pagination={{ pageSize: 10 }}
              rowKey="id"
              bordered
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default GarbageCollectionsReport;