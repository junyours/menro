// resources/js/Components/map/MapIcons.jsx
import L from "leaflet";

export const greenIcon = new L.Icon({
  iconUrl: "/images/marker.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export const truckIcon = new L.Icon({
  iconUrl: "/images/d.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// ✅ Add zone colors here
export const ZONE_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];
