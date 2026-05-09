// pages/Home.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiTruck, FiShield, FiRotateCcw, FiPhone,
  FiArrowRight, FiZap, FiChevronLeft, FiChevronRight,
} from "react-icons/fi";

import PopularCategories        from "../components/PopularCategories";
import FeaturedProducts         from "../components/FeaturedProducts";
import TestimonialsAndBlog      from "./Testimonialsandblog";
import ProductShowcaseBanner_footer from "../components/ProductShowcaseBanner_footer";
import OurProjects              from "../components/OurProjects";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// ── Fallback slides — shown while API loads or on error ───────────────────────
const FALLBACK_SLIDES = [
  {
    _id:         "fallback-1",
    badge:       "🎉 Back2School Sale — Live Now!",
    title:       "Electronic",
    titleAccent: "Components",
    subtitle:    "& Modules — Everything for Your Projects",
    desc:        "Sensors, Motors, Microcontrollers, Relay Modules & more. Delivered across India.",
    cta:         "Shop Sensors",
    ctaLink:     "/collection/Sensors%20%26%20Modules",
    bg:          "from-blue-800 via-blue-700 to-blue-900",
    accentColor: "text-yellow-300",
    image:       "https://amulyaelectronics.com/wp-content/uploads/2026/01/Untitled-design-2026-01-10T115404.662.jpg",
    bgImage:     "",
  },
  {
    _id:         "fallback-2",
    badge:       "🔥 Hot Deals on Voltmeters",
    title:       "VOLTMETER &",
    titleAccent: "Multimeters",
    subtitle:    "Precision Measurement Tools",
    desc:        "Digital voltmeters, multimeters, temperature controllers & relay timers.",
    cta:         "View Voltmeters",
    ctaLink:     "/collection/VOLTMETER",
    bg:          "from-orange-600 via-orange-500 to-red-600",
    accentColor: "text-yellow-200",
    image:       "https://amulyaelectronics.com/wp-content/uploads/2026/01/Untitled-design-49.jpg",
    bgImage:     "",
  },
  {
    _id:         "fallback-3",
    badge:       "⚙️ Motors, Drivers & Robotics",
    title:       "Build Your",
    titleAccent: "Next Project",
    subtitle:    "with Quality Components",
    desc:        "DC motors, motor drivers, chassis kits, wheels and Arduino/ESP32 boards.",
    cta:         "Shop Robotics",
    ctaLink:     "/collection/Robotics",
    bg:          "from-slate-800 via-slate-700 to-slate-900",
    accentColor: "text-cyan-300",
    image:       "https://amulyaelectronics.com/wp-content/uploads/2026/01/Untitled-design-2026-01-10T115752.056.jpg",
    bgImage:     "",
  },
];

