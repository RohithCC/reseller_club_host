// src/components/OurProjects.jsx
//
// ✅ Now fetches from blog API (category=Project) instead of separate Project model
//   so that Project-category blog posts created via BlogManager appear here.

import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

// ─── API Config ────────────────────────────────────────────────────────────────
const BACKEND  = import.meta.env.VITE_BACKEND_URL || "http://localhost:10000";
const API_BASE = `${BACKEND}/api`;

// Resolve relative image paths to full backend URLs
const imgUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BACKEND}${path}`;
};

// ─── Fallback placeholder ──────────────────────────────────────────────────────
const THUMB = "https://placehold.co/400x280/1e40af/ffffff?text=Project";

// ─── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project }) {
  const [imgErr, setImgErr] = useState(false);
  const slug = project.slug || project._id;

  return (
    <Link
      to={`/blog/${slug}`}
      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-400 flex flex-col hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-900/8"
    >
      {/* ── Image ── */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={imgErr ? THUMB : imgUrl(project.image) || THUMB}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          loading="lazy"
          onError={() => setImgErr(true)}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

        {/* Category badge */}
        {project.category && (
          <span
            className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide"
            style={{
              background: "rgba(255,255,255,0.92)",
              color: "#1e40af",
              border: "1px solid rgba(219,234,254,0.8)",
              backdropFilter: "blur(6px)",
            }}
          >
            {project.category}
          </span>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-400">
          <span
            className="text-white text-sm font-bold px-5 py-2 rounded-full backdrop-blur-md transition-all duration-300 group-hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "1.5px solid rgba(255,255,255,0.35)",
            }}
          >
            Read More →
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col flex-1">
        {/* Date */}
        {project.date && (
          <p className="text-[11px] font-mono text-gray-400 mb-2 font-medium tracking-tight">
            {new Date(project.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}

        {/* Title */}
        <h3 className="font-extrabold text-[15px] leading-snug text-[#0f172a] mb-2.5 line-clamp-2 group-hover:text-blue-700 transition-colors duration-200">
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 flex-1">
          {project.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5 group/arrow">
            Read Full Article
            <svg
              className="w-3.5 h-3.5 transition-transform duration-300 group-hover/arrow:translate-x-1"
              fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function OurProjects() {
  const [projects,        setProjects]        = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError,   setProjectsError]   = useState(null);

  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const card = container.children[0];
    const w = card?.offsetWidth || 320;
    const gap = 20;
    container.scrollBy({ left: dir * (w + gap), behavior: "smooth" });
  };

  // ── Fetch PROJECT-category blogs from blog API ────────────────────────────
  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const res = await fetch(`${API_BASE}/blog/list?category=Project&published=true&limit=10`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.blogs)) {
        setProjects(json.blogs);
      } else {
        throw new Error(json.message || "Invalid response");
      }
    } catch (err) {
      setProjectsError(err.message);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <section className="bg-white py-16 sm:py-20 px-4">
      <div className="max-w-[1400px] mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-12">
          <span
            className="inline-block text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-4 tracking-wider uppercase"
            style={{
              background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
          >
            Portfolio
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0f172a] mb-4 tracking-tight">
            Our Projects
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Real-world builds using components from our store — Arduino, sensors,
            robotics and more.
          </p>
        </div>

        {/* ── Error State ── */}
        {projectsError && (
          <div className="text-center py-14 rounded-2xl mb-8" style={{ background: "#fef2f2", border: "1.5px solid #fecaca" }}>
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-700 font-bold text-sm mb-1">Failed to load projects</p>
            <p className="text-red-400 text-xs mb-5">{projectsError}</p>
            <button
              onClick={fetchProjects}
              className="px-7 py-2.5 rounded-full text-sm font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: "#1d4ed8" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Slider ── */}
        {!projectsError && (
          <div className="relative">
            {/* Prev arrow */}
            {projects.length > 0 && (
              <button
                onClick={() => scroll(-1)}
                className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 hover:shadow-blue-200/40 hidden sm:flex"
                aria-label="Previous"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Cards */}
            <div
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {projectsLoading
                ? [...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="snap-start shrink-0 w-[300px] sm:w-[340px]"
                    >
                      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
                        <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200" />
                        <div className="p-5 space-y-3">
                          <div className="h-3 bg-gray-200 rounded-full w-20" />
                          <div className="h-5 bg-gray-200 rounded-full w-full" />
                          <div className="h-3 bg-gray-200 rounded-full w-full" />
                          <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                        </div>
                      </div>
                    </div>
                  ))
                : projects.length === 0
                  ? (
                    <div className="w-full text-center py-20">
                      <p className="text-5xl mb-4">📂</p>
                      <p className="text-gray-400 font-bold text-base">No projects yet.</p>
                      <p className="text-gray-300 text-xs mt-1">Check back soon!</p>
                    </div>
                  )
                  : projects.map((project) => (
                      <div
                        key={project._id}
                        className="snap-start shrink-0 w-[300px] sm:w-[340px]"
                      >
                        <ProjectCard project={project} />
                      </div>
                    ))}
            </div>

            {/* Next arrow */}
            {projects.length > 0 && (
              <button
                onClick={() => scroll(1)}
                className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 hover:shadow-blue-200/40 hidden sm:flex"
                aria-label="Next"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* ── View All link ── */}
        {!projectsLoading && projects.length > 0 && (
          <div className="text-center mt-10">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm text-white transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #1d4ed8, #1e3a8a)",
                boxShadow: "0 4px 20px rgba(29,78,216,0.30)",
              }}
            >
              View All Posts
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}

export default OurProjects;