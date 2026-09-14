import React, { useState, useEffect } from "react";
import { ChatPanel } from "./components/ChatPanel";
import { InteractiveMap } from "./components/InteractiveMap";
import { CityPresetsBar } from "./components/CityPresetsBar";
import { ImageLightboxModal } from "./components/ImageLightboxModal";
import { ChatMessage, MapPin, CityPreset } from "./types";

const INITIAL_PINS: MapPin[] = [
  {
    id: "kopi-nako-tebet",
    name: "Kopi Nako Tebet",
    lat: -6.2346,
    lng: 106.8519,
    category: "Kafe Estetik Outdoor & Rumah Kaca",
    address: "Jl. Tebet Barat Dalam X No.29, Tebet, Jakarta Selatan",
    rating: 4.7,
    priceLevel: "Rp 25.000 - 45.000",
    highlights: "Konsep rumah kaca modern, outdoor rindang asri di bawah pohon, cocok buat nongkrong sore santai.",
    tags: ["Rumah Kaca", "Outdoor Rindang", "Es Kopi Nako"],
    googleReviewRating: 4.7,
    googleReviewCount: 3820,
    googleReviewSnippet: "Tempatnya luas banget, konsep rumah kacanya ikonik dan adem di bawah pohon. Es Kopi Nako manis gurihnya pas!",
    googleReviewAuthor: "Bagus Wicaksono",
    photoSource: "google_review",
  },
  {
    id: "anomali-senopati",
    name: "Anomali Coffee Senopati",
    lat: -6.2325,
    lng: 106.8105,
    category: "Specialty Coffee & Tempat WFC Nyaman",
    address: "Jl. Senopati No.19, Kebayoran Baru, Jakarta Selatan",
    rating: 4.6,
    priceLevel: "Rp 35.000 - 65.000",
    highlights: "Pioneer specialty coffee Indonesia, banyak colokan, wifi stabil cepat, suasana tenang fokus kerja.",
    tags: ["Specialty Coffee", "WFC Friendly", "Colokan Banyak"],
    googleReviewRating: 4.6,
    googleReviewCount: 1950,
    googleReviewSnippet: "Pelopor kopi single origin nusantara. Lantai duanya hening dan nyaman banget buat WFC laptopan seharian.",
    googleReviewAuthor: "Dimas Arya (Local Guide)",
    photoSource: "google_review",
  },
  {
    id: "lege-tebet",
    name: "LEGE Coffee & Bakery",
    lat: -6.2389,
    lng: 106.8524,
    category: "Artisan Bakery & Specialty Coffee",
    address: "Jl. Tebet Timur Dalam Raya No.34, Tebet, Jakarta Selatan",
    rating: 4.8,
    priceLevel: "Rp 30.000 - 55.000",
    highlights: "Pastry & croissant almond homemade fresh renyah buttery, tempat nyaman dan aesthetic modern.",
    tags: ["Almond Croissant", "Modern Aesthetic", "Artisan Coffee"],
    googleReviewRating: 4.8,
    googleReviewCount: 640,
    googleReviewSnippet: "Pastry dan croissant almond-nya fresh renyah buttery! Kopinya nikmat, interior minimalis estetik buat nugas santai.",
    googleReviewAuthor: "Cindy Aurelia",
    photoSource: "google_review",
  },
  {
    id: "filosofi-kopi-melawai",
    name: "Filosofi Kopi Melawai",
    lat: -6.2447,
    lng: 106.8016,
    category: "Kedai Kopi Vintage & Warisan",
    address: "Kawasan Blok M Square, Jl. Melawai VI No.1, Kebayoran Baru, Jakarta Selatan",
    rating: 4.6,
    priceLevel: "Rp 25.000 - 50.000",
    highlights: "Vibes nostalgia kawasan Melawai Blok M yang khas. Kopi Tiwus dan Lestari selalu jadi favorit nongkrong sore.",
    tags: ["Vintage Blok M", "Kopi Tiwus", "Roti Bakar", "Outdoor"],
    googleReviewRating: 4.6,
    googleReviewCount: 4780,
    googleReviewSnippet: "Vibes nostalgia kawasan Melawai Blok M yang khas. Kopi Tiwus dan Lestari selalu jadi favorit, tempat nongkrong asik sore hari.",
    googleReviewAuthor: "Rizky P. (Local Guide)",
    photoSource: "google_review",
  },
];

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome-1",
  role: "assistant",
  content: `Halo! Aku **decul**, asisten peta & pemandu kafe pribadimu! 🗺️✨

Ada beberapa kafe terfavorit dengan **foto asli & ulasan pengunjung Google Review** yang siap kamu jelajahi:

* ☕ **Kopi Nako Tebet** — *Tebet, Jakarta Selatan*
  - 🌿 **Suasana**: Konsep rumah kaca modern & area outdoor sejuk di bawah pohon rindang.
  - 🍹 **Menu Favorit**: *Es Kopi Nako* creamy manis gurih & aneka cemilan gorengan.
* 💻 **Anomali Coffee Senopati** — *Kebayoran Baru*
  - 🌿 **Suasana**: Pioneer specialty coffee Indonesia, lantai 2 tenang cocok buat WFC.
  - 🥐 **Menu Favorit**: Single origin Aceh Gayo & croissant almond renyah.
* 🥖 **LEGE Coffee & Bakery** — *Tebet Timur*
  - 🌿 **Suasana**: Interior minimalis estetik modern, nyaman buat santai dan ngobrol.
  - 🥐 **Menu Favorit**: Artisan bakery homemade & pain au chocolat.
* 📻 **Filosofi Kopi Melawai** — *Blok M*
  - 🌿 **Suasana**: Nuansa vintage legendaris bernostalgia di pusat Blok M.
  - ☕ **Menu Favorit**: *Kopi Tiwus*, *Kopi Lestari*, dan roti bakar srikaya.

👇 *Sentuh kartu kafe di bawah untuk melihat rute di peta atau buka foto langsung di Google Maps!*`,
  timestamp: Date.now(),
  places: INITIAL_PINS,
};

