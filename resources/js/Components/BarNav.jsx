// resources/js/Components/Navbar.jsx
import { Header } from "antd/es/layout/layout";
import { Avatar, Button, Dropdown, Space, Badge, Typography, Tag } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { Link, usePage } from "@inertiajs/react";

const { Text, Title } = Typography;

export default function Navbar({ collapsed, toggleCollapsed, user }) {
  const { props } = usePage();
  const notifications = props.auth?.notifications || {};
  const reschedules = notifications.reschedules || [];

  // Combine all notifications
  const allNotifications = [
    ...reschedules.map((r) => ({
      id: `resched-${r.id}`,
      type: "Reschedule",
      message: `Pickup in ${r.barangay?.name ?? "Barangay"} rescheduled to ${r.pickup_datetime}`,
      link: "/bar/reschedule", // ✅ Link for navigation
    })),
  ];

  // Notification dropdown content
  const notificationMenu = (
    <div
      style={{
        maxWidth: 360,
        maxHeight: 450,
        overflowY: "auto",
        padding: 12,
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
      }}
    >
      {allNotifications.length ? (
        allNotifications.map((item) => (
          <Link key={item.id} href={item.link} style={{ textDecoration: "none" }}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                marginBottom: 8,
                background: "#fafafa",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fafafa")}
            >
              <Space direction="vertical" size={2}>
                <Tag color="orange" style={{ fontWeight: 600 }}>
                  {item.type}
                </Tag>
                <Text style={{ fontSize: 13, color: "#555" }}>{item.message}</Text>
              </Space>
            </div>
          </Link>
        ))
      ) : (
        <div
          style={{
            padding: 20,
            textAlign: "center",
            color: "#999",
            fontStyle: "italic",
          }}
        >
          No new notifications
        </div>
      )}
    </div>
  );

  // User dropdown menu
  const userMenu = [
    {
      key: "profile",
      label: (
        <Link
          href={route("BarProfile")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
          }}
        >
          <UserOutlined /> Profile
        </Link>
      ),
    },
    {
      key: "logout",
      label: (
        <Link
          href={route("logout")}
          method="post"
          as="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            color: "#ff4d4f",
            fontWeight: 600,
          }}
        >
          <LogoutOutlined /> Logout
        </Link>
      ),
    },
  ];

  return (
    <Header
      style={{
        padding: "0 24px",
        background: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        borderRadius: "12px",
        margin: "10px",
      }}
    >
      {/* Left Section: Toggle + Title */}
      <Space size="large" align="center">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleCollapsed}
          style={{ fontSize: "18px", color: "#333", transition: "color 0.2s" }}
        />

        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
            Waste Monitoring
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Welcome back, {user?.role || "User"}
          </Text>
        </div>
      </Space>

      {/* Right Section */}
      <Space size="large">
        {/* Notification Bell */}
        <Dropdown overlay={notificationMenu} trigger={["click"]} placement="bottomRight" arrow>
          <Badge count={allNotifications.length} size="xs">
            <BellOutlined
              style={{ fontSize: "20px", cursor: "pointer", color: "#333" }}
            />
          </Badge>
        </Dropdown>

        {/* User Dropdown */}
        <Dropdown menu={{ items: userMenu }} trigger={["click"]} placement="bottomRight" arrow>
          <span style={{ cursor: "pointer" }}>
            <Space size="middle">
              <Avatar style={{ backgroundColor: "#1890ff" }} icon={<UserOutlined />} />
              {!collapsed && (
                <Text strong style={{ color: "#333" }}>
                  {user?.name}
                </Text>
              )}
            </Space>
          </span>
        </Dropdown>
      </Space>
    </Header>
  );
}
