import React, { useState } from "react";
import { Button, message } from "antd";
import axios from "axios";

export default function AssignZonesButton({
  selectedSchedule,
  selectedWeeklyReportId,
  selectedZones,
  setPreviewZones,
  setZonesAssigned,
  setSelectedWeeklyReport,
}) {
  const [loading, setLoading] = useState(false);

  const handleAssignZones = async () => {
    if (!selectedSchedule) return message.error("No schedule selected.");
    if (!selectedZones.length) return message.error("Select at least one zone.");
    if (!selectedWeeklyReportId) return message.error("No weekly report found.");

    setLoading(true);

    try {
      const payload = {
        schedule_id: Number(selectedSchedule.id),
        weekly_report_id: Number(selectedWeeklyReportId),
        zone_ids: selectedZones.map(z => Number(z)),
      };
      const { data } = await axios.post("/route-planner", payload);

      if (data.success) {
        setPreviewZones(data.zones);
        setZonesAssigned(true);
        if (data.weekly_report) setSelectedWeeklyReport(data.weekly_report);
        message.success("Zones loaded successfully.");
      } else message.error(data.error || "Failed to assign zones.");
    } catch (error) {
      console.error(error);
      message.error("Failed to assign zones.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="primary" block onClick={handleAssignZones} loading={loading}>
      Load Selected Zones on Map
    </Button>
  );
}
