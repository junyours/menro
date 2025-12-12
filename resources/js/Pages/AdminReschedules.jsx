// resources/js/Pages/Reports/AdminReschedule.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Head } from "@inertiajs/react";
import {
  Layout,
  DatePicker,
  Table,
  Modal,
  Descriptions,
  Tag,
  Divider,
  message,
} from "antd";
import dayjs from "dayjs";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";
import LoadingCube from "@/Components/LoadingCube";
import {
  TruckIcon,
  CalendarDaysIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";

const { Content } = Layout;

export default function AdminReschedule({ reschedules = [], auth }) {
  const [collapsed, setCollapsed] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Filter schedules by selected date
  const filteredSchedules = useMemo(() => {
    if (!selectedDate) return reschedules;
    return reschedules.filter((s) =>
      dayjs(s.pickup_datetime).isSame(selectedDate, "day")
    );
  }, [selectedDate, reschedules]);

  // Fetch segment details
  const handleViewDetails = async (schedule) => {
    setSelectedSchedule(schedule);
    setSegments([]);
    setModalVisible(true);
    setLoading(true);

    try {
      const res = await fetch(`/reschedule-details/${schedule.id}`);
      if (!res.ok) throw new Error("Failed to fetch segments");
      const data = await res.json();

      const list = (data.routeDetails || []).map((d, i) => {
        const plannedMin =
          d.duration_min ?? Math.round((d.duration_seconds || 0) / 60) ?? 0;
        const actualStart = d.start_time ? dayjs(d.start_time) : null;
        const actualEnd = d.completed_at ? dayjs(d.completed_at) : null;
        let delayStatus = "—";

        if (actualStart && actualEnd && plannedMin) {
          const actualDuration = actualEnd.diff(actualStart, "minute");
          delayStatus = actualDuration <= plannedMin ? "On Time" : "Delayed";
        }

        return {
          id: d.id,
          no: i + 1,
          start_location: d.from_name || d.start_location || "—",
          end_location: d.to_name || d.end_location || "—",
          planned_min: plannedMin,
          actual_start: d.start_time ?? null,
          actual_end: d.completed_at ?? null,
          status: d.status ?? "—",
          delay_status: delayStatus,
        };
      });

      setSegments(list);
    } catch (err) {
      console.error(err);
      message.error("Failed to load segments for this reschedule.");
    } finally {
      setLoading(false);
    }
  };

  const scheduleColumns = [
    {
      title: "Barangay",
      dataIndex: ["barangay", "name"],
      key: "barangay",
      render: (text) => <span className="font-semibold">{text || "—"}</span>,
    },
    {
      title: "Truck",
      key: "truck",
      render: (record) =>
        record.truck
          ? `${record.truck.model} (${record.truck.plate_number})`
          : "Unassigned",
    },
    {
      title: "Driver",
      key: "driver",
      render: (record) =>
        record.driver?.user?.name || "Unassigned",
    },
    {
      title: "Pickup Date",
      dataIndex: "pickup_datetime",
      key: "pickup_datetime",
      render: (text) =>
        text ? dayjs(text).format("MMM D, YYYY h:mm A") : "—",
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render: (status) => {
        const map = {
          completed: { color: "green", text: "Completed" },
          pending: { color: "gold", text: "Pending" },
          in_progress: { color: "blue", text: "In Progress" },
        };
        return (
          <Tag color={map[status]?.color || "gray"} className="rounded-md">
            {map[status]?.text || status}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <button
          onClick={() => handleViewDetails(record)}
          className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
        >
          View Details →
        </button>
      ),
    },
  ];

  const segmentColumns = [
    { title: "#", dataIndex: "no", key: "no", width: 60 },
    { title: "From", dataIndex: "start_location", key: "start_location" },
    { title: "To", dataIndex: "end_location", key: "end_location" },
    {
      title: "Planned (min)",
      dataIndex: "planned_min",
      key: "planned_min",
      align: "center",
    },
    {
      title: "Actual Start",
      dataIndex: "actual_start",
      key: "actual_start",
      render: (v) => (v ? dayjs(v).format("MMM D, YYYY h:mm A") : "—"),
    },
    {
      title: "Actual End",
      dataIndex: "actual_end",
      key: "actual_end",
      render: (v) => (v ? dayjs(v).format("MMM D, YYYY h:mm A") : "—"),
    },
    {
      title: "Delay",
      dataIndex: "delay_status",
      key: "delay_status",
      align: "center",
      render: (v) => (
        <Tag
          color={v === "On Time" ? "green" : v === "Delayed" ? "red" : "gray"}
        >
          {v}
        </Tag>
      ),
    },
    { title: "Status", dataIndex: "status", key: "status", align: "center" },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Head title="Admin Reschedules" />
      <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />
      <Layout>
        <Navbar collapsed={collapsed} setCollapsed={setCollapsed} auth={auth} />
        <Content className="p-10 bg-gray-100 min-h-screen">
         {/* -------------------------------------- */}
{/* HEADER WITH GRADIENT & SHADOW        */}
{/* -------------------------------------- */}
<div
  className="mb-8"
  style={{
    borderRadius: 16,
    padding: "24px",
    background: "linear-gradient(135deg, #1e3a8a 0%, #f9fafb 100%)", // dark blue left → soft white right
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)", // subtle shadow
  }}
>
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
    {/* Title + Description */}
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
      <TruckIcon className="w-9 h-9 text-white" /> {/* White icon for contrast */}
      <div className="flex flex-col">
        {/* Title */}
        <h1
          className="text-3xl font-extrabold flex items-center gap-3"
          style={{
            fontFamily: "Poppins, sans-serif",
            color: "#ffffff",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          Re-Schedules List
        </h1>

        {/* Description */}
        <p
          className="mt-2 text-sm md:text-base"
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          View all reschedules and their details, including drivers and trucks.
        </p>
      </div>
    </div>
  </div>
</div>


          {/* Date Filter */}
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
              placeholder="Select a date (optional)"
              allowClear
            />
          </div>

          {/* Table */}
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-md border border-gray-100">
            <Table
              dataSource={filteredSchedules}
              columns={scheduleColumns}
              rowKey="id"
              bordered={false}
              pagination={{ pageSize: 5 }}
              rowClassName="hover:bg-indigo-50 transition-colors duration-150"
            />
          </div>

          {/* Modal */}
          <Modal
            open={modalVisible}
            onCancel={() => {
              setModalVisible(false);
              setSegments([]);
              setSelectedSchedule(null);
            }}
            footer={null}
            width={950}
            title={
              <div className="flex items-center gap-2">
                <FlagIcon className="w-5 h-5 text-indigo-500" />
                <div>
                  <div className="font-semibold text-gray-900">Reschedule Segments</div>
                  <div className="text-sm text-gray-500">
                    {selectedSchedule
                      ? dayjs(selectedSchedule.pickup_datetime).format(
                        "MMMM D, YYYY - h:mm A"
                      )
                      : ""}
                  </div>
                </div>
              </div>
            }
          >
            {loading ? (
              <LoadingCube />
            ) : selectedSchedule ? (
              <>
                <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
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
                      {dayjs(selectedSchedule.completed_at).format(
                        "MMM D, YYYY h:mm A"
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Remarks" span={2}>
                      {selectedSchedule.remarks || "No remarks"}
                    </Descriptions.Item>
                  </Descriptions>
                </div>

                <Divider />

                <Table
                  dataSource={segments}
                  columns={segmentColumns}
                  rowKey="id"
                  pagination={false}
                />
              </>
            ) : null}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
}
