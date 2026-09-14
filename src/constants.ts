import { CityPreset } from "./types";

export const DECUL_LOGO = "/assets/icon.png";

export const CITY_PRESETS: CityPreset[] = [
  {
    name: "Jakarta Selatan",
    province: "DKI Jakarta",
    lat: -6.2615,
    lng: 106.8106,
    zoom: 13,
    tagline: "Pusat kafe estetik, Senopati, Tebet & Blok M",
  },
  {
    name: "Bandung",
    province: "Jawa Barat",
    lat: -6.9175,
    lng: 107.6191,
    zoom: 13,
    tagline: "Kafe sejuk Dago Atas, Riau & kuliner legendaris",
  },
  {
    name: "Yogyakarta",
    province: "DI Yogyakarta",
    lat: -7.7956,
    lng: 110.3695,
    zoom: 13,
    tagline: "Kopi jos, Malioboro, Prawirotaman & kafe syahdu",
  },
  {
    name: "Surabaya",
    province: "Jawa Timur",
    lat: -7.2575,
    lng: 112.7521,
    zoom: 13,
    tagline: "Kuliner malam Tunjungan, rawon & kafe modern",
  },
  {
    name: "Bali (Canggu/Ubud)",
    province: "Bali",
    lat: -8.65,
    lng: 115.13,
    zoom: 13,
    tagline: "Sunset beach club, artisan bakery & kafe sawah",
  },
  {
    name: "Semarang",
    province: "Jawa Tengah",
    lat: -6.9667,
    lng: 110.4167,
    zoom: 13,
    tagline: "Kota Lama, kuliner lumpia & kafe perbukitan",
  },
  {
    name: "Malang",
    province: "Jawa Timur",
    lat: -7.9666,
    lng: 112.6326,
    zoom: 13,
    tagline: "Kafe vintage hawa sejuk, apel & bakso Malang",
  },
];

export const QUICK_PROMPTS = [
  {
    label: "☕ Kafe Aesthetic & WFC Tebet",
    prompt: "Carikan kafe aesthetic yang nyaman buat WFC di area Tebet Jakarta Selatan yang punya wifi kencang dan colokan banyak",
  },
  {
    label: "🥐 Croissant & Bakery Viral Blok M",
    prompt: "Rekomendasi tempat ngopi dan bakery viral yang hits di kawasan Blok M dan Melawai",
  },
  {
    label: "🌿 Kafe Outdoor Adem & Sejuk",
    prompt: "Ada kafe outdoor dengan tanaman rindang yang adem dan nyaman buat nongkrong sore di Jakarta Selatan?",
  },
  {
    label: "🍛 Kuliner Malam Legendaris",
    prompt: "Rekomendasi tempat makan kuliner malam enak yang legendaris di sekitar lokasiku",
  },
];
