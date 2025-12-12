import L from "leaflet";

/* ---------- icons ---------- */
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

/* ---------- colors ---------- */
export const ZONE_COLORS = [
  "#22c55e","#3b82f6","#f59e0b","#ef4444","#a855f7","#06b6d4","#84cc16","#f97316"
];

/* ---------- distance calculations ---------- */
export function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const toRad = v => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findClosestIndex(coords, pointLngLat) {
  const [pLng, pLat] = Array.isArray(pointLngLat)
    ? pointLngLat
    : [pointLngLat.lng, pointLngLat.lat];
  let bestIdx = 0, bestDist = Infinity;
  coords.forEach(([lng, lat], i) => {
    const d = haversineDistance([lat, lng], [pLat, pLng]);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  });
  return bestIdx;
}

export function sliceCoordsSafe(coords, startIdx, endIdx) {
  const s = Math.max(0, Math.min(coords.length - 1, startIdx));
  const e = Math.max(0, Math.min(coords.length - 1, endIdx));
  return e < s ? coords.slice(e, s + 1).reverse() : coords.slice(s, e + 1);
}
