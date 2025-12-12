import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapFocus({ allCoords }) {
  const map = useMap();
  useEffect(() => {
    if (allCoords?.length) map.fitBounds(allCoords, { padding: [50, 50] });
  }, [allCoords, map]);
  return null;
}
