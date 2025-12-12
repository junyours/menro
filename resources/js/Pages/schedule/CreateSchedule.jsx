import React, { useState, useEffect } from "react";
import {
  Layout,
  Button,
  Typography,
  Table,
  Tag,
  Card,
  DatePicker,
  Row,
  Col,
  Dropdown,
  Menu,
  message,
  Input,
  Tooltip,
  Divider,
} from "antd";
import { Head } from "@inertiajs/react";
import {
  PlusCircleOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  ReloadOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";
import CreateScheduleModal from "@/modal/CreateScheduleModal";
import EditScheduleModal from "@/modal/EditScheduleModal";
import LoadingCube from "@/Components/LoadingCube";
import dayjs from "dayjs";
import axios from "axios";

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function ManageSchedule({
  auth,
  trucks = [],
  truckDriverMap = [],
  barangays = [],
  schedules: initialSchedules = [],
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editData, setEditData] = useState(null);
  const [schedules, setSchedules] = useState(initialSchedules);
  const [filteredSchedules, setFilteredSchedules] = useState(initialSchedules);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [initialSchedules]);

  const handleTableChange = (newPagination) => {
    setLoading(true);
    setPagination(newPagination);
    setTimeout(() => setLoading(false), 800);
  };

  const handleSearch = () => {
    let filtered = schedules;
    if (selectedDate) {
      filtered = filtered.filter((s) =>
        dayjs(s.pickup_datetime).isSame(selectedDate, "day")
      );
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.truck?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.driver?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.barangay?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredSchedules(filtered);
  };

  const handleReset = () => {
    setSelectedDate(null);
    setSearchTerm("");
    setFilteredSchedules(schedules);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await axios.patch(`/schedules/${id}/status`, { status });
      if (response.data.success) {
        const updatedSchedules = schedules.map((s) =>
          s.id === id ? { ...s, status } : s
        );
        setSchedules(updatedSchedules);
        setFilteredSchedules(updatedSchedules);
        message.success(response.data.message);
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to update schedule status");
    }
  };

  const handleEdit = (record) => {
    setEditData(record);
    setIsEditModalVisible(true);
  };

  const statusColors = {
    ongoing: { gradient: "linear-gradient(135deg,#52c41a,#b7eb8f)", color: "#fff" },
    pending: { gradient: "linear-gradient(135deg,#faad14,#ffe58f)", color: "#fff" },
    completed: { gradient: "linear-gradient(135deg,#1890ff,#91d5ff)", color: "#fff" },
    deleted: { gradient: "linear-gradient(135deg,#ff4d4f,#ffccc7)", color: "#fff" },
    default: { gradient: "#f0f0f0", color: "#555" },
  };

  const columns = [
    {
      title: "Truck",
      key: "truck",
      render: (_, record) =>
        record.truck
          ? `${record.truck.model} (${record.truck.plate_number})`
          : "N/A",
    },
    {
      title: "Driver",
      key: "driver",
      render: (_, record) => record.driver?.user?.name || "N/A",
    },
    {
      title: "Barangay",
      key: "barangay",
      render: (_, record) => record.barangay?.name || "N/A",
    },
    {
      title: "Date & Time",
      dataIndex: "pickup_datetime",
      key: "pickup_datetime",
      render: (text) => dayjs(text).format("MMMM D, YYYY, h:mm A"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const s = statusColors[status?.toLowerCase()] || statusColors.default;
        return (
          <Tag
            style={{
              background: s.gradient,
              color: s.color,
              fontWeight: 600,
              borderRadius: "24px",
              padding: "6px 18px",
              fontSize: "14px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              textTransform: "capitalize",
            }}
          >
            {status || "N/A"}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const menu = (
          <Menu>
            <Menu.Item
              key="edit"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ fontWeight: 600 }}
            >
              Edit Schedule
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              key="deleted"
              onClick={() => handleUpdateStatus(record.id, "Deleted")}
              style={{ color: "red", fontWeight: 600 }}
            >
              Mark as Deleted
            </Menu.Item>
          </Menu>
        );
        return (
          <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
            <Button
              type="text"
              icon={<MoreOutlined />}
              style={{ fontSize: "18px", color: "#555" }}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
  <Layout style={{ minHeight: "100vh", background: "#f5f8fc" }}>
    <Head title="Manage Schedule" />

    <Sidebar
      collapsible
      collapsed={collapsed}
      onCollapse={() => setCollapsed(!collapsed)}
    />

   <Layout style={{ background: "transparent" }}>
      <Navbar auth={auth} collapsed={collapsed} setCollapsed={setCollapsed} />

      <Content style={{ margin: "24px", transition: "all 0.3s ease" }}>
        {loading ? (
          <LoadingCube />
        ) : (
          <>
            {/* -------------------------------------- */}
            {/* HEADER WITHOUT CARD — CLEAN & SIMPLE   */}
            {/* -------------------------------------- */}
       {/* -------------------------------------- */}
{/* HEADER WITH GRADIENT & SHADOW        */}
{/* -------------------------------------- */}
<div
  style={{
    borderRadius: 16,
    padding: "24px",
    marginBottom: 24,
    background: "linear-gradient(135deg, #1e3a8a 0%, #f9fafb 100%)", // dark blue left → soft white right
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)", // subtle shadow
  }}
>
  <Title
    level={3}
    style={{
      fontWeight: 700,
      marginBottom: 4,
      fontFamily: "Poppins, Inter, sans-serif",
      letterSpacing: "0.3px",
      color: "#ffffff", // white text for contrast
      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
    }}
  >
    Manage Garbage Collection Schedules
  </Title>

  <Text
    style={{
      fontFamily: "Inter, sans-serif",
      fontSize: 15,
      letterSpacing: "0.2px",
      color: "rgba(255,255,255,0.85)", // light subtitle text
      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
    }}
  >
    View, filter, and manage all garbage collection schedules efficiently from this dashboard.
  </Text>

</div>


            {/* -------------------------------------- */}
            {/* FILTER SECTION                         */}
            {/* -------------------------------------- */}
            <Card
              style={{
                borderRadius: 16,
                marginBottom: 20,
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                background: "linear-gradient(to bottom right, #ffffff, #f7fbff)",
                border: "1px solid #e6f7ff",
              }}
            >
              <Paragraph
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#555",
                  marginBottom: 12,
                }}
              >
                <InfoCircleOutlined style={{ color: "#1890ff", marginRight: 8 }} />
                Use the filters below to search by truck, driver, barangay, or date.
              </Paragraph>

              <Row gutter={[12, 12]} align="middle">
                <Col xs={24} md={10} lg={8}>
                  <Input
                    placeholder="Search by truck, driver, or barangay..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    prefix={<SearchOutlined style={{ color: "#1890ff" }} />}
                    style={{
                      borderRadius: 12,
                      height: 40,
                      boxShadow: "0 4px 12px rgba(24,144,255,0.1)",
                    }}
                  />
                </Col>

                <Col xs={24} md={8} lg={6}>
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    placeholder="Select date"
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      height: 40,
                      boxShadow: "0 4px 12px rgba(24,144,255,0.1)",
                    }}
                  />
                </Col>

                <Col>
                  <Tooltip title="Search">
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      shape="circle"
                      onClick={handleSearch}
                      style={{
                        background: "linear-gradient(135deg, #1890ff, #40a9ff)",
                      }}
                    />
                  </Tooltip>
                </Col>

                <Col>
                  <Tooltip title="Reset Filters">
                    <Button
                      icon={<ReloadOutlined />}
                      shape="circle"
                      onClick={handleReset}
                    />
                  </Tooltip>
                </Col>

                <Col flex="auto" style={{ textAlign: "right" }}>
                  <Button
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    onClick={() => setIsModalVisible(true)}
                    style={{
                      borderRadius: 12,
                      height: 40,
                      fontWeight: 600,
                      background: "linear-gradient(135deg,#52c41a,#73d13d)",
                      boxShadow: "0 4px 14px rgba(82,196,26,0.3)",
                    }}
                  >
                    Add Schedule
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* -------------------------------------- */}
            {/* TABLE SECTION                          */}
            {/* -------------------------------------- */}
            <Card
              style={{
                borderRadius: 16,
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              }}
              bodyStyle={{ padding: 0 }}
            >
              <Table
                columns={columns}
                dataSource={filteredSchedules}
                rowKey="id"
                pagination={pagination}
                onChange={handleTableChange}
                style={{ borderRadius: "16px" }}
                rowClassName={(record, index) =>
                  index % 2 === 0 ? "table-row-even" : "table-row-odd"
                }
                scroll={{ x: "max-content" }}
              />
            </Card>

            {/* -------------------------------------- */}
            {/* MODALS                                 */}
            {/* -------------------------------------- */}
            <CreateScheduleModal
              visible={isModalVisible}
              onCancel={() => setIsModalVisible(false)}
              trucks={trucks}
              truckDriverMap={truckDriverMap}
              barangays={barangays}
              onSuccess={(newSchedule) => {
                setIsModalVisible(false);
                if (newSchedule) {
                  const updated = [newSchedule, ...schedules];
                  setSchedules(updated);
                  setFilteredSchedules(updated);
                }
              }}
            />

            <EditScheduleModal
              visible={isEditModalVisible}
              onCancel={() => {
                setIsEditModalVisible(false);
                setEditData(null);
              }}
              data={editData}
              trucks={trucks}
              truckDriverMap={truckDriverMap}
              barangays={barangays}
              onSuccess={(updated) => {
                setIsEditModalVisible(false);
                if (updated) {
                  const updatedList = schedules.map((s) =>
                    s.id === updated.id ? updated : s
                  );
                  setSchedules(updatedList);
                  setFilteredSchedules(updatedList);
                }
              }}
            />
          </>
        )}
      </Content>
    </Layout>

    <style>
      {`
        .table-row-even:hover, .table-row-odd:hover {
          background: rgba(24, 144, 255, 0.05);
        }
        .table-row-even { background: #ffffff; }
        .table-row-odd { background: #f9f9f9; }
        .ant-table-thead > tr > th {
          background: #e6f7ff;
          font-weight: 600;
          color: #1f1f1f;
        }
        .ant-pagination-item-active {
          background-color: #1890ff !important;
          border-color: #1890ff !important;
        }
      `}
    </style>
  </Layout>
);
}
