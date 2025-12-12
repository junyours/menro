// resources/js/Pages/RoutePlans/ScheduleZones.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Layout,
  Typography,
  Card,
  Select,
  Button,
  Row,
  Col,
  Space,
  message,
  Divider,
} from "antd";
import { Head, usePage, router } from "@inertiajs/react";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";
import RouteSummaryAside from "@/Components/RouteSummaryAside";
import StatusBadge from "@/Components/StatusBadge";
import { EnvironmentOutlined } from "@ant-design/icons";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
  Tooltip
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ZONE_COLORS } from "@/Components/MapIcons";
import axios from "axios";
import dayjs from "dayjs";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

/* ---------------- Mapbox token ---------------- */
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiamVzc3RoZXIxMjMiLCJhIjoiY21meGdzNmFzMDliMjJqczYyczBoZ3d6OCJ9.i1xXSqwXGWE5wXoUQB4fnw";

/* ---------------- Map helpers ---------------- */
function MapFocus({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds?.length) {
      try {
        map.fitBounds(bounds, { padding: [60, 60] });
      } catch (e) {
        // fail silently if bounds invalid
      }
    }
  }, [bounds, map]);
  return null;
}

function createZoneMarker(selected = false) {
  return L.divIcon({
    className: "zone-marker",
    html: `<div style="background:${selected ? "#10b981" : "#3b82f6"};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;">Z</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createTerminalMarker() {
  return L.divIcon({
    className: "terminal-marker",
    html: `<div style="background:#f59e0b;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;">T</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/* Safe helpers to extract zone id / name / coords */
const zoneId = (z) => z?.zone_id ?? z?.id ?? null;
const zoneName = (z) => z?.zone_name ?? z?.name ?? "Zone";

function getZoneCoord(zone) {
  const path = zone?.route_path;
  if (!Array.isArray(path) || path.length === 0) return null;

  let sumLat = 0,
    sumLng = 0,
    count = 0;
  for (const p of path) {
    const lat = p?.lat ?? p?.latitude ?? (Array.isArray(p) ? p[1] : undefined);
    const lng = p?.lng ?? p?.longitude ?? (Array.isArray(p) ? p[0] : undefined);
    if (lat != null && lng != null) {
      sumLat += Number(lat);
      sumLng += Number(lng);
      count++;
    }
  }
  if (count > 0) return [sumLat / count, sumLng / count];

  const first = path[0];
  const fLat =
    first?.lat ?? first?.latitude ?? (Array.isArray(first) ? first[1] : undefined);
  const fLng =
    first?.lng ?? first?.longitude ?? (Array.isArray(first) ? first[0] : undefined);
  if (fLat != null && fLng != null) return [Number(fLat), Number(fLng)];

  return null;
}

function computeBounds(routeInfo, previewZones) {
  if (routeInfo?.bounds?.length) return routeInfo.bounds;

  const pts = [];
  (previewZones || []).forEach((z) => {
    const c = getZoneCoord(z);
    if (c) pts.push(c);
    (z.garbage_terminals || []).forEach((t) => {
      if (t?.lat != null && t?.lng != null) pts.push([Number(t.lat), Number(t.lng)]);
    });
  });

  return pts;
}

/* ---------------- Utilities previously from ORSService ---------------- */

/**
 * haversineDistance expects [lat, lng] pairs and returns meters
 */
function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * findClosestIndex
 * - coordsList: array of [lng, lat] (Mapbox / geojson order)
 * - point: [lng, lat]
 * returns the index of the closest coordinate in coordsList to point
 */
function findClosestIndex(coordsList = [], point = [0, 0]) {
  if (!coordsList.length) return 0;
  let bestIdx = 0;
  let bestDist = Infinity;
  const [pxLng, pxLat] = point;
  for (let i = 0; i < coordsList.length; i++) {
    const [lng, lat] = coordsList[i];
    // convert to [lat, lng] for haversine
    const dist = haversineDistance([lat, lng], [pxLat, pxLng]);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * sliceCoordsSafe
 * - coordsList: array of [lng, lat]
 * - startIdx, endIdx: indices (may be out of order or out of range)
 * returns subarray from start to end (inclusive of end index)
 */
function sliceCoordsSafe(coordsList = [], startIdx = 0, endIdx = 0) {
  if (!Array.isArray(coordsList) || coordsList.length === 0) return [];
  const len = coordsList.length;
  let a = Math.max(0, Math.min(len - 1, startIdx));
  let b = Math.max(0, Math.min(len - 1, endIdx));
  if (a > b) {
    // swap
    const tmp = a;
    a = b;
    b = tmp;
  }
  // slice inclusive: slice(a, b + 1)
  return coordsList.slice(a, b + 1);
}

/* ---------------- Mapbox Directions call (replaces getRouteGeoJSON) ---------------- */
async function getMapboxRoute(orderedCoords) {
  // orderedCoords is expected: [[lng, lat], [lng, lat], ...]
  if (!orderedCoords || !orderedCoords.length) return null;

  // Mapbox expects "lng,lat;lng,lat;..."
  const coordString = orderedCoords.map((c) => `${c[0]},${c[1]}`).join(";");
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&overview=full&steps=false&access_token=${MAPBOX_TOKEN}`;

  const res = await axios.get(url);
  if (!res?.data?.routes?.length) return null;
  const route = res.data.routes[0];
  // route.geometry.coordinates is [ [lng,lat], [lng,lat], ... ]
  return {
    coordinates: route.geometry.coordinates,
    distance: route.distance, // meters
    duration: route.duration, // seconds
    // Mapbox doesn't return 'segments' in the same form; keep undefined or empty
    segments: route.legs || [],
  };
}

/* ---------------- Component ---------------- */
export default function ScheduleZones() {
  const { schedules, schedule, auth } = usePage().props;

  const [collapsed, setCollapsed] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedWeeklyReportId, setSelectedWeeklyReportId] = useState(null);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [weeklyZoneReports, setWeeklyZoneReports] = useState([]);
  const [previewZones, setPreviewZones] = useState([]);
  const [selectedZones, setSelectedZones] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [asideOpen, setAsideOpen] = useState(false);
  const [assigningZones, setAssigningZones] = useState(false);
  const [zonesAssigned, setZonesAssigned] = useState(false);
  const [avgSpeedKmh, setAvgSpeedKmh] = useState(20);
  const legsRef = useRef([]);
  const coordsLngLatRef = useRef([]);
  const [showLoadingCube, setShowLoadingCube] = useState(false);

  // Guards to avoid duplicate ORS requests and handle cancellation
  const lastOrderedKeyRef = useRef(null);
  const currentFetchTokenRef = useRef(null);

  useEffect(() => {
    setSelectedSchedule(schedule || null);
    setSelectedWeeklyReportId(schedule?.weekly_report_id ?? null);
  }, [schedule]);

  useEffect(() => {
    let mounted = true;
    axios
      .get("/weekly-reports")
      .then((res) => {
        if (!mounted) return;
        setWeeklyReports(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching weekly reports:", err);
        message.error("Failed to load weekly reports.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedWeeklyReportId) {
      setWeeklyZoneReports([]);
      setPreviewZones([]);
      return;
    }

    let mounted = true;
    axios
      .get(`/weekly-reports/${selectedWeeklyReportId}/zones`)
      .then((res) => {
        if (!mounted) return;
        const zones = res.data?.zones || [];
        setWeeklyZoneReports(zones);
        setPreviewZones(zones);
        setSelectedZones([]);
        setAsideOpen(true);
      })
      .catch((err) => {
        console.error("Error fetching zones:", err);
        message.error("Failed to load zones.");
      });

    return () => {
      mounted = false;
    };
  }, [selectedWeeklyReportId]);

  useEffect(() => {
    if (!selectedSchedule?.id) {
      setZonesAssigned(false);
      return;
    }
    let mounted = true;
    axios
      .get(`/route-planner/check/${selectedSchedule.id}`)
      .then((res) => {
        if (!mounted) return;
        setZonesAssigned(Boolean(res.data?.alreadyAssigned));
      })
      .catch((err) => {
        console.error("Error checking assigned zones:", err);
      });
    return () => {
      mounted = false;
    };
  }, [selectedSchedule]);

  useEffect(() => {
    // When zonesAssigned becomes true we compute route — with heavy guards
    if (!zonesAssigned) {
      setRouteInfo(null);
      coordsLngLatRef.current = [];
      legsRef.current = [];
      lastOrderedKeyRef.current = null;
      // cancel any in-flight fetch
      currentFetchTokenRef.current = null;
      return;
    }

    if (!selectedSchedule?.route_plans?.length) {
      setRouteInfo(null);
      return;
    }

    let cancelled = false;

    const fetchRoute = async () => {
      // Build orderedCoords + waypoints deterministically
      // NEW LOGIC: only include the FIRST zone's entry, then only each zone's FIRST ACTIVE terminal
      const orderedCoords = [];
      const allLatLngForBounds = [];
      const waypoints = [];

      const plans = (selectedSchedule.route_plans || []).filter(p => p && p.zone);
      if (!plans.length) {
        message.warn("No route plans available.");
        return;
      }

      // Helper: get entry coordinate from route_path (first point)
      const extractEntry = (zone) => {
        const routePath = Array.isArray(zone.route_path) ? zone.route_path : [];
        if (!routePath.length) return null;
        const entry = routePath[0];
        const entryLat = entry?.lat ?? entry?.latitude ?? (Array.isArray(entry) ? entry[1] : undefined);
        const entryLng = entry?.lng ?? entry?.longitude ?? (Array.isArray(entry) ? entry[0] : undefined);
        if (entryLat != null && entryLng != null) return [Number(entryLng), Number(entryLat)];
        return null;
      };

      // Helper: get an "exit/fallback" coordinate if no terminal exists
      const extractExitFallback = (zone) => {
        const routePath = Array.isArray(zone.route_path) ? zone.route_path : [];
        if (!routePath.length) return null;
        const exit = routePath[routePath.length - 1] || routePath[0];
        const exitLat = exit?.lat ?? exit?.latitude ?? (Array.isArray(exit) ? exit[1] : undefined);
        const exitLng = exit?.lng ?? exit?.longitude ?? (Array.isArray(exit) ? exit[0] : undefined);
        if (exitLat != null && exitLng != null) return [Number(exitLng), Number(exitLat)];
        return null;
      };

      // 1) Add ONLY the first plan's entry (if exists) as the start waypoint
      const firstPlan = plans[0];
      const firstZone = firstPlan.zone;
      const firstEntryCoords = extractEntry(firstZone);
      if (firstEntryCoords) {
        orderedCoords.push(firstEntryCoords);
        allLatLngForBounds.push([firstEntryCoords[1], firstEntryCoords[0]]); // [lat, lng]
        waypoints.push({
          label: `Entry: ${zoneName(firstZone)}`,
          lat: firstEntryCoords[1],
          lng: firstEntryCoords[0],
          zoneId: zoneId(firstZone) ?? null,
        });
      }

      // 2) For every plan (in order), push the FIRST ACTIVE terminal (if present).
      //    If no active terminal found, fall back to exit coordinate (last route_path point).
      plans.forEach((plan, idx) => {
        const zone = plan.zone;
        if (!zone) return;

        const terminals = Array.isArray(zone.garbage_terminals) ? zone.garbage_terminals : [];
        const firstActiveTerminal = terminals.find(t => t && t.is_active);

        if (firstActiveTerminal && firstActiveTerminal?.lat != null && firstActiveTerminal?.lng != null) {
          // terminal coords -> orderedCoords expects [lng, lat]
          orderedCoords.push([Number(firstActiveTerminal.lng), Number(firstActiveTerminal.lat)]);
          allLatLngForBounds.push([Number(firstActiveTerminal.lat), Number(firstActiveTerminal.lng)]);
          waypoints.push({
            label: `${zoneName(zone)}: Terminal 1`,
            lat: Number(firstActiveTerminal.lat),
            lng: Number(firstActiveTerminal.lng),
            zoneId: zoneId(zone) ?? null,
            terminalId: firstActiveTerminal?.id ?? null,
          });
        } else {
          // fallback: use exit or entry point as substitute (still [lng, lat])
          const fallback = extractExitFallback(zone);
          if (fallback) {
            orderedCoords.push([Number(fallback[0]), Number(fallback[1])]);
            allLatLngForBounds.push([Number(fallback[1]), Number(fallback[0])]);
            waypoints.push({
              label: `${zoneName(zone)}: Entry`,
              lat: Number(fallback[1]),
              lng: Number(fallback[0]),
              zoneId: zoneId(zone) ?? null,
            });
          }
        }
      });

      // Nothing to call Directions API with
      if (!orderedCoords.length) {
        setRouteInfo(null);
        message.warn("No coordinates available to compute route.");
        return;
      }

      // Create a stable key so we don't request the same route twice
      const orderedKey = JSON.stringify(orderedCoords);
      if (lastOrderedKeyRef.current === orderedKey && currentFetchTokenRef.current) {
        // Already fetched (or in-flight). Skip duplicate call.
        return;
      }

      // mark this key as the last one and create a token
      lastOrderedKeyRef.current = orderedKey;
      const fetchToken = Symbol("fetchRouteToken");
      currentFetchTokenRef.current = fetchToken;

      try {
        // CALL MAPBOX DIRECTIONS (replaces getRouteGeoJSON)
        const data = await getMapboxRoute(orderedCoords);
        // if a newer fetch started or component unmounted, ignore result
        if (cancelled || currentFetchTokenRef.current !== fetchToken) return;

        // Mapbox returns coordinates as [lng, lat]
        coordsLngLatRef.current = data.coordinates || [];

        const orsDistanceMeters = data.distance ?? 0;
        const orsDurationSeconds = data.duration ?? 0;

        // find closest indices of waypoints on the returned route polyline
        const waypointIndices = waypoints.map((wp) =>
          findClosestIndex(data.coordinates || [], [wp.lng, wp.lat])
        );

        const legs = [];
        for (let i = 0; i < waypointIndices.length - 1; i++) {
          const startIdx = waypointIndices[i];
          const endIdx = waypointIndices[i + 1];
          const legCoordsLngLat = sliceCoordsSafe(data.coordinates, startIdx, endIdx); // [ [lng,lat], ... ]
          const legCoordsLatLng = legCoordsLngLat.map(([lng, lat]) => [lat, lng]); // [ [lat,lng], ... ]
          let legDistanceMeters = 0;
          for (let k = 1; k < legCoordsLatLng.length; k++) {
            legDistanceMeters += haversineDistance(legCoordsLatLng[k - 1], legCoordsLatLng[k]);
          }
          legs.push({
            from: waypoints[i]?.label,
            to: waypoints[i + 1]?.label,
            fromZoneId: waypoints[i]?.zoneId ?? null,
            toZoneId: waypoints[i + 1]?.zoneId ?? null,
            fromTerminalId: waypoints[i]?.terminalId ?? null,
            toTerminalId: waypoints[i + 1]?.terminalId ?? null,
            distanceMeters: legDistanceMeters,
            coords: legCoordsLatLng,
          });
        }

        const totalLegDistance = legs.reduce((s, x) => s + (x.distanceMeters || 0), 0);
        const fallbackTotalDistance = totalLegDistance;
        const totalDistanceMeters = orsDistanceMeters || fallbackTotalDistance;
        const totalDurationSeconds = orsDurationSeconds || legs.reduce((s, x) => s + ((x.legSeconds) || 0), 0);

        const legsWithTimes = legs.map((l) => {
          const proportion = totalDistanceMeters > 0 ? (l.distanceMeters / totalDistanceMeters) : 0;
          const legSeconds = totalDurationSeconds > 0
            ? Math.max(1, Math.round(totalDurationSeconds * proportion))
            : Math.max(1, Math.round((l.distanceMeters / 1000) / (avgSpeedKmh || 20) * 3600));
          return { ...l, legSeconds, legMinutes: legSeconds / 60 };
        });

        if (orsDistanceMeters > 0 && orsDurationSeconds > 0) {
          const dynamicSpeed = (orsDistanceMeters / 1000) / (orsDurationSeconds / 3600);
          setAvgSpeedKmh(Number(dynamicSpeed.toFixed(2)));
        }

        // --- NEW: filter terminal-to-terminal legs (Option A) ---
        const terminalLegs = legsWithTimes.filter(
          (l) =>
            typeof l.from === "string" &&
            typeof l.to === "string" &&
            l.from.includes("Terminal") &&
            l.to.includes("Terminal")
        );

        if (!cancelled && currentFetchTokenRef.current === fetchToken) {
          setRouteInfo({
            distance: orsDistanceMeters || legsWithTimes.reduce((s, x) => s + x.distanceMeters, 0),
            duration: orsDurationSeconds || legsWithTimes.reduce((s, x) => s + x.legSeconds, 0),
            coordinates: data.coordinates,
            bounds: [...allLatLngForBounds, ...((data.coordinates || []).map(([lng, lat]) => [lat, lng]))],
            waypoints,
            legs: legsWithTimes,
            terminalLegs,
            segments: data.segments,
          });

          legsRef.current = legsWithTimes;
        }
      } catch (err) {
        if (cancelled) return;
        console.error("fetchRoute error:", err);
        message.error("Failed to fetch route from Directions API.");
        setRouteInfo(null);
        coordsLngLatRef.current = [];
        legsRef.current = [];
      }
    };

    // Run fetch (no debounce needed: we dedupe by orderedKey)
    fetchRoute();

    return () => {
      cancelled = true;
      // clear token so late responses are ignored
      currentFetchTokenRef.current = null;
    };
  }, [selectedSchedule, zonesAssigned, avgSpeedKmh]);

  const handleAssignZones = async () => {
    if (!selectedSchedule) return message.error("No schedule selected.");
    if (!selectedZones.length) return message.error("Please select at least one zone.");
    if (!selectedWeeklyReportId) return message.error("No weekly report found.");

    setAssigningZones(true);
    try {
      const payload = {
        schedule_id: Number(selectedSchedule.id),
        weekly_report_id: Number(selectedWeeklyReportId),
        zone_ids: selectedZones.map(Number),
      };
      const { data } = await axios.post("/route-planner", payload);

      if (data.success) {
        setPreviewZones(data.zones || []);
        // assume server now marks assigned; set flag
        setZonesAssigned(true);

        // show loading cube briefly and then reload — but guard in case router.reload fails
        setShowLoadingCube(true);
        message.success("Zones assigned and loaded. Reloading...");

        // try to reload; if reload doesn't happen within 2s, hide cube and stop assigning state
        const reloaded = router.reload();
        // router.reload returns immediately; we'll set a fallback timeout
        setTimeout(() => {
          setShowLoadingCube(false);
          setAssigningZones(false);
        }, 2000);
      } else {
        message.error(data.error || "Failed to assign zones.");
      }
    } catch (err) {
      console.error("assign error", err);
      message.error("Failed to assign zones.");
    } finally {
      // ensure button is re-enabled if error occurred
      setAssigningZones(false);
    }
  };

  const handleZoneMarkerClick = (idRaw) => {
    const id = Number(idRaw);
    setSelectedZones((prev) => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const computed = useMemo(() => {
    if (!routeInfo?.legs?.length)
      return { totalMinutes: 0, totalWithBuffer: 0, legs: [], avgSpeedKmh, routeBufferMinutes: 20 };
    const routeBufferMinutes = 20;
    let cumulative = 0;
    const legs = routeInfo.legs.map((l) => {
      cumulative += l.legMinutes;
      return { ...l, cumulativeMinutes: cumulative };
    });
    const totalMinutes = (routeInfo.duration && routeInfo.duration > 0) ? (routeInfo.duration / 60) : legs.reduce((sum, x) => sum + x.legMinutes, 0);
    return { totalMinutes, totalWithBuffer: totalMinutes + routeBufferMinutes, routeBufferMinutes, legs, avgSpeedKmh };
  }, [routeInfo, avgSpeedKmh]);

  const hasPreviewCoords = useMemo(() => {
    return previewZones.some((z) => !!getZoneCoord(z));
  }, [previewZones]);

  const bounds = computeBounds(routeInfo, previewZones);

  return (
    <>
      <Head title="Schedule Zones" />
      <Layout style={{ minHeight: "100vh", background: "#f4f5f7" }}>
        <Sidebar collapsible collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />
        <Layout>
          <Navbar auth={auth} collapsed={collapsed} setCollapsed={setCollapsed} />
          <Content style={{ margin: "24px 16px" }}>

            <style>{`
            .loading-cube-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.45);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 9999;
            }
            .loading-cube {
              width: 64px;
              height: 64px;
              transform-style: preserve-3d;
              animation: cube-rotate 1.2s infinite linear;
            }
            .loading-cube > div {
              position: absolute;
              width: 64px;
              height: 64px;
              background: linear-gradient(135deg,#4f46e5,#3b82f6);
              opacity: 0.9;
            }
            @keyframes cube-rotate {
              0% { transform: rotateX(0deg) rotateY(0deg); }
              50% { transform: rotateX(180deg) rotateY(0deg); }
              100% { transform: rotateX(180deg) rotateY(180deg); }
            }
          `}</style>

            {showLoadingCube && (
              <div className="loading-cube-overlay" aria-hidden>
                <div className="loading-cube" role="status" aria-label="Loading">
                  <div></div>
                </div>
              </div>
            )}

            {/* Schedule Zones Map Header */}
            <div style={{ marginBottom: 24 }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Space align="center">
                    <span
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        background: "#4f46e5",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#fff",
                        fontSize: 24,
                      }}
                    >
                      <EnvironmentOutlined />
                    </span>

                    <div>
                      <Title
                        level={3}
                        style={{
                          margin: 0,
                          fontFamily: "Poppins, Inter, sans-serif",
                          fontWeight: 600,
                          letterSpacing: "0.4px",
                        }}
                      >
                        Schedule Zones Map
                      </Title>

                      <Text
                        style={{
                          color: "#666",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 14,
                          letterSpacing: "0.3px",
                        }}
                      >
                        Click a zone to add it to the selected zones
                      </Text>

                    </div>
                  </Space>
                </Col>

                {selectedSchedule && (
                  <Col>
                    <div
                      style={{
                        padding: "10px 20px",
                        borderRadius: 14,
                        background: "linear-gradient(135deg, #eef2ff, #fafaff)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 600,
                          color: "#4338ca",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Status:
                      </Text>

                      <StatusBadge status={selectedSchedule.status} />
                    </div>
                  </Col>

                )}
              </Row>

              <Divider />
            </div>


            {schedules?.length > 0 && (
              <Card
                style={{
                  borderRadius: 20,
                  padding: 24,
                  marginBottom: 28,
                  background: "rgba(255, 255, 255, 0.75)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  transition: "all 0.35s ease",
                  transform: "translateY(0px)",
                }}
                hoverable
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-6px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0px)")}
                bodyStyle={{ padding: 0 }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Text
                    strong
                    style={{
                      fontSize: 18,
                      letterSpacing: 0.5,
                      color: "#111",
                      fontFamily: "Inter, Poppins, sans-serif",
                      marginBottom: 4,
                      display: "block",
                    }}
                  >
                    Select a Schedule
                  </Text>

                  <Text
                    type="secondary"
                    style={{
                      fontSize: 13.5,
                      fontFamily: "Inter, Poppins, sans-serif",
                    }}
                  >
                    Choose a pending schedule to view its collection route.
                  </Text>
                </div>

                <Select
                  placeholder="Select a schedule..."
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    fontFamily: "Inter, Poppins, sans-serif",
                  }}
                  size="large"
                  value={selectedSchedule?.id}
                  dropdownStyle={{
                    borderRadius: 14,
                    padding: 6,
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 6px 22px rgba(0,0,0,0.12)",
                  }}
                  onChange={val => {
                    const sched = schedules.find(s => s.id === val);
                    setSelectedWeeklyReportId(sched?.weekly_report_id || null);
                    router.visit(`/route-plans/${val}`, { preserveScroll: true });
                  }}
                  optionLabelProp="label"
                >
                  {schedules
                    .filter(s => s.status === "Pending")
                    .map(s => (
                      <Option
                        key={s.id}
                        value={s.id}
                        label={`${s.barangay?.name} — ${s.pickup_datetime}`}
                      >
                        <div
                          style={{
                            padding: 8,
                            fontFamily: "Inter, Poppins, sans-serif",
                          }}
                        >
                          <Text strong style={{ fontSize: 15 }}>
                            {s.barangay?.name}
                          </Text>
                          <br />
                        <Text type="secondary" style={{ fontSize: 12.5 }}>
            {dayjs(s.pickup_datetime).format("MMM DD YYYY")}
          </Text>
                        </div>
                      </Option>
                    ))}
                </Select>
              </Card>

            )}

            {selectedSchedule && (
            <Card
  style={{
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    background: "rgba(255, 255, 255, 0.78)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.12)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.25)",
    transition: "all 0.35s ease",
    transform: "translateY(0px)",
  }}
  hoverable
  onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-6px)")}
  onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0px)")}
  bodyStyle={{ padding: 0 }}
>
  <Row gutter={16}>
    {/* ------------------------- Select Weekly Report ------------------------- */}
    <Col xs={24} md={12}>
      <Text
        strong
        style={{
          marginBottom: 6,
          display: "block",
          fontFamily: "Poppins, Inter, sans-serif",
          fontSize: 15,
          letterSpacing: 0.3,
        }}
      >
        Select Weekly Report:
      </Text>

      <Select
        placeholder="Select Weekly Report"
        style={{
          width: "100%",
          borderRadius: 12,
          fontFamily: "Inter, Poppins, sans-serif",
        }}
        size="large"
        value={selectedWeeklyReportId}
        onChange={val => setSelectedWeeklyReportId(val)}
        optionLabelProp="label"
        dropdownStyle={{
          borderRadius: 14,
          padding: 6,
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 6px 22px rgba(0,0,0,0.12)",
        }}
      >
        {weeklyReports.map(r => (
          <Option
            key={r.id}
            value={r.id}
            label={r.submitted_at ? dayjs(r.submitted_at).format("MMM DD YYYY") : `Weekly Report #${r.id}`}
          >
            <div style={{ padding: 8 }}>
              <Text strong style={{ fontSize: 14 }}>
                {r.submitted_at
                  ? dayjs(r.submitted_at).format("MMM DD YYYY")
                  : `Weekly Report #${r.id}`}
              </Text>
            </div>
          </Option>
        ))}
      </Select>
    </Col>

    {/* ------------------------- Select Zones ------------------------- */}
    <Col xs={24} md={12}>
      <Text
        strong
        style={{
          marginBottom: 6,
          display: "block",
          fontFamily: "Poppins, Inter, sans-serif",
          fontSize: 15,
          letterSpacing: 0.3,
        }}
      >
        Select Zones:
      </Text>

      <Select
        mode="multiple"
        placeholder="Click zones on map to select"
        value={selectedZones}
        onChange={(vals) =>
          setSelectedZones((vals || []).filter(v => v != null).map(Number))
        }
        style={{
          width: "100%",
          borderRadius: 12,
          fontFamily: "Inter, Poppins, sans-serif",
        }}
        size="large"
        disabled
        dropdownStyle={{
          borderRadius: 14,
          padding: 6,
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 6px 22px rgba(0,0,0,0.12)",
        }}
      >
        {weeklyZoneReports.map((z, idx) => (
          <Option key={zoneId(z) || idx} value={zoneId(z) || idx}>
            {zoneName(z)}
          </Option>
        ))}
      </Select>
    </Col>
  </Row>

  {/* ------------------------- Action Button ------------------------- */}
  <Button
    type="primary"
    block
    style={{
      marginTop: 20,
      borderRadius: 12,
      fontFamily: "Inter, Poppins, sans-serif",
      fontWeight: 600,
      background: zonesAssigned
        ? "linear-gradient(135deg, #d9d9d9, #f0f0f0)"
        : "linear-gradient(135deg, #4f46e5, #3b82f6)",
      boxShadow: zonesAssigned ? "none" : "0 6px 18px rgba(79,70,229,0.3)",
      cursor: zonesAssigned ? "not-allowed" : "pointer",
    }}
    onClick={handleAssignZones}
    loading={assigningZones}
    disabled={zonesAssigned}
  >
    {zonesAssigned ? "Zones Already Assigned" : "Load Selected Zones on Map"}
  </Button>
</Card>
            )}

            {selectedSchedule && (hasPreviewCoords || routeInfo) && (
              <Card title={zonesAssigned && routeInfo ? "Route Map" : "Zone Map"} style={{ borderRadius: 16, marginBottom: 24, boxShadow: "0 6px 20px rgba(0,0,0,0.05)" }}>
                <MapContainer center={[8.475, 124.6425]} zoom={13} style={{ height: "550px", width: "100%", borderRadius: 16 }}>
                  <TileLayer
                    url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                    attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a> &amp; OpenStreetMap contributors'
                  />

                  {previewZones.map((zone, idx) => {
                    const coord = getZoneCoord(zone);
                    if (!coord) return null;
                    const id = zoneId(zone) ?? idx;
                    return (
                      <Marker
                        key={`zone-${id}`}
                        position={[coord[0], coord[1]]}
                        icon={createZoneMarker(selectedZones.includes(Number(id)))}
                        eventHandlers={{ click: () => handleZoneMarkerClick(id) }}
                      >
                        <Popup><Text strong>{zoneName(zone)}</Text></Popup>
                        <Tooltip permanent direction="top" offset={[0, -10]}>{zoneName(zone)}</Tooltip>
                      </Marker>
                    );
                  })}

                  {zonesAssigned && routeInfo && (
                    <>
                      {routeInfo.legs?.map((leg, idx) => (
                        <Polyline key={`leg-${idx}`} positions={leg.coords} pathOptions={{ color: ZONE_COLORS[leg.fromZoneId] || "#1890ff", weight: 4, opacity: 0.8 }} />
                      ))}

                      {selectedSchedule?.route_plans?.flatMap((plan, planIdx) =>
                        (plan.zone?.garbage_terminals || [])
                          .filter(t => t.is_active)
                          .map((t, tIdx) => {
                            if (t?.lat == null || t?.lng == null) return null;
                            return (
                              <Marker key={`terminal-${planIdx}-${tIdx}`} position={[Number(t.lat), Number(t.lng)]} icon={createTerminalMarker()}>
                                <Popup><Text>Terminal {tIdx + 1}: {plan.zone?.name}</Text></Popup>
                              </Marker>
                            );
                          })
                      )}

                      <MapFocus bounds={bounds} />
                    </>
                  )}

                  {!routeInfo && hasPreviewCoords && <MapFocus bounds={bounds} />}
                </MapContainer>
              </Card>
            )}

            {zonesAssigned && routeInfo && (
              <RouteSummaryAside
                open={asideOpen}
                onClose={() => setAsideOpen(false)}
                data={computed}
                distance={routeInfo.distance}
                computed={computed}
                avgSpeedKmh={avgSpeedKmh}
                onSpeedChange={setAvgSpeedKmh}
                scheduleId={selectedSchedule?.id}
                terminalLegs={routeInfo.terminalLegs}
              />
            )}
          </Content>
        </Layout>
      </Layout>
    </>
  );
}
