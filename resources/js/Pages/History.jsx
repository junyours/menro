import React, { useEffect, useState, useMemo } from "react";
import { Head } from "@inertiajs/react";
import {
  Layout,
  DatePicker,
  Table,
  Modal,
  Descriptions,
  Tag,
  message,
  Tooltip,
  Divider,
} from "antd";
import dayjs from "dayjs";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";
import LoadingCube from "@/Components/LoadingCube";
import {
  TruckIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const { Content } = Layout;

export default function History({ schedules = [], reschedDetails = [], auth }) {
  const [collapsed, setCollapsed] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [routeDetails, setRouteDetails] = useState([]);
  const [routeSummary, setRouteSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Map reschedules by original schedule_id (group as list per schedule)
  const reschedByScheduleId = useMemo(() => {
    const map = {};
    (reschedDetails || []).forEach((d) => {
      if (!d || !d.schedule_id) return;
      if (!map[d.schedule_id]) {
        map[d.schedule_id] = [];
      }
      map[d.schedule_id].push(d);
    });
    return map;
  }, [reschedDetails]);

  // Precompute which dates have schedules
  const scheduleDateStatus = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      const date = dayjs(s.pickup_datetime).format("YYYY-MM-DD");
      if (!map[date]) map[date] = s.status;
    });
    return map;
  }, [schedules]);

  // Filter schedules (show all if no date chosen)
  const filteredSchedules = useMemo(() => {
    if (!selectedDate) return schedules;
    return schedules.filter((s) =>
      dayjs(s.pickup_datetime).isSame(selectedDate, "day")
    );
  }, [selectedDate, schedules]);

  // Fetch details when selecting a schedule
  useEffect(() => {
    if (!selectedSchedule) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [resDetails, resSummary] = await Promise.all([
          fetch(`/route-details/${selectedSchedule.id}`),
          fetch(`/route-summary/${selectedSchedule.id}`),
        ]);
        if (!resDetails.ok || !resSummary.ok)
          throw new Error("Failed to fetch route data.");

        const dataDetails = await resDetails.json();
        const dataSummary = await resSummary.json();
        setRouteDetails(dataDetails.routeDetails || []);
        setRouteSummary(dataSummary.summary || null);
      } catch (err) {
        console.error(err);
        message.error("Error loading schedule details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSchedule]);

  // Helpers
  const getDuration = (start, end) =>
    start && end ? Math.floor((new Date(end) - new Date(start)) / 1000) : null;

  const formatDuration = (seconds) => {
    if (seconds === null) return "—";
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  const getDelayStatus = (plannedMin, actualSec) => {
    if (actualSec == null) return "—";
    const plannedSec = plannedMin * 60;
    return actualSec <= plannedSec ? "On Time" : "Delayed";
  };

  // Table Columns
  const scheduleColumns = [
    {
      title: "Barangay",
      dataIndex: ["barangay", "name"],
      key: "barangay",
      render: (text) => (
        <span className="font-semibold text-gray-800">{text || "—"}</span>
      ),
    },
    {
      title: "Truck",
      key: "truck",
      render: (record) => (
        <span className="text-gray-700">
          {record.truck
            ? `${record.truck.model} (${record.truck.plate_number})`
            : "Unassigned"}
        </span>
      ),
    },
    {
      title: "Driver",
      key: "driver",
      render: (record) => (
        <span className="text-gray-700">
          {record.driver?.user?.name || "Unassigned"}
        </span>
      ),
    },
    {
      title: "Pickup Date",
      dataIndex: "pickup_datetime",
      key: "pickup_datetime",
      render: (text) => (
        <span className="text-gray-600">
          {dayjs(text).format("MMM D, YYYY h:mm A")}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const map = {
          completed: { color: "success", text: "Completed" },
          in_progress: { color: "processing", text: "In Progress" },
        };
        return (
          <Tag color={map[status]?.color || "warning"} className="rounded-md">
            {map[status]?.text || status}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Tooltip title="View Schedule Details">
          <button
            onClick={() => {
              setSelectedSchedule(record);
              setModalVisible(true);
            }}
            className="text-indigo-600 hover:text-indigo-800 font-medium transition-all duration-200 hover:underline"
          >
            View →
          </button>
        </Tooltip>
      ),
    },
  ];

  const reschedColumns = [
    { title: "#", render: (_, __, i) => i + 1, width: 60 },
    {
      title: "Rescheduled Driver",
      key: "resched_driver",
      render: (record) => (
        <span className="text-gray-700">
          {record.reschedule?.driver?.user?.name || "Unassigned"}
        </span>
      ),
    },
    {
      title: "Rescheduled Pickup Date",
      key: "resched_pickup",
      render: (record) => (
        <span className="text-gray-600">
          {record.reschedule?.pickup_datetime
            ? dayjs(record.reschedule.pickup_datetime).format(
              "MMM D, YYYY h:mm A"
            )
            : "—"}
        </span>
      ),
    },
  ];

  const routeColumns = [
    { title: "#", render: (_, __, i) => i + 1, width: 50 },
    { title: "From", dataIndex: "from_name" },
    { title: "To", dataIndex: "to_name" },
    {
      title: "Planned (min)",
      dataIndex: "duration_min",
      align: "center",
    },
    {
      title: "Actual",
      align: "center",
      render: (record) =>
        formatDuration(getDuration(record.start_time, record.completed_at)),
    },
    {
      title: "Delay",
      align: "center",
      render: (record) => {
        const status = getDelayStatus(
          record.duration_min,
          getDuration(record.start_time, record.completed_at)
        );
        return (
          <Tag
            color={status === "On Time" ? "success" : "error"}
            className="rounded-lg"
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      align: "center",
      dataIndex: "status",
      render: (status) =>
        status === "completed" ? (
          <Tag color="success" className="rounded-lg">
            Completed
          </Tag>
        ) : (
          <Tag color="warning" className="rounded-lg">
            {status}
          </Tag>
        ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Head title="Admin Schedules" />
      <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />

      <Layout>
        <Navbar collapsed={collapsed} setCollapsed={setCollapsed} auth={auth} />

        <Content className="p-10 bg-gray-100 min-h-screen">
          {/* HEADER */}
          <div
            className="mb-8"
            style={{
              borderRadius: 16,
              padding: "24px",
              background: "linear-gradient(135deg, #1e3a8a 0%, #f9fafb 100%)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                <TruckIcon className="w-9 h-9 text-white" />
                <div className="flex flex-col">
                  <h1
                    className="text-3xl font-extrabold flex items-center gap-3 tracking-tight"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      color: "#ffffff",
                      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    Schedule list
                  </h1>
                  <p
                    className="mt-2 text-sm md:text-base"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.85)",
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}
                  >
                    Analyze all collection schedules and performance insights.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* DATE FILTER */}
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-md border border-gray-100 mb-8">
            <label className="block mb-3 font-semibold text-gray-700 flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-indigo-500" />
              Filter by Pickup Date
            </label>
            <DatePicker
              className="w-full h-12 text-base rounded-xl border-gray-200 hover:border-indigo-400 focus:border-indigo-500"
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              format="MMMM D, YYYY"
              placeholder="Select a date to filter schedules (optional)"
              allowClear
              dateRender={(current) => {
                const formatted = current.format("YYYY-MM-DD");
                const status = scheduleDateStatus[formatted];
                const style =
                  status === "completed"
                    ? "bg-green-100 text-green-700 font-semibold"
                    : status === "in_progress"
                      ? "bg-yellow-100 text-yellow-700 font-semibold"
                      : "";
                return (
                  <div
                    className={`w-full h-full flex items-center justify-center rounded-md ${style}`}
                  >
                    {current.date()}
                  </div>
                );
              }}
            />
          </div>

          {/* TABLE */}
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-md border border-gray-100 transition-all">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">
              {selectedDate
                ? `Schedules for ${selectedDate.format("MMMM D, YYYY")}`
                : "All Schedules"}
            </h2>

            {filteredSchedules.length > 0 ? (
              <Table
                dataSource={filteredSchedules}
                columns={scheduleColumns}
                rowKey="id"
                bordered={false}
                className="rounded-2xl"
                pagination={{ pageSize: 5 }}
                rowClassName="hover:bg-indigo-50 transition-colors duration-150"
              />
            ) : (
              <p className="text-gray-500 italic">No schedules found.</p>
            )}
          </div>

          {/* MODAL */}
          <Modal
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={null}
            width={950}
            className="rounded-3xl overflow-hidden"
            bodyStyle={{
              background: "linear-gradient(to bottom right, #f9fafb, #f1f5f9)",
            }}
            title={
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <ClockIcon className="w-5 h-5 text-indigo-500" />
                Schedule Overview
              </div>
            }
          >
            {loading ? (
              <LoadingCube />
            ) : (
              selectedSchedule && (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="Barangay">
                        {selectedSchedule.barangay?.name || "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Truck">
                        {selectedSchedule.truck
                          ? `${selectedSchedule.truck.model} (${selectedSchedule.truck.plate_number})`
                          : "Unassigned"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Driver">
                        {selectedSchedule.driver?.user?.name || "Unassigned"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Pickup Date">
                        {dayjs(selectedSchedule.pickup_datetime).format(
                          "MMM D, YYYY h:mm A"
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color="processing">{selectedSchedule.status}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Completed Date">
                        {selectedSchedule.completed_at ? (
                          dayjs(selectedSchedule.completed_at).format("MMM D, YYYY h:mm A")
                        ) : (
                          <span style={{ color: "#facc15", fontWeight: "700" }}>
                            Not completed yet
                          </span>
                        )}
                      </Descriptions.Item>

                      <Descriptions.Item label="Remarks" span={2}>
                        {selectedSchedule.remarks || "No remarks"}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>

                  {reschedByScheduleId[selectedSchedule.id] &&
                    reschedByScheduleId[selectedSchedule.id].length > 0 && (
                      <div className="bg-white p-4 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">
                          Reschedule Details
                        </h3>
                        <Table
                          dataSource={reschedByScheduleId[selectedSchedule.id]}
                          columns={reschedColumns}
                          rowKey="id"
                          bordered
                          pagination={false}
                          className="rounded-xl"
                        />
                      </div>
                    )}

                  {routeSummary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <SummaryCard
                        color="green"
                        label="Completed"
                        value={routeSummary.completed_count}
                      />
                      <SummaryCard
                        color="red"
                        label="Missed"
                        value={routeSummary.missed_count}
                      />
                      <SummaryCard
                        color="amber"
                        label="Reasons"
                        value={routeSummary.missed_reasons || "—"}
                      />
                      <SummaryCard
                        color="blue"
                        label="Total Duration"
                        value={formatDuration(routeSummary.total_duration)}
                      />
                    </div>
                  )}

                  <Divider className="my-4" />

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                      Route Details
                    </h3>
                    {routeDetails.length > 0 ? (
                      <Table
                        dataSource={routeDetails}
                        columns={routeColumns}
                        rowKey="id"
                        bordered
                        pagination={false}
                        className="rounded-xl"
                      />
                    ) : (
                      <p className="text-gray-500 italic">
                        No route details found for this schedule.
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
}

// Modern summary cards
function SummaryCard({ color, label, value }) {
  const colorMap = {
    green: "from-green-400 to-emerald-500",
    red: "from-red-400 to-rose-500",
    blue: "from-blue-400 to-indigo-500",
    amber: "from-amber-400 to-orange-500",
  };

  return (
    <div
      className={`bg-gradient-to-r ${colorMap[color]} text-white rounded-2xl p-5 shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200`}
    >
      <p className="text-sm opacity-90">{label}</p>
      <p className="text-2xl font-extrabold mt-1 tracking-tight">{value}</p>
    </div>
  );
}