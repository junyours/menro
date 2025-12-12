// resources/js/Pages/MapComponents.jsx
import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { NEAR_ROUTE_DISTANCE_M, FAR_ROUTE_DISTANCE_M } from "./mapUtils";

export default function SmartFly({ truckLocation, routeBounds, focusTruck }) {
  const map = useMap();
  const prevLocation = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Nothing to do if no truck or route data
    if (!truckLocation && routeBounds) {
      map.fitBounds(routeBounds, { padding: [60, 60], maxZoom: 18 });
      return;
    }

    // Skip if truck hasn't moved significantly
    if (truckLocation && prevLocation.current) {
      const distanceMoved = map.distance(
        L.latLng(truckLocation[0], truckLocation[1]),
        L.latLng(prevLocation.current[0], prevLocation.current[1])
      );

      // Only update map if truck moved more than ~20 meters
      if (distanceMoved < 20) return;
    }

    if (truckLocation && routeBounds) {
      const routeCenter = routeBounds.getCenter();
      const dist = map.distance(
        L.latLng(truckLocation[0], truckLocation[1]),
        routeCenter
      );

      if (focusTruck) {
        map.flyTo([truckLocation[0], truckLocation[1]], 18, { duration: 1.2 });
      } else if (dist < NEAR_ROUTE_DISTANCE_M) {
        map.flyTo([truckLocation[0], truckLocation[1]], 18, { duration: 1.0 });
      } else if (dist > FAR_ROUTE_DISTANCE_M) {
        map.flyToBounds(routeBounds, {
          padding: [60, 60],
          maxZoom: 15,
          duration: 1.2,
        });
      } else {
        map.flyToBounds(routeBounds, {
          padding: [80, 80],
          maxZoom: 16,
          duration: 1.2,
        });
      }
    } else if (truckLocation && !routeBounds) {
      map.flyTo([truckLocation[0], truckLocation[1]], 17, { duration: 1.0 });
    }

    // Save previous location for next comparison
    if (truckLocation) {
      prevLocation.current = truckLocation;
    }
  }, [truckLocation, routeBounds, focusTruck, map]);

  return null;
}
