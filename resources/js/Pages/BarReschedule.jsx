// resources/js/Pages/BarReschedule.jsx
import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import {
  Layout,
  DatePicker,
  Button,
  Table,
  Modal,
  Tag,
  Empty,
  Tooltip,
  Divider,
  Card,
  Space,
} from "antd";
import dayjs from "dayjs";
import LoadingCube from "@/Components/LoadingCube";
import BarSide from "@/Components/BarSide";
import BarNav from "@/Components/BarNav";
import Feedback from "@/Pages/Feedback";
import {
  ArrowLeftIcon,
  TruckIcon,
  CalendarDaysIcon,
  FlagIcon,
  InformationCircleIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";

const { Content } = Layout;

export default function BarReschedule({ reschedules = [], auth }) {
  const [collapsed, setCollapsed] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [routeDetails, setRouteDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  // Helpers
  const getDuration = (start, end) =>
    !start || !end ? null : Math.floor((new Date(end) - new Date(start)) / 1000);
  const formatDuration = (s) =>
    s == null ? "—" : s < 60 ? `${s}s` : `${Math.floor(s / 60)} min`;
  const getDelayStatus = (plannedMin, actualSec) => {
    if (actualSec == null) return "—";
    const plannedSec = plannedMin * 60;
    return actualSec <= plannedSec ? "On Time" : "Delayed";
  };

  const displayedSchedules = selectedDate
    ? reschedules.filter(
        (s) =>
          dayjs(s.pickup_datetime).format("YYYY-MM-DD") ===
          dayjs(selectedDate).format("YYYY-MM-DD")
      )
    : reschedules;

  const handleViewDetails = async (record) => {
    setSelectedSchedule(record);
    setModalVisible(true);
    setLoading(true);
    setRouteDetails([]);

    try {
      const res = await fetch(`/re-details/${record.id}`);
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      setRouteDetails(data.routeDetails || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load route details.");
    } finally {
      setLoading(false);
    }
  };

  // Table Columns
  const columns = [
    {
      title: "Pickup Date",
      dataIndex: "pickup_datetime",
      key: "pickup_datetime",
      render: (v) => (
        <span className="font-medium text-gray-800">
          {dayjs(v).format("MMMM D, YYYY (h:mm A)")}
        </span>
      ),
    },
    {
      title: "Barangay",
      dataIndex: ["barangay", "name"],
      key: "barangay",
      render: (v) => <span className="text-gray-700 font-semibold">{v || "—"}</span>,
    },
    {
      title: "Truck",
      dataIndex: "truck",
      key: "truck",
      render: (truck) =>
        truck ? (
          <Tooltip title={`${truck.model} (${truck.plate_number})`}>
            <span className="text-gray-700 truncate block max-w-[160px]">
              {truck.model} ({truck.plate_number})
            </span>
          </Tooltip>
        ) : (
          <span className="text-gray-400 italic">Unassigned</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (v) => {
        let color = "";
        let ringColor = "";
        switch (v) {
          case "completed":
            color = "bg-green-500 text-white";
            ringColor = "ring-green-300";
            break;
          case "pending":
            color = "bg-orange-500 text-white";
            ringColor = "ring-orange-300";
            break;
          default:
            color = "bg-gray-400 text-white";
            ringColor = "ring-gray-300";
        }
        return (
          <span
            className={`px-3 py-1 text-sm font-semibold text-center rounded-full ${color} shadow-md ring-2 ${ringColor}`}
          >
            {v.toUpperCase()}
          </span>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Tooltip title="View Route Details">
          <Button
            type="primary"
            onClick={() => handleViewDetails(record)}
            icon={<InformationCircleIcon className="w-5 h-5 text-white" />}
            className="rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
            style={{
              background: "linear-gradient(to right, #2563eb, #1e40af)",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              fontWeight: 500,
            }}
          >
            Details
          </Button>
        </Tooltip>
      ),
    },
  ];

  const segmentColumns = [
    { title: "#", render: (_, __, i) => i + 1, width: 50, align: "center" },
    { title: "From", dataIndex: "from_name", key: "from_name", align: "center" },
    { title: "To", dataIndex: "to_name", key: "to_name", align: "center" },
    {
      title: "Planned Duration",
      dataIndex: "duration_min",
      align: "center",
      render: (min) => `${min} min`,
    },
    {
      title: "Actual Duration",
      align: "center",
      render: (record) =>
        formatDuration(getDuration(record.start_time, record.completed_at)),
    },
    {
      title: "Delay Status",
      align: "center",
      render: (record) => {
        const actualSec = getDuration(record.start_time, record.completed_at);
        const status = getDelayStatus(record.duration_min, actualSec);
        const color =
          status === "On Time"
            ? "text-green-600"
            : status === "Delayed"
            ? "text-red-600"
            : "text-gray-500";
        return <span className={`${color} font-semibold`}>{status}</span>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      align: "center",
      render: (v) =>
        v === "completed" ? (
          <Tag color="green">Completed</Tag>
        ) : (
          <Tag color="gold">Pending</Tag>
        ),
    },
  ];

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Head title="Barangay Route Re-Schedules" />
      <BarSide collapsed={collapsed} toggleCollapsed={toggleCollapsed} />
   <Layout style={{ background: "transparent" }}>
        <BarNav collapsed={collapsed} toggleCollapsed={toggleCollapsed} user={auth.user} />

        <Content className="p-8 mx-auto max-w-[1300px]">
          {/* HEADER */}
          <Card
            bordered={false}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg mb-10 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <TruckIcon className="w-9 h-9" />
                 Re-Scheduled List
                </h1>
                <p className="text-white/80 mt-1">
                  View and monitor all rescheduled pickups.
                </p>
              </div>
              <Button
                onClick={() => history.back()}
                icon={<ArrowLeftIcon className="w-5 h-5" />}
                className="bg-white text-blue-700 hover:bg-gray-100 px-4 py-2 rounded-lg"
              >
                Back
              </Button>
            </div>
          </Card>

          {/* FILTER BAR */}
          <Card className="shadow-sm mb-8 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <Space>
                <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-gray-800">Filter by Pickup Date:</span>
                <DatePicker
                  className="rounded-md w-60"
                  value={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  format="MMMM D, YYYY"
                  allowClear
                />
              </Space>
              <Button onClick={() => setSelectedDate(null)}>Clear</Button>
            </div>
          </Card>

          {/* MAIN TABLE */}
          <Card className="shadow-lg border border-gray-200 rounded-xl">
            {displayedSchedules.length ? (
              <Table
                dataSource={displayedSchedules}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 6 }}
                className="rounded-xl overflow-hidden"
              />
            ) : (
              <Empty description="No reschedules found." />
            )}
          </Card>

          {/* DETAILS MODAL */}
          <Modal
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={null}
            width={950}
            className="rounded-2xl modern-modal"
            centered
            title={
              <div className="flex items-center gap-3 text-blue-700 font-bold text-lg">
                <FlagIcon className="w-6 h-6" />
                Route Segment Details — {selectedSchedule?.barangay?.name || ""}
              </div>
            }
          >
            {loading ? (
              <LoadingCube />
            ) : routeDetails.length ? (
              <Table
                dataSource={routeDetails}
                columns={segmentColumns}
                rowKey="id"
                pagination={false}
                className="rounded-xl overflow-hidden"
              />
            ) : (
              <Empty description="No route segments available." />
            )}
          </Modal>

          {/* FEEDBACK FLOATING BUTTON */}
          <button
            onClick={() => setShowFeedback(true)}
            className="fixed bottom-6 right-6 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
            Feedback
          </button>

          {/* FEEDBACK MODAL */}
          {showFeedback && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-[400px] relative">
                <button
                  onClick={() => setShowFeedback(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                  ✖
                </button>
                <Feedback isModal={true} onClose={() => setShowFeedback(false)} />
              </div>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
