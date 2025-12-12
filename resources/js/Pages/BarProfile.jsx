// resources/js/Pages/BarProfile.jsx
import React, { useState } from "react";
import { Head } from "@inertiajs/react";
import {
  Layout,
  Typography,
  Card,
  Button,
  Row,
  Col,
  message,
  Tag,
  Divider,
  Space,
  Switch,
  Avatar,
  Modal,
} from "antd";
import {
  PlusCircleOutlined,
  ApartmentOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  CompassOutlined,
  DownloadOutlined,
  EditOutlined,
} from "@ant-design/icons";
import Sidebar from "@/Components/BarSide";
import Navbar from "@/Components/BarNav";
import CreateZoneModal from "@/modal/CreateZoneModal";
import EditZoneModal from "@/modal/EditZoneModal";
import ZoneRouteModal from "@/modal/ZoneRouteModal";
import UpdateZoneLeaderModal from "@/modal/UpdateZoneLeaderModal";
import LoadingCube from "@/Components/LoadingCube";
import TerminalHouseholdModal from "@/modal/TerminalHouseholdModal";
import axios from "axios";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function BarProfile({
  auth,
  barangayProfile,
  zonalLeaders,
  zones: initialZones,
  allZones = [],
}) {
  const [collapsed, setCollapsed] = useState(true);
  const toggleCollapsed = () => setCollapsed(!collapsed);

  const [zones, setZones] = useState(initialZones || []);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [updateLeaderVisible, setUpdateLeaderVisible] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [editingZone, setEditingZone] = useState(null);
  const [saving, setSaving] = useState(false);

  // terminal modal states
  const [terminalModalVisible, setTerminalModalVisible] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState(null);

  // QR modal states (ADDED)
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrTerminal, setQrTerminal] = useState(null);

  const maxZonesAllowed = barangayProfile?.zone_count || 0;
  const currentZoneCount = zones.length;
  const canAddZone = currentZoneCount < maxZonesAllowed;

  // Create Zone
  const handleCreateFinish = (values, form) => {
    if (!canAddZone) {
      message.warning(`You cannot add more than ${maxZonesAllowed} zones.`);
      return;
    }

    setSaving(true);
    axios
      .post("/zones", values)
      .then(() => {
        message.success("Zone created successfully!");
        form.resetFields();
        setCreateModalVisible(false);
        // refresh zones - simple approach: reload zones via API or full page
        window.location.reload();
      })
      .catch(() => message.error("Failed to create zone."))
      .finally(() => setSaving(false));
  };

  const handleEditFinish = (values, form) => {
    if (!editingZone?.id) return;
    setSaving(true);
    axios
      .put(`/zones/${editingZone.id}`, values)
      .then((res) => {
        message.success("Zone updated successfully!");
        form.resetFields();
        setEditModalVisible(false);
        const updated = res.data.zone;
        if (updated) {
          setZones((prev) =>
            prev.map((z) => (z.id === updated.id ? { ...z, ...updated } : z))
          );
        } else {
          window.location.reload();
        }
      })
      .catch((error) => {
        console.error(error);
        message.error(
          error.response?.data?.message || "Failed to update zone."
        );
      })
      .finally(() => setSaving(false));
  };

  // Open Route Modal
  const openRouteModal = (zone) => {
    if (!zone?.id) {
      message.error("Cannot add routes: zone ID missing.");
      return;
    }
    setSelectedZone(zone);
    setRouteModalVisible(true);
  };

  // Submit Routes
  const handleRouteSubmit = (values, form) => {
    if (!selectedZone?.id) return;
    setSaving(true);
    axios
      .post(`/zones/${selectedZone.id}/routes`, values)
      .then(() => {
        message.success("Route(s) added successfully!");
        form.resetFields();
        setRouteModalVisible(false);
        window.location.reload();
      })
      .catch(() => message.error("Failed to add route."))
      .finally(() => setSaving(false));
  };

  // Toggle terminal active/inactive
  const toggleTerminalActive = (zoneId, terminalId) => {
    setSaving(true);
    const zoneIndex = zones.findIndex((z) => z.id === zoneId);
    if (zoneIndex === -1) return;

    const terminal = zones[zoneIndex].garbage_terminals.find((t) => t.id === terminalId);
    if (!terminal) return;

    const newStatus = !terminal.is_active;

    axios
      .put(`/terminals/${terminalId}/toggle-active`, { is_active: newStatus })
      .then(() => {
        message.success(`Terminal ${newStatus ? "activated" : "deactivated"} successfully!`);
        setZones((prevZones) => {
          const updatedZones = [...prevZones];
          updatedZones[zoneIndex] = {
            ...updatedZones[zoneIndex],
            garbage_terminals: updatedZones[zoneIndex].garbage_terminals.map((t) =>
              t.id === terminalId ? { ...t, is_active: newStatus } : t
            ),
          };
          return updatedZones;
        });
      })
      .catch(() => message.error("Failed to toggle terminal."))
      .finally(() => setSaving(false));
  };

  // Handle Update Leader
  const handleOpenLeaderModal = (zone) => {
    setSelectedZone(zone);
    setUpdateLeaderVisible(true);
  };

  const handleUpdateLeader = async (values, form) => {
    if (!selectedZone?.id) return;
    try {
      setSaving(true);
      await axios.put(`/zones/${selectedZone.id}/update-leader`, values);
      message.success("Zone leader updated successfully!");
      setUpdateLeaderVisible(false);
      form.resetFields();
      window.location.reload();
    } catch (error) {
      console.error(error);
      message.error("Failed to update zone leader.");
    } finally {
      setSaving(false);
    }
  };

  // Terminal modal open
  const handleOpenTerminalModal = (terminal, zone) => {
    setSelectedTerminal({ ...terminal, zone_id: zone.id });
    setTerminalModalVisible(true);
  };

  // Terminal update submit
  const handleUpdateTerminal = async (values, form) => {
    if (!selectedTerminal?.id) return;
    setSaving(true);

    try {
      // call backend endpoint - it returns updated terminal object
      const res = await axios.put(`/terminals/${selectedTerminal.id}/update-households`, values);
      const updatedTerminal = res.data.terminal;

      message.success("Terminal updated successfully!");

      // update zones state to reflect the updated terminal in-place
      setZones((prevZones) => {
        return prevZones.map((z) => {
          if (z.id !== selectedTerminal.zone_id) return z;
          return {
            ...z,
            garbage_terminals: z.garbage_terminals.map((t) =>
              t.id === updatedTerminal.id ? { ...t, ...updatedTerminal } : t
            ),
          };
        });
      });

      setTerminalModalVisible(false);
      form.resetFields();
    } catch (err) {
      console.error(err);
      message.error("Failed to update terminal data.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- QR Modal helpers (ADDED) ----------
  const handleOpenQrModal = (terminal) => {
    if (!terminal?.qr_code) {
      message.warning("QR code not available for this terminal.");
      return;
    }
    // ensure we keep original terminal object (do not mutate)
    setQrTerminal(terminal);
    setQrModalVisible(true);
  };

  const handleDownloadQr = (terminal) => {
    if (!terminal?.qr_code) {
      message.warning("No QR available to download.");
      return;
    }
    // create temporary link to trigger download
    const link = document.createElement("a");
    // terminal.qr_code expected like 'storage/qrcodes/terminal_1_xxx.png'
    link.href = `/${terminal.qr_code}`.replace("//", "/");
    link.download = `${(terminal.name || "terminal").replace(/\s+/g, "_")}_qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  // -----------------------------------------------

  return (
    <>
      <Head title="Barangay Profile" />
      <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
        <Sidebar collapsed={collapsed} toggleCollapsed={toggleCollapsed} />
        <Layout>
          <Navbar collapsed={collapsed} toggleCollapsed={toggleCollapsed} user={auth.user} />
          <Content
            style={{
              margin: "24px 16px",
              padding: 24,
              borderRadius: "12px",
              background: "#f5f7fa",
            }}
          >
            {saving && <LoadingCube />}

            {/* PROFILE HEADER */}
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                background: "#fff",
                padding: "24px 28px",
                marginBottom: 32,
              }}
            >
              <Row justify="space-between" align="middle" gutter={[16, 16]}>
                <Col xs={24} md={16}>
                  <Space align="center" size={16}>
                    <Avatar
                      size={64}
                      style={{
                        backgroundColor: "#1890ff",
                        fontSize: 28,
                        fontWeight: "bold",
                      }}
                    >
                      {barangayProfile?.name?.charAt(0) || "B"}
                    </Avatar>
                    <div>
                      <Title level={3} style={{ marginBottom: 6, color: "#001529" }}>
                        {barangayProfile?.name || "Barangay Profile"}
                      </Title>
                      <Text type="secondary">{auth.user.email}</Text>
                    </div>
                  </Space>
                </Col>
                <Col xs={24} md={8} style={{ textAlign: "right" }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusCircleOutlined />}
                    onClick={() =>
                      canAddZone ? setCreateModalVisible(true) : message.warning(`Max ${maxZonesAllowed} zones allowed.`)
                    }
                    disabled={!canAddZone}
                    style={{
                      borderRadius: 14,
                      fontWeight: 600,
                      padding: "0 24px",
                      background: "linear-gradient(90deg,#1890ff,#40a9ff)",
                      boxShadow: "0 8px 20px rgba(24,144,255,0.25)",
                    }}
                  >
                    Create Zone
                  </Button>
                </Col>
              </Row>

              <Divider />
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card bordered={false} style={{ background: "#fafafa" }}>
                    <Space>
                      <EnvironmentOutlined style={{ color: "#1890ff" }} />
                      <Text strong>Zone Coverage:</Text>
                      <Tag color="blue">{barangayProfile?.zone_count}</Tag>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card bordered={false} style={{ background: "#fafafa" }}>
                    <Space>
                      <TeamOutlined style={{ color: "#52c41a" }} />
                      <Text strong>Zonal Leaders:</Text>
                      <Tag color="green">{zonalLeaders?.length}</Tag>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card bordered={false} style={{ background: "#fafafa" }}>
                    <Space>
                      <CompassOutlined style={{ color: "#fa8c16" }} />
                      <Text strong>Active Zones:</Text>
                      <Tag color="orange">{zones?.length}</Tag>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* ZONE CARDS */}
            <Divider orientation="left" style={{ fontSize: 18, fontWeight: 600 }}>
              Covered Zones
            </Divider>

            <Row gutter={[24, 24]}>
              {zones.map((zone) => (
                <Col xs={24} sm={12} md={8} key={zone.id}>
                  <Card
                    hoverable
                    title={
                      <div style={{ cursor: "pointer" }} onClick={() => openRouteModal(zone)}>
                        <Space direction="vertical" size={0}>
                          <Space>
                            <ApartmentOutlined style={{ color: "#1890ff", fontSize: 20 }} />
                            <Text strong style={{ fontSize: 16 }}>
                              {zone.name || `Zone #${zone.id}`}
                            </Text>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Click here to add terminal
                          </Text>
                        </Space>
                      </div>
                    }
                    style={{
                      borderRadius: "14px",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                      borderLeft: "6px solid #1890ff",
                      transition: "all 0.3s",
                      background: "#ffffff",
                    }}
                    bodyStyle={{ minHeight: 200, padding: "16px 20px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setEditingZone(zone);
                          setEditModalVisible(true);
                        }}
                        style={{
                          borderRadius: 999,
                          borderColor: "#e5e7eb",
                          color: "#111827",
                          background: "#f9fafb",
                        }}
                      >
                        Edit Zone
                      </Button>
                    </div>
                    <Text strong style={{ color: "#1890ff" }}>
                      Zone Leader:
                    </Text>
                    {zone.zone_leader ? (
                      <Paragraph style={{ marginTop: 6 }}>
                        <Text
                          strong
                          style={{
                            color: "#1890ff",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                          onClick={() => handleOpenLeaderModal(zone)}
                        >
                          {zone.zone_leader.name}
                        </Text>
                        <br />
                        <Text type="secondary">{zone.zone_leader.email}</Text>
                      </Paragraph>
                    ) : (
                      <Paragraph type="secondary" style={{ marginTop: 6, cursor: "pointer" }} onClick={() => handleOpenLeaderModal(zone)}>
                        Assign Leader
                      </Paragraph>
                    )}

                    <Divider style={{ margin: "12px 0" }} />

                    <Text strong style={{ color: "#1890ff" }}>
                      Route Path:
                    </Text>
                    {zone.route_path?.length ? (
                      <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                        {zone.route_path.map((coord, idx) => (
                          <li key={idx}>
                            <Text strong>{coord.name || `Landmark`}</Text> – <Text type="secondary">Lat: {coord.lat}, Lng: {coord.lng}</Text>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Paragraph type="secondary" style={{ marginTop: 8 }}>
                        No coordinates added.
                      </Paragraph>
                    )}

                    <Divider style={{ margin: "12px 0" }} />

                    <Text strong style={{ color: "#1890ff" }}>
                      Garbage Terminals:
                    </Text>
                    {zone.garbage_terminals?.length ? (
                      <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                        {zone.garbage_terminals.map((terminal) => (
                          <li
                            key={terminal.id}
                            style={{
                              marginBottom: 6,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <Text
                                strong
                                style={{ color: "#1890ff", cursor: "pointer", textDecoration: "underline" }}
                                onClick={() => handleOpenTerminalModal(terminal, zone)}
                              >
                                {terminal.name}
                              </Text>{" "}
                              {/* ADDED: small View QR button next to name (keeps your existing click behavior intact) */}
                              <Button type="link" size="small" onClick={() => handleOpenQrModal(terminal)}>
                                View QR
                              </Button>
                              {" – "}
                              <Text type="secondary">
                                Lat: {terminal.lat}, Lng: {terminal.lng}
                              </Text>
                              <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                                <span style={{ marginRight: 10 }}>HH: {terminal.household_count ?? 0}</span>
                                <span>Est: {terminal.establishment_count ?? 0}</span>
                              </div>
                            </div>

                            <Switch
                              checked={terminal.is_active}
                              onChange={() => toggleTerminalActive(zone.id, terminal.id)}
                              checkedChildren="Active"
                              unCheckedChildren="Inactive"
                            />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Paragraph type="secondary" style={{ marginTop: 8 }}>
                        No garbage terminals assigned.
                      </Paragraph>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>

            {/* MODALS */}
            <CreateZoneModal
              visible={createModalVisible}
              onCancel={() => setCreateModalVisible(false)}
              onFinish={handleCreateFinish}
              saving={saving}
              maxZones={maxZonesAllowed}
              existingZones={allZones}
              zonalLeaders={zonalLeaders}
            />

            <EditZoneModal
              visible={editModalVisible}
              onCancel={() => setEditModalVisible(false)}
              onFinish={handleEditFinish}
              saving={saving}
              zone={editingZone}
              zonalLeaders={zonalLeaders}
            />

            <ZoneRouteModal visible={routeModalVisible} onCancel={() => setRouteModalVisible(false)} zone={selectedZone} onSubmit={handleRouteSubmit} saving={saving} destroyOnHidden />

            <UpdateZoneLeaderModal visible={updateLeaderVisible} onCancel={() => setUpdateLeaderVisible(false)} onSubmit={handleUpdateLeader} saving={saving} zonalLeaders={zonalLeaders} zone={selectedZone} />

            <TerminalHouseholdModal visible={terminalModalVisible} onCancel={() => setTerminalModalVisible(false)} onSubmit={handleUpdateTerminal} terminal={selectedTerminal} saving={saving} />

           {/* Modern QR Modal */}
<Modal
  open={qrModalVisible}
  centered
  title={
    <div
      style={{
        textAlign: "center",
        fontSize: 20,
        fontWeight: 600,
        color: "#1f2937",
      }}
    >
      {qrTerminal ? `QR Code for ${qrTerminal.name}` : "QR Code"}
    </div>
  }
  onCancel={() => setQrModalVisible(false)}
  footer={[
    <Button
      key="download"
      type="primary"
      size="large"
      icon={<DownloadOutlined />}
      style={{
        borderRadius: 8,
        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
        boxShadow: "0 3px 10px rgba(37, 99, 235, 0.3)",
      }}
      onClick={() => handleDownloadQr(qrTerminal)}
    >
      Download QR
    </Button>,
    <Button
      key="close"
      size="large"
      onClick={() => setQrModalVisible(false)}
      style={{
        borderRadius: 8,
      }}
    >
      Close
    </Button>,
  ]}
>
  {qrTerminal ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 12px",
      }}
    >
      {/* QR Image Card */}
      <div
        style={{
          background: "white",
          borderRadius: 16,
          boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
          padding: 24,
          transition: "all 0.3s ease",
        }}
      >
        <img
          src={`/${qrTerminal.qr_code}`.replace("//", "/")}
          alt="QR Code"
          style={{
            width: 260,
            height: 260,
            borderRadius: 12,
            transition: "transform 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />
      </div>

      {/* 📄 Description */}
      <p
        style={{
          marginTop: 18,
          fontSize: 15,
          color: "#4b5563",
          textAlign: "center",
          maxWidth: 320,
          lineHeight: 1.6,
        }}
      >
        <strong>Note:</strong> Use this QR code for the{" "}
        <strong>completion of the route</strong> — the driver must scan it to
        confirm that this terminal has been reached.
      </p>
    </div>
  ) : (
    <Paragraph type="secondary" style={{ textAlign: "center" }}>
      No QR available.
    </Paragraph>
  )}
</Modal>

          </Content>
        </Layout>
      </Layout>
    </>
  );
}
