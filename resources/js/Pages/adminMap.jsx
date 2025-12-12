import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Head, router } from "@inertiajs/react";
import { Button, Empty, Divider } from "antd";
import LoadingCube from "@/Components/LoadingCube";
import "leaflet.awesome-markers/dist/leaflet.awesome-markers.css";
import "leaflet.awesome-markers";
import Navbar from "@/Components/Navbar";
import Sidebar from "@/Components/Sidebar";
import {
  TruckIcon,
} from "@heroicons/react/24/outline";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { ref as fbRef, onValue, off } from "firebase/database";
import { db } from "@/firebase";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiamVzc3RoZXIxMjMiLCJhIjoiY21meGdzNmFzMDliMjJqczYyczBoZ3d6OCJ9.i1xXSqwXGWE5wXoUQB4fnw";
const MAPBOX_DIRECTIONS_PROFILE = "driving";
const ROUTE_POLL_MS = 15000; // poll route details for all schedules
const ROUTE_DIRECTIONS_TIMEOUT_MS = 12000; // abort timeout for mapbox calls

const completedIcon = L.AwesomeMarkers.icon({
  icon: "check-circle",
  markerColor: "green",
  prefix: "fa",
  iconColor: "white",
});
const inProgressIcon = L.AwesomeMarkers.icon({
  icon: "spinner",
  markerColor: "orange",
  prefix: "fa",
  spin: true,
  iconColor: "white",
});
const pendingIcon = L.AwesomeMarkers.icon({
  icon: "hourglass-half",
  markerColor: "blue",
  prefix: "fa",
  iconColor: "white",
});
const missedIcon = L.AwesomeMarkers.icon({
  icon: "times-circle",
  markerColor: "red",
  prefix: "fa",
  iconColor: "white",
});

const truckIcon = L.icon({
  iconUrl: "/images/truckicon.png",
  iconSize: [35, 35],
  iconAnchor: [15, 15],
  popupAnchor: [0, -20],
});

dayjs.extend(utc);

function geojsonToLatLngArray(coords) {
  return coords.map(([lng, lat]) => [lat, lng]);
}

function getMarkerIcon(status) {
  switch (status) {
    case "completed":
      return completedIcon;
    case "in_progress":
      return inProgressIcon;
    case "missed":
      return missedIcon;
    default:
      return pendingIcon;
  }
}

function SmartFly({ truckLocationsMap, routeBounds, focusTruckFor }) {
  const map = useMap();
  const hasInitialView = useRef(false);

  useEffect(() => {
    if (!map) return;
    // Fit to combined route bounds once
    if (!hasInitialView.current && routeBounds) {
      try {
        map.fitBounds(routeBounds, { padding: [60, 60], maxZoom: 18 });
      } catch (e) {
        console.warn("SmartFly fitBounds failed:", e);
      }
      hasInitialView.current = true;
    }

    // If focusTruckFor is provided (truckId), fly to that truck
    if (focusTruckFor && truckLocationsMap && truckLocationsMap[focusTruckFor]) {
      const loc = truckLocationsMap[focusTruckFor];
      try {
        map.flyTo([loc[0], loc[1]], 18, { duration: 1.2 });
      } catch (e) {
        console.warn("SmartFly flyTo failed:", e);
      }
    }
  }, [map, truckLocationsMap, routeBounds, focusTruckFor]);

  return null;
}

