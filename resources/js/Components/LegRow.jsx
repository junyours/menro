import React from "react";
import { formatDistanceShort } from "@/utils/etaUtils";

export default function LegRow({ from, to, distance, legMinutes, running }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
        gap: 12,
        padding: "10px 12px",
        alignItems: "center",
        borderTop: "1px solid #f0f0f0",
      }}
    >
      <div>{from}</div>
      <div>{to}</div>
      <div>{formatDistanceShort(distance)}</div>
      <div>{legMinutes.toFixed(2)} min</div>
      <div>{(legMinutes + 20).toFixed(2)} min</div>
    </div>
  );
}
