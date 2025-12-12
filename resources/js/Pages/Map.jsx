// resources/js/Pages/Map.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Head, router } from "@inertiajs/react";
import { Button, Empty, Collapse } from "antd";
import LoadingCube from "@/Components/LoadingCube";
import "leaflet.awesome-markers/dist/leaflet.awesome-markers.css";
import "leaflet.awesome-markers";
import Feedback from "@/Pages/Feedback";
import { ArrowLeftIcon, TruckIcon } from "@heroicons/react/24/outline";
import { FaCommentDots } from "react-icons/fa";

// Firebase Realtime DB imports
import { ref as fbRef, onValue, off } from "firebase/database";
import { db } from "@/firebase";

/* ---------------------- Config ---------------------- */
// Keep your Mapbox token here (no env var used to avoid process usage).
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiamVzc3RoZXIxMjMiLCJhIjoiY21meGdzNmFzMDliMjJqczYyczBoZ3d6OCJ9.i1xXSqwXGWE5wXoUQB4fnw";

const MAPBOX_DIRECTIONS_PROFILE = "driving";
const ROUTE_POLL_MS = 15000; // refresh route details
const TRUCK_LISTENER_DEBOUNCE_MS = 50;

const COLOR_PALETTE = [
  "#2563eb", // blue (default)
  "#10b981", // green (completed)
  "#f97316", // orange (in_progress)
  "#8b5cf6", // purple
  "#ef4444", // red (missed)
  "#06b6d4", // teal
  "#f59e0b", // amber
  "#7c3aed", // violet
  "#0ea5e9", // sky
  "#f43f5e", // pinkish
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

/* ---------------------- Helpers ---------------------- */
function geojsonToLatLngArray(coords) {
  try {
    return coords.map(([lng, lat]) => [lat, lng]);
  } catch (e) {
    return [];
  }
}


/* ---------------------- Icons ---------------------- */
function makeAwesomeOrDivIcon({ icon = "circle", markerColor = "blue", prefix = "fa", iconColor = "white" }) {
  if (typeof L !== "undefined" && L.AwesomeMarkers && L.AwesomeMarkers.icon) {
    try {
      return L.AwesomeMarkers.icon({ icon, markerColor, prefix, iconColor });
    } catch (e) {
      // fallback to divIcon below
    }
  }
  const size = 22;
  const html = `<div style="width:${size}px;height:${size}px;border-radius:4px;background:${markerColor};display:flex;align-items:center;justify-content:center;color:${iconColor};font-size:12px;font-weight:600">${icon === "check-circle" ? "✓" : ""}</div>`;
  return L.divIcon({
    html,
    className: "simple-status-icon",
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
}

const completedIcon = makeAwesomeOrDivIcon({ icon: "check-circle", markerColor: "green", iconColor: "white" });
const inProgressIcon = makeAwesomeOrDivIcon({ icon: "spinner", markerColor: "blue", iconColor: "white" });
const pendingIcon = makeAwesomeOrDivIcon({ icon: "hourglass-half", markerColor: "blue", iconColor: "white" });
const missedIcon = makeAwesomeOrDivIcon({ icon: "times-circle", markerColor: "red", iconColor: "white" });

// smaller truck icon with image and small colored status badge (no border)
function createTruckDivIconWithBadge(
  angleDeg = 0,
  size = 32, // smaller size (was 44)
  imageUrl = "/images/truckicon.png",
) {
  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-${size / 2}px, -${size / 2}px);
    ">
      <img
        src="${imageUrl}"
        style="
          width: ${size}px;
          height: ${size}px;
          transform: rotate(${angleDeg}deg);
          display: block;
          pointer-events: none;
        "
        alt="truck"
      />
    </div>
  `;
  return L.divIcon({
    html,
    className: "truck-image-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}


/* ---------------------- SmartFly component ---------------------- */
function SmartFly({ truckLocationsMap, routeBounds, focusTruckFor }) {
  const map = useMap();
  const hasInitial = useRef(false);

  useEffect(() => {
    if (!map) return;
    if (!hasInitial.current && routeBounds) {
      try {
        map.fitBounds(routeBounds, { padding: [60, 60], maxZoom: 16 });
      } catch (e) {}
      hasInitial.current = true;
    }
  }, [map, routeBounds]);

  useEffect(() => {
    if (!map || !focusTruckFor) return;
    const loc = truckLocationsMap[focusTruckFor];
    if (!loc) return;
    try {
      map.flyTo([loc[0], loc[1]], 17, { duration: 1.2 });
    } catch (e) {}
  }, [map, focusTruckFor, truckLocationsMap]);

  return null;
}

/* ---------------------- Main component ---------------------- */
export default function Map({ schedules = [] }) {
  // only pending schedules shown
  const pendingSchedules = (schedules || []).filter((s) => s.status === "Pending");

  // maps per schedule/truck
  const [routeDetailsMap, setRouteDetailsMap] = useState({});
  const [routePolylinesMap, setRoutePolylinesMap] = useState({});
  const [truckLocationsMap, setTruckLocationsMap] = useState({});
  const [truckLastUpdatedMap, setTruckLastUpdatedMap] = useState({});

  // ui state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [controlsCollapsed, setControlsCollapsed] = useState(true); // mobile toggle
  const [focusTruckFor, setFocusTruckFor] = useState(null);
  const [routeDriversMap, setRouteDriversMap] = useState({});


  // refs
  const mapRef = useRef(null);
  const listenersRef = useRef([]);
  const pendingTruckUpdateRef = useRef(null);
  const pendingTruckUpdates = useRef({});

 /* ---------------------- Fetch route details for all pending schedules ---------------------- */
useEffect(() => {
  let mounted = true;
  setError(null);

  const fetchAllRoutes = async (silent = false) => {
    if (!silent) setLoading(true);

    const newRouteMap = {};
    const newDriverMap = {};

    try {
      await Promise.all(
        pendingSchedules.map(async (s) => {
          try {
            const res = await fetch(`/route-details/${s.id}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();

            // Route details
            newRouteMap[s.id] = json.routeDetails || [];

            // Driver (added)
            newDriverMap[s.id] = json.driver || null;
          } catch (err) {
            console.warn("route fetch failed for", s.id, err);
            newRouteMap[s.id] = [];
            newDriverMap[s.id] = null;
          }
        })
      );

      if (!mounted) return;

      // Merge route + driver maps
      setRouteDetailsMap((prev) => ({ ...prev, ...newRouteMap }));
      setRouteDriversMap((prev) => ({ ...prev, ...newDriverMap }));
    } catch (err) {
      console.error("fetchAllRoutes error", err);
      if (mounted) setError("Failed to load route details");
    } finally {
      if (!silent && mounted) setLoading(false);

      if (mounted) {
        setTimeout(() => fetchAllRoutes(true), ROUTE_POLL_MS);
      }
    }
  };

  if (pendingSchedules.length > 0) {
    fetchAllRoutes(false);
  } else {
    setRouteDetailsMap({});
    setRoutePolylinesMap({});
    setRouteDriversMap({});
  }

  return () => {
    mounted = false;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [JSON.stringify(pendingSchedules.map((s) => s.id))]);

  /* ---------------------- Firebase listeners for trucks ---------------------- */
  useEffect(() => {
    // cleanup previous listeners
    for (const l of listenersRef.current) {
      try { off(l.ref, "value", l.handler); } catch (e) { try { off(l.ref); } catch (ee) {} }
    }
    listenersRef.current = [];

    const truckIdsSet = new Set();
    pendingSchedules.forEach((s) => {
      if (s.truck && s.truck.id != null) truckIdsSet.add(String(s.truck.id));
    });
    const truckIds = Array.from(truckIdsSet);
    if (truckIds.length === 0) {
      setTruckLocationsMap({});
      setTruckLastUpdatedMap({});
      return;
    }

    truckIds.forEach((truckId) => {
      const ref = fbRef(db, `trucks/${truckId}`);
      const handler = (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          pendingTruckUpdates.current[truckId] = null;
        } else {
          const lat = data.latitude != null ? parseFloat(data.latitude)
            : data.lat != null ? parseFloat(data.lat)
            : null;
          const lng = data.longitude != null ? parseFloat(data.longitude)
            : data.lng != null ? parseFloat(data.lng)
            : null;
          if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
            pendingTruckUpdates.current[truckId] = null;
          } else {
            pendingTruckUpdates.current[truckId] = {
              lat, lng,
              updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
            };
          }
        }

        if (pendingTruckUpdateRef.current) clearTimeout(pendingTruckUpdateRef.current);
        pendingTruckUpdateRef.current = setTimeout(() => {
          const updates = { ...pendingTruckUpdates.current };
          pendingTruckUpdates.current = {};
          pendingTruckUpdateRef.current = null;

          setTruckLocationsMap((prev) => {
            const copy = { ...prev };
            for (const [tid, val] of Object.entries(updates)) {
              if (val == null) {
                delete copy[tid];
              } else {
                copy[tid] = [val.lat, val.lng];
              }
            }
            return copy;
          });

          setTruckLastUpdatedMap((prev) => {
            const copy = { ...prev };
            for (const [tid, val] of Object.entries(updates)) {
              if (val == null) {
                delete copy[tid];
              } else {
                try { copy[tid] = new Date(val.updatedAt).toLocaleTimeString(); }
                catch (e) { copy[tid] = new Date().toLocaleTimeString(); }
              }
            }
            return copy;
          });
        }, TRUCK_LISTENER_DEBOUNCE_MS);
      };

      onValue(ref, handler, (err) => console.error("firebase onValue error", err));
      listenersRef.current.push({ ref, handler, truckId });
    });

    return () => {
      for (const l of listenersRef.current) {
        try { off(l.ref, "value", l.handler); } catch (e) { try { off(l.ref); } catch (ee) {} }
      }
      listenersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pendingSchedules.map((s) => s.truck?.id))]);

  /* ---------------------- Compute polylines for each schedule via Mapbox (async) ---------------------- */
  useEffect(() => {
    let mounted = true;

    const computePolylines = async () => {
      const result = {};

      for (let i = 0; i < pendingSchedules.length; i++) {
        const s = pendingSchedules[i];
        const segs = routeDetailsMap[s.id] || [];
        const truckId = s.truck?.id ? String(s.truck.id) : null;
        const truckLoc = truckId ? truckLocationsMap[truckId] : null;

        const coords = [];
        if (truckLoc) coords.push([truckLoc[1], truckLoc[0]]); // lng,lat
        for (const seg of segs) {
          if (seg.from_lng != null && seg.from_lat != null) coords.push([seg.from_lng, seg.from_lat]);
        }
        const last = segs.length ? segs[segs.length - 1] : null;
        if (last && last.to_lng != null && last.to_lat != null) coords.push([last.to_lng, last.to_lat]);

        if (coords.length >= 2) {
          try {
            const coordsStr = coords.map((c) => c.join(",")).join(";");
            const url = `https://api.mapbox.com/directions/v5/mapbox/${MAPBOX_DIRECTIONS_PROFILE}/${coordsStr}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
            const resp = await fetch(url);
            const json = await resp.json();
            if (json && json.routes && json.routes.length > 0 && json.routes[0].geometry) {
              const geo = json.routes[0].geometry.coordinates;
              result[s.id] = geojsonToLatLngArray(geo);
              continue;
            }
          } catch (err) {
            console.warn("Mapbox directions failed for schedule", s.id, err);
          }
        }

        // fallback polyline from raw points
        const fallback = [];
        if (truckLoc) fallback.push([truckLoc[0], truckLoc[1]]);
        for (const seg of segs) {
          if (seg.from_lat != null && seg.from_lng != null) fallback.push([seg.from_lat, seg.from_lng]);
        }
        if (last && last.to_lat != null && last.to_lng != null) fallback.push([last.to_lat, last.to_lng]);
        result[s.id] = fallback;
      }

      if (mounted) setRoutePolylinesMap(result);
    };

    computePolylines();

    return () => { mounted = false; };
  }, [routeDetailsMap, truckLocationsMap, JSON.stringify(pendingSchedules.map((s) => s.id))]);

  /* ---------------------- Combined bounds ---------------------- */
  const routeBounds = useMemo(() => {
    const allPoints = [];
    Object.values(routePolylinesMap).forEach((arr) => {
      if (Array.isArray(arr)) arr.forEach((p) => { if (p && p.length) allPoints.push(p); });
    });
    Object.values(truckLocationsMap).forEach((loc) => {
      if (Array.isArray(loc)) allPoints.push([loc[0], loc[1]]);
    });
    return allPoints.length ? L.latLngBounds(allPoints) : null;
  }, [routePolylinesMap, truckLocationsMap]);

  /* ---------------------- UI helpers ---------------------- */
  function scheduleLabel(s) {
    if (!s) return "Unknown";
    let formattedDate = "Unknown Date";
    if (s.pickup_datetime) {
      const d = new Date(s.pickup_datetime);
      if (!isNaN(d)) formattedDate = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    return `${formattedDate} — ${s.barangay?.name || "Unknown Barangay"} — ${s.truck?.model || "Unassigned"}`;
  }

  function getMarkerIcon(status) {

    const st = (status || "").toLowerCase();
    switch (st) {
      case "completed":
        return completedIcon; // green
      case "missed":
        return missedIcon; // red
      case "pending":
      default:
        return pendingIcon; // blue
    }
  }

  function getAggregateStatusForTruck(truckId) {
    const schedulesForTruck = pendingSchedules.filter((s) => String(s.truck?.id) === String(truckId));
    if (schedulesForTruck.length === 0) return "pending";
    // collect all segments for schedules of this truck
    let anyMissed = false;
    let allCompleted = true;
    let anyInProgress = false;
    for (const s of schedulesForTruck) {
      const segs = routeDetailsMap[s.id] || [];
      if (!segs || segs.length === 0) {
        allCompleted = false;
      } else {
        for (const seg of segs) {
          const st = (seg.status || "").toLowerCase();
          if (st === "missed") anyMissed = true;
          if (st !== "completed") allCompleted = false;
          if (st === "in_progress") anyInProgress = true;
        }
      }
    }
    if (anyMissed) return "missed";
    if (allCompleted) return "completed";
    if (anyInProgress) return "in_progress";
    return "pending";
  }

  function statusToBadgeColor(status) {
    switch ((status || "").toLowerCase()) {
      case "completed": return "#10b981";
      case "in_progress": return "#f59e0b";
      case "missed": return "#ef4444";
      default: return "#2563eb"; // blue
    }
  }

  /* ---------------------- Responsive map height helper ---------------------- */
  const mapHeightStyle = {
    height: "60vh", // mobile default
  };

  /* ---------------------- Render ---------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <Head title="Route Monitoring" />
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 sm:p-6 rounded-2xl shadow-md mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <TruckIcon className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Route Monitoring</h1>
              <p className="text-blue-100 text-xs sm:text-sm">All pending schedules shown on a single map. Multiple trucks & routes visible simultaneously.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-white/90 text-sm hidden sm:block">Pending: {pendingSchedules.length}</div>
            <Button onClick={() => router.visit("/")} className="bg-white text-blue-600 px-3 sm:px-4 py-2 rounded-lg">Back</Button>
          </div>
        </div>

        {/* compact controls row (mobile: toggles, desktop: inline) */}
        <div className="flex items-start sm:items-center gap-3 mb-4 flex-wrap">
         <div className="flex items-center gap-2">
  <button
    onClick={() => setControlsCollapsed((c) => !c)}
    className={`
      sm:hidden inline-flex items-center gap-2
      px-4 py-2 rounded-full text-sm font-medium
      bg-[#0A2540] text-[#B3E5FC]
      shadow-lg transition-all duration-300
      hover:bg-[#123B63] hover:text-white hover:shadow-[0_0_15px_#4FC3F7]
      active:scale-95
    `}
  >
    {controlsCollapsed ? "Show Controls" : "Hide Controls"}
  </button>
            <div className="hidden sm:flex items-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-400 rounded-sm"></span>
                <span>Pending / In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-500 rounded-sm"></span>
                <span>Missed</span>
              </div>
            </div>
          </div>

        {/* focus buttons: collapsible on mobile */}
<div className={`${controlsCollapsed ? "hidden" : "block"} sm:block ml-auto`}>
  <div className="flex gap-3 flex-wrap justify-end">
    {pendingSchedules.map((s, idx) => (
      <button
        key={s.id}
        onClick={() => s.truck?.id && setFocusTruckFor(String(s.truck.id))}
        disabled={!s.truck?.id || !truckLocationsMap[String(s.truck?.id)]}
        className={`
          relative px-4 py-2 rounded-full text-xs font-semibold 
          transition-all duration-300 shadow-lg
          ${!s.truck?.id || !truckLocationsMap[String(s.truck?.id)]
            ? "bg-gray-600 text-gray-300 cursor-not-allowed shadow-none"
            : "bg-[#0A2540] text-[#B3E5FC] hover:bg-[#123B63] hover:text-white hover:shadow-[0_0_15px_#4FC3F7]"
          }
        `}
      >
        {s.truck?.plate_number || `Truck ${s.truck?.id || s.id}`}
      </button>
    ))}
  </div>
</div>
</div>

        {/* map container */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white/80 backdrop-blur-lg mb-6">
          {loading ? (
            <div className="p-6"><LoadingCube /></div>
          ) : pendingSchedules.length === 0 ? (
            <div className="p-6 text-center"><p className="text-gray-600">No pending schedules at the moment.</p></div>
          ) : (
            <div className="w-full">
              <MapContainer
                whenCreated={(m) => (mapRef.current = m)}
                center={routeBounds ? [routeBounds.getCenter().lat, routeBounds.getCenter().lng] : [8.482, 124.647]}
                zoom={13}
                style={{ width: "100%", ...mapHeightStyle }}
                className="md:h-[70vh] lg:h-[80vh]"
              >
                <TileLayer
                  url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                  attribution='© <a href="https://www.mapbox.com/">Mapbox</a>, © OpenStreetMap'
                  tileSize={512}
                  zoomOffset={-1}
                />

                <SmartFly truckLocationsMap={truckLocationsMap} routeBounds={routeBounds} focusTruckFor={focusTruckFor} />

                {/* Draw each schedule route as a colored polyline (no fill) */}
                {Object.keys(routePolylinesMap).map((scheduleId, idx) => {
                  const positions = routePolylinesMap[scheduleId] || [];
                  const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
                  if (!positions || positions.length < 2) return null;
                  return (
                    <Polyline
                      key={`poly-${scheduleId}`}
                      positions={positions}
                      pathOptions={{ color, weight: 5, opacity: 0.95 }}
                    />
                  );
                })}

                {/* segment markers */}
                {Object.entries(routeDetailsMap).map(([scheduleId, segs]) =>
                  segs.map((seg) => {
                    if (!seg || seg.from_lat == null || seg.from_lng == null) return null;
                    return (
                      <Marker
                        key={`seg-${scheduleId}-${seg.id}`}
                        position={[seg.from_lat, seg.from_lng]}
                        icon={getMarkerIcon(seg.status)}
                      >
                      <Popup>
  <div className="text-sm space-y-1">

    <strong className="text-base">
      {seg.name || seg.from_name || "Unknown"}
    </strong>

    <div>
      <span className="opacity-70">Driver: </span>
      <strong>{routeDriversMap[scheduleId]?.name || "No Assigned Driver"}</strong>
    </div>

    <div>
      <span className="opacity-70">Schedule: </span>
      {scheduleLabel(pendingSchedules.find((s) => String(s.id) === String(scheduleId)))}
    </div>

    <div>
      <span className="opacity-70">Status: </span>
      <span
        className={
          seg.status === "On Time"
            ? "text-green-600"
            : seg.status === "Delayed"
            ? "text-red-600"
            : ""
        }
      >
        {seg.status || "—"}
      </span>
    </div>

    <div>
      <span className="opacity-70">Planned: </span>
      {seg.duration_min || "—"} min
    </div>

  </div>
</Popup>

                      </Marker>
                    );
                  })
                )}

                {/* terminal markers */}
                {Object.entries(routeDetailsMap).map(([scheduleId, segs]) => {
                  const last = segs && segs.length ? segs[segs.length - 1] : null;
                  if (!last || last.to_lat == null || last.to_lng == null) return null;
                  return (
                    <Marker
                      key={`term-${scheduleId}`}
                      position={[last.to_lat, last.to_lng]}
                      icon={getMarkerIcon(last.status)}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>Last Terminal</strong>
                          <div>Schedule: {scheduleLabel(pendingSchedules.find((s) => String(s.id) === String(scheduleId)))}</div>
                          <div>Status: {last.status || "—"}</div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* truck markers (image + status badge) */}
                {Object.entries(truckLocationsMap).map(([truckId, loc], idx) => {
                  if (!loc || !Array.isArray(loc)) return null;
                  const truckSchedules = pendingSchedules.filter((s) => String(s.truck?.id) === String(truckId));

                  // color by schedule index if available
                  const scheduleIndex = pendingSchedules.findIndex((s) => String(s.truck?.id) === String(truckId));
                  const color = scheduleIndex >= 0 ? COLOR_PALETTE[scheduleIndex % COLOR_PALETTE.length] : "#111827";

                  // compute aggregate status for truck
                  const aggStatus = getAggregateStatusForTruck(truckId);
                  const badgeColor = statusToBadgeColor(aggStatus);

                  // attempt to compute orientation using the previous point if available - simple heuristic:
                  const angle = 0; // keep 0 for now; image still visible

                  // counts
                  const segCount = truckSchedules.reduce((acc, s) => acc + ((routeDetailsMap[s.id] || []).length), 0);
                  const missedCount = truckSchedules.reduce((acc, s) => {
                    const segs = routeDetailsMap[s.id] || [];
                    return acc + (segs.filter((g) => (g.status || "").toLowerCase() === "missed").length);
                  }, 0);
                  const completedCount = truckSchedules.reduce((acc, s) => {
                    const segs = routeDetailsMap[s.id] || [];
                    return acc + (segs.filter((g) => (g.status || "").toLowerCase() === "completed").length);
                  }, 0);

                  return (
                    <Marker
                      key={`truck-${truckId}`}
                      position={loc}
                      icon={createTruckDivIconWithBadge(angle, 44, "/images/truckicon.png", badgeColor)}
                    >
                      <Popup>
                        <div className="text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <strong className="text-base">{truckSchedules.length ? (truckSchedules[0].truck?.plate_number || `Truck ${truckId}`) : `Truck ${truckId}`}</strong>
                          </div>

                          <div className="text-xs text-gray-700 mb-2">
                            <div><strong>Assigned Barangay:</strong> {truckSchedules[0]?.barangay?.name || "—"}</div>
                            <div><strong>Last Seen:</strong> {truckLastUpdatedMap[truckId] || "—"}</div>
                            <div><strong>Segments:</strong> {segCount} • <strong>Completed:</strong> {completedCount} • <strong>Missed:</strong> {missedCount}</div>
                          </div>

                          <div className="flex gap-2 mt-2">
                            <Button size="small" onClick={() => { setFocusTruckFor(String(truckId)); }}>
                              Focus
                            </Button>
                            <Button size="small" onClick={() => { /* optional: open full details route */ router.visit(`/trucks/${truckId}`); }}>
                              View Truck
                            </Button>
                          </div>
                        </div>
                      </Popup>

                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}
        </div>

        {/* Below-map compact grid: pending schedules + notes. */}
        <div className="mb-8">
          <div className="hidden sm:block grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-2">Pending Schedules ({pendingSchedules.length})</h3>
              {pendingSchedules.length === 0 ? (
                <p className="text-sm text-gray-600">No pending schedules.</p>
              ) : (
                <ul className="text-sm space-y-3">
                  {pendingSchedules.map((s, idx) => (
                    <li key={s.id} className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-sm mt-1" style={{ backgroundColor: COLOR_PALETTE[idx % COLOR_PALETTE.length] }} />
                      <div className="flex-1">
                        <div className="font-medium">{scheduleLabel(s)}</div>
                        <div className="text-xs text-gray-500">Truck: {s.truck?.plate_number || "—"} • Barangay: {s.barangay?.name || "—"}</div>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <Button size="small" onClick={() => s.truck?.id && setFocusTruckFor(String(s.truck.id))} disabled={!s.truck?.id || !truckLocationsMap[String(s.truck?.id)]}>Focus</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-gray-600">
                All pending schedules are rendered simultaneously on one map. Click any route or marker to inspect details. Use the Focus buttons to fly to a particular truck.
              </p>
            </div>
          </div>

          {/* Mobile collapse */}
          <div className="sm:hidden">
            <Collapse>
              <Collapse.Panel header={`Pending Schedules (${pendingSchedules.length})`} key="1">
                {pendingSchedules.length === 0 ? (
                  <p className="text-sm text-gray-600">No pending schedules.</p>
                ) : (
                  <ul className="text-sm space-y-3">
                    {pendingSchedules.map((s, idx) => (
                      <li key={s.id} className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-sm mt-1" style={{ backgroundColor: COLOR_PALETTE[idx % COLOR_PALETTE.length] }} />
                        <div className="flex-1">
                          <div className="font-medium">{scheduleLabel(s)}</div>
                          <div className="text-xs text-gray-500">Truck: {s.truck?.plate_number || "—"} • Barangay: {s.barangay?.name || "—"}</div>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <Button size="small" onClick={() => s.truck?.id && setFocusTruckFor(String(s.truck.id))} disabled={!s.truck?.id || !truckLocationsMap[String(s.truck?.id)]}>Focus</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Collapse.Panel>

              <Collapse.Panel header="Notes" key="2">
                <p className="text-sm text-gray-600">
                  All pending schedules are rendered simultaneously on one map. Click any route or marker to inspect details. Use the Focus buttons to fly to a particular truck.
                </p>
              </Collapse.Panel>
            </Collapse>
          </div>
        </div>
      </div>


<button
  onClick={() => setShowFeedback(true)}
  className="fixed bottom-6 right-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-lg transition z-50"
>
  <FaCommentDots className="w-5 h-5" />
  <span className="text-xs font-medium">Feedback</span>
</button>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowFeedback(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✖
            </button>
            <Feedback isModal={true} onClose={() => setShowFeedback(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
