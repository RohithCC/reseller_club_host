import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const slides = [
  {
    id: 1,
    bg: "from-purple-700 via-purple-600 to-purple-800",
    badge: "Limited Period Offer!",
    badgeBg: "bg-orange-400",
    title: "Back to",
    titleHighlight: "School",
    subtitle: "with Future Skills!",
    desc: "Special offers now live on all Robotics Kits!",
    cta: "Explore the Offers",
    ctaLink: "/collection",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80",
    tag: "🎉 Back2School Sale",
  },
  {
    id: 2,
    bg: "from-orange-500 via-orange-400 to-yellow-400",
    badge: "New Arrival!",
    badgeBg: "bg-purple-600",
    title: "Feel the",
    titleHighlight: "Speed!",
    subtitle: "Build Your Own MEX Mobile",
    desc: "Robotics kits for young innovators aged 8+",
    cta: "Explore Now!",
    ctaLink: "/collection",
    image: "https://images.unsplash.com/photo-1518314916381-77a37c2a49ae?w=800&q=80",
    tag: "🚀 New Launch",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative overflow-hidden">
      <div className={`bg-gradient-to-r ${slide.bg} transition-all duration-700 min-h-[420px] md:min-h-[480px] flex items-center relative`}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/5 rounded-full translate-y-1/3" />

        <div className="max-w-[1400px] mx-auto px-6 md:px-12 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-12">
          {/* TEXT */}
          <div className="z-10">
            <span className="inline-block bg-white/20 text-white text-xs font-bold px-4 py-1 rounded-full mb-4 tracking-widest uppercase">
              {slide.tag}
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-1">
              {slide.title}
            </h1>
            <h1 className="text-5xl md:text-7xl font-black text-yellow-300 leading-none mb-1">
              {slide.titleHighlight}
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-4">
              {slide.subtitle}
            </h2>
            <p className="text-white/80 text-lg mb-8 font-medium">{slide.desc}</p>
            <button
              onClick={() => navigate(slide.ctaLink)}
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black px-8 py-4 rounded-full text-lg transition-all duration-200 shadow-xl hover:shadow-yellow-400/40 hover:scale-105 active:scale-95"
            >
              {slide.cta} →
            </button>
          </div>

          {/* IMAGE */}
          <div className="relative flex justify-center">
            <div className="relative w-full max-w-md">
              <img
                src={slide.image}
                alt="Hero"
                className="w-full h-72 md:h-80 object-cover rounded-3xl shadow-2xl"
              />
              {/* Badge blob */}
              <div className={`absolute top-4 right-4 ${slide.badgeBg} text-white text-sm font-black px-4 py-3 rounded-2xl shadow-lg text-center leading-tight rotate-6`}>
                {slide.badge}
              </div>
            </div>
          </div>
        </div>

        {/* NAV ARROWS */}
        <button
          onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
        >
          ‹
        </button>
        <button
          onClick={() => setCurrent((c) => (c + 1) % slides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
        >
          ›
        </button>

        {/* DOTS */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-white w-8" : "bg-white/40 w-2"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
