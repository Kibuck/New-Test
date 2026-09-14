import React, { useEffect } from "react";
import { X, ExternalLink, Camera } from "lucide-react";

interface ImageLightboxModalProps {
  photo: { url: string; title: string; author?: string } | null;
  onClose: () => void;
}

export function ImageLightboxModal({ photo, onClose }: ImageLightboxModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-[#15181C] border border-[#262B31] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#262B31] bg-[#121519]">
          <div className="flex items-center gap-2 truncate">
            <Camera className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-sm text-slate-100 truncate">
              {photo.title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#262B31] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo view */}
        <div className="relative bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
          <img
            src={photo.url}
            alt={photo.title}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-[#121519] border-t border-[#262B31] flex items-center justify-between text-xs text-slate-400">
          <span>{photo.author ? `Foto oleh: ${photo.author}` : "Foto Pengunjung Google Review"}</span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(photo.title)}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
          >
            <span>Buka di Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