export default function App() {
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456,
  });
  const [zoom, setZoom] = useState<number>(13);
  const [activeCityName, setActiveCityName] = useState<string>("Jakarta Selatan");
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [pins, setPins] = useState<MapPin[]>(INITIAL_PINS);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [groundingMode, setGroundingMode] = useState<"auto" | "maps" | "search">("auto");
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title: string } | null>(null);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean | null>(null);

  // Check API key availability
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => {
        if (data.hasGeminiKey !== undefined) {
          setHasGeminiKey(data.hasGeminiKey);
        }
      })
      .catch(() => {});
  }, []);

  const handleSendMessage = async (text: string, mode: "maps" | "search" | "auto" = "auto") => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          mapLocation: {
            lat: center.lat,
            lng: center.lng,
            zoom,
            label: activeCityName,
          },
          mode,
        }),
      });

      const data = await res.json();

      const newPins: MapPin[] = data.places || [];
      if (newPins.length > 0) {
        setPins((prev) => {
          const map = new Map(prev.map((p) => [p.name.toLowerCase().trim(), p]));
          newPins.forEach((p) => map.set(p.name.toLowerCase().trim(), p));
          return Array.from(map.values());
        });

        // Focus map to first returned pin
        setCenter({ lat: newPins[0].lat, lng: newPins[0].lng });
        setZoom(14);
        setSelectedPin(newPins[0]);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Maaf, belum ada respons dari decul.",
        timestamp: Date.now(),
        sources: data.sources || [],
        places: newPins,
        groundingMode: data.groundingMode || mode,
        isMissingApiKey: data.isMissingApiKey,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Waduh, terjadi kendala saat menghubungi server decul. Silakan coba kirim ulang pesanmu ya!",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCity = (city: CityPreset) => {
    setActiveCityName(city.name);
    setCenter({ lat: city.lat, lng: city.lng });
    setZoom(city.zoom);
    setSelectedPin(null);
  };

  const handleSelectPin = (pin: MapPin | null) => {
    setSelectedPin(pin);
    if (pin) {
      setCenter({ lat: pin.lat, lng: pin.lng });
      setZoom(15);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0D10] text-slate-100 font-sans">
      {/* Left Chat Sidebar (420px on desktop, full screen on mobile) */}
      <div className="w-full md:w-[420px] lg:w-[460px] h-full shrink-0 flex flex-col z-10 shadow-2xl">
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          currentMapCenter={center}
          onSelectPin={(pin) => handleSelectPin(pin)}
          groundingMode={groundingMode}
          onChangeGroundingMode={setGroundingMode}
          hasGeminiKey={hasGeminiKey}
        />
      </div>

      {/* Right Interactive Map Area (Hidden on mobile if desired, or flex) */}
      <div className="hidden md:flex flex-1 flex-col h-full relative overflow-hidden">
        {/* City Quick Presets Bar */}
        <CityPresetsBar
          onSelectCity={handleSelectCity}
          activeCityName={activeCityName}
        />

        {/* Leaflet Interactive Map View */}
        <div className="flex-1 relative">
          <InteractiveMap
            center={center}
            zoom={zoom}
            pins={pins}
            selectedPin={selectedPin}
            onSelectPin={handleSelectPin}
            onMapCenterChange={(newCenter) => setCenter(newCenter)}
            onOpenPhoto={(url, title) => setLightboxPhoto({ url, title })}
          />
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <ImageLightboxModal
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </div>
  );
}
