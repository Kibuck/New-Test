import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Layers,
  MapPin as MapPinIcon,
  Navigation,
  Compass,
  Star,
  ExternalLink,
  Locate,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { MapPin } from "../types";
import { getFallbackPlacePhoto } from "../lib/placeImages";

interface InteractiveMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  pins: MapPin[];
  selectedPin: MapPin | null;
  onSelectPin: (pin: MapPin | null) => void;
  onMapCenterChange?: (center: { lat: number; lng: number }) => void;
  onOpenPhoto?: (photoUrl: string, title: string) => void;
}

export function InteractiveMap({
  center,
  zoom,
  pins,
  selectedPin,
  onSelectPin,
  onMapCenterChange,
  onOpenPhoto,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [mapLayer, setMapLayer] = useState<"standard" | "satellite">("standard");
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  // Tracks whether the last center/zoom change originated from the map itself
  // (user drag, scroll-zoom, +/- buttons, geolocate) so we don't re-fly the map
  // back to the exact spot it's already at and cause a jarring "bounce back".
  const isInternalUpdateRef = useRef(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: zoom,
      zoomControl: false,
    });

    const standardTiles = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: "abcd",
      }
    ).addTo(map);

    tileLayerRef.current = standardTiles;
    mapInstanceRef.current = map;

    map.on("moveend", () => {
      const c = map.getCenter();
      isInternalUpdateRef.current = true;
      onMapCenterChange?.({ lat: c.lat, lng: c.lng });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Center & Zoom
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Skip re-flying the map when this change was caused by the map itself
    // (e.g. the user just dragged/zoomed it) — otherwise the map "bounces
    // back" to the same spot with an unwanted animation right after the
    // user interacts with it.
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    mapInstanceRef.current.flyTo([center.lat, center.lng], zoom, {
      duration: 1.2,
    });
  }, [center.lat, center.lng, zoom]);

  // Toggle Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (mapLayer === "satellite") {
      tileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 18,
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
          subdomains: "abcd",
        }
      ).addTo(map);
    }
  }, [mapLayer]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    pins.forEach((pin) => {
      const isSelected = selectedPin?.id === pin.id;
      const customIcon = L.divIcon({
        className: "custom-pin-wrapper",
        html: `
          <div class="relative group cursor-pointer transition-transform duration-200 ${
            isSelected ? "scale-125 z-50" : "hover:scale-115"
          }">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 ${
              isSelected
                ? "bg-amber-500 border-white text-slate-950 animate-bounce"
                : "bg-blue-600 border-white text-white"
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45 border-r border-b border-white ${
              isSelected ? "bg-amber-500" : "bg-blue-600"
            }"></div>
          </div>
        `,
        iconSize: [32, 36],
        iconAnchor: [16, 36],
      });

      const marker = L.marker([pin.lat, pin.lng], { icon: customIcon }).addTo(map);
      marker.on("click", () => onSelectPin(pin));
      markersRef.current.set(pin.id, marker);
    });
  }, [pins, selectedPin]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapInstanceRef.current?.flyTo([coords.lat, coords.lng], 15);
        isInternalUpdateRef.current = true;
        onMapCenterChange?.(coords);
      },
      (err) => console.warn(err)
    );
  };

  return (
    <div className="relative w-full h-full bg-[#0E1116] overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Layer toggle: standard vs satellite */}
        <button
          type="button"
          onClick={() => setMapLayer(mapLayer === "standard" ? "satellite" : "standard")}
          className="p-2.5 rounded-xl bg-[#15181C]/90 hover:bg-[#1C2027] text-slate-200 border border-[#2B313C] shadow-lg backdrop-blur-md transition-colors"
          title={`Beralih ke tampilan ${mapLayer === "standard" ? "Satelit" : "Peta Standar"}`}
        >
          <Layers className="w-4 h-4 text-blue-400" />
        </button>

        {/* Current Location */}
        <button
          type="button"
          onClick={handleGeolocate}
          className="p-2.5 rounded-xl bg-[#15181C]/90 hover:bg-[#1C2027] text-slate-200 border border-[#2B313C] shadow-lg backdrop-blur-md transition-colors"
          title="Ke lokasiku sekarang"
        >
          <Locate className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Zoom In & Out */}
        <div className="flex flex-col bg-[#15181C]/90 border border-[#2B313C] rounded-xl shadow-lg backdrop-blur-md overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 hover:bg-[#222731] text-slate-300 hover:text-white transition-colors border-b border-[#2B313C]"
            title="Perbesar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 hover:bg-[#222731] text-slate-300 hover:text-white transition-colors"
            title="Perkecil"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Pin Bottom Popup Card */}
      {selectedPin && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-88 z-20 animate-in slide-in-from-bottom-3 duration-200">
          <div className="bg-[#15181C]/95 backdrop-blur-md border border-[#2F3642] rounded-2xl p-3.5 shadow-2xl text-slate-100 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  {selectedPin.category || "Kafe Rekomendasi"}
                </span>
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {selectedPin.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectPin(null)}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded-md hover:bg-[#242A34]"
              >
                ✕
              </button>
            </div>

            {/* Thumbnail (falls back to a curated photo when the pin has no photoUrl yet) */}
            {(() => {
              const fallback = getFallbackPlacePhoto(selectedPin.name, selectedPin.category);
              const thumbUrl = selectedPin.photoUrl || fallback.photoUrl;
              const thumbAuthor = selectedPin.photoAuthor || fallback.author;
              return (
                <div
                  onClick={() => onOpenPhoto?.(thumbUrl, selectedPin.name)}
                  className="relative h-28 w-full rounded-xl overflow-hidden cursor-pointer group"
                >
                  <img
                    src={thumbUrl}
                    alt={selectedPin.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[11px] text-white flex items-center gap-1 font-medium">
                      <Maximize2 className="w-3 h-3" />
                      <span>Lihat Foto Penuh</span>
                    </span>
                  </div>
                  <span className="absolute bottom-1 left-1.5 right-1.5 truncate text-[10px] text-slate-200 drop-shadow px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm pointer-events-none">
                    📷 {thumbAuthor}
                  </span>
                </div>
              );
            })()}

            {/* Address & Snippet */}
            {selectedPin.googleReviewSnippet && (
              <p className="text-xs text-slate-300 italic line-clamp-2">
                "{selectedPin.googleReviewSnippet}"
              </p>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-[#262B31] text-xs">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{(selectedPin.googleReviewRating || selectedPin.rating || 4.7).toFixed(1)}</span>
              </span>

              <a
                href={
                  selectedPin.googleMapsUrl ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedPin.name} ${selectedPin.address || ""}`
                  )}`
                }
                target="_blank"
                rel="noreferrer"
                className="py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center gap-1 shadow"
              >
                <span>Buka di Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
