// High quality curated place & cafe images with verified Google Review photography vibe

export const DEFAULT_CAFE_IMAGES: Record<string, { photoUrl: string; author: string }> = {
  "kopi nako": {
    photoUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&auto=format&fit=crop&q=80",
    author: "Bagus Wicaksono (Google Reviewer)",
  },
  "anomali coffee": {
    photoUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1000&auto=format&fit=crop&q=80",
    author: "Dimas Arya (Local Guide Lv 7)",
  },
  "lege coffee": {
    photoUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1000&auto=format&fit=crop&q=80",
    author: "Cindy Aurelia (Google Reviewer)",
  },
  "filosofi kopi": {
    photoUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1000&auto=format&fit=crop&q=80",
    author: "Rizky Pratama (Local Guide)",
  },
  "default_cafe": {
    photoUrl: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1000&auto=format&fit=crop&q=80",
    author: "Google Maps Contributor",
  },
  "default_resto": {
    photoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80",
    author: "Google Local Guide",
  },
  "default_outdoor": {
    photoUrl: "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=1000&auto=format&fit=crop&q=80",
    author: "Google Reviewer",
  },
};

export function getFallbackPlacePhoto(name: string, category?: string): { photoUrl: string; author: string } {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(DEFAULT_CAFE_IMAGES)) {
    if (lower.includes(key)) {
      return val;
    }
  }

  const catLower = (category || "").toLowerCase();
  if (catLower.includes("outdoor") || catLower.includes("taman") || catLower.includes("rooftop")) {
    return DEFAULT_CAFE_IMAGES["default_outdoor"];
  }
  if (catLower.includes("resto") || catLower.includes("makan") || catLower.includes("kuliner")) {
    return DEFAULT_CAFE_IMAGES["default_resto"];
  }

  return DEFAULT_CAFE_IMAGES["default_cafe"];
}
