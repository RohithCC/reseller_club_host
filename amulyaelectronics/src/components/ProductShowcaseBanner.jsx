import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const banners = [
  {
    id: 1,
    title: "Feel the Speed!",
    subtitle: "Build Your Own MEX Mobile...",
    cta: "Explore Now!",
    link: "/collection?cat=robotics",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1400&q=85",
    overlayColor: "from-black/70 via-black/30 to-transparent",
  },
  {
    id: 2,
    title: "Code. Create. Innovate.",
    subtitle: "Start your STEM journey today with our beginner-friendly kits.",
    cta: "Shop Kits",
    link: "/collection?cat=coding",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1400&q=85",
    overlayColor: "from-blue-900/80 via-blue-900/30 to-transparent",
  },
  {
    id: 3,
    title: "Build Real Robots.",
    subtitle: "Hands-on robotics for curious minds aged 8 and above.",
    cta: "Discover More",
    link: "/collection?cat=robotics",
    image: "https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?w=1400&q=85",
    overlayColor: "from-purple-900/80 via-purple-900/30 to-transparent",
  },
];

export default function ProductShowcaseBanner() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const slide = banners[current];

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative w-full h-[380px] md:h-[480px] overflow-hidden">
      {/* BG Image */}
      <img
        key={slide.id}
        src={slide.image}
        alt={slide.title}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
      />

      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.overlayColor}`} />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-10 md:px-20 max-w-2xl">
        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-3 drop-shadow-lg">
          {slide.title}
        </h2>
        <p className="text-white/90 text-lg md:text-xl mb-8 font-medium drop-shadow">
          {slide.subtitle}
        </p>
        <button
          onClick={() => navigate(slide.link)}
          className="self-start bg-white text-gray-900 hover:bg-yellow-300 px-8 py-3 rounded-full font-black text-base transition-all duration-200 shadow-xl hover:scale-105 active:scale-95"
        >
          {slide.cta} →
        </button>
      </div>

      {/* Arrows */}
      <button
        onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/25 hover:bg-white/50 text-white w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold backdrop-blur-sm transition-all z-20"
      >
        ‹
      </button>
      <button
        onClick={() => setCurrent((c) => (c + 1) % banners.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/25 hover:bg-white/50 text-white w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold backdrop-blur-sm transition-all z-20"
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-white w-8" : "bg-white/40 w-2"}`}
          />
        ))}
      </div>
    </section>
  );
}
