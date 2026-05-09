// src/components/ProductShowcaseBanner_footer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Fetches banners from GET /api/showcase/banners on mount.
// Falls back to STATIC_BANNERS if API is unavailable or returns empty.
// Auto-rotates every 6 s; arrows + dots for manual control.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { useNavigate }                  from "react-router-dom";
import { FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

// ── Static fallback (shown when API returns nothing) ──────────────────────────
const STATIC_BANNERS = [
  {
    _id:      "static-1",
    title:    "Motors & Motor Drivers",
    subtitle: "DC, Geared, Servo motors + L298N, BTS7960 drivers. Perfect for robotics and DIY projects.",
    cta:      "Shop Motors",
    link:     "/collection/Motor",
    image:    "https://amulyaelectronics.com/wp-content/uploads/2026/01/Untitled-design-2026-01-10T115752.056.jpg",
    overlay:  "from-slate-900/85 via-slate-900/50 to-transparent",
  },
  {
    _id:      "static-2",
    title:    "72+ Sensors & Modules",
    subtitle: "DHT11, Ultrasonic, PIR, IR, Rain, Soil, Flame and many more sensor modules in stock.",
    cta:      "Explore Sensors",
    link:     "/collection/Sensors%20%26%20Modules",
    image:    "https://amulyaelectronics.com/wp-content/uploads/2026/01/Untitled-design-2026-01-10T122511.900-200x200.jpg",
    overlay:  "from-blue-900/85 via-blue-900/50 to-transparent",
  },
  {
    _id:      "static-3",
    title:    "Soldering & Basic Tools",
    subtitle: "Soldering irons, lead wire, flux, desol wicks and essential hand tools for every maker.",
    cta:      "Shop Tools",
    link:     "/collection/SOLDERING",
    image:    "https://amulyaelectronics.com/wp-content/uploads/2026/01/Untitled-design-2026-01-10T123707.153-200x200.jpg",
    overlay:  "from-orange-900/85 via-orange-900/50 to-transparent",
  },
];

export function ProductShowcaseBanner_footer() {
  const navigate  = useNavigate();
  const [banners, setBanners]   = useState(STATIC_BANNERS);
  const [current, setCurrent]   = useState(0);
  const [loaded,  setLoaded]    = useState(false);   // image loaded state for fade-in
  const timerRef  = useRef(null);
  const imgKey    = banners[current]?._id ?? current; // key forces re-mount on slide change

  // ── Fetch from API ─────────────────────────────────────────────────────────
  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/showcase/banners`)
      .then(({ data }) => {
        if (data.success && Array.isArray(data.banners) && data.banners.length > 0) {
          setBanners(data.banners);
          setCurrent(0);
        }
        // else: keep STATIC_BANNERS
      })
      .catch(() => {
        // Silently fall back to static — no console noise in production
      });
  }, []);

  // ── Auto-rotate timer ──────────────────────────────────────────────────────
  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setCurrent((c) => (c + 1) % banners.length),
      6000
    );
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [banners.length]);   // restart if banner count changes after API load

  const goTo = (idx) => {
    setCurrent((idx + banners.length) % banners.length);
    setLoaded(false);
    startTimer();
  };

  const slide = banners[current] ?? STATIC_BANNERS[0];

  return (
    <section className="relative w-full h-[260px] sm:h-[360px] md:h-[440px] overflow-hidden bg-slate-900">

      {/* ── Background image with fade-in ─── */}
      <img
        key={imgKey}
        src={slide.image}
        alt={slide.title}
        onLoad={() => setLoaded(true)}
        onError={(e) => { e.target.src = "https://placehold.co/1400x440?text=Amulya+Electronics"; setLoaded(true); }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
      />

      {/* ── Gradient overlay ──────────────── */}
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.overlay ?? "from-slate-900/85 via-slate-900/50 to-transparent"}`} />

      {/* ── Content ───────────────────────── */}
      <div className="relative z-10 h-full flex flex-col justify-center px-7 sm:px-14 md:px-20 max-w-2xl">
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">
          Amulya Electronics · Dharwad
        </p>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-3 drop-shadow-lg">
          {slide.title}
        </h2>
        <p className="text-white/85 text-xs sm:text-sm md:text-base mb-6 font-medium leading-relaxed">
          {slide.subtitle}
        </p>
        <button
          onClick={() => navigate(slide.link)}
          className="self-start bg-white text-gray-900 hover:bg-yellow-300 px-6 py-2.5 sm:px-8 sm:py-3 rounded-full font-black text-sm transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          {slide.cta} <FiArrowRight size={14} />
        </button>
      </div>

      {/* ── Prev arrow ────────────────────── */}
      <button
        onClick={() => goTo(current - 1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/25 hover:bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-20"
        aria-label="Previous banner"
      >
        <FiChevronLeft size={18} />
      </button>

      {/* ── Next arrow ────────────────────── */}
      <button
        onClick={() => goTo(current + 1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/25 hover:bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-20"
        aria-label="Next banner"
      >
        <FiChevronRight size={18} />
      </button>

      {/* ── Dot indicators ────────────────── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "bg-white w-8" : "bg-white/40 w-2 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* ── Slide counter ─────────────────── */}
      <div className="absolute bottom-4 right-4 z-20 text-white/40 text-[10px] font-mono font-bold">
        {current + 1} / {banners.length}
      </div>
    </section>
  );
}

export default ProductShowcaseBanner_footer;