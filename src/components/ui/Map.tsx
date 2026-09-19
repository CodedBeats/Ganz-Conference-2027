"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icon resolves image URLs relative to the bundled JS,
// which 404s under Next - point it at the same images served from a CDN instead
// of relying on Next's (bundler-dependent) handling of image imports from node_modules.
const venueIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface MapProps {
    lat: number;        // latitude
    lng: number;        // longitude
    zoom?: number;      // default zoom
    venueName: string;  // label shown in the marker popup
}

const Map = ({ lat, lng, zoom = 13, venueName }: MapProps) => {
    return (
        <MapContainer center={[lat, lng]} zoom={zoom} className="size-full">
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />
            <Marker position={[lat, lng]} icon={venueIcon}>
                <Popup>{venueName}</Popup>
            </Marker>
        </MapContainer>
    );
};

export default Map;
