import React from "react";
import { Tag } from "antd";

export default function StatusBadge({ status }) {
  const mapObj = {
    completed: { color: "green", label: "Completed" },
    in_progress: { color: "gold", label: "In Progress" },
    pending: { color: "red", label: "Pending" },
  };
  const cfg = mapObj[status] || { color: "default", label: status || "—" };
  return (
    <Tag color={cfg.color} style={{ borderRadius: 999, padding: "2px 10px" }}>
      {cfg.label}
    </Tag>
  );
}
