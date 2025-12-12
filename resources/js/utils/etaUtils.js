// utils/etaUtils.js

/**
 * Converts meters to a human-readable distance string
 */
export function formatDistanceShort(meters) {
  if (!Number.isFinite(meters)) return "0 m";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Converts seconds to rounded minutes
 */
export function secondsToMinutes(sec) {
  if (!Number.isFinite(sec)) return 0;
  return Math.round(sec / 60);
}

/**
 * Calculates legs with ETA from ORS segments
 * @param {Array} segments - ORS route segments
 * @param {number} bufferMinutes - extra minutes to add to ETA (default 0)
 * @returns {Array} legs - array of {from, to, distanceMeters, legMinutes, legMinutesWithBuffer, etaLabel}
 */
export function calculateLegsWithETA(segments, bufferMinutes = 0) {
  if (!Array.isArray(segments)) return [];

  const legs = [];

  segments.forEach((seg) => {
    const segDistance = seg.distance || 0; // meters
    const segDuration = seg.duration || 0; // seconds

    const fromName = seg.steps?.[0]?.name || "-";
    const toName = seg.steps?.[seg.steps.length - 1]?.name || "-";

    const legMinutes = segDuration / 60; // raw ETA minutes
    const legMinutesWithBuffer = legMinutes + bufferMinutes;

    legs.push({
      from: fromName,
      to: toName,
      distanceMeters: segDistance,
      legMinutes, // original ETA
      legMinutesWithBuffer, // ETA + buffer
      etaLabel: `${legMinutes.toFixed(2)} min → ${legMinutesWithBuffer.toFixed(2)} min`,
    });
  });

  return legs;
}

/**
 * Returns ETA string based on cumulative minutes from now
 */
// export function etaFromNow(cumulativeMinutes) {
//   if (!Number.isFinite(cumulativeMinutes)) return "—";
//   const now = new Date();
//   now.setMinutes(now.getMinutes() + cumulativeMinutes);
//   const hours = now.getHours().toString().padStart(2, "0");
//   const mins = now.getMinutes().toString().padStart(2, "0");
//   return `${hours}:${mins}`;
// }
