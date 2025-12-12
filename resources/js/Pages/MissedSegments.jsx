import React, { useState, useMemo } from "react";
import axios from "axios";
import { Head } from "@inertiajs/react";
import {
  ArrowPathIcon,
  TruckIcon,
  MagnifyingGlassIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { Layout, message, Input, Tooltip, Divider } from "antd";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";

const { Content } = Layout;
const { Search } = Input;

export default function MissedSegments({ missed_segments, trucks, drivers, auth }) {
  const [collapsed, setCollapsed] = useState(true);
  const [selectedLegs, setSelectedLegs] = useState([]);
  const [localSegments, setLocalSegments] = useState(missed_segments);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rescheduleData, setRescheduleData] = useState({
    reschedule_time: "",
    truck_id: "",
    driver_id: "",
  });

  // ✅ Filter segments by pickup_datetime
  const filteredSegments = useMemo(() => {
    return localSegments.filter((seg) =>
      (seg.schedule?.pickup_datetime || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, localSegments]);

  // ✅ Toggle segment selection
  const toggleSelect = (legId) => {
    setSelectedLegs((prev) =>
      prev.includes(legId) ? prev.filter((id) => id !== legId) : [...prev, legId]
    );
  };

  // ✅ Hide segment and update backend (is_viewed = 1)
  const hideSegment = async (legId) => {
    try {
      await axios.post(route("route-details.viewed", legId)); // 🔥 Laravel endpoint

      setLocalSegments((prev) => prev.filter((seg) => seg.id !== legId));
      message.success(`Segment #${legId} marked as viewed`);
    } catch (error) {
      console.error(error);
      message.error("❌ Failed to mark as viewed. Try again.");
    }
  };

  // ✅ Bulk reschedule
  const handleBulkReschedule = async () => {
    const { reschedule_time, truck_id, driver_id } = rescheduleData;

    if (!reschedule_time || !truck_id || !driver_id) {
      message.warning("⚠️ Please fill out all fields before rescheduling");
      return;
    }
    if (selectedLegs.length === 0) {
      message.warning("⚠️ Please select at least one missed segment");
      return;
    }

    try {
      setLoading(true);
      await axios.post(route("route-details.reschedule.bulk"), {
        leg_ids: selectedLegs,
        reschedule_time,
        truck_id,
        driver_id,
      });

      message.success("✅ Reschedule successful!");
      // Instantly remove from UI
      setLocalSegments((prev) =>
        prev.filter((seg) => !selectedLegs.includes(seg.id))
      );
      setSelectedLegs([]);
      setRescheduleData({
        reschedule_time: "",
        truck_id: "",
        driver_id: "",
      });
    } catch (error) {
      console.error(error);
      message.error("❌ Failed to reschedule. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Head title="Missed Segments" />
      <Sidebar
        collapsible
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
      />

      <Layout>
        <Navbar collapsed={collapsed} setCollapsed={setCollapsed} auth={auth} />

               <Content className="p-10 bg-gray-100 min-h-screen">

    {/* -------------------------------------- */}
{/* HEADER WITH GRADIENT & SHADOW        */}
{/* -------------------------------------- */}
<section
  className="mb-8"
  style={{
    borderRadius: 16,
    padding: "24px",
    background: "linear-gradient(135deg, #1e3a8a 0%, #f9fafb 100%)", // dark blue left → soft white right
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
  }}
>
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
    {/* Title and Icon */}
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
      <TruckIcon className="w-10 h-10 text-white" /> {/* White icon for contrast */}
      <div className="flex flex-col">
        {/* Title */}
        <h1
          className="text-3xl font-extrabold tracking-wide"
          style={{
            fontFamily: "Poppins, sans-serif",
            color: "#ffffff",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          Missed Segments
        </h1>

        {/* Description */}
        <p
          className="text-sm mt-1 md:mt-0"
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: 14,
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          View all segments that were missed during the garbage collection rounds. 
          Use this dashboard to track, filter, and manage missed segments efficiently.
        </p>
      </div>
    </div>

    {/* Selected Count */}
    {selectedLegs.length > 0 && (
      <span
        className="mt-2 md:mt-0 text-sm font-semibold bg-white px-4 py-1.5 rounded-full shadow-sm border border-blue-200 animate-pulse"
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          color: "#1e3a8a", // dark blue text for contrast
        }}
      >
        {selectedLegs.length} selected
      </span>
    )}
  </div>

</section>




          {/* Search Bar */}
          <div className="flex justify-between items-center mb-6 bg-white/70 backdrop-blur-md border border-gray-200 p-4 rounded-2xl shadow-sm">
            <Search
              placeholder="Search by Pickup DateTime..."
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              enterButton={
                <Tooltip title="Search">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
                </Tooltip>
              }
              className="max-w-md"
            />
          </div>

          {/* No segments */}
          {filteredSegments.length === 0 ? (
            <div className="bg-white border border-green-200 p-10 rounded-2xl text-green-600 shadow-md text-center text-lg font-semibold">
              🎉 All caught up! No missed segments found.
            </div>
          ) : (
            <>
              {/* Bulk Reschedule Section */}
              <section className="bg-white/90 backdrop-blur-lg border border-gray-100 shadow-lg rounded-3xl p-8 space-y-6 mb-10 hover:shadow-2xl transition">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  <ArrowPathIcon className="w-7 h-7 text-indigo-600" />
                  Bulk Reschedule
                </h2>

                <div className="grid md:grid-cols-4 gap-6 items-end">
                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Reschedule Time
                    </label>
                    <input
                      type="datetime-local"
                      value={rescheduleData.reschedule_time}
                      onChange={(e) =>
                        setRescheduleData((prev) => ({
                          ...prev,
                          reschedule_time: e.target.value,
                        }))
                      }
                      className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm p-2.5"
                    />
                  </div>

                  {/* Truck */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Select Truck
                    </label>
                    <select
                      value={rescheduleData.truck_id}
                      onChange={(e) =>
                        setRescheduleData((prev) => ({
                          ...prev,
                          truck_id: e.target.value,
                          driver_id: "",
                        }))
                      }
                      className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm p-2.5"
                    >
                      <option value="">Choose Truck</option>
                      {trucks.map((truck) => (
                        <option key={truck.id} value={truck.id}>
                          {truck.plate_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Driver */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Select Driver
                    </label>
                    <select
                      value={rescheduleData.driver_id}
                      onChange={(e) =>
                        setRescheduleData((prev) => ({
                          ...prev,
                          driver_id: e.target.value,
                        }))
                      }
                      className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm p-2.5"
                    >
                      <option value="">Choose Driver</option>
                      {drivers
                        .filter((d) => d.truck_id == rescheduleData.truck_id)
                        .map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-start">
                    <button
                      onClick={handleBulkReschedule}
                      disabled={loading}
                      className={`${
                        loading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                      } text-white font-semibold rounded-xl px-6 py-3 shadow-md flex items-center gap-2 transition duration-300 ease-in-out`}
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                      {loading ? "Processing..." : "Reschedule Selected"}
                    </button>
                  </div>
                </div>
              </section>

              {/* Segment Cards */}
              <section className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {filteredSegments.map((leg) => (
                  <div
                    key={leg.id}
                    className={`transition-all transform hover:-translate-y-1 hover:shadow-2xl duration-300 bg-white border rounded-2xl shadow-sm p-6 relative overflow-hidden ${
                      selectedLegs.includes(leg.id)
                        ? "border-indigo-500 ring-2 ring-indigo-200"
                        : "border-gray-200"
                    }`}
                  >
                    {selectedLegs.includes(leg.id) && (
                      <span className="absolute top-0 left-0 bg-indigo-600 text-white text-xs px-3 py-1 rounded-br-xl">
                        Selected
                      </span>
                    )}

                    {/* 🔥 Hide Button */}
                    <button
                      onClick={() => hideSegment(leg.id)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"
                      title="Hide segment"
                    >
                      <EyeSlashIcon className="w-5 h-5" />
                    </button>

                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedLegs.includes(leg.id)}
                        onChange={() => toggleSelect(leg.id)}
                        className="mt-1 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />

                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-bold text-gray-800">
                            Segment #{leg.id}
                          </h3>
                          <span className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                            {leg.schedule?.pickup_datetime || "Not Completed"}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Truck</p>
                            <p className="font-semibold text-gray-800">
                              {leg.schedule?.truck?.plate_number || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Driver</p>
                            <p className="font-semibold text-gray-800">
                              {leg.schedule?.driver?.user?.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Barangay</p>
                            <p className="font-semibold text-gray-800">
                              {leg.schedule?.barangay?.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Route</p>
                            <p className="font-semibold text-gray-800">
                              {leg.from_name || "Unknown"} →{" "}
                              {leg.to_name || "Unknown"}
                            </p>
                          </div>
                        </div>

                        {/* ✅ Remarks Section */}
                        {leg.remarks && (
                          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                            <p className="text-sm font-medium text-orange-600">
                              Remarks: {leg.remarks}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
