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
  message,
  Card,
  Space,
  Divider,
} from "antd";
import dayjs from "dayjs";
import {
  ArrowLeftIcon,
  TruckIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import BarSide from "@/Components/BarSide";
import BarNav from "@/Components/BarNav";
import LoadingCube from "@/Components/LoadingCube";
import Feedback from "@/Pages/Feedback";

const { Content } = Layout;

export default function BarHistory({ schedules = [], auth }) {
  const [collapsed, setCollapsed] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredSchedules, setFilteredSchedules] = useState(schedules);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [routeDetails, setRouteDetails] = useState([]);
  const [routeSummary, setRouteSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  useEffect(() => {
    if (!selectedDate) {
      setFilteredSchedules(schedules);
    } else {
      const dateStr = dayjs(selectedDate).format("YYYY-MM-DD");
      setFilteredSchedules(
        schedules.filter(
          (s) => dayjs(s.pickup_datetime).format("YYYY-MM-DD") === dateStr
        )
      );
    }
  }, [selectedDate, schedules]);

  const fetchDetails = async (schedule) => {
    try {
      setLoading(true);
      setSelectedSchedule(schedule);
      setDetailsVisible(true);

      const [detailsRes, summaryRes] = await Promise.all([
        fetch(`/route-details/${schedule.id}`),
        fetch(`/route-summary/${schedule.id}`),
      ]);

      if (!detailsRes.ok || !summaryRes.ok) throw new Error("Load failed");

      const detailsData = await detailsRes.json();
      const summaryData = await summaryRes.json();

      setRouteDetails(detailsData.routeDetails || []);
      setRouteSummary(summaryData.summary || null);
    } catch (err) {
      console.error(err);
      message.error("Failed to load route details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDuration = (start, end) =>
    !start || !end ? null : Math.floor((new Date(end) - new Date(start)) / 1000);

  const formatDuration = (s) =>
    s == null ? "—" : s < 60 ? `${s}s` : `${Math.floor(s / 60)} min`;

  const getDelayStatus = (plannedMin, actualSec) => {
    if (actualSec == null) return "—";
    const plannedSec = plannedMin * 60;
    return actualSec <= plannedSec ? "On Time" : "Delayed";
  };

  const columns = [
  {
    title: "Pickup Date",
    dataIndex: "pickup_datetime",
    key: "pickup_datetime",
    align: "left",
    width: 180,
    render: (date) => (
      <span className="font-medium text-gray-800">
        {dayjs(date).format("MMMM D, YYYY (h:mm A)")}
      </span>
    ),
  },
  {
    title: "Barangay",
    dataIndex: ["barangay", "name"],
    key: "barangay",
    align: "left",
    width: 140,
    render: (text) => <span className="text-gray-700">{text || "—"}</span>,
  },
  {
    title: "Truck",
    key: "truck",
    align: "left",
    width: 180,
    render: (_, record) =>
      record.truck ? (
        <Tooltip
          title={`${record.truck.model} (${record.truck.plate_number})`}
        >
          <span className="text-gray-700 truncate block max-w-[160px]">
            {record.truck.model} ({record.truck.plate_number})
          </span>
        </Tooltip>
      ) : (
        <span className="text-gray-400 italic">Unassigned</span>
      ),
  },
  {
    title: "Remarks",
    dataIndex: "remarks",
    key: "remarks",
    align: "left",
    width: 250,
    render: (text) =>
      text ? (
        <Tooltip title={text}>
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm truncate block max-w-[230px]">
            {text}
          </span>
        </Tooltip>
      ) : (
        <span className="text-gray-400 italic">—</span>
      ),
  },
  {
  title: "Status",
  dataIndex: "status",
  key: "status",
  align: "center",
  width: 110,
  render: (status) => {
    let color = "";
    let ringColor = "";

    switch (status) {
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
        break;
    }

    return (
      <span
        className={`px-3 py-1 text-sm font-semibold text-center rounded-full ${color} shadow-md ring-2 ${ringColor}`}
      >
        {status.toUpperCase()}
      </span>
    );
  },
},

  {
  title: "Action",
  key: "action",
  align: "center",
  width: 120,
  render: (_, record) => (
    <Tooltip title="View Route Details">
      <Button
        type="primary"
        icon={<InformationCircleIcon className="w-5 h-5" />}
        className="rounded-full px-4 py-2 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
        onClick={() => fetchDetails(record)}
      >
        Details
      </Button>
    </Tooltip>
  ),
},

];


  const detailColumns = [
    { title: "#", render: (_, __, i) => i + 1, width: 50, align: "center" },
    { title: "From", dataIndex: "from_name", align: "center" },
    { title: "To", dataIndex: "to_name", align: "center" },
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
      render: (status) => (
        <Tag color={status === "completed" ? "green" : "orange"}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Head title="Barangay Route History" />
      <BarSide collapsed={collapsed} toggleCollapsed={toggleCollapsed} />
   <Layout style={{ background: "transparent" }}>
        <BarNav
          collapsed={collapsed}
          toggleCollapsed={toggleCollapsed}
          user={auth.user}
        />
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
                  Scheduled List
                </h1>
                <p className="text-white/80 mt-1">
                  View and analyze previous collection schedules.
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
                <span className="font-semibold text-gray-800">
                  Filter by Pickup Date:
                </span>
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
            {filteredSchedules.length ? (
              <Table
                dataSource={filteredSchedules}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 6 }}
                className="rounded-xl overflow-hidden"
              />
            ) : (
              <Empty description="No schedules found." />
            )}
          </Card>

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

          {/* DETAILS MODAL */}
          <Modal
            open={detailsVisible}
            onCancel={() => setDetailsVisible(false)}
            footer={null}
            width={950}
            className="rounded-2xl modern-modal"
            centered
            title={
              <div className="flex items-center gap-3 text-blue-700 font-bold text-lg">
                <TruckIcon className="w-6 h-6" />
                Route Details — {selectedSchedule?.barangay?.name || ""}
              </div>
            }
          >
            {loading ? (
              <LoadingCube />
            ) : (
              <>
                {routeSummary && (
                  <div className="grid grid-cols-3 gap-5 mb-6">
                    <div className="p-5 bg-green-50 rounded-xl text-center border border-green-200 shadow-sm">
                      <CheckCircleIcon className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-sm font-medium">Completed</p>
                      <p className="text-xl font-bold text-green-700">
                        {routeSummary.completed_count}
                      </p>
                    </div>
                    <div className="p-5 bg-red-50 rounded-xl text-center border border-red-200 shadow-sm">
                      <XCircleIcon className="w-6 h-6 text-red-600 mx-auto mb-1" />
                      <p className="text-sm font-medium">Missed</p>
                      <p className="text-xl font-bold text-red-700">
                        {routeSummary.missed_count}
                      </p>
                    </div>
                    <div className="p-5 bg-blue-50 rounded-xl text-center border border-blue-200 shadow-sm">
                      <ClockIcon className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-sm font-medium">Total Duration</p>
                      <p className="text-xl font-bold text-blue-700">
                        {formatDuration(routeSummary.total_duration)}
                      </p>
                    </div>
                  </div>
                )}
                <Divider />
                {routeDetails.length ? (
                  <Table
                    dataSource={routeDetails}
                    columns={detailColumns}
                    rowKey="id"
                    pagination={false}
                    className="rounded-xl overflow-hidden"
                  />
                ) : (
                  <Empty description="No route details available." />
                )}
              </>
            )}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
}
