import React from "react";
import { Select, message } from "antd";
import axios from "axios";
const { Option } = Select;

export default function WeeklyReportSelector({
  weeklyReports,
  selectedWeeklyReportId,
  setSelectedWeeklyReportId,
  setWeeklyZoneReports,
  setSelectedZones,
  setPreviewZones,
  setZonesAssigned,
}) {
  const handleChange = async (id) => {
    setSelectedWeeklyReportId(id);
    setZonesAssigned(false);

    try {
      const res = await axios.get(`/weekly-reports/${id}/zones`);
      const zones = res.data?.zones || [];
      setWeeklyZoneReports(zones);
      setSelectedZones(zones.map(z => z.zone_id));
      setPreviewZones(zones);
    } catch (err) {
      console.error(err);
      message.error("Failed to load zones for this weekly report.");
    }
  };

  return (
    <Select
      placeholder="Select Weekly Report"
      style={{ width: "100%" }}
      value={selectedWeeklyReportId}
      onChange={handleChange}
    >
      {weeklyReports.map(report => (
        <Option key={report.id} value={report.id}>
          {report.submitted_at
            ? new Date(report.submitted_at).toLocaleString("en-US", { 
                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" 
              })
            : `Weekly Report #${report.id}`}
        </Option>
      ))}
    </Select>
  );
}
