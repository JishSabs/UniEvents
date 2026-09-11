"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, MapPin } from "lucide-react";

interface Coords {
  lat: number;
  lng: number;
}

interface LiveMapInnerProps {
  buyer?: Coords;
  seller?: Coords;
  buyerName: string;
  sellerName: string;
}

// --- Pulsing animated markers -------------------------------------------
function makeIcon(color: string) {
  return new L.DivIcon({
    className: "",
    html: `
      <div style="position:relative;width:22px;height:22px;">
        <div style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:0.35;animation:pulseRing 1.8s ease-out infinite;"></div>
        <div style="position:absolute;top:4px;left:4px;width:14px;height:14px;border-radius:9999px;background:${color};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}
const BUYER_MARKER_COLOR = "#4f46e5"; // indigo-600
const SELLER_MARKER_COLOR = "#64748b"; // slate-500

const buyerIcon = makeIcon(BUYER_MARKER_COLOR);
const sellerIcon = makeIcon(SELLER_MARKER_COLOR);

// --- Distance helper (haversine, km) ------------------------------------
function distanceKm(a: Coords, b: Coords) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// --- Auto-fit bounds to show both markers -------------------------------
function FitBounds({ buyer, seller }: { buyer?: Coords; seller?: Coords }) {
  const map = useMap();
  useEffect(() => {
    if (buyer && seller) {
      const bounds = L.latLngBounds([
        [buyer.lat, buyer.lng],
        [seller.lat, seller.lng],
      ]);
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (buyer || seller) {
      const c = (buyer || seller)!;
      map.setView([c.lat, c.lng], 15);
    }
  }, [buyer, seller, map]);
  return null;
}

export default function LiveMapInner({ buyer, seller, buyerName, sellerName }: LiveMapInnerProps) {
  const center = buyer || seller || { lat: 0, lng: 0 };
  const mapRef = useRef<L.Map | null>(null);

  const distance = useMemo(() => (buyer && seller ? distanceKm(buyer, seller) : null), [buyer, seller]);

  const openDirections = () => {
    const dest = seller || buyer;
    if (!dest) return;
    const origin = buyer ? `${buyer.lat},${buyer.lng}` : "";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest.lat},${dest.lng}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.4; }
          70% { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .leaflet-popup-content-wrapper { border-radius: 12px; }
        .leaflet-container { font-family: inherit; }
      `}</style>

      <MapContainer
        ref={mapRef}
        center={[center.lat, center.lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        {/* Cleaner, more premium tile style than default OSM */}
        <TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>

        <FitBounds buyer={buyer} seller={seller} />

        {buyer && seller && (
          <Polyline
            positions={[
              [buyer.lat, buyer.lng],
              [seller.lat, seller.lng],
            ]}
            pathOptions={{ color: BUYER_MARKER_COLOR, weight: 3, dashArray: "6 8", opacity: 0.6 }}
          />
        )}

        {buyer && (
          <Marker position={[buyer.lat, buyer.lng]} icon={buyerIcon}>
            <Popup>
              <span className="font-medium">{buyerName}</span> · Buyer
            </Popup>
          </Marker>
        )}
        {seller && (
          <Marker position={[seller.lat, seller.lng]} icon={sellerIcon}>
            <Popup>
              <span className="font-medium">{sellerName}</span> · Seller
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legend + distance card */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur rounded-xl shadow-md border border-slate-100 px-3 py-2 text-xs space-y-1.5 z-[1000]">
        {buyer && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BUYER_MARKER_COLOR }} />
            <span className="text-slate-600 truncate max-w-[120px]">{buyerName}</span>
          </div>
        )}
        {seller && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SELLER_MARKER_COLOR }} />
            <span className="text-slate-600 truncate max-w-[120px]">{sellerName}</span>
          </div>
        )}
        {distance !== null && (
          <div className="pt-1 mt-1 border-t border-slate-100 text-slate-500 font-medium">
            {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`} apart
          </div>
        )}
      </div>

      {/* Directions button */}
      {(buyer || seller) && (
        <button
          onClick={openDirections}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-medium px-3.5 py-2.5 rounded-full shadow-lg hover:bg-indigo-700 active:scale-95 transition z-[1000]"
        >
          <Navigation size={14} />
          Get Directions
        </button>
      )}

      {!buyer && !seller && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-[1000]">
          <div className="flex flex-col items-center text-slate-400 gap-1">
            <MapPin size={20} />
            <span className="text-xs">No location available</span>
          </div>
        </div>
      )}
    </div>
  );
}