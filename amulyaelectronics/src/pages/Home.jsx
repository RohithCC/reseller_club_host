// pages/Home.jsx

import {
  FiTruck, FiShield, FiRotateCcw, FiPhone,
  FiZap,
} from "react-icons/fi";

import HeroBanner        from "../components/HeroBanner";
import PopularCategories from "../components/PopularCategories";
import FeaturedProducts  from "../components/FeaturedProducts";
import OurProjects       from "../components/OurProjects";
import YouTubeReels      from "../components/YouTubeReels";

// ─── TRUST STRIP ─────────────────────────────────────────────────────────────
export function TrustStrip() {
  const features = [
    { icon: <FiTruck size={22} />,     title: "Free Delivery",    desc: "On orders above ₹999",      color: "text-blue-600",   bg: "bg-blue-50"   },
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
      <YouTubeReels />
    </div>
  )
}