import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Checkbox,
  Button,
  Card,
  message,
  Row,
  Col,
  Tag,
  Space,
  Tooltip,
  Alert,
  Divider,
} from "antd";
import { Head, useForm } from "@inertiajs/react";
import Sidebar from "@/Components/BarSide";
import Navbar from "@/Components/BarNav";
import {
  CheckCircleOutlined,
  EyeOutlined,
  SendOutlined,
  InboxOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);

const { Content } = Layout;
const { Title, Text } = Typography;

export default function ZoneReport({ auth, weeklyReport, zones, existingReports, errors }) {
  const [collapsed, setCollapsed] = useState(true);
  const [now, setNow] = useState(dayjs());
  const [isClosed, setIsClosed] = useState(false);

  const existingZoneIds = existingReports.map((z) => z.zone_id);
  const alreadySubmitted = existingReports.length > 0;

  const { data, setData, post, processing } = useForm({
    weekly_report_id: weeklyReport?.id || undefined,
    zones: existingZoneIds,
  });

  const submittedAt = weeklyReport?.submitted_at
    ? dayjs(weeklyReport.submitted_at, "YYYY-MM-DD HH:mm:ss")
    : null;

  // Auto-refresh for deadline
  useEffect(() => {
    if (!submittedAt) return;
    const timer = setInterval(() => {
      const currentTime = dayjs();
      setNow(currentTime);

      if (currentTime.isSameOrAfter(submittedAt)) {
        if (!sessionStorage.getItem("zoneReportReloaded")) {
          sessionStorage.setItem("zoneReportReloaded", "true");
          clearInterval(timer);
          window.location.reload();
        } else {
          setIsClosed(true);
          clearInterval(timer);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [submittedAt]);

  // Close form if past deadline
  useEffect(() => {
    if (submittedAt && dayjs().isSameOrAfter(submittedAt)) {
      setIsClosed(true);
    }
  }, [submittedAt]);

  // Submit handler
  const handleSubmit = () => {
    if (!weeklyReport?.id) {
      message.error("No active weekly report found. Cannot submit.");
      return;
    }

    if (isClosed) {
      message.warning("Segregation is closed. Please create a new weekly report.");
      return;
    }

    if (data.zones.length === 0) {
      message.error("Please select at least one zone before submitting.");
      return;
    }

    post(route("barangay.zone.store"), {
      onSuccess: () => message.success("Zone report submitted successfully."),
      onError: (err) => {
        const msg = err?.response?.data?.errors?.report || "Failed to submit zone report.";
        message.error(msg);
      },
    });
  };

  // Debug zone leader info
  useEffect(() => {
    zones.forEach((zone) => {
      if (zone.zoneLeader) {
        console.log(
          `Zone: ${zone.name} | Zone Leader ID: ${zone.zoneLeader.id} | Name: ${zone.zoneLeader.firstname} ${zone.zoneLeader.lastname}`
        );
      } else {
        console.warn(`Zone leader not found for zone: ${zone.name} (zone id: ${zone.id})`);
      }
    });
  }, [zones]);

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f4f6f8" }}>
      <Head title="Zone Report" />
      <Sidebar collapsed={collapsed} toggleCollapsed={() => setCollapsed(!collapsed)} />
      <Layout>
        <Navbar collapsed={collapsed} toggleCollapsed={() => setCollapsed(!collapsed)} user={auth?.user} />
        <Content style={{ margin: "24px 16px", padding: 0 }}>

          {/* Header */}
          <Card
            variant="outlined"
            style={{
              borderRadius: 20,
              margin: "24px 0",
              padding: "24px 32px",
              backgroundColor: "#ffffff",
              boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
            }}
          >
            <Row align="middle" justify="space-between">
              <Col xs={24} md={12}>
                <Title level={2} style={{ fontWeight: 700, margin: 0, color: "#001529" }}>
                  Zone Segregation Plan
                </Title>
                <Text type="secondary" style={{ fontSize: 14 }}>Weekly Overview</Text>
              </Col>
              <Col xs={24} md={12} style={{ textAlign: "right" }}>
                {submittedAt && (
                  <>
                    <Text style={{ display: "block", fontSize: 14, color: "#8c8c8c" }}>Weekly Report Deadline</Text>
                    <Text style={{ display: "block", fontWeight: 600, fontSize: 15 }}>
                      {submittedAt.format("MMMM D, YYYY h:mm A")}
                    </Text>
                    <Divider style={{ margin: "8px 0", borderColor: "#f0f0f0" }} />
                    <Text style={{ display: "block", fontSize: 14, color: "#8c8c8c" }}>Current Time</Text>
                    <Text style={{ display: "block", fontWeight: 600, fontSize: 15 }}>
                      {now.format("MMMM D, YYYY h:mm:ss A")}
                    </Text>
                  </>
                )}
              </Col>
            </Row>
          </Card>

          {!weeklyReport?.id ? (
            <Alert
              type="info"
              message="No active weekly report available. Please create a weekly report first."
              style={{ marginBottom: 24, borderRadius: 12 }}
            />
          ) : (
            <>
              {/* Zone Selection */}
              <Card
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: "#1890ff", fontSize: 22 }} />
                    <span style={{ fontWeight: 600, fontSize: 18 }}>Select Completed Zones</span>
                  </Space>
                }
                variant="outlined"
                style={{
                  borderRadius: 20,
                  marginBottom: 32,
                  backgroundColor: "#ffffff",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                }}
              >
                {alreadySubmitted ? (
                  <Alert
                    message="This week's zone report has already been submitted."
                    type="success"
                    showIcon
                    style={{ borderRadius: 12, marginBottom: 24, fontWeight: 500 }}
                  />
                ) : isClosed ? (
                  <Alert
                    message="Segregation Closed"
                    description={`This report closed on ${submittedAt.format("MMMM D, YYYY h:mm A")}. Please create a new weekly report.`}
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    style={{ borderRadius: 12, marginBottom: 24, fontWeight: 500 }}
                  />
                ) : (
                  <Text type="secondary">Check all zones that have completed segregation for this week.</Text>
                )}

                <Divider style={{ margin: "16px 0", borderColor: "#e0e0e0" }} />

                <Row gutter={[16, 16]}>
                  {zones.map((zone) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={zone.id}>
                      <Checkbox
                        value={zone.id}
                        checked={data.zones.includes(zone.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const updatedZones = checked
                            ? [...data.zones, zone.id]
                            : data.zones.filter((id) => id !== zone.id);
                          setData("zones", updatedZones);
                        }}
                        disabled={alreadySubmitted || isClosed}
                        style={{
                          width: "100%",
                          display: "block",
                          padding: "16px 24px",
                          borderRadius: 14,
                          backgroundColor: "#f9fafb",
                          border: "1px solid #d9d9d9",
                          fontSize: 16,
                          fontWeight: 500,
                          transition: "all 0.3s",
                        }}
                      >
                        {zone.name} {zone.zoneLeader ? `(${zone.zoneLeader.firstname} ${zone.zoneLeader.lastname})` : "(No Leader)"}
                      </Checkbox>
                    </Col>
                  ))}
                </Row>

                {errors.zones && <Text type="danger" style={{ display: "block", marginTop: 12 }}>{errors.zones}</Text>}

                <div style={{ marginTop: 32 }}>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSubmit}
                    loading={processing}
                    block
                    disabled={alreadySubmitted || isClosed}
                    size="large"
                    style={{
                      borderRadius: 14,
                      background: "linear-gradient(90deg,#1890ff,#40a9ff)",
                      border: "none",
                      fontWeight: 600,
                      fontSize: 16,
                      boxShadow: "0 8px 20px rgba(24,144,255,0.25)",
                      transition: "all 0.3s",
                    }}
                  >
                    Submit Zone Plan
                  </Button>
                </div>
              </Card>

              {/* Completed Zones */}
              {existingReports.length > 0 && (
                <Card
                  title={
                    <Space>
                      <InboxOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                      <span style={{ fontWeight: 600, fontSize: 18 }}>Completed Zone Reports</span>
                    </Space>
                  }
                  variant="outlined"
                  style={{
                    borderRadius: 20,
                    background: "#ffffff",
                    padding: 24,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                  }}
                >
                  <Row gutter={[16, 16]}>
                    {existingReports.map((report) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={report.id}>
                        <Card
                          size="small"
                          hoverable
                          variant="outlined"
                          style={{
                            borderRadius: 14,
                            background: "#f9fafb",
                            border: "1px solid #d9d9d9",
                            transition: "all 0.3s",
                          }}
                          title={
                            <Space>
                              <CheckCircleOutlined style={{ color: "#52c41a" }} />
                              {report.zone?.name || "Unknown Zone"} {report.zone?.zoneLeader ? `(${report.zone.zoneLeader.firstname} ${report.zone.zoneLeader.lastname})` : "(No Leader)"}
                            </Space>
                          }
                          extra={
                            report.zone?.route_path && (
                              <Tooltip title="Preview Route Path">
                                <Button
                                  size="small"
                                  shape="circle"
                                  icon={<EyeOutlined />}
                                  onClick={() => console.log("Preview path:", report.zone?.name)}
                                />
                              </Tooltip>
                            )
                          }
                        >
                          {report.zone?.garbage_terminals?.length > 0 ? (
                            <>
                              <Text type="secondary" style={{ fontSize: 12 }}>Terminals:</Text>
                              <div style={{ marginTop: 6 }}>
                                {report.zone.garbage_terminals.map((term) => (
                                  <Tag key={term.id} color="#2f54eb">
                                    {term.lat}, {term.lng}
                                  </Tag>
                                ))}
                              </div>
                            </>
                          ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>No terminals assigned</Text>
                          )}
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
