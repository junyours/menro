// resources/js/Pages/Dashboard.jsx

import { Head } from "@inertiajs/react";
import { useState } from "react";
import { Layout, Typography, Tag, Card, Space, Pagination } from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  CarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  PushpinOutlined,
  CheckOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import Sidebar from "@/Components/BarSide";
import Navbar from "@/Components/BarNav";

const { Content } = Layout;
const { Title, Text } = Typography;

export default function BarangayDashboard({ auth, schedules = [] }) {
  const [collapsed, setCollapsed] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const statusColor = (status) => {
    switch (status) {
      case "Ongoing":
        return "green";
      case "Completed":
        return "blue";
      case "Pending":
        return "orange";
      default:
        return "default";
    }
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case "completed":
        return { icon: <CheckOutlined style={{ color: "#1890ff" }} />, color: "#e6f7ff" };
      case "Pending":
        return { icon: <PushpinOutlined style={{ color: "#fa8c16" }} />, color: "#fff7e6" };
      case "Ongoing":
        return { icon: <ClockCircleOutlined style={{ color: "#52c41a" }} />, color: "#f6ffed" };
      default:
        return { icon: null, color: "#fafafa" };
    }
  };

  // Pastel background palette for cards
  const cardGradients = [
    "linear-gradient(135deg, #d6eaff, #f0faff)",
    "linear-gradient(135deg, #e6fffb, #f6ffed)",
    "linear-gradient(135deg, #fff1f0, #fffbe6)",
    "linear-gradient(135deg, #f9f0ff, #f0f5ff)",
  ];

  // Pagination logic
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSchedules = schedules.slice(startIndex, startIndex + pageSize);

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f4f7fb" }}>
      <Head title="Barangay Dashboard" />

      {/* Sidebar */}
      <Sidebar collapsed={collapsed} toggleCollapsed={toggleCollapsed} />

   <Layout style={{ background: "transparent" }}>
        <Navbar collapsed={collapsed} toggleCollapsed={toggleCollapsed} user={auth.user} />

        <Content style={{ margin: "24px 16px", padding: 24 }}>
          {/* Welcome Section */}
          <Card
            style={{
              borderRadius: 20,
              marginBottom: 32,
              padding: 30,
              background: "linear-gradient(120deg, rgba(24,144,255,0.2), rgba(255,255,255,0.95))",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              border: "none",
            }}
          >
            <Title level={3} style={{ marginBottom: 8, color: "#001529", fontWeight: 800, letterSpacing: 0.3 }}>
              Welcome back, {auth.user.name}! 👋
            </Title>
            <Text style={{ fontSize: 16, color: "#595959" }}>
              You are logged into the Barangay Dashboard. Here’s the latest schedule overview.
            </Text>
          </Card>

          {/* Latest Schedules Section */}
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: "#1890ff" }} />
                <span style={{ fontWeight: 700 }}>Latest Schedules</span>
              </Space>
            }
            style={{
              borderRadius: 20,
              backgroundColor: "#ffffff",
              boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
              border: "none",
            }}
            bodyStyle={{ padding: "28px" }}
          >
            <div
              style={{
                display: "grid",
                gap: "24px",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                marginTop: "16px",
              }}
            >
              {paginatedSchedules.length > 0 ? (
                paginatedSchedules.map((schedule, index) => (
                  <Card
                    key={schedule.id}
                    hoverable
                    bordered={false}
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      background: cardGradients[index % cardGradients.length],
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      transition: "all 0.3s ease",
                      position: "relative",
                    }}
                    bodyStyle={{ padding: 20, paddingLeft: 60 }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    title={
                      <Space>
                        <CalendarOutlined style={{ color: "#1890ff" }} />
                        <Text strong style={{ fontSize: 15 }}>
                          {new Date(schedule.pickup_datetime).toLocaleString()}
                        </Text>
                      </Space>
                    }
                  >
                    {/* Status Icon Top-Left */}
                    <div
                      style={{
                        position: "absolute",
                        top: 16,
                        left: 16,
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: getStatusDetails(schedule.status).color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      {getStatusDetails(schedule.status).icon}
                    </div>

                    <p style={{ marginBottom: 8 }}>
                      <CarOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                      <strong>Truck:</strong> {schedule.truck?.model || "N/A"}
                    </p>
                    <p style={{ marginBottom: 8 }}>
                      <UserOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                      <strong>Driver:</strong> {schedule.driver?.user?.name || "N/A"}
                    </p>
                    <p style={{ marginBottom: 8 }}>
                      <EnvironmentOutlined style={{ marginRight: 8, color: "#fa8c16" }} />
                      <strong>Barangay:</strong> {schedule.barangay?.name || "N/A"}
                    </p>

                    <p style={{ marginBottom: 8, marginLeft: 0 }}>
                      <strong>Status:</strong>{" "}
                      <Tag
                        color={statusColor(schedule.status)}
                        style={{
                          borderRadius: 12,
                          fontWeight: 600,
                          padding: "4px 10px",
                          fontSize: 14,
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        {schedule.status}
                      </Tag>
                    </p>

                    {schedule.remarks && (
                      <p style={{ marginTop: 10, color: "#595959" }}>
                        <strong>Remarks:</strong> {schedule.remarks}
                      </p>
                    )}
                  </Card>
                ))
              ) : (
                <Card
                  style={{
                    textAlign: "center",
                    borderRadius: 16,
                    background: "#fafafa",
                  }}
                >
                  <Text type="secondary">No schedules available.</Text>
                </Card>
              )}
            </div>

            {/* Pagination */}
            {schedules.length > pageSize && (
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={schedules.length}
                  onChange={(page) => setCurrentPage(page)}
                  showSizeChanger={false}
                />
              </div>
            )}
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