export default function AdminMap({ schedules = [], auth = {} }) {
  // Sidebar
  const [collapsed, setCollapsed] = useState(true);

  // We'll include ALL pending schedules on a single map (no selecting)
  const pendingSchedules = schedules.filter((s) => s.status === "Pending");

  // routeDetailsMap: { scheduleId: [segments...] }
  const [routeDetailsMap, setRouteDetailsMap] = useState({});
  const [loadingMap, setLoadingMap] = useState(false);
  const [error, setError] = useState(null);

  const [routePolylinesMap, setRoutePolylinesMap] = useState({});

  const [truckLocationsMap, setTruckLocationsMap] = useState({});
  const [truckLastUpdatedMap, setTruckLastUpdatedMap] = useState({});
  const [routeDriversMap, setRouteDriversMap] = useState({});


  // focus truck id when pressing Focus button
  const [focusTruckFor, setFocusTruckFor] = useState(null);

  // color palette for schedule polylines (cycle through)
  const colorPalette = ["#2563eb", "#10b981", "#f97316", "#8b5cf6", "#ef4444", "#06b6d4"];

// Fetch route details for ALL pending schedules repeatedly
useEffect(() => {
  let mounted = true;
  let timers = [];

  const fetchForAll = async (silent = false) => {
    setError(null);
    if (!silent) setLoadingMap(true);

    try {
      const newRouteMap = {};
      const newDriverMap = {};

      for (const s of pendingSchedules) {
        try {
          const res = await fetch(`/route-details/${s.id}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data = await res.json();

          // Save route details
          newRouteMap[s.id] = data.routeDetails || [];

          // Save driver
          newDriverMap[s.id] = data.driver || null;

        } catch (err) {
          console.warn(`Failed to fetch route for schedule ${s.id}:`, err);

          // Fallback if error
          newRouteMap[s.id] = [];
          newDriverMap[s.id] = null;
        }
      }

      if (mounted) {
        setRouteDetailsMap((prev) => ({ ...prev, ...newRouteMap }));
        setRouteDriversMap((prev) => ({ ...prev, ...newDriverMap }));
      }
    } catch (err) {
      console.error("fetchForAll error", err);
      if (mounted) setError("Failed to load route details.");
    } finally {
      if (!silent && mounted) setLoadingMap(false);

      // set next poll
      if (mounted) {
        const t = setTimeout(() => fetchForAll(true), ROUTE_POLL_MS);
        timers.push(t);
      }
    }
  };

  if (pendingSchedules.length > 0) fetchForAll(false);

  return () => {
    mounted = false;
    timers.forEach((t) => clearTimeout(t));
  };
}, [JSON.stringify(pendingSchedules.map((p) => p.id))]);


  // Listen to Firebase for all trucks related to pending schedules
  useEffect(() => {
    const listeners = [];
    const newTruckMap = { ...truckLocationsMap };
    const newLastMap = { ...truckLastUpdatedMap };

    // cleanup previous listeners when schedules change
    const addListener = (truckId, scheduleId) => {
      if (!truckId) return;
      const truckRef = fbRef(db, `trucks/${truckId}`);
      const handler = (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setTruckLocationsMap((prev) => {
            const copy = { ...prev };
            delete copy[truckId];
            return copy;
          });
          return;
        }
        const lat = data.latitude != null ? parseFloat(data.latitude) : data.lat != null ? parseFloat(data.lat) : null;
        const lng = data.longitude != null ? parseFloat(data.longitude) : data.lng != null ? parseFloat(data.lng) : null;
        if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return;
        setTruckLocationsMap((prev) => ({ ...prev, [truckId]: [lat, lng] }));
        const updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
        try {
          setTruckLastUpdatedMap((prev) => ({ ...prev, [truckId]: new Date(updatedAt).toLocaleTimeString() }));
        } catch (e) {
          setTruckLastUpdatedMap((prev) => ({ ...prev, [truckId]: new Date().toLocaleTimeString() }));
        }
      };

      onValue(truckRef, handler, (err) => console.error("Firebase truck onValue error:", err));
      listeners.push({ ref: truckRef, handler, truckId });
    };

    // set listeners for current pending schedules' trucks
    for (const s of pendingSchedules) {
      if (s.truck && s.truck.id) addListener(s.truck.id, s.id);
    }

    // cleanup function
    return () => {
      listeners.forEach((l) => {
        try {
          off(l.ref, 'value', l.handler);
        } catch (e) {
          try { off(l.ref); } catch (ee) {}
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pendingSchedules.map((p) => p.truck && p.truck.id))]);

  // For each schedule compute route polyline via Mapbox Directions when possible.
  useEffect(() => {
    let mounted = true;

    const abortControllers = [];

    const computePolylines = async () => {
      const mapResult = {};

      for (let i = 0; i < pendingSchedules.length; i++) {
        const s = pendingSchedules[i];
        const segs = routeDetailsMap[s.id] || [];
        const truckId = s.truck?.id;
        const truckLoc = truckId ? truckLocationsMap[truckId] : null;

        // build coordinates: truck -> each segment from_lat/from_lng -> last to_lat/to_lng
        const coords = [];
        if (truckLoc) coords.push([truckLoc[1], truckLoc[0]]); // lng,lat
        for (const seg of segs) {
          if (seg.from_lng != null && seg.from_lat != null) coords.push([seg.from_lng, seg.from_lat]);
        }
        const last = segs.length ? segs[segs.length - 1] : null;
        if (last && last.to_lng != null && last.to_lat != null) coords.push([last.to_lng, last.to_lat]);

        if (coords.length >= 2) {
          // Call Mapbox Directions; use AbortController to be safe
          const ac = new AbortController();
          abortControllers.push(ac);
          try {
            const coordsStr = coords.map((c) => c.join(",")).join(";");
            const url = `https://api.mapbox.com/directions/v5/mapbox/${MAPBOX_DIRECTIONS_PROFILE}/${coordsStr}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
            const timeout = setTimeout(() => ac.abort(), ROUTE_DIRECTIONS_TIMEOUT_MS);
            const resp = await fetch(url, { signal: ac.signal });
            clearTimeout(timeout);
            if (!mounted) break;
            const json = await resp.json();
            if (json && json.routes && json.routes.length > 0 && json.routes[0].geometry) {
              const geo = json.routes[0].geometry.coordinates; // [ [lng,lat], ... ]
              mapResult[s.id] = geojsonToLatLngArray(geo);
              continue;
            }
          } catch (err) {
            // fall through to fallback
            console.warn(`Mapbox directions failed for schedule ${s.id}:`, err);
          }
        }

        // fallback: create simple polyline from available points (truck + segments)
        const fallback = [];
        if (truckLoc) fallback.push([truckLoc[0], truckLoc[1]]);
        for (const seg of segs) {
          if (seg.from_lat != null && seg.from_lng != null) fallback.push([seg.from_lat, seg.from_lng]);
        }
        if (last && last.to_lat != null && last.to_lng != null) fallback.push([last.to_lat, last.to_lng]);
        mapResult[s.id] = fallback;
      }

      if (mounted) setRoutePolylinesMap(mapResult);
    };

    computePolylines();

    return () => {
      mounted = false;
      abortControllers.forEach((ac) => {
        try { ac.abort(); } catch (e) {}
      });
    };
  }, [routeDetailsMap, truckLocationsMap, JSON.stringify(pendingSchedules.map((p) => p.id))]);

  // Compute combined route bounds to fit the map
  const routeBounds = useMemo(() => {
    const allPoints = [];
    Object.values(routePolylinesMap).forEach((arr) => {
      if (arr && arr.length) arr.forEach((p) => allPoints.push(p));
    });
    // also include truck locations
    Object.values(truckLocationsMap).forEach((loc) => {
      if (loc && loc.length) allPoints.push([loc[0], loc[1]]);
    });

    return allPoints.length ? L.latLngBounds(allPoints) : null;
  }, [routePolylinesMap, truckLocationsMap]);

  const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

  // Helper to format schedule label
 function scheduleLabel(s) {
    if (!s) return "Unknown";
    let formattedDate = "Unknown Date";
    if (s.pickup_datetime) {
      const d = new Date(s.pickup_datetime);
      if (!isNaN(d)) formattedDate = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    return `${formattedDate} — ${s.barangay?.name || "Unknown Barangay"} — ${s.truck?.model || "Unassigned"}`;
  }

  // UI render
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <Sidebar collapsible collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />

      <div className="flex-1 flex flex-col">
        <Navbar collapsed={collapsed} setCollapsed={setCollapsed} auth={auth} />

        <div className="max-w-7xl mx-auto p-6 md:p-10">
          <Head title="Route Monitoring" />

         <div className="mb-6">
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
    {/* Title + Description */}
    <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
      <TruckIcon className="w-8 h-8 text-blue-600" />
      <div className="flex flex-col">
        {/* Title */}
        <h1
          className="text-2xl md:text-3xl font-extrabold flex items-center gap-2"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Route Monitoring
        </h1>

        {/* Description */}
        <p
          className="mt-2 text-sm md:text-base text-blue-500"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
        >
          All pending schedules rendered on a single map (no selector).
        </p>
      </div>
    </div>

    {/* Optional Placeholder */}
    <div className="flex items-center gap-3"></div>
  </div>

  {/* Divider */}
  <Divider style={{ marginTop: 16, borderColor: "#93c5fd" }} />
</div>

          <div className="flex items-center gap-3 mb-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
              <span className="font-medium text-gray-700">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-yellow-400 rounded-sm"></span>
              <span className="font-medium text-gray-700">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-red-500 rounded-sm"></span>
              <span className="font-medium text-gray-700">Missed</span>
            </div>
          </div>

          {/* Truck Controls (keeps focus button but allows selecting which truck to focus on) */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">Focus a truck (if multiple):</div>
                <div className="flex gap-2 flex-wrap">
                  {pendingSchedules.length === 0 ? (
                    <span className="text-sm text-gray-500">No pending schedules</span>
                  ) : (
                    pendingSchedules.map((s) => (
                      <Button
                        key={s.id}
                        size="small"
                        onClick={() => setFocusTruckFor(s.truck?.id || null)}
                        disabled={!s.truck?.id || !truckLocationsMap[s.truck?.id]}
                        className="rounded-lg"
                      >
                        {s.truck?.plate_number || `Truck ${s.truck?.id || s.id}`}
                      </Button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 bg-white/70 px-3 py-1 rounded-full shadow">⏱ Updated per truck</span>
              </div>
            </div>
          </div>

          {/* Map area */}
          {loadingMap ? (
            <LoadingCube />
          ) : Object.keys(routeDetailsMap).length === 0 && pendingSchedules.length === 0 ? (
            <p className="text-gray-600 text-center">No pending schedules at the moment.</p>
          ) : (
            <>
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-white/80 backdrop-blur-lg mb-10">
                <MapContainer
                  center={
                    routeBounds
                      ? [routeBounds.getCenter().lat, routeBounds.getCenter().lng]
                      : [8.482, 124.647]
                  }
                  zoom={13}
                  style={{ height: "640px", width: "100%" }}
                >
                  <TileLayer
                    url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                    attribution='© <a href="https://www.mapbox.com/">Mapbox</a>, © OpenStreetMap'
                    tileSize={512}
                    zoomOffset={-1}
                  />

                  <SmartFly truckLocationsMap={truckLocationsMap} routeBounds={routeBounds} focusTruckFor={focusTruckFor} />

                  {/* Draw polylines for each schedule */}
                  {Object.keys(routePolylinesMap).map((scheduleId, idx) => {
                    const positions = routePolylinesMap[scheduleId] || [];
                    const color = colorPalette[idx % colorPalette.length];
                    if (!positions || positions.length < 2) return null;
                    return (
                      <Polyline
                        key={`poly-${scheduleId}`}
                        positions={positions}
                        pathOptions={{ color, weight: 5, opacity: 0.9 }}
                      />
                    );
                  })}

                  {/* Draw segment markers for all schedules */}
                  {Object.entries(routeDetailsMap).map(([scheduleId, segs]) =>
                    segs.map((d) =>
                      d.from_lat && d.from_lng ? (
                        <Marker
                          key={`from-${scheduleId}-${d.id}`}
                          position={[d.from_lat, d.from_lng]}
                          icon={getMarkerIcon(d.status)}
                        >
  <Popup>
  <div
    style={{
      fontSize: "13px",
      lineHeight: "1.45",
      padding: "10px 12px",
      borderRadius: "8px",
      background: "rgba(255, 255, 255, 0.95)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      maxWidth: "220px"
    }}
  >
    {/* Title */}
    <div
      style={{
        fontSize: "14.5px",
        fontWeight: 600,
        marginBottom: "6px",
        color: "#222"
      }}
    >
      {d.name || d.from_name || "Unknown"}
    </div>

    {/* Driver */}
    <div style={{ marginBottom: "4px" }}>
      <span style={{ color: "#666" }}>Driver:</span>{" "}
      <strong style={{ color: "#111" }}>
        {routeDriversMap[scheduleId]?.name || "No Assigned Driver"}
      </strong>
    </div>

    {/* Schedule */}
    <div style={{ marginBottom: "4px" }}>
      <span style={{ color: "#666" }}>Schedule:</span>{" "}
      <span style={{ color: "#111" }}>
        {scheduleLabel(schedules.find((s) => String(s.id) === String(scheduleId)))}
      </span>
    </div>

    {/* Status */}
    <div style={{ marginBottom: "4px" }}>
      <span style={{ color: "#666" }}>Status:</span>{" "}
      <strong
        style={{
          color:
            d.status === "On Time"
              ? "#22c55e"
              : d.status === "Delayed"
              ? "#ef4444"
              : "#333"
        }}
      >
        {d.status || "—"}
      </strong>
    </div>

    {/* Planned */}
    <div>
      <span style={{ color: "#666" }}>Planned:</span>{" "}
      <span style={{ color: "#111" }}>{d.duration_min || "—"} min</span>
    </div>
  </div>
</Popup>



                        </Marker>
                      ) : null
                    )
                  )}

                  {/* final terminal markers for each schedule */}
                  {Object.entries(routeDetailsMap).map(([scheduleId, segs]) => {
                    const last = segs.length ? segs[segs.length - 1] : null;
                    if (last && last.to_lat && last.to_lng) {
                      return (
                        <Marker
                          key={`term-${scheduleId}`}
                          position={[last.to_lat, last.to_lng]}
                          icon={getMarkerIcon(last.status)}
                        >
                          <Popup>
                            <strong>Last Terminal</strong>
                            <br />
                            Schedule: {scheduleLabel(schedules.find((s) => String(s.id) === String(scheduleId)))}
                            <br />
                            Status: {last.status || "—"}
                          </Popup>
                        </Marker>
                      );
                    }
                    return null;
                  })}

                  {/* Truck markers for all trucks */}
                  {Object.entries(truckLocationsMap).map(([truckId, loc]) => (
                    <Marker key={`truck-${truckId}`} position={loc} icon={truckIcon}>
                      <Popup>
                        🚛 Truck {truckId}
                        <br />
                        Last: {truckLastUpdatedMap[truckId] || "—"}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Minimal legend and schedule list (no bottom card) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <h3 className="font-semibold mb-2">Pending Schedules ({pendingSchedules.length})</h3>
                  <ul className="text-sm space-y-2">
                    {pendingSchedules.map((s, idx) => (
                      <li key={s.id} className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colorPalette[idx % colorPalette.length] }}></div>
                        <div>
                          <div className="font-medium">{scheduleLabel(s)}</div>
                          <div className="text-xs text-gray-500">Truck: {s.truck?.plate_number || "—"}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">All pending schedules are displayed together. Click any marker to see details. Use the small truck buttons above to focus a truck.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
