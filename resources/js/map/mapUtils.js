// resources/js/Pages/mapUtils.js
import L from "leaflet";

/**
 * Constants used by SmartFly and elsewhere
 */
export const NEAR_ROUTE_DISTANCE_M = 250; // zoom in when truck within this distance to any route point
export const FAR_ROUTE_DISTANCE_M = 800; // zoom out (fit bounds) when truck further than this

/**
 * AwesomeMarkers icons for statuses
 * (copied exactly from your original file)
 */
export const completedIcon = L.AwesomeMarkers.icon({
  icon: "check-circle",
  markerColor: "green",
  prefix: "fa",
  iconColor: "white",
});
export const inProgressIcon = L.AwesomeMarkers.icon({
  icon: "spinner",
  markerColor: "orange",
  prefix: "fa",
  spin: true,
  iconColor: "white",
});
export const pendingIcon = L.AwesomeMarkers.icon({
  icon: "hourglass-half",
  markerColor: "blue",
  prefix: "fa",
  iconColor: "white",
});
export const missedIcon = L.AwesomeMarkers.icon({
  icon: "times-circle",
  markerColor: "red",
  prefix: "fa",
  iconColor: "white",
});

/**
 * Create truck DivIcon that uses scaleX(1) or scaleX(-1) to face right/left.
 * It also includes a smooth transition on the <img>.
 * (function kept exactly as your original)
 */
export function createTruckDivIconFace(face = "right", size = 52, imgUrl = "/images/truckico.png") {
  // face: "right" or "left"
  const scaleX = face === "right" ? 1 : -1;
  // inline CSS: transition for smooth flipping, drop-shadow to stand out
  const html = `
    <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
      <img
        src="${imgUrl}"
        style="width:${size}px;height:${size}px;object-fit:contain;transform:scaleX(${scaleX});transition:transform 0.4s ease-in-out;filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));"
      />
    </div>
  `;
  return L.divIcon({
    html,
    className: "leaflet-truck-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Arrow DivIcon (unchanged)
 */
export function createArrowDivIcon(angle = 0, size = 36) {
  const html = `
    <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;transform:rotate(${angle}deg);">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25));">
        <path d="M2 12l18-10v6h2v8h-2v6z" fill="#1d4ed8"></path>
      </svg>
    </div>
  `;
  return L.divIcon({ html, className: "leaflet-arrow-icon", iconSize: [size, size], iconAnchor: [size/2, size/2] });
}


export function createTruckDivIconAngle(angle, size = 35, img = "/images/truckico.png") {
  return L.divIcon({
    className: "truck-icon",
    html: `<img src="${img}" 
          style="width:${size}px;height:${size}px;
                 transform:rotate(${angle}deg);
                 transform-origin:center center;
                 transition: transform 0.3s ease;" />`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Convert Mapbox GeoJSON coordinates [[lng,lat],...] to leaflet-friendly [lat,lng]
 */
export function geojsonToLatLngArray(coords) {
  return coords.map(([lng, lat]) => [lat, lng]);
}

/**
 * Haversine distance (meters) between two [lat, lng] coordinates
 */
export function haversineDistanceMeters(a, b) {
  if (!a || !b) return Infinity;
  const lat1 = a[0] * (Math.PI / 180);
  const lon1 = a[1] * (Math.PI / 180);
  const lat2 = b[0] * (Math.PI / 180);
  const lon2 = b[1] * (Math.PI / 180);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const R = 6371000; // metres
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export function metersToKm(m) {
  if (!isFinite(m)) return null;
  return +(m / 1000).toFixed(2);
}
export function formatDurationHuman(sec) {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
}
export function getDurationSec(start, end) {
  if (!start || !end) return null;
  return Math.floor((new Date(end) - new Date(start)) / 1000);
}
export function getDelayStatus(plannedMin, actualSec) {
  if (actualSec == null) return "—";
  return actualSec <= plannedMin * 60 ? "On Time" : "Delayed";
}

/**
 * compute bearing between two latlngs in degrees (used for arrow)
 */
export function bearingDeg(a, b) {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const lat1 = a[0] * toRad;
  const lat2 = b[0] * toRad;
  const dLon = (b[1] - a[1]) * toRad;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let brng = Math.atan2(y, x) * toDeg;
  brng = (brng + 360) % 360;
  return brng;
}
