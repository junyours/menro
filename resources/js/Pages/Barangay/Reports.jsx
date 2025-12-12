import React, { useState, useMemo } from "react";
import { Head } from "@inertiajs/react";
import {
  Layout,
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Tabs,
  DatePicker,
  Row,
  Col,
} from "antd";
import Sidebar from "@/Components/BarSide";
import Navbar from "@/Components/BarNav";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function Reports({ auth, weeklyReports }) {
  const [collapsed, setCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [complyDate, setComplyDate] = useState(null);

  const filteredReports = useMemo(() => {
    return weeklyReports.filter((report) => {
      if (report.status === "pending") return false;
      if (activeTab !== "all" && report.status !== activeTab) return false;
      if (complyDate && report.comply_on) {
        const reportDate = dayjs(report.comply_on).startOf("day");
        const selectedDate = dayjs(complyDate).startOf("day");
        if (!reportDate.isSame(selectedDate)) return false;
      }
      return true;
    });
  }, [weeklyReports, activeTab, complyDate]);

  const tagStyle = (color) => ({
    background: `${color}33`,
    color: color,
    fontWeight: 600,
    borderRadius: 8,
    padding: "0 12px",
    height: 28,
    display: "flex",
    alignItems: "center",
    boxShadow: `0 2px 8px ${color}22`,
  });

  const statusTag = (status) => {
    switch (status) {
      case "approved":
        return (
          <Tag style={tagStyle("green")} icon={<CheckCircleOutlined />}>
            Approved
          </Tag>
        );
      case "rejected":
        return (
          <Tag style={tagStyle("red")} icon={<CloseCircleOutlined />}>
            Rejected
          </Tag>
        );
      case "scheduled":
      case "schedule":
        return (
          <Tag style={tagStyle("#1890ff")} icon={<CalendarOutlined />}>
            Scheduled
          </Tag>
        );
      default:
        return null;
    }
  };

  const columns = [
    {
      title: "Comply Date",
      dataIndex: "comply_on",
      key: "comply_on",
      render: (date) =>
        date ? dayjs(date).format("MMMM D, YYYY h:mm A") : "—",
    },
    {
      title: "Submitted At",
      dataIndex: "submitted_at",
      key: "submitted_at",
      render: (submitted_at) =>
        submitted_at
          ? dayjs(submitted_at, "YYYY-MM-DD HH:mm:ss").format(
              "MMMM D, YYYY h:mm A"
            )
          : "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: statusTag,
    },
  ];

  const expandedRowRender = (record) => (
    <div style={{ padding: 12 }}>
      <Title level={5} style={{ marginBottom: 16, color: "#1f1f1f", fontWeight: 700 }}>
        Zones & Segregation
      </Title>
      <Row gutter={[16, 16]}>
        {record.zone_reports.map((zr) => (
          <Col xs={24} sm={12} md={8} lg={6} key={zr.id}>
            <Card
              size="small"
              hoverable
              style={{
                borderRadius: 12,
                padding: 16,
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                transition: "transform 0.3s, box-shadow 0.3s",
                background: "#fff",
              }}
              bodyStyle={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
              }}
            >
              <Text strong style={{ fontWeight: 600, fontSize: 14 }}>
                {zr.zone.name}
              </Text>
              <Tag
                style={{
                  background: zr.is_segregated
                    ? "linear-gradient(135deg,#73d13d,#95de64)"
                    : "linear-gradient(135deg,#ff4d4f,#ff7875)",
                  color: "#fff",
                  fontWeight: 600,
                  borderRadius: 12,
                  padding: "0 12px",
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                {zr.is_segregated ? "Segregated" : "Not Segregated"}
              </Tag>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Head title="Weekly Reports" />
      <Sidebar collapsed={collapsed} toggleCollapsed={() => setCollapsed(!collapsed)} />
      <Layout>
        <Navbar
          collapsed={collapsed}
          toggleCollapsed={() => setCollapsed(!collapsed)}
          user={auth?.user ?? { name: "Barangay User" }}
        />
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: "calc(100vh - 64px)",
          }}
        >
          {/* Header Card */}
          <Card
            bordered={false}
            style={{
              borderRadius: 20,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              marginBottom: 24,
              background: "#fff",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg,#1f1f1f,#3f3f3f)",
                borderRadius: 16,
                padding: "20px 24px",
                marginTop: "-40px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
            >
              <Title
                level={3}
                style={{
                  marginBottom: 8,
                  color: "#fff",
                  fontWeight: 800,
                  textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
                }}
              >
                <CalendarOutlined style={{ marginRight: 8, color: "#fff" }} />
                Weekly Reports
              </Title>
              <Text style={{ color: "#e6f7ff", fontWeight: 500 }}>
                Filter and explore weekly reports. Click a report to see zones.
              </Text>
            </div>
          </Card>

          {/* Filters */}
          <Card
            bordered={false}
            style={{
              borderRadius: 20,
              boxShadow: "0 6px 24px rgba(0,0,0,0.05)",
              marginBottom: 16,
              background: "#fff",
              padding: 24,
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                placeholder="Search by Comply Date"
                onChange={(date) => setComplyDate(date)}
                format="MMMM D, YYYY"
              />
              <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key)}
                type="card"
                size="large"
                style={{ marginTop: 16 }}
              >
                <TabPane tab="All" key="all" />
                <TabPane tab="Scheduled" key="scheduled" />
                <TabPane tab="Approved" key="approved" />
                <TabPane tab="Rejected" key="rejected" />
              </Tabs>
            </Space>
          </Card>

          {/* Table */}
          <Card
            bordered={false}
            style={{
              borderRadius: 20,
              boxShadow: "0 6px 24px rgba(0,0,0,0.05)",
              background: "#fff",
              padding: 24,
            }}
          >
            <Table
              dataSource={filteredReports}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 5, showSizeChanger: false }}
              expandable={{
                expandedRowRender,
                expandRowByClick: true,
              }}
              rowClassName={() => "modern-hover-row"}
              bordered={false}
              style={{ marginTop: 12 }}
            />
          </Card>

          <style>{`
            .modern-hover-row:hover {
              background: #f5f7fa !important;
              cursor: pointer;
              transform: translateY(-1px);
              transition: all 0.2s;
            }
          `}</style>
        </Content>
      </Layout>
    </Layout>
  );
}
