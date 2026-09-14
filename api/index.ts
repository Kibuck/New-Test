import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(express.json());

// Lazy-initialization for Gemini API client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not set or invalid.");
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

interface GroundingSource {
  title: string;
  url: string;
}

interface MapPin {
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

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  sources?: GroundingSource[];
  places?: MapPin[];
}

interface MapLocation {
  lat: number;
  lng: number;
  zoom?: number;
  label?: string;
}

const SYSTEM_INSTRUCTION = `Kamu adalah "decul", asisten peta cerdas dan teman ngobrol AI Indonesia yang seru, pintar, dan asik.
Gaya bicaramu santai, hangat, dan mengalir seperti chat sama teman akrab (gunakan bahasa santai Indonesia yang natural: kamu-aku, ramah, solutif).

PEDOMAN FORMAT JAWABAN (WAJIB ENAK & MUDAH DIBACA):
1. **DILARANG membuat dinding teks (wall of text)** yang panjang dan melelahkan dibaca. Pecah jawaban menjadi poin-poin yang renggang dan nyaman di mata.
2. **Struktur Jawaban yang Sangat Bersih & Nyaman**:
   - **Salam / Pembuka Singkat (1 kalimat)**: Langsung to-the-point dan ceria menjawab apa yang dicari pengguna.
   - **Rekomendasi Terstruktur (Bullet Points Rapi)**:
     Untuk setiap tempat yang kamu rekomendasikan (2-3 tempat terbaik), gunakan struktur scannable seperti ini:
     * ☕ **[Nama Tempat]** — *[Kecamatan / Kawasan]*
       - 🌟 **Vibe & Suasana**: Jelaskan daya tarik utamanya (misal: outdoor rindang, estetik modern, hening buat WFC).
       - 🥐 **Menu Favorit**: Makanan / minuman signature yang paling sering dipuji pengunjung.
       - 💬 **Ulasan Pengunjung**: 1 kutipan singkat kesan pengunjung asli dari Google Review.
   - **Penutup Hangat (1 kalimat)**: Tanyakan apakah butuh detail lain dengan ramah (misal: "Mau aku carikan yang punya colokan banyak buat kerja atau yang buka 24 jam?").
3. **Penebalan Kata Kunci**: Gunakan **tebal** pada nama tempat, menu andalan, dan poin penting agar pengguna bisa memindai (scan) informasi dalam hitungan detik.
4. **Tag Koordinat Peta & Kartu Foto**:
   Setiap kali merekomendasikan tempat/kafe, kamu WAJIB menyertakan tag koordinat lengkap di baris paling akhir dalam format JSON berikut agar aplikasi otomatis memunculkan Kartu Foto Asli Google Review, rating Google Maps, dan tombol rute:
   <!-- PLACE: {"name": "Nama Kafe", "lat": -6.2384, "lng": 106.8475, "category": "Kafe Outdoor & Specialty Coffee", "address": "Jalan, Kecamatan, Kota", "rating": 4.6, "priceLevel": "Rp 25k - 50k", "highlights": "Kutipan ulasan pengunjung Google Review", "googleReviewCount": 2400, "googleReviewSnippet": "Spot outdoor asri dan es kopi susu creamy enak"} -->
5. Jika pengguna menanyakan area koordinat peta tertentu atau kota tertentu, prioritaskan rekomendasi yang paling dekat dan mudah dijangkau dari sana.`;

