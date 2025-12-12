// resources/js/services/ORSService.js
import axios from "axios";

// ORS API call
export async function getRouteGeoJSON(orderedCoords) {
  if (!Array.isArray(orderedCoords) || orderedCoords.length < 2) return null;

  try {
    const res = await axios.post("/ors/route", { coordinates: orderedCoords });
    const data = res.data;
    if (!data) return null;

    return {
      distance: data.distance ?? null,
      duration: data.duration ?? null,
      coordinates: Array.isArray(data.coordinates) ? data.coordinates : [],
      segments: Array.isArray(data.segments) ? data.segments : null,
    };
  } catch (err) {
    console.error("ORSService.getRouteGeoJSON error:", err?.response?.data || err?.message || err);
    throw err;
  }
}

// ✅ Helper functions
export function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findClosestIndex(coords, pointLngLat) {
  const [pLng, pLat] = Array.isArray(pointLngLat)
    ? pointLngLat
    : [pointLngLat.lng, pointLngLat.lat];
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const [lng, lat] = coords[i];
    const d = haversineDistance([lat, lng], [pLat, pLng]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function sliceCoordsSafe(coords, startIdx, endIdx) {
  const s = Math.max(0, Math.min(coords.length - 1, startIdx));
  const e = Math.max(0, Math.min(coords.length - 1, endIdx));
  if (e < s) return coords.slice(e, s + 1).reverse();
  return coords.slice(s, e + 1);
}
