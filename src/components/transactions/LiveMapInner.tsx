"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Leaflet's default icons break under Next.js bundling)
const buyerIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#0d9488;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #0d9488"></div>`,
  iconSize: [16, 16],
});
const sellerIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#834e35;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #834e35"></div>`,
  iconSize: [16, 16],
});

interface LiveMapInnerProps {
  buyer?: { lat: number; lng: number };
  seller?: { lat: number; lng: number };
  buyerName: string;
  sellerName: string;
}

export default function LiveMapInner({ buyer, seller, buyerName, sellerName }: LiveMapInnerProps) {
  const center = buyer || seller || { lat: 0, lng: 0 };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {buyer && (
        <Marker position={[buyer.lat, buyer.lng]} icon={buyerIcon}>
          <Popup>{buyerName} (Buyer)</Popup>
        </Marker>
      )}
      {seller && (
        <Marker position={[seller.lat, seller.lng]} icon={sellerIcon}>
          <Popup>{sellerName} (Seller)</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}