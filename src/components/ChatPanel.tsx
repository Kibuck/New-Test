import React, { useState, useRef, useEffect, useMemo } from "react";
import Markdown from "react-markdown";
import {
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  MapPin as MapPinIcon,
  ExternalLink,
  Compass,
  Search,
  Globe,
  Copy,
  Check,
  RotateCcw,
  Coffee,
  MessageSquare,
  LayoutGrid,
  Filter,
  Maximize2,
  Tag,
} from "lucide-react";
import { ChatMessage, GroundingSource, MapPin } from "../types";
import { QUICK_PROMPTS, DECUL_LOGO } from "../constants";
import { PlaceCard } from "./PlaceCard";
import { ImageLightboxModal } from "./ImageLightboxModal";

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string, mode?: "maps" | "search" | "auto") => void;
  onClearChat: () => void;
  currentMapCenter: { lat: number; lng: number };
  onSelectPin: (pin: MapPin) => void;
  groundingMode: "auto" | "maps" | "search";
  onChangeGroundingMode: (mode: "auto" | "maps" | "search") => void;
  hasGeminiKey?: boolean | null;
}

export function ChatPanel({
  messages,
  isLoading,
  onSendMessage,
  onClearChat,
  currentMapCenter,
  onSelectPin,
  groundingMode,
  onChangeGroundingMode,
  hasGeminiKey,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "gallery">("chat");
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Lightbox modal state
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title: string } | null>(null);

  // Gallery search & filter state
  const [gallerySearch, setGallerySearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat when in chat tab
  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, activeTab]);

  // Aggregate all unique places mentioned in messages
  const allDiscoveredPlaces = useMemo(() => {
    const map = new Map<string, MapPin>();
    messages.forEach((msg) => {
      if (msg.places) {
        msg.places.forEach((p) => {
          const key = p.name.toLowerCase().trim();
          if (!map.has(key)) {
            map.set(key, p);
          }
        });
      }
    });
    return Array.from(map.values());
  }, [messages]);

  // Filtered places in the gallery tab
  const filteredPlaces = useMemo(() => {
    return allDiscoveredPlaces.filter((p) => {
      const matchesSearch =
        gallerySearch === "" ||
        p.name.toLowerCase().includes(gallerySearch.toLowerCase()) ||
        (p.address && p.address.toLowerCase().includes(gallerySearch.toLowerCase())) ||
        (p.highlights && p.highlights.toLowerCase().includes(gallerySearch.toLowerCase()));

      if (!matchesSearch) return false;

      if (categoryFilter === "all") return true;
      const lowerCat = (p.category || "").toLowerCase();
      if (categoryFilter === "coffee") {
        return lowerCat.includes("kafe") || lowerCat.includes("kopi") || lowerCat.includes("coffee") || lowerCat.includes("bakery");
      }
      if (categoryFilter === "food") {
        return lowerCat.includes("kuliner") || lowerCat.includes("makan") || lowerCat.includes("resto");
      }
      if (categoryFilter === "wfc") {
        return (
          lowerCat.includes("wfc") ||
          (p.highlights && p.highlights.toLowerCase().includes("wfc")) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes("wfc")))
        );
      }
      return true;
    });
  }, [allDiscoveredPlaces, gallerySearch, categoryFilter]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim(), groundingMode);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setActiveTab("chat");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Text to Speech playback
  const handleToggleSpeech = (msg: ChatMessage) => {
    if (!("speechSynthesis" in window)) return;

    if (speakingMessageId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = msg.content.replace(/[*#_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "id-ID";
    utterance.rate = 1.05;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0D10] border-r border-[#262B31] text-slate-100 select-none">
      {/* Decul Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#262B31] bg-[#15181C]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 shrink-0">
            <img
              src={DECUL_LOGO}
              alt="decul mascot"
              className="w-9 h-9 rounded-xl shadow-md border border-[#262B31]"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B0D10] shadow-sm animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-white tracking-tight">
                decul
              </h2>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                MAP AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Asisten Peta Cerdas & Google Review
            </p>
          </div>
        </div>

        {/* Right Header Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Clear history button */}
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-[#20252D] transition-colors"
            title="Bersihkan riwayat obrolan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="bg-[#1C1F26] border-b border-[#2F3540] px-4 py-2.5 flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-150 shrink-0">
          <span className="text-slate-200">Hapus riwayat obrolan?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClearChat();
                setShowClearConfirm(false);
              }}
              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition-colors"
            >
              Ya, Hapus
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="px-2.5 py-1 rounded bg-[#2B303C] hover:bg-[#353B4A] text-slate-300 text-xs transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Main View Mode Tabs: [Obrolan] vs [Katalog Foto Kafe] */}
      <div className="flex border-b border-[#262B31] bg-[#121519] px-2 pt-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "chat"
              ? "border-blue-500 text-blue-400 bg-blue-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Obrolan & Rekomendasi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gallery")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "gallery"
              ? "border-amber-500 text-amber-400 bg-amber-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Katalog Foto Kafe</span>
          {allDiscoveredPlaces.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold ml-1">
              {allDiscoveredPlaces.length}
            </span>
          )}
        </button>
      </div>

      {/* Active Location Anchor Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#15181C]/50 border-b border-[#262B31]/60 text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Fokus Peta:</span>
          <span className="font-mono text-slate-300">
            {currentMapCenter.lat.toFixed(4)}, {currentMapCenter.lng.toFixed(4)}
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-medium shrink-0">● Real-time Maps</span>
      </div>

      {/* Tab 1: CHAT VIEW */}
      {activeTab === "chat" && (
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full py-8 px-2">
              <div className="relative mb-3">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-md" />
                <img
                  src={DECUL_LOGO}
                  alt="decul mascot"
                  className="relative w-16 h-16 rounded-2xl shadow-xl border border-[#262B31]"
                />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-1">
                Halo! Aku decul
              </h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
                Teman ngobrol AI & asisten petamu. Tanyakan tempat makan enak, kafe estetik, spot wisata, rute, atau apa pun seputar lokasi.
              </p>

              {/* Starter Quick Suggestions */}
              <div className="w-full space-y-2 text-left max-w-sm">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Pilih topik obrolan:
                </span>
                {QUICK_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendMessage(item.prompt, groundingMode)}
                    className="w-full text-left p-2.5 rounded-xl bg-[#15181C] hover:bg-[#1B1F24] border border-[#262B31] text-xs text-slate-200 transition-all hover:border-blue-500/50 flex items-center justify-between group"
                  >
                    <span>{item.label}</span>
                    <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`w-full max-w-[96%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-md sm:max-w-[85%]"
                      : "bg-[#15181C] border border-[#262B31] text-slate-100 rounded-bl-sm shadow"
                  }`}
                >
                  {/* Assistant header tag */}
                  {msg.role === "assistant" && (
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#262B31]/70">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={DECUL_LOGO}
                          alt="decul"
                          className="w-4 h-4 rounded-md border border-[#262B31]"
                        />
                        <span className="text-xs font-bold text-blue-400 font-mono">
                          decul
                        </span>
                        {msg.groundingMode && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1A2230] text-blue-300 border border-blue-500/20 font-medium">
                            {msg.groundingMode === "maps" ? "📍 Google Maps" : "🌐 Google Search"}
                          </span>
                        )}
                      </div>

                      {/* Message action controls: copy & speech */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#20252D] transition-colors"
                          title="Salin teks jawaban"
                        >
                          {copiedMessageId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSpeech(msg)}
                          className={`p-1 rounded transition-colors ${
                            speakingMessageId === msg.id
                              ? "text-blue-400 bg-blue-500/10"
                              : "text-slate-400 hover:text-slate-200 hover:bg-[#20252D]"
                          }`}
                          title={
                            speakingMessageId === msg.id
                              ? "Hentikan suara"
                              : "Dengarkan jawaban (Text to Speech)"
                          }
                        >
                          {speakingMessageId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Markdown formatted response body with high-readability typography */}
                  <div className="text-[13.5px] leading-relaxed text-slate-200 font-sans break-words selection:bg-blue-500 selection:text-white">
                    <Markdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-base font-bold text-white mt-3.5 mb-2 pb-1.5 border-b border-[#262B31] flex items-center gap-1.5 tracking-tight">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-sm font-bold text-amber-300 mt-3 mb-1.5 flex items-center gap-1.5">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm font-semibold text-blue-300 mt-2.5 mb-1 flex items-center gap-1.5">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-200">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="space-y-1.5 my-2.5 pl-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="space-y-1.5 my-2.5 pl-5 list-decimal text-slate-300">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="relative pl-4 leading-relaxed text-slate-200 before:content-['•'] before:absolute before:left-0 before:text-blue-400 before:font-bold before:text-sm">
                            {children}
                          </li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-white tracking-wide">
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className="text-amber-200/90 italic font-medium">
                            {children}
                          </em>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-blue-500/80 pl-3 py-1.5 my-2.5 bg-blue-500/10 rounded-r-lg text-xs text-slate-300 italic">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-[#1E232B] text-amber-300 border border-[#2D343F]">
                            {children}
                          </code>
                        ),
                        hr: () => <hr className="my-3 border-[#262B31]" />,
                      }}
                    >
                      {msg.content}
                    </Markdown>
                  </div>

                  {/* VISUAL CAFE & PLACE CARDS WITH PHOTOS */}
                  {msg.places && msg.places.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#262B31] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Coffee className="w-4 h-4 text-amber-400" />
                          <span>Foto & Info Kafe Rekomendasi ({msg.places.length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("gallery")}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-0.5"
                        >
                          <span>Buka di Katalog</span>
                          <LayoutGrid className="w-3 h-3 ml-0.5" />
                        </button>
                      </div>

                      {/* Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {msg.places.map((place, idx) => (
                          <PlaceCard
                            key={place.id || `${idx}-${place.name}`}
                            place={place}
                            onSelectPin={onSelectPin}
                            onOpenPhoto={(photoUrl, title) =>
                              setLightboxPhoto({ url: photoUrl, title })
                            }
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grounding Sources (Google Maps & Search) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#262B31]">
                      <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        <span>Sumber Terverifikasi:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((source, sIdx) => {
                          let hostname = source.url;
                          try {
                            hostname = new URL(source.url).hostname.replace("www.", "");
                          } catch {}

                          return (
                            <a
                              key={sIdx}
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-md bg-[#1D222A] hover:bg-[#252C37] text-slate-300 hover:text-blue-300 text-[10px] font-mono border border-[#2B323E] inline-flex items-center gap-1 transition-colors"
                            >
                              <span className="truncate max-w-[140px]">{source.title || hostname}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-start gap-2 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-[#15181C] border border-[#262B31] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-sm bg-[#15181C] border border-[#262B31] text-xs text-slate-300 flex items-center gap-2">
                <span className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                </span>
                <span>decul sedang mencari data Google Maps & ulasan review...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Tab 2: VISUAL GALLERY CATALOG VIEW */}
      {activeTab === "gallery" && (
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3.5">
          {/* Search and Category Filter Bar */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
                placeholder="Cari kafe, croissant, kawasan, atau suasana..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#15181C] border border-[#262B31] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              {[
                { id: "all", label: "Semua Kafe" },
                { id: "coffee", label: "☕ Kopi & Bakery" },
                { id: "wfc", label: "💻 Nyaman WFC" },
                { id: "food", label: "🍛 Makanan/Resto" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setCategoryFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    categoryFilter === pill.id
                      ? "bg-blue-600 text-white"
                      : "bg-[#181C22] text-slate-400 hover:text-slate-200 border border-[#262B31]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Place Cards Catalog */}
          {filteredPlaces.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Coffee className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                {gallerySearch
                  ? "Tidak ada kafe yang cocok dengan pencarian."
                  : "Belum ada rekomendasi kafe. Tanyakan ke decul di tab obrolan untuk memunculkan tempat baru!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredPlaces.map((place, idx) => (
                <PlaceCard
                  key={place.id || `${idx}-${place.name}`}
                  place={place}
                  onSelectPin={onSelectPin}
                  onOpenPhoto={(photoUrl, title) =>
                    setLightboxPhoto({ url: photoUrl, title })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-3 border-t border-[#262B31] bg-[#121519] shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanyakan kafe, spot WFC, rute, atau suasana tempat..."
            className="w-full resize-none pl-3.5 pr-20 py-2.5 rounded-xl bg-[#181C22] border border-[#262B31] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          />

          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-colors"
              title="Kirim pesan"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
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
