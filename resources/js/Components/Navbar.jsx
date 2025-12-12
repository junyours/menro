// Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
  Layout,
  Avatar,
  Dropdown,
  Space,
  Button,
  Badge,
  List,
  Modal,
  Typography,
  Card,
  message,
  Divider,
  Tag,
} from "antd";
import dayjs from "dayjs";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReadOutlined,
} from "@ant-design/icons";

const { Header } = Layout;
const { Text, Title } = Typography;

export default function Navbar({ collapsed, setCollapsed, auth }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // "feedback" | "weeklyReport"

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const rawNotifs = auth?.notifications ?? [];

  const getInitialLists = () => {
    let fb = [];
    let wr = [];

    if (Array.isArray(rawNotifs)) {
      rawNotifs.forEach((n) => {
        if (n?.barangay || (n.status && n.submitted_at)) {
          wr.push(n);
        } else {
          fb.push(n);
        }
      });
    } else if (rawNotifs && typeof rawNotifs === "object") {
      fb = rawNotifs.feedbacks ?? [];
      wr = rawNotifs.weeklyReports ?? [];
    }

    return { feedbacks: fb, weeklyReports: wr };
  };

  const initial = getInitialLists();
  const [feedbacks, setFeedbacks] = useState(initial.feedbacks);
  const [weeklyReports, setWeeklyReports] = useState(initial.weeklyReports);

  useEffect(() => {
    const lists = getInitialLists();
    setFeedbacks(lists.feedbacks);
    setWeeklyReports(lists.weeklyReports);
    if (selectedNotification) {
      const stillExists =
        lists.feedbacks.find((f) => f.id === selectedNotification.id) ||
        lists.weeklyReports.find((r) => r.id === selectedNotification.id);
      if (!stillExists) {
        setModalVisible(false);
        setSelectedNotification(null);
        setSelectedType(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const unreadCount =
    (feedbacks?.filter((n) => !n.is_viewed).length || 0) +
    (weeklyReports?.filter((r) => !("is_viewed" in r) || !r.is_viewed).length ||
      0);

  const toggleCollapsed = () => setCollapsed && setCollapsed(!collapsed);

  const openModal = (item, type) => {
    setSelectedNotification(item);
    setSelectedType(type);
    setModalVisible(true);
    setNotifDropdownOpen(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
    setSelectedType(null);
  };

  const markAsRead = (item, type) => {
    if (!item) return;

    if (item.id) {
      router.post(
        route("notifications.view", item.id),
        {},
        {
          onSuccess: () => {
            if (type === "feedback") {
              setFeedbacks((prev) =>
                prev.map((f) => (f.id === item.id ? { ...f, is_viewed: true } : f))
              );
            } else if (type === "weeklyReport") {
              setWeeklyReports((prev) =>
                prev.map((r) => (r.id === item.id ? { ...r, is_viewed: true } : r))
              );
            }
            message.success("Notification marked as read.");
            closeModal();
          },
          onError: (err) => {
            console.error("Failed to mark notification as read", err);
            if (type === "feedback") {
              setFeedbacks((prev) =>
                prev.map((f) => (f.id === item.id ? { ...f, is_viewed: true } : f))
              );
            } else {
              setWeeklyReports((prev) =>
                prev.map((r) => (r.id === item.id ? { ...r, is_viewed: true } : r))
              );
            }
            message.warning("Couldn't update server — updated locally.");
            closeModal();
          },
        }
      );
    } else {
      if (type === "feedback") {
        setFeedbacks((prev) =>
          prev.map((f) => (f === item ? { ...f, is_viewed: true } : f))
        );
      } else {
        setWeeklyReports((prev) =>
          prev.map((r) => (r === item ? { ...r, is_viewed: true } : r))
        );
      }
      message.success("Marked as read (local).");
      closeModal();
    }
  };

  const viewWeeklyReport = (report) => {
    if (!report) return;
    try {
      if (report.id) {
        router.get(route("weekly-reports.show", report.id));
      } else {
        router.get(route("weekly-reports.index"));
      }
    } catch (e) {
      router.get(route("weekly.reports"));
    }
  };

  const notificationMenu = (
    <div
      style={{
        width: 380,
        maxHeight: 460,
        overflowY: "auto",
        padding: 12,
        background: "#ffffff",
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18)",
        borderRadius: 16,
        border: "1px solid #f0f0f0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <Text
          strong
          style={{ fontSize: 14, color: "#111827", letterSpacing: 0.3 }}
        >
          Notifications
        </Text>
        <Tag color="blue" style={{ borderRadius: 999, fontSize: 11 }}>
          {unreadCount} unread
        </Tag>
      </div>

      <Divider style={{ margin: "6px 0 10px 0" }} />

      {/* Feedback Notifications */}
      <div style={{ marginBottom: 8 }}>
        <Text strong>Feedback Notifications</Text>
        <List
          style={{ marginTop: 8 }}
          dataSource={feedbacks}
          locale={{
            emptyText: (
              <Text type="secondary">No feedback notifications</Text>
            ),
          }}
          renderItem={(item) => (
            <List.Item
              onClick={() => openModal(item, "feedback")}
              style={{
                background: item.is_viewed ? "#f9fafb" : "#e0f2fe",
                borderRadius: 12,
                marginBottom: 8,
                padding: "10px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition:
                  "transform 0.15s, box-shadow 0.15s, background 0.15s",
                boxShadow: item.is_viewed
                  ? "0 1px 2px rgba(15, 23, 42, 0.04)"
                  : "0 4px 10px rgba(37, 99, 235, 0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 18px rgba(15, 23, 42, 0.16)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = item.is_viewed
                  ? "0 1px 2px rgba(15, 23, 42, 0.04)"
                  : "0 4px 10px rgba(37, 99, 235, 0.15)";
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<UserOutlined />}
                    style={{
                      background: item.is_viewed ? "#e5e7eb" : "#1d4ed8",
                      color: item.is_viewed ? "#374151" : "#eff6ff",
                      boxShadow: "0 2px 6px rgba(15, 23, 42, 0.2)",
                    }}
                  />
                }
                title={
                  <span
                    style={{
                      fontWeight: item.is_viewed ? 500 : 700,
                      fontSize: 13,
                      color: "#111827",
                    }}
                  >
                    {item.username || "Unknown"}
                  </span>
                }
                description={
                  <span
                    style={{
                      color: "#4b5563",
                      fontSize: 12,
                      display: "block",
                      marginTop: 2,
                    }}
                  >
                    {item.message || "No message"}
                  </span>
                }
              />
              {!item.is_viewed && (
                <Tag
                  color="blue"
                  style={{
                    borderRadius: 999,
                    fontSize: 11,
                    padding: "2px 10px",
                    fontWeight: 600,
                  }}
                >
                  New
                </Tag>
              )}
            </List.Item>
          )}
        />
      </div>

      {/* Weekly Reports */}
      <div>
        <Text strong>Weekly Reports</Text>
        <List
          style={{ marginTop: 8 }}
          dataSource={weeklyReports}
          locale={{
            emptyText: <Text type="secondary">No weekly reports</Text>,
          }}
          renderItem={(report) => (
            <List.Item
              onClick={() => openModal(report, "weeklyReport")}
              style={{
                background:
                  !("is_viewed" in report) || !report.is_viewed
                    ? "#fef3c7"
                    : "#f9fafb",
                borderRadius: 12,
                marginBottom: 8,
                padding: "10px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition:
                  "transform 0.15s, box-shadow 0.15s, background 0.15s",
                boxShadow:
                  !("is_viewed" in report) || !report.is_viewed
                    ? "0 4px 10px rgba(251, 191, 36, 0.25)"
                    : "0 1px 2px rgba(15, 23, 42, 0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 18px rgba(15, 23, 42, 0.16)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  !("is_viewed" in report) || !report.is_viewed
                    ? "0 4px 10px rgba(251, 191, 36, 0.25)"
                    : "0 1px 2px rgba(15, 23, 42, 0.04)";
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar style={{ backgroundColor: "#f59e0b", color: "#fff" }}>
                    {(report.barangay?.name || "W").charAt(0)}
                  </Avatar>
                }
                title={
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>
                    Weekly Report -{" "}
                    {report.barangay?.name ||
                      `Barangay ${report.barangay_id || "?"}`}
                  </span>
                }
                description={
                  <span style={{ color: "#4b5563", fontSize: 12 }}>
                    Status: {report.status || "N/A"} — Submitted:{" "}
                    {report.submitted_at
                      ? new Date(report.submitted_at).toLocaleDateString()
                      : "—"}
                  </span>
                }
              />
              <Tag
                color="gold"
                style={{
                  borderRadius: 999,
                  fontSize: 11,
                  padding: "2px 10px",
                  fontWeight: 600,
                }}
              >
                Pending
              </Tag>
            </List.Item>
          )}
        />
      </div>
    </div>
  );

  const profileMenu = (
    <div style={{ minWidth: 160 }}>
      <List size="small">
        <List.Item
          style={{ padding: "8px 12px", cursor: "pointer" }}
          onClick={() => router.visit("/admin/profile")}
        >
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <div>
              <div style={{ fontWeight: 600 }}>
                {auth.user?.name || "Guest"}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>
                {auth.user?.email}
              </div>
            </div>
          </Space>
        </List.Item>
        <List.Item style={{ padding: "8px 12px", cursor: "pointer" }}>
          <button
            onClick={() => router.post(route("logout"))}
            style={{
              border: "none",
              background: "transparent",
              color: "#e74c3c",
              cursor: "pointer",
            }}
          >
            <Space>
              <LogoutOutlined />
              Logout
            </Space>
          </button>
        </List.Item>
      </List>
    </div>
  );

  return (
    <>
      <Header
        style={{
          padding: "8px 20px",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
          borderRadius: 12,
          margin: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button
            type="text"
            onClick={toggleCollapsed}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            style={{ fontSize: 18 }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Title level={5} style={{ margin: 0 }}>
              Waste Monitoring
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Welcome back, {auth.user?.role || "User"}
            </Text>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* Notifications */}
          <Dropdown
            overlay={notificationMenu}
            trigger={["click"]}
            placement="bottomRight"
            arrow
            open={notifDropdownOpen}
            onOpenChange={setNotifDropdownOpen}
          >
            <Badge count={unreadCount} offset={[0, 8]} size="small">
              <BellOutlined
                style={{
                  fontSize: 20,
                  cursor: "pointer",
                  padding: 6,
                  borderRadius: 999,
                  transition: "background 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#eff6ff";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              />
            </Badge>
          </Dropdown>

          {/* Profile dropdown */}
          <Dropdown
            overlay={profileMenu}
            trigger={["click"]}
            placement="bottomRight"
            arrow
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: "#1890ff" }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontWeight: 600 }}>{auth.user?.name}</div>
                <Text type="secondary" style={{ fontSize: 12 }}></Text>
              </div>
            </div>
          </Dropdown>
        </div>
      </Header>

      {/* Modal for feedback + weekly report details */}
      <Modal
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        centered
        bodyStyle={{ padding: 0, overflow: "hidden" }}
        width={640}
      >
        {/* Gradient Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            background: "linear-gradient(135deg,#1890ff,#40a9ff)",
            color: "#fff",
          }}
        >
          <Space>
            <Avatar
              icon={<UserOutlined />}
              style={{ backgroundColor: "#fff", color: "#1890ff" }}
            />
            <div>
              <Title level={5} style={{ color: "#fff", margin: 0 }}>
                {selectedType === "feedback"
                  ? "Notification Details"
                  : "Weekly Report Details"}
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.9)" }}>
                {selectedType === "feedback"
                  ? "User feedback & schedule info"
                  : "Details for the weekly garbage report"}
              </Text>
            </div>
          </Space>

          <div>
            {selectedNotification &&
              (selectedNotification.is_viewed ? (
                <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 26 }} />
              ) : (
                <ClockCircleOutlined style={{ color: "#fff", fontSize: 26 }} />
              ))}
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: 20,
            background: "#f7f9fb",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {selectedType === "feedback" && selectedNotification && (
            <>
              <div
                style={{
                  maxHeight: "70vh",
                  overflowY: "auto",
                  paddingRight: 8,
                }}
              >
                {/* Sender Info */}
                <Card
                  size="small"
                  style={{
                    borderRadius: 10,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    marginBottom: 12,
                    padding: "12px",
                  }}
                >
                  <Title level={5} style={{ marginBottom: 4, fontSize: 14 }}>
                    From:
                  </Title>
                  <Text style={{ fontSize: 13 }}>
                    {selectedNotification.username || "Unknown"}
                  </Text>

                  <Divider style={{ margin: "8px 0" }} />

                  <Title level={5} style={{ marginBottom: 4, fontSize: 14 }}>
                    Message:
                  </Title>
                  <Text
                    style={{
                      fontSize: 13,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {selectedNotification.message || "No message"}
                  </Text>
                </Card>

                {/* Schedule Info */}
                {selectedNotification.schedule && (
                  <Card
                    size="small"
                    style={{
                      borderRadius: 10,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      marginBottom: 12,
                      padding: "12px",
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>
                      Feedback was submitted for the scheduled pickup on{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        {selectedNotification.schedule?.pickup_datetime
                          ? dayjs(
                              selectedNotification.schedule.pickup_datetime
                            ).format("MMM D, YYYY")
                          : "N/A"}
                      </Text>{" "}
                      , handled by driver{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        {selectedNotification.schedule?.driver?.user?.name ||
                          "N/A"}
                      </Text>{" "}
                      from{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        {selectedNotification.schedule?.barangay?.name ||
                          "N/A"}
                      </Text>{" "}
                      area.
                    </Text>
                  </Card>
                )}

                {/* Terminal Info */}
                {selectedNotification.terminal && (
                  <Card
                    size="small"
                    style={{
                      borderRadius: 10,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      marginBottom: 12,
                      padding: "12px",
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>
                      The feedback is associated with the{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        {selectedNotification.terminal?.name || "N/A"}
                      </Text>{" "}
                      terminal located in the{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        {selectedNotification.terminal?.zone?.name || "N/A"}
                      </Text>{" "}
                      zone.
                    </Text>
                  </Card>
                )}
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                {!selectedNotification.is_viewed && (
                  <Button
                    icon={<ReadOutlined />}
                    type="primary"
                    size="small"
                    onClick={() =>
                      markAsRead(selectedNotification, "feedback")
                    }
                  >
                    Mark as Read
                  </Button>
                )}
                <Button size="small" onClick={closeModal}>
                  Close
                </Button>
              </div>
            </>
          )}

          {selectedType === "weeklyReport" && selectedNotification && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
                padding: 16,
                background: "rgba(255, 255, 255, 0.6)",
                backdropFilter: "blur(10px)",
                borderRadius: 24,
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              }}
            >
              {/* Barangay Card */}
              <Card
                size="small"
                style={{
                  borderRadius: 20,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                  padding: 16,
                  background: "linear-gradient(145deg, #f0f8ff, #e6f7ff)",
                  transition: "transform 0.3s, box-shadow 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 28px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(0,0,0,0.06)";
                }}
              >
                <Text strong style={{ fontSize: 16, color: "#1e3a8a" }}>
                  Barangay:
                </Text>{" "}
                <Text style={{ fontSize: 15, color: "#34495e" }}>
                  {selectedNotification.barangay?.name ||
                    `Barangay ${selectedNotification.barangay_id || "?"}`}
                </Text>
              </Card>

              {/* Status & Submitted At Card */}
              <Card
                size="small"
                style={{
                  borderRadius: 20,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                  padding: 16,
                  background: "#ffffff",
                  transition: "transform 0.3s, box-shadow 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 28px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(0,0,0,0.06)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div>
                    <Text strong style={{ color: "#34495e" }}>
                      Status:
                    </Text>{" "}
                    <Tag
                      color={
                        selectedNotification.status === "approved"
                          ? "#73d13d"
                          : selectedNotification.status === "rejected"
                          ? "#ff4d4f"
                          : "#40a9ff"
                      }
                      style={{
                        fontWeight: 600,
                        borderRadius: 20,
                        padding: "4px 14px",
                        fontSize: 13,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                      }}
                    >
                      {selectedNotification.status || "N/A"}
                    </Tag>
                  </div>

                  <div>
                    <Text strong style={{ color: "#34495e" }}>
                      Submitted At:
                    </Text>{" "}
                    <Text style={{ color: "#595959" }}>
                      {selectedNotification.submitted_at
                        ? dayjs(
                            selectedNotification.submitted_at
                          ).format("MMMM D, YYYY h:mm A")
                        : "N/A"}
                    </Text>
                  </div>
                </div>

                {Array.isArray(selectedNotification.zone_reports) &&
                  selectedNotification.zone_reports.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <Text strong style={{ color: "#34495e" }}>
                        Zones:
                      </Text>
                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {selectedNotification.zone_reports.map((zr) => (
                          <Tag
                            key={zr.id}
                            color={zr.is_segregated ? "#b7eb8f" : "#ffa39e"}
                            style={{
                              borderRadius: 20,
                              padding: "6px 14px",
                              fontSize: 13,
                              fontWeight: 500,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                              backdropFilter: "blur(2px)",
                            }}
                          >
                            {zr.zone?.name || `Zone ${zr.zone_id}`} —{" "}
                            {zr.is_segregated
                              ? "Segregated"
                              : "Not Segregated"}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
              </Card>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                }}
              >
                <Button
                  type="primary"
                  style={{
                    borderRadius: 12,
                    background: "linear-gradient(90deg,#667eea,#764ba2)",
                    fontWeight: 600,
                    boxShadow: "0 6px 18px rgba(102,126,234,0.3)",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-2px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                  onClick={() => viewWeeklyReport(selectedNotification)}
                >
                  View Report
                </Button>
                <Button
                  style={{
                    borderRadius: 12,
                    fontWeight: 500,
                    border: "1px solid #d9d9d9",
                    background: "#fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-2px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                  onClick={closeModal}
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {!selectedType && (
            <div style={{ padding: 12 }}>
              <Text type="secondary">No details to show.</Text>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}