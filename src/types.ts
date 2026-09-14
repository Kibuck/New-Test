export interface GroundingSource {
  title: string;
  url: string;
}

export interface MapPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category?: string;
  address?: string;
  rating?: number;
  priceLevel?: string;
  highlights?: string;
  tags?: string[];
  googlePlaceId?: string;
  googleMapsUrl?: string;
  photoUrl?: string;
  photoAuthor?: string;
  googleReviewRating?: number;
  googleReviewCount?: number;
  googleReviewSnippet?: string;
  googleReviewAuthor?: string;
  photoSource?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  sources?: GroundingSource[];
  places?: MapPin[];
  groundingMode?: "maps" | "search" | "auto";
  isMissingApiKey?: boolean;
}

export interface CityPreset {
  name: string;
  province: string;
  lat: number;
  lng: number;
  zoom: number;
  tagline: string;
}
