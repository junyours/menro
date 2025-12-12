// distanceUtils.js

export function formatDistance(meters) {
  if (!Number.isFinite(meters)) return "0 m";
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

export function formatDistanceShort(meters) {
  if (!Number.isFinite(meters)) return "0 m";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

/**
 * Calculate route legs with ETA for animation
 * @param {Array} features - GeoJSON features from ORS route
 * @returns {Array} legs with coords and estimated arrival times
 */
export function calculateLegsWithETA(features) {
  if (!Array.isArray(features)) return [];

  return features.map((feature) => {
    const coords = feature.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];
    const distance = feature.properties?.summary?.distance || 0; // meters
    const duration = feature.properties?.summary?.duration || 0; // seconds

    return {
      coords,
      distance,
      duration,
      eta: new Date(Date.now() + duration * 1000), // estimated arrival
    };
  });
}
