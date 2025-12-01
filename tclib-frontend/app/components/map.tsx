"use client";

import {useEffect} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
const libraryIcon = L.icon({
    iconUrl: "/lib_map_marker.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
});

export default function LibraryMap({ libraries }: { libraries: any }) {

    // Initialising map
    useEffect(() => {
        if (Object.keys(libraries).length === 0) return;

        // create map
        const map = L.map("map").setView([53.3438, -6.2546], 16);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        // adding markers
        Object.entries(libraries).forEach(([key, lib]: any) => {
            if (!lib.coords) return;

            const {lat, lng} = lib.coords;

            L.marker([lat, lng], {icon: libraryIcon})
                .addTo(map)
                .bindPopup(`<b>${lib.name}</b>`);
        });

        // cleanup
        return () => {
            map.remove();
        };
    }, [libraries]);

    return <div id="map" className="w-full h-[600px] rounded-xl shadow-lg"/>;
}