// ─── HERO BANNER ──────────────────────────────────────────────────────────────
// Fetches slides from /api/hero-banner.
// Each slide may have an optional `bgImage` (full-bleed background photo)
// set by the admin. When present it is layered under the gradient overlay.
export function HeroBanner() {
  const [slides,  setSlides]  = useState(FALLBACK_SLIDES);
  const [current, setCurrent] = useState(0);
  const navigate  = useNavigate();
  const timerRef  = useRef(null);

  // ── Fetch active slides from API ──────────────────────────────────────────
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/hero-banner`)
      .then(({ data }) => {
        if (data.success && data.slides?.length > 0) {
          setSlides(data.slides);
        }
        // If API returns 0 slides, FALLBACK_SLIDES stay
      })
      .catch(() => {
        // On network error, FALLBACK_SLIDES stay — no crash
      });
  }, []);

  // ── Auto-rotate every 5.5 s ───────────────────────────────────────────────
  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setCurrent((c) => (c + 1) % slides.length),
      5500
    );
  };
  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const go = (dir) => {
    setCurrent((c) => (c + dir + slides.length) % slides.length);
    startTimer();
  };

  const slide = slides[current] || slides[0];
  if (!slide) return null;

  // ── Build inline style for the section background ─────────────────────────
  // Priority: bgImage (admin-set photo) → Tailwind gradient class only
  const sectionStyle = slide.bgImage
    ? {
        backgroundImage:    `url(${slide.bgImage})`,
        backgroundSize:     "cover",
        backgroundPosition: "center",
        backgroundRepeat:   "no-repeat",
      }
    : {};

  return (
    <section className="relative overflow-hidden">
      {/*
        Outer div carries the background image (if any).
        The inner gradient div is always present — it doubles as the gradient
        when there is no bgImage, or as a colour-tinted overlay when there is.
      */}
      <div
        className="relative min-h-[380px] sm:min-h-[440px] md:min-h-[500px] flex items-center transition-all duration-700"
        style={sectionStyle}
      >
        {/* Gradient layer — always rendered */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${slide.bg} ${
            slide.bgImage ? "opacity-70" : "opacity-100"
          } transition-opacity duration-700`}
        />

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none z-0" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-white/5 rounded-full translate-y-1/3 pointer-events-none z-0" />

        {/* Content grid */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-12 md:py-16">

          {/* ── Text column ── */}
          <div className="order-2 md:order-1">
            {/* Badge */}
            <span className="inline-flex items-center bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-wide">
              {slide.badge}
            </span>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-none mb-1 drop-shadow-lg">
              {slide.title}
            </h1>
            <h1 className={`text-4xl sm:text-5xl md:text-6xl font-black ${slide.accentColor} leading-none mb-3 drop-shadow-lg`}>
              {slide.titleAccent}
            </h1>

            {/* Sub-headline + description */}
            {slide.subtitle && (
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-white/90 mb-3">
                {slide.subtitle}
              </h2>
            )}
            {slide.desc && (
              <p className="text-white/75 text-sm sm:text-base mb-7 leading-relaxed max-w-md">
                {slide.desc}
              </p>
            )}

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(slide.ctaLink)}
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black px-7 py-3.5 rounded-full text-sm sm:text-base transition-all shadow-xl hover:shadow-yellow-400/40 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                {slide.cta} <FiArrowRight size={15} />
              </button>
              <button
                onClick={() => navigate("/collection")}
                className="border-2 border-white/50 text-white hover:bg-white/10 font-bold px-6 py-3.5 rounded-full text-sm transition-all"
              >
                All Products
              </button>
            </div>
          </div>

          {/* ── Image column ── */}
        
        </div>

        {/* ── Prev / Next arrows ── */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-20"
            >
              <FiChevronLeft size={20} />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-20"
            >
              <FiChevronRight size={20} />
            </button>
          </>
        )}

        {/* ── Dot indicators ── */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); startTimer(); }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? "bg-white w-8" : "bg-white/40 w-2"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── TRUST STRIP ─────────────────────────────────────────────────────────────
export function TrustStrip() {
  const features = [
    { icon: <FiTruck size={22} />,     title: "Free Delivery",    desc: "On orders above ₹499",      color: "text-blue-600",   bg: "bg-blue-50"   },
    { icon: <FiZap size={22} />,       title: "Fast Dispatch",    desc: "Same day before 2 PM",      color: "text-orange-600", bg: "bg-orange-50" },
    { icon: <FiShield size={22} />,    title: "Genuine Products", desc: "100% authentic components", color: "text-green-600",  bg: "bg-green-50"  },
    { icon: <FiRotateCcw size={22} />, title: "Easy Returns",     desc: "30-day hassle-free returns",color: "text-purple-600", bg: "bg-purple-50" },
    { icon: <FiPhone size={22} />,     title: "Expert Support",   desc: "8310787546 / 8217317884",   color: "text-cyan-600",   bg: "bg-cyan-50"   },
  ];

  return (
    <section className="bg-white border-y border-gray-100 py-7 px-4">
      <div className="max-w-[1400px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        {features.map((f) => (
          <div key={f.title} className="flex items-center gap-3">
            <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center ${f.color} flex-shrink-0`}>
              {f.icon}
            </div>
            <div>
              <p className="text-sm font-black text-gray-800">{f.title}</p>
              <p className="text-xs text-gray-500 leading-tight">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div>
      <HeroBanner />
      <TrustStrip />
      <PopularCategories />
      <FeaturedProducts />
      <OurProjects />
      <ProductShowcaseBanner_footer />
      <TestimonialsAndBlog />
    </div>
  );
}