// Chatbot endpoint with Google Maps Grounding & Google Search Grounding
app.post("/api/chat", async (req, res) => {
  try {
    const {
      messages = [],
      mapLocation,
      mode = "auto",
    }: {
      messages: ChatMessage[];
      mapLocation?: MapLocation;
      mode?: "maps" | "search" | "auto";
    } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: "Messages array cannot be empty." });
    }

    // Check if user has supplied GEMINI_API_KEY yet
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === "" || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      return res.json({
        reply: `Halo! Aku **decul**, asisten peta & kuliner pribadimu. 😊🗺️

Untuk mengaktifkan pencarian cerdas & rekomendasi kafe real-time dengan AI:

* 🔑 **Pasang Kunci API**: Buka menu **Settings** (ikon gerigi kanan atas) → pilih **Secrets / Environment Variables** → tambahkan \`GEMINI_API_KEY\`.
* 📍 **Jelajahi Peta Sekarang**: Kamu sudah bisa langsung klik pin di peta, ganti mode satelit/jalan, mencari rute, dan melihat katalog foto kafe di tab atas! ✨`,
        sources: [],
        places: [],
        isMissingApiKey: true,
      });
    }

    const ai = getGenAI();

    // Build conversation history for contents
    const contents = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // Decide whether to use googleMaps grounding or googleSearch grounding
    const useMaps = mode === "maps" || mode === "auto";
    const tools: any[] = [];
    if (useMaps) {
      tools.push({ googleMaps: {} });
    } else {
      tools.push({ googleSearch: {} });
    }

    // Context message for the model
    let locationContext = "";
    if (mapLocation) {
      locationContext = `\n[Info Posisi Pengguna Saat Ini di Peta]: Latitude ${mapLocation.lat}, Longitude ${mapLocation.lng}${
        mapLocation.label ? ` (Area: ${mapLocation.label})` : ""
      }. Prioritaskan tempat di sekitar koordinat ini.`;
    }

    const effectiveSystemInstruction = SYSTEM_INSTRUCTION + locationContext;

    // Use gemini-3.1-flash-lite as standard fast/cheap model, fallback to gemini-3.8-flash
    let responseText = "";
    let groundingChunks: any[] = [];
    let successfulModel = "gemini-3.1-flash-lite";

    const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: effectiveSystemInstruction,
            tools: tools,
            temperature: 0.7,
          },
        });

        if (response.text) {
          responseText = response.text;
          successfulModel = modelName;
          const candidate = response.candidates?.[0];
          groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or tools not supported, trying fallback...`, err?.message);
        lastError = err;

        // Fallback without tools if tools cause issue
        try {
          const fallbackResp = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: effectiveSystemInstruction,
              temperature: 0.7,
            },
          });
          if (fallbackResp.text) {
            responseText = fallbackResp.text;
            successfulModel = modelName;
            break;
          }
        } catch (innerErr) {
          lastError = innerErr;
        }
      }
    }

    if (!responseText) {
      throw lastError || new Error("Failed to get response from Gemini AI");
    }

    // Extract sources
    const sources: GroundingSource[] = [];
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || "Sumber Google",
          url: chunk.web.uri,
        });
      }
      if (chunk.maps?.uri) {
        sources.push({
          title: chunk.maps.title || "Google Maps",
          url: chunk.maps.uri,
        });
      }
    });

    // Extract PLACE JSON tags from output
    const places: MapPin[] = [];
    const placeRegex = /<!--\s*PLACE:\s*(\{.*?\})\s*-->/g;
    let match;
    while ((match = placeRegex.exec(responseText)) !== null) {
      try {
        const placeData = JSON.parse(match[1]);
        if (placeData.name && placeData.lat && placeData.lng) {
          places.push({
            id: `place-${places.length + 1}-${Date.now()}`,
            name: placeData.name,
            lat: parseFloat(placeData.lat),
            lng: parseFloat(placeData.lng),
            category: placeData.category || "Rekomendasi Kafe",
            address: placeData.address || "",
            rating: placeData.rating ? parseFloat(placeData.rating) : 4.7,
            priceLevel: placeData.priceLevel || "Rp 25.000 - 50.000",
            highlights: placeData.highlights || "",
            tags: placeData.tags || ["Kafe Estetik", "WFC Friendly"],
            googleReviewRating: placeData.rating ? parseFloat(placeData.rating) : 4.7,
            googleReviewCount: placeData.googleReviewCount || 1250,
            googleReviewSnippet: placeData.googleReviewSnippet || placeData.highlights || "Suasananya sangat nyaman, kopinya enak!",
            googleReviewAuthor: placeData.googleReviewAuthor || "Google Maps Contributor",
            photoSource: "google_review",
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${placeData.name} ${placeData.address || ""}`
            )}`,
          });
        }
      } catch (e) {
        console.warn("Failed to parse place json tag:", e);
      }
    }

    // Clean up response text by removing the hidden PLACE comments
    const cleanReply = responseText.replace(/<!--\s*PLACE:\s*\{.*?\}\s*-->/g, "").trim();

    res.json({
      reply: cleanReply,
      sources,
      places,
      groundingMode: useMaps ? "maps" : "search",
      modelUsed: successfulModel,
    });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({
      error: "Maaf, terjadi masalah saat memproses pesanmu.",
      details: err?.message,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== "" &&
    process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  );
  res.json({
    status: "ok",
    hasGeminiKey,
    time: new Date().toISOString(),
  });
});

export default app;
