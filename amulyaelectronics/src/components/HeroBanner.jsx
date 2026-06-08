import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:10000";

// ─── SIMPLE SPINNER ──────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="w-full bg-gray-100 min-h-[200px] sm:min-h-[400px] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

// ─── HERO BANNER ─────────────────────────────────────────────────────────────
export default function HeroBanner() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const touchX = useRef(null);

  // ── Fetch active slides from API ──────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/hero-banner`)
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;
        if (data.success && data.slides?.length > 0) {
          setSlides(data.slides);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  // ── Auto-rotate every 5s ──────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (slides.length < 2) return;
    timerRef.current = setInterval(
      () => setCurrent((c) => (c + 1) % slides.length),
      5000
    );
  }, [slides.length]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  // ── Navigation ──────────────────────────────────────────────────────────
  const go = (dir) => {
    setCurrent((c) => (c + dir + slides.length) % slides.length);
    startTimer();
  };

  const goTo = (idx) => {
    setCurrent(idx);
    startTimer();
  };

  // ── Touch swipe ──────────────────────────────────────────────────────────
  const handleTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(diff) > 50) go(diff > 0 ? -1 : 1);
    touchX.current = null;
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return <Spinner />;

  // ── No slides state ───────────────────────────────────────────────────────
  if (slides.length === 0) return null;

  const slide = slides[current] || slides[0];
  if (!slide) return null;

  // ── Resolve image URLs ────────────────────────────────────────────────────
  const desktopImg = slide.image?.startsWith("http")
    ? slide.image
    : slide.image
      ? `${API_BASE}${slide.image}`
      : null;

  const mobileImg = slide.imageMobile?.startsWith("http")
    ? slide.imageMobile
    : slide.imageMobile
      ? `${API_BASE}${slide.imageMobile}`
      : null;

  // ── Handle click (supports internal + external links) ─────────────────────
  const handleClick = () => {
    if (!slide.link) return;
    if (slide.link.startsWith("http")) {
      window.open(slide.link, "_blank", "noopener,noreferrer");
    } else {
      navigate(slide.link);
    }
  };

  return (
    <section
      className="relative overflow-hidden bg-gray-900 select-none cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {/* ── Responsive image using <picture> — only the correct image loads ── */}
      {desktopImg && (
        <picture>
          {/* Desktop: 640px+ */}
          <source media="(min-width: 640px)" srcSet={desktopImg} />
          {/* Mobile: fallback to mobileImg if available, else desktopImg */}
          <img
            src={mobileImg || desktopImg}
            alt={slide.title || "Hero banner"}
            className="w-full h-auto min-h-[180px] sm:min-h-[300px] md:min-h-[400px] lg:min-h-[480px] object-cover transition-opacity duration-700"
            loading="eager"
          />
        </picture>
      )}

      {/* ── Fallback if no images at all ── */}
      {!desktopImg && !mobileImg && (
        <div className="w-full min-h-[200px] sm:min-h-[400px] bg-gradient-to-r from-blue-700 to-blue-900 flex items-center justify-center">
          <p className="text-white text-lg font-bold">{slide.title || "Amulya Electronics"}</p>
        </div>
      )}

      {/* ── Arrows ── */}
      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-10"
            aria-label="Previous slide"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); go(1); }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-10"
            aria-label="Next slide"
          >
            <FiChevronRight size={20} />
          </button>
        </>
      )}

      {/* ── Dots ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "bg-white w-6 sm:w-8" : "bg-white/40 w-2 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
