import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Table,
  Spin,
  Card,
  Tag,
  Empty,
  Space,
  Row,
  Col,
  message,
  Button,
  Dropdown,
  Menu,
  DatePicker,
  Input,
  Divider,
} from "antd";
import { Head } from "@inertiajs/react";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";
import {
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

export default function ScheduleReports({
  auth,
  pendingReports: initialPending,
  approvedReports: initialApproved,
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pendingReports, setPendingReports] = useState([]);
  const [approvedReports, setApprovedReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const formatReports = (reports) =>
    reports.map((item) => ({
      key: item.id,
      id: item.id,
      barangay: item.barangay?.name || `Barangay ${item.barangay_id}`,
      submitted_at: item.submitted_at
        ? dayjs.utc(item.submitted_at).format("D MMM YYYY, h:mm A")
        : "-",
      status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      zone_reports:
        item.zone_reports?.map((zr) => ({
          id: zr.id,
          zone: { name: zr.zone?.name || `Zone ${zr.zone_id}` },
          is_segregated: zr.is_segregated,
        })) || [],
    }));

  useEffect(() => {
    setPendingReports(formatReports(initialPending));
    setApprovedReports(formatReports(initialApproved));
  }, [initialPending, initialApproved]);

  // ✅ REFRESH (local)
  const reloadReports = () => {
    setLoading(true);
    setTimeout(() => {
      setPendingReports(formatReports(initialPending));
      setApprovedReports(formatReports(initialApproved));
      message.success("Reports refreshed.");
      setLoading(false);
    }, 1000);
  };

  // ✅ Update report status (with backend)
  const handleAction = async (reportId, newStatus) => {
    try {
      setLoading(true);

      const response = await axios.put(`/weekly-reports/${reportId}/status`, {
        status: newStatus.toLowerCase(),
      });

      if (response.data.status) {
        // Update frontend state after backend success
        const updateStatus = (reports) =>
          reports.map((r) =>
            r.id === reportId
              ? { ...r, status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1) }
              : r
          );

        if (newStatus === "Approved") {
          const report = pendingReports.find((r) => r.id === reportId);
          if (report) {
            setApprovedReports([
              ...approvedReports,
              { ...report, status: "Approved" },
            ]);
            setPendingReports(pendingReports.filter((r) => r.id !== reportId));
          }
        } else if (newStatus === "Rejected") {
          setPendingReports(updateStatus(pendingReports));
          setApprovedReports(updateStatus(approvedReports));
        } else if (newStatus === "pending") {
          const report = approvedReports.find((r) => r.id === reportId);
          if (report) {
            setPendingReports([
              ...pendingReports,
              { ...report, status: "Pending" },
            ]);
            setApprovedReports(approvedReports.filter((r) => r.id !== reportId));
          }
        }

        message.success(`Report marked as ${newStatus}.`);
      } else {
        message.error("Failed to update report status.");
      }
    } catch (error) {
      console.error(error);
      message.error("Something went wrong while updating status.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setDateFilter("");
  };

  // ✅ Status Tag Styling
  const statusTag = (status) => {
    const colors = {
      approved: "#52c41a",
      rejected: "#f5222d",
      pending: "#fa8c16",
      scheduled: "#1890ff",
    };
    const color = colors[status.toLowerCase()] || "#d9d9d9";
    return (
      <Tag
        style={{
          backgroundColor: `${color}20`,
          color,
          fontWeight: 600,
          borderRadius: 20,
          padding: "0 14px",
          height: 30,
          display: "flex",
          alignItems: "center",
          boxShadow: `0 2px 8px ${color}22`,
        }}
      >
        {status}
      </Tag>
    );
  };

  const pendingColumns = [
    {
      title: "Barangay",
      dataIndex: "barangay",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Submitted At",
      dataIndex: "submitted_at",
      render: (date) => <Text>{date}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: statusTag,
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<CheckOutlined />}
            style={{
              background: "linear-gradient(135deg,#52c41a,#73d13d)",
              border: "none",
              borderRadius: 20,
            }}
            onClick={() => handleAction(record.id, "Approved")}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            style={{ borderRadius: 20 }}
            onClick={() => handleAction(record.id, "Rejected")}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const approvedColumns = [
    {
      title: "Barangay",
      dataIndex: "barangay",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Submitted At",
      dataIndex: "submitted_at",
      render: (date) => <Text>{date}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: statusTag,
    },
    {
      title: "Actions",
      align: "center",
      render: (_, record) => {
        const menu = (
          <Menu
            items={[
              {
                key: "rejected",
                label: "Mark as Rejected",
                onClick: () => handleAction(record.id, "Rejected"),
              },
              {
                key: "pending",
                label: "Move to Pending",
                onClick: () => handleAction(record.id, "pending"),
              },
            ]}
          />
        );
        return (
          <Dropdown overlay={menu} trigger={["click"]}>
            <Button
              shape="circle"
              icon={<MoreOutlined />}
              style={{
                border: "none",
                background: "#f0f0f0",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
            />
          </Dropdown>
        );
      },
    },
  ];

  const expandedRowRender = (record) => (
    <div style={{ padding: "12px 0" }}>
      <Row gutter={[16, 16]}>
        {record.zone_reports.length ? (
          record.zone_reports.map((zr) => (
            <Col xs={24} sm={12} md={8} lg={6} key={zr.id}>
              <Card
                hoverable
                style={{
                  borderRadius: 16,
                  textAlign: "center",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                }}
              >
                <Text strong>{zr.zone.name}</Text>
                <Tag
                  style={{
                    marginTop: 8,
                    background: zr.is_segregated
                      ? "linear-gradient(135deg,#73d13d,#95de64)"
                      : "linear-gradient(135deg,#ff4d4f,#ff7875)",
                    color: "#fff",
                    fontWeight: 600,
                    borderRadius: 16,
                    padding: "2px 12px",
                    display: "inline-block",
                  }}
                >
                  {zr.is_segregated ? "Segregated" : "Not Segregated"}
                </Tag>
              </Card>
            </Col>
          ))
        ) : (
          <Text type="secondary">No zones found</Text>
        )}
      </Row>
    </div>
  );

  const filterReports = (reports) =>
    reports.filter((r) => {
      const matchBarangay = r.barangay
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchZone = r.zone_reports.some((zr) =>
        zr.zone.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchDate = dateFilter
        ? r.submitted_at.includes(dayjs(dateFilter).format("D MMM YYYY"))
        : true;
      return (matchBarangay || matchZone) && matchDate;
    });

  const filteredPending = filterReports(pendingReports);
  const filteredApproved = filterReports(approvedReports);

  return (
   <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
  <Head title="Weekly Barangay Garbage Plan" />
  <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
  <Layout style={{ background: "transparent" }}> 
    <Navbar auth={auth} collapsed={collapsed} setCollapsed={setCollapsed} />

    <Content style={{ padding: "24px 32px", background: "transparent" }}> 
     {/* Title Container */}
<div
  style={{
    background: "linear-gradient(135deg, #1e3a8a 0%, #f9fafb 100%)", // dark blue left → soft white right
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)", // subtle container shadow
    padding: "24px",
    marginBottom: 24,
  }}
>
  <h3
    style={{
      fontFamily: "Poppins, sans-serif",
      fontWeight: 700,
      fontSize: "1.75rem",
      marginBottom: 8,
      color: "#ffffff", // white text for contrast
      textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)", // subtle text shadow
    }}
  >
    Weekly Barangay Garbage Plan
  </h3>
  <p
    style={{
      fontFamily: "Inter, sans-serif",
      fontWeight: 400,
      fontSize: "0.95rem",
      color: "rgba(255,255,255,0.85)", // light text for readability
      marginBottom: 0,
      textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)", // subtle text shadow
    }}
  >
    Review weekly barangay plans.
  </p>
</div>

      {/* Filters */}
      <Space style={{ marginBottom: 20 }}>
        <Search
          placeholder="Search Barangay or Zone"
          allowClear
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 260 }}
        />
        <DatePicker
          value={dateFilter ? dayjs(dateFilter) : null}
          onChange={(date, dateString) => setDateFilter(dateString)}
          placeholder="Filter by Date"
        />
        <Button onClick={handleReset}>Reset</Button>
      </Space>

      {/* Pending Plans */}
      <Card
        title="Pending Plans"
        style={{
          borderRadius: 16,
          marginBottom: 32,
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          background: "#ffffff",
        }}
      >
        {filteredPending.length > 0 ? (
          <Table
            columns={pendingColumns}
            dataSource={filteredPending}
            expandable={{
              expandedRowRender,
              expandRowByClick: true,
            }}
            pagination={{ pageSize: 5 }}
            rowKey="id"
          />
        ) : (
          <Empty description="No pending datas" />
        )}
      </Card>

      {/* Approved Plans */}
      <Card
        title="Approved Plans"
        style={{
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          background: "#ffffff",
        }}
      >
        {filteredApproved.length > 0 ? (
          <Table
            columns={approvedColumns}
            dataSource={filteredApproved}
            expandable={{
              expandedRowRender,
              expandRowByClick: true,
            }}
            pagination={{ pageSize: 5 }}
            rowKey="id"
          />
        ) : (
          <Empty description="No approved reports" />
        )}
      </Card>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      )}
    </Content>
  </Layout>
</Layout>
 );
}
