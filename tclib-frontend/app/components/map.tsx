"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const libraryIcon = L.icon({
  iconUrl: "/lib_map_marker.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

export default function LibraryMap({ libraries }: { libraries: any }) {
  useEffect(() => {
    const map = L.map("map").setView([53.3438, -6.2546], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Loop through libraries and add markers
    Object.entries(libraries).forEach(([key, lib]: any) => {
      if (!lib.coords) return;

      L.marker([lib.coords.lat, lib.coords.lng], { icon: libraryIcon })
        .addTo(map)
        .bindPopup(`<b>${lib.name}</b>`);
    });

    return () => map.remove();
  }, [libraries]);

  return <div id="map" className="w-full h-[600px] rounded-xl shadow-lg" />;
}
