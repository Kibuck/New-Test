import React, { useState } from "react";
import {
  Star,
  MapPin as MapPinIcon,
  ExternalLink,
  MessageSquareQuote,
  Maximize2,
  Navigation,
  Sparkles,
} from "lucide-react";
import { MapPin } from "../types";
import { getFallbackPlacePhoto } from "../lib/placeImages";

interface PlaceCardProps {
  place: MapPin;
  onSelectPin: (pin: MapPin) => void;
  onOpenPhoto?: (photoUrl: string, title: string) => void;
  compact?: boolean;
}

export function PlaceCard({
  place,
  onSelectPin,
  onOpenPhoto,
  compact = false,
}: PlaceCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fallback = getFallbackPlacePhoto(place.name, place.category);
  const displayPhoto = imageError ? fallback.photoUrl : place.photoUrl || fallback.photoUrl;
  const authorName = place.photoAuthor || fallback.author;
  const rating = place.googleReviewRating || place.rating || 4.7;
  const reviewCount = place.googleReviewCount || 850;

  const mapsUrl =
    place.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${place.name} ${place.address || ""}`
    )}`;

  return (
    <div className="group relative flex flex-col bg-[#161A20] hover:bg-[#1A1F26] border border-[#262B31] hover:border-blue-500/50 rounded-xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md">
      {/* Photo Header */}
      <div className="relative w-full h-36 bg-[#0F1216] overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#15181C] animate-pulse">
            <Sparkles className="w-5 h-5 text-slate-600" />
          </div>
        )}
        <img
          src={displayPhoto}
          alt={place.name}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#161A20] via-transparent to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-slate-300 font-normal">({reviewCount > 1000 ? `${(reviewCount / 1000).toFixed(1)}k` : reviewCount})</span>
          </span>

          {onOpenPhoto && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPhoto(displayPhoto, place.name);
              }}
              className="pointer-events-auto p-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-slate-200 hover:text-white border border-white/10 transition-colors shadow"
              title="Perbesar foto"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Photo Attribution Badge */}
        <div className="absolute bottom-1.5 left-2 right-2 truncate pointer-events-none">
          <span className="text-[10px] text-slate-300 drop-shadow px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm truncate">
            📷 {authorName}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <h4
              onClick={() => onSelectPin(place)}
              className="text-xs font-bold text-slate-100 hover:text-blue-400 transition-colors cursor-pointer line-clamp-1"
              title={place.name}
            >
              {place.name}
            </h4>
          </div>

          {place.category && (
            <span className="inline-block text-[10px] text-blue-400 font-medium mb-1 line-clamp-1">
              {place.category}
            </span>
          )}

          {/* Google Review Quote snippet */}
          {(place.googleReviewSnippet || place.highlights) && (
            <div className="p-2 rounded-lg bg-[#111418] border border-[#23272F] text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug">
              <MessageSquareQuote className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="line-clamp-2 italic">
                "{place.googleReviewSnippet || place.highlights}"
              </p>
            </div>
          )}

          {place.address && (
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1.5 line-clamp-1">
              <MapPinIcon className="w-3 h-3 text-slate-500 shrink-0" />
              <span>{place.address}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-[#23272F] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectPin(place)}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm"
          >
            <Navigation className="w-3 h-3" />
            <span>Lihat di Peta</span>
          </button>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="py-1.5 px-2.5 rounded-lg bg-[#20252D] hover:bg-[#282F3A] text-slate-300 hover:text-white text-[11px] font-medium border border-[#2F3642] flex items-center justify-center gap-1 transition-colors"
            title="Buka ulasan lengkap di Google Maps"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
