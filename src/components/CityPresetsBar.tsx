import React from "react";
import { Compass, Sparkles } from "lucide-react";
import { CITY_PRESETS } from "../constants";
import { CityPreset } from "../types";

interface CityPresetsBarProps {
  onSelectCity: (city: CityPreset) => void;
  activeCityName?: string;
}

export function CityPresetsBar({ onSelectCity, activeCityName }: CityPresetsBarProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-[#121519] border-b border-[#262B31] overflow-x-auto no-scrollbar shrink-0 text-xs">
      <div className="flex items-center gap-1 text-slate-400 font-semibold shrink-0 pr-1">
        <Compass className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden sm:inline">Kota Populer:</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {CITY_PRESETS.map((city) => {
          const isActive = activeCityName === city.name;
          return (
            <button
              key={city.name}
              type="button"
              onClick={() => onSelectCity(city)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-[#1C2027] hover:bg-[#252B34] text-slate-300 hover:text-white border border-[#2B313C]"
              }`}
              title={city.tagline}
            >
              <span>{city.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
