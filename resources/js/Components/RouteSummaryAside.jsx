// resources/js/Components/RouteSummaryAside.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Space,
  Button,
  Divider,
  Row,
  Col,
  Tag,
  message,
  Tooltip,
} from "antd";
import {
  AimOutlined,
  ClockCircleOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SaveOutlined,
  FlagOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import axios from "axios";
import { formatDistance, formatDistanceShort } from "@/utils/distanceUtils";
import { getRouteGeoJSON } from "@/services/ORSService";

const { Title, Text } = Typography;

const formatCumulativeTime = (value) => {
  if (value < 1) {
    const seconds = Math.round(value * 60);
    return `${seconds} sec`;
  }
  return `${value.toFixed(1)} min`;
};

export default function RouteSummaryAside({
  distance,
  computed,
  avgSpeedKmh,
  scheduleId,
  onSpeedChange,
}) {
  // responsive width for panel so it never becomes too large
  const [visible, setVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [panelWidth, setPanelWidth] = useState(340); // default width in px

  useEffect(() => {
    // adjust panel width based on viewport so the toggle remains visible and panel isn't huge
    const computeWidth = () => {
      const vw = window.innerWidth;
      if (vw <= 360) setPanelWidth(260);
      else if (vw <= 420) setPanelWidth(280);
      else if (vw <= 540) setPanelWidth(320);
      else setPanelWidth(340);
    };

    computeWidth();
    window.addEventListener("resize", computeWidth);
    return () => window.removeEventListener("resize", computeWidth);
  }, []);

  useEffect(() => {
    if (!scheduleId) return;
    (async () => {
      try {
        const data = await getRouteGeoJSON(scheduleId);
        setAlreadySaved(data?.legs?.length > 0);
      } catch (err) {
        console.error("❌ Failed to load route geojson:", err?.message ?? err);
      }
    })();
  }, [scheduleId]);

  const handleSaveAllLegs = async () => {
    if (!computed?.legs || computed.legs.length === 0) {
      message.warning("No legs to save.");
      return;
    }

    setSaving(true);
    try {
      let cumulative = 0;

      for (const leg of computed.legs) {
        const legMinutes = Number(leg.legMinutes ?? 0);
        cumulative += legMinutes;

        const distanceKm = leg.distanceMeters
          ? parseFloat((leg.distanceMeters / 1000).toFixed(2))
          : null;

        let speedKmh = null;
        if (distanceKm !== null && legMinutes > 0) {
          speedKmh = parseFloat((distanceKm / (legMinutes / 60)).toFixed(2));
        }

        const durationMinutes = parseFloat(cumulative.toFixed(2));

        const payload = {
          schedule_id: scheduleId,
          from_zone_id: leg.fromZoneId ?? null,
          from_terminal_id: leg.fromTerminalId ?? null,
          to_zone_id: leg.toZoneId ?? null,
          to_terminal_id: leg.toTerminalId ?? null,
          distance_km: distanceKm,
          distance_m: leg.distanceMeters ?? null,
          duration_min: durationMinutes,
          speed_kmh: speedKmh,
        };

        // post each leg sequentially (keeps logic same as original)
        await axios.post("/route-legs", payload, {
          headers: { "Content-Type": "application/json", Accept: "application/json" },
        });
      }

      message.success("All route legs saved successfully!");
      setAlreadySaved(true);
    } catch (error) {
      if (error?.response) {
        message.error("Route legs already saved for this schedule.");
      } else {
        message.error("Unexpected error occurred.");
      }
    } finally {
      setSaving(false);
    }
  };

  // small, consistent style objects to keep code tidy and compact
  const styles = {
    container: {
      position: "fixed",
      top: "50%",
      right: 12,
      transform: "translateY(-50%)",
      zIndex: 1400,
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      pointerEvents: "auto",
    },
    toggleBtn: {
      boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
      backgroundColor: "#fff",
      border: "none",
      transition: "transform 0.18s ease",
      width: 44,
      height: 44,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      flexShrink: 0,
    },
    card: {
      borderRadius: 12,
      boxShadow: "0 10px 30px rgba(2,6,23,0.08)",
      border: "1px solid rgba(15,15,15,0.04)",
      width: panelWidth,
      background: "#ffffff",
      overflow: "hidden",
      pointerEvents: "auto",
    },
    cardBody: {
      padding: 16,
    },
    headerTitle: {
      marginBottom: 2,
      color: "#111827",
      fontWeight: 700,
      fontSize: 16,
    },
    headerSub: {
      fontSize: 12,
      color: "#6b7280",
    },
    statIcon: { fontSize: 18 },
    legCard: {
      borderRadius: 10,
      background: "#fbfdff",
      padding: 10,
      boxSizing: "border-box",
    },
    legList: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      maxHeight: 220,
      overflowY: "auto",
      paddingRight: 6,
    },
    label: { color: "#6b7280", fontSize: 12, display: "inline-block", minWidth: 56 },
    value: { fontSize: 13, color: "#111827" },
  };

  return (
    <div style={styles.container} aria-live="polite">
      {/* Toggle Button - kept outside the card so it never gets hidden by card width */}
      <Tooltip title={visible ? "Hide summary" : "Show summary"} placement="left">
        <Button
          type="default"
          shape="circle"
          size="middle"
          icon={visible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={() => setVisible((v) => !v)}
          style={styles.toggleBtn}
          aria-label={visible ? "Collapse route summary" : "Expand route summary"}
        />
      </Tooltip>

      {visible && (
        <Card style={styles.card} bodyStyle={styles.cardBody} size="small">
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {/* Header */}
            <div style={{ textAlign: "left" }}>
              <div style={styles.headerTitle}>Route Summary</div>
              <div style={styles.headerSub}>Quick overview of distance and total time</div>
            </div>

            {/* Stats Row */}
            <Row gutter={12} justify="start" align="middle" style={{ marginTop: 6 }}>
              <Col span={12}>
                <Space direction="horizontal" size={8} align="center">
                  <AimOutlined style={{ ...styles.statIcon, color: "#2563eb" }} />
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>Distance</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{formatDistance(distance)}</div>
                  </div>
                </Space>
              </Col>

              <Col span={12}>
                <Space direction="horizontal" size={8} align="center">
                  <ClockCircleOutlined style={{ ...styles.statIcon, color: "#16a34a" }} />
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>Duration</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {`${Math.round(computed?.totalMinutes || 0)} min`}
                    </div>
                  </div>
                </Space>
              </Col>
            </Row>

            <Divider style={{ margin: "6px 0" }} />

            {/* Leg Details */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", marginBottom: 6 }}>
                Segment Details
              </div>

              <div style={styles.legList}>
                {!computed?.legs?.length ? (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    No waypoint details available.
                  </Text>
                ) : (
                  (() => {
                    let cumulative = 0;
                    return computed.legs.map((leg, idx) => {
                      const legMin = Number(leg.legMinutes || 0);
                      cumulative += legMin;

                      return (
                        <div key={`aside-leg-${idx}`} style={styles.legCard}>
                          <Row justify="space-between" align="middle" style={{ marginBottom: 6 }}>
                            <Col>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  fontWeight: 600,
                                  fontSize: 13,
                                  color: "#1890FF", // professional Ant Design blue
                                }}
                              >
                                <FlagOutlined style={{ fontSize: 15, color: "#1890FF" }} />
                                {`Segment ${idx + 1}`}
                              </div>

                            </Col>

                            <Col>
                              <Tag color="blue" style={{ fontSize: 12, padding: "2px 8px" }}>
                                {formatDistanceShort(leg.distanceMeters)}
                              </Tag>
                            </Col>
                          </Row>

                          <Row style={{ gap: 8 }} align="middle">
                            <Col span={24}>
                              <Text style={styles.label}>From:</Text>
                              <Text style={styles.value}>
                                &nbsp;{leg.from || "Unknown"}
                              </Text>
                            </Col>
                          </Row>

                          <Row style={{ gap: 8, marginTop: 4 }} align="middle">
                            <Col span={24}>
                              <Text style={styles.label}>To:</Text>
                              <Text style={styles.value}>
                                &nbsp;{leg.to || "Unknown"}
                              </Text>
                            </Col>
                          </Row>

                          <Row gutter={8} style={{ marginTop: 8 }}>
                            <Col>
                              <Tag color="green" style={{ padding: "3px 8px", fontSize: 12 }}>
                                Duration: {formatCumulativeTime(legMin)}
                              </Tag>
                            </Col>
                            <Col>
                              <Tag style={{ padding: "3px 8px", fontSize: 12 }}>
                                Cumulative: {formatCumulativeTime(cumulative)}
                              </Tag>
                            </Col>
                          </Row>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>

            <Divider style={{ margin: "6px 0" }} />

            {/* Save button */}
            <Tooltip title={alreadySaved ? "Already saved" : "Save route legs"} placement="top">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveAllLegs}
                loading={saving}
                disabled={alreadySaved}
                block
                style={{
                  borderRadius: 8,
                  height: 38,
                  fontWeight: 600,
                  background: alreadySaved ? "#d1d5db" : "linear-gradient(135deg,#3b82f6,#60a5fa)",
                  border: "none",
                }}
                aria-disabled={alreadySaved}
              >
                {alreadySaved ? "Legs Already Saved" : "Save All Legs"}
              </Button>
            </Tooltip>
          </Space>
        </Card>
      )}
    </div>
  );
}

RouteSummaryAside.propTypes = {
  distance: PropTypes.number,
  computed: PropTypes.shape({
    totalMinutes: PropTypes.number,
    avgSpeedKmh: PropTypes.number,
    legs: PropTypes.arrayOf(
      PropTypes.shape({
        from: PropTypes.string,
        to: PropTypes.string,
        fromZoneId: PropTypes.number,
        fromTerminalId: PropTypes.number,
        toZoneId: PropTypes.number,
        toTerminalId: PropTypes.number,
        distanceMeters: PropTypes.number,
        legMinutes: PropTypes.number,
        cumulativeMinutes: PropTypes.number,
        avgSpeedKmh: PropTypes.number,
      })
    ),
  }),
  scheduleId: PropTypes.number,
  avgSpeedKmh: PropTypes.number.isRequired,
  onSpeedChange: PropTypes.func.isRequired,
};
