import React, { useEffect, useState, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import { Layout, DatePicker, Select, Button, Empty } from "antd";
import dayjs from "dayjs";
import LoadingCube from "@/Components/LoadingCube";
import {
  ArrowLeftIcon,
  FlagIcon,
  CalendarDaysIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";

const { Content } = Layout;
const { Option } = Select;

export default function ResHistory({ schedules = [], auth }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [routeDetails, setRouteDetails] = useState([]);
  const [routeSummary, setRouteSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Map schedule statuses by date
  const scheduleDateStatus = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      const date = dayjs(s.pickup_datetime).format("YYYY-MM-DD");
      if (map[date] !== "completed") map[date] = s.status;
    });
    return map;
  }, [schedules]);

  // ✅ Fetch route data
  useEffect(() => {
    if (!selectedSchedule) return;
    let isMounted = true;

    const fetchData = async () => {
      try {
        setError(null);
        if (isMounted) setLoading(true);

        const [detailsRes, summaryRes] = await Promise.all([
          fetch(`/route-details/${selectedSchedule.id}`),
          fetch(`/route-summary/${selectedSchedule.id}`),
        ]);

        if (!detailsRes.ok || !summaryRes.ok)
          throw new Error("Failed to load data");

        const detailsData = await detailsRes.json();
        const summaryData = await summaryRes.json();

        if (isMounted) {
          setRouteDetails(detailsData.routeDetails || []);
          setRouteSummary(summaryData.summary || null);
        }
      } catch (err) {
        console.error(err);
        setError("Couldn’t load the route data. Try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [selectedSchedule]);

  // ✅ Utility functions
  const getDuration = (start, end) =>
    !start || !end ? null : Math.floor((new Date(end) - new Date(start)) / 1000);
  const formatDuration = (s) =>
    s == null ? "—" : s < 60 ? `${s}s` : `${Math.floor(s / 60)} min`;
  const getDelayStatus = (plannedMin, actualSec) => {
    if (actualSec == null) return "—";
    const plannedSec = plannedMin < 1 ? plannedMin * 100 : plannedMin * 60;
    return actualSec <= plannedSec ? "On Time" : "Delayed";
  };

  const filteredSchedules = schedules.filter(
    (s) =>
      selectedDate &&
      new Date(s.pickup_datetime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) === selectedDate
  );

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100">
      <Head title="Route History" />
      <Content className="p-6 md:p-10 max-w-7xl mx-auto">

        {/* 🔹 Header */}
        <div className="bg-white/60 backdrop-blur-xl border border-gray-200/70 rounded-3xl p-8 mb-10 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-blue-400/10 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
                <TruckIcon className="w-9 h-9 text-blue-600" />
                Route History
              </h1>
              <p className="text-gray-600 mt-2 text-sm md:text-base">
                Review your completed routes with detailed performance insights.
              </p>
            </div>
            <Button
              onClick={() => router.visit("/")}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all duration-300"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back
            </Button>
          </div>
        </div>

        {/* 🔸 Status Legend */}
        <div className="flex flex-wrap items-center gap-3 mb-8 bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span className="w-3 h-3 rounded-full bg-green-500"></span> Completed
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span> Pending
          </div>
        </div>

        {/* 🔹 Selectors */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 mb-10 shadow-lg transition-all hover:shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Date Picker */}
            <div>
              <label className="block mb-3 font-semibold text-gray-800 text-base flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
                Pickup Date
              </label>
              <DatePicker
                className="w-full rounded-2xl border-gray-300 text-gray-800 text-base py-2.5"
                value={selectedDate ? dayjs(selectedDate, "MMMM D, YYYY") : null}
                onChange={(date, dateString) => {
                  setSelectedDate(dateString);
                  setSelectedSchedule(null);
                }}
                format="MMMM D, YYYY"
                dateRender={(current) => {
                  const formatted = current.format("YYYY-MM-DD");
                  const status = scheduleDateStatus[formatted];
                  const bg =
                    status === "completed"
                      ? "bg-green-100 text-green-700"
                      : status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-white";
                  return (
                    <div
                      className={`w-full h-full flex items-center justify-center rounded-md ${bg}`}
                    >
                      {current.date()}
                    </div>
                  );
                }}
              />
            </div>

            {/* Schedule Selector */}
            <div>
              <label className="block mb-3 font-semibold text-gray-800 text-base flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-blue-600" />
                Schedule
              </label>
              <Select
                placeholder="Select a schedule"
                className="w-full rounded-2xl"
                size="large"
                onChange={(value) => {
                  const schedule = schedules.find((s) => String(s.id) === value);
                  setSelectedSchedule(schedule || null);
                }}
                disabled={!selectedDate}
                showSearch
                optionFilterProp="children"
              >
                {filteredSchedules.length > 0 ? (
                  filteredSchedules.map((s) => (
                    <Option key={s.id} value={String(s.id)}>
                      🗺️ {s.barangay?.name || "Unknown Barangay"} —{" "}
                      {s.truck
                        ? `${s.truck.model} (${s.truck.plate_number})`
                        : "Unassigned Truck"}{" "}
                      [{s.status}]
                    </Option>
                  ))
                ) : (
                  <Option disabled>No schedules for this date</Option>
                )}
              </Select>
            </div>
          </div>
        </div>

        {/* 🔹 Route Summary */}
        {selectedSchedule && routeSummary && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[
                {
                  icon: <CheckCircleIcon className="w-7 h-7 text-green-600" />,
                  label: "Completed",
                  value: routeSummary.completed_count,
                  bg: "from-green-50 to-green-100 border-green-200",
                },
                {
                  icon: <XCircleIcon className="w-7 h-7 text-red-600" />,
                  label: "Missed",
                  value: routeSummary.missed_count,
                  bg: "from-red-50 to-red-100 border-red-200",
                },
                {
                  icon: <ClockIcon className="w-7 h-7 text-blue-600" />,
                  label: "Total Duration",
                  value: formatDuration(routeSummary.total_duration),
                  bg: "from-blue-50 to-blue-100 border-blue-200",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 border rounded-2xl p-5 shadow-md bg-gradient-to-br ${card.bg} hover:shadow-lg transition-all`}
                >
                  {card.icon}
                  <div>
                    <p className="text-sm text-gray-600">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 🟥 Missed Reason Section */}
            {routeSummary.missed_reasons && (
              <div className="bg-red-50 border border-red-300 rounded-3xl p-6 mb-10 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                  <h2 className="text-lg font-semibold text-red-700">
                    Missed Reason
                  </h2>
                </div>
                <p className="text-gray-800 text-sm leading-relaxed">
                  The segments were missed due to:{" "}
                  <span className="font-semibold text-red-700">
                    {routeSummary.missed_reasons}
                  </span>
                </p>
              </div>
            )}
          </>
        )}

        {/* 🔹 Route Details */}
        {selectedSchedule ? (
          loading ? (
            <LoadingCube />
          ) : error ? (
            <p className="text-red-600 font-medium">{error}</p>
          ) : routeDetails.length === 0 ? (
            <Empty
              description={
                <span className="text-gray-600">
                  No route details found for this schedule.
                </span>
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {routeDetails.map((detail, index) => {
                const actualSec = getDuration(detail.start_time, detail.completed_at);
                const delayStatus = getDelayStatus(detail.duration_min, actualSec);

                return (
                  <div
                    key={detail.id}
                    className="relative rounded-3xl border bg-white/80 backdrop-blur-md p-6 shadow-md hover:shadow-xl transition-all"
                  >
                    {/* Status badges */}
                    <div className="absolute top-0 left-0">
                      <span
                        className={`px-3 py-1 text-xs text-white font-semibold rounded-br-lg ${
                          delayStatus === "On Time"
                            ? "bg-green-500"
                            : delayStatus === "Delayed"
                            ? "bg-red-500"
                            : "bg-gray-400"
                        }`}
                      >
                        {delayStatus}
                      </span>
                    </div>
                    <div className="absolute top-0 right-0">
                      <span
                        className={`px-3 py-1 text-xs text-white font-semibold rounded-bl-lg ${
                          detail.status === "completed"
                            ? "bg-green-600"
                            : detail.status === "Pending"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                        }`}
                      >
                        {detail.status}
                      </span>
                    </div>

                    <h2 className="text-lg font-semibold text-blue-700 mb-4 mt-6 flex items-center gap-2">
                      <FlagIcon className="w-5 h-5 text-blue-600" />
                      Segment {index + 1}
                    </h2>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                      <p><b>From:</b> {detail.from_name}</p>
                      <p><b>To:</b> {detail.to_name}</p>
                      <p><b>Planned:</b> {detail.duration_min} min</p>
                      <p><b>Actual:</b> {formatDuration(actualSec)}</p>
                      <p><b>Start:</b> {detail.start_time ? new Date(detail.start_time).toLocaleString() : "—"}</p>
                      <p><b>Completed:</b> {detail.completed_at ? new Date(detail.completed_at).toLocaleString() : "—"}</p>
                    </div>

                    {detail.remarks && (
                      <div className="mt-5 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-blue-600" />
                          <p className="text-sm font-semibold text-gray-800">
                            Remarks:
                          </p>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {detail.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          selectedDate && (
            <Empty description="Please select a schedule to view route history." />
          )
        )}
      </Content>
    </Layout>
  );
}
