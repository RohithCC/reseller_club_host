// src/components/OurProjects.jsx

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchProjects } from "../app/projectcontentslice";

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function ProjectSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-52 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-4 bg-gray-200 rounded-full w-16" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-5 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/5" />
        <div className="h-8 bg-gray-200 rounded-full w-28 mt-2" />
      </div>
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
function ProjectModal({ project, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(10,17,40,0.72)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl overflow-hidden w-full max-w-2xl shadow-2xl"
        style={{ maxHeight: "90vh", overflowY: "auto", border: "1.5px solid #e2e8f0" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-xl font-black transition-colors duration-150"
          style={{ background: "rgba(0,0,0,0.07)", color: "#1a2744" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.14)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.07)"}
        >
          ×
        </button>

        {/* Hero image */}
        <div className="h-56 sm:h-72 w-full overflow-hidden bg-gray-100">
          <img
            src={project.img || "https://placehold.co/600x288?text=Project"}
            alt={project.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = "https://placehold.co/600x288?text=Project"; }}
          />
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: "#eff6ff", color: "#1a56db", border: "1px solid #dbeafe" }}
            >
              {project.cat}
            </span>
            <span className="text-xs text-gray-400">{project.date}</span>
          </div>

          <h2
            className="text-xl sm:text-2xl font-black mb-3 leading-snug"
            style={{ color: "#1a2744" }}
          >
            {project.title}
          </h2>

          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            {project.description}
          </p>

          <div style={{ height: "1.5px", background: "#f1f5f9", marginBottom: "20px" }} />

          <div className="flex items-center gap-3 flex-wrap">
            {project.link ? (
              <Link
                to={project.link}
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm text-white transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #1a56db 0%, #1e3a8a 100%)",
                  boxShadow: "0 4px 14px rgba(26,86,219,0.3)",
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 22px rgba(26,86,219,0.45)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(26,86,219,0.3)"}
              >
                View Project
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            ) : null}
            <button
              onClick={onClose}
              className="inline-flex items-center px-5 py-2.5 rounded-full font-bold text-sm transition-colors duration-150"
              style={{ background: "#f1f5f9", color: "#1a2744", border: "1.5px solid #e2e8f0" }}
              onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
              onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Tab ────────────────────────────────────────────────────────────────
function FilterTab({ label, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap"
      style={
        active
          ? {
              background: "#1a56db",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(26,86,219,0.28)",
              border: "1.5px solid #1a56db",
            }
          : {
              background: "#f8faff",
              color: "#1a2744",
              border: "1.5px solid #e2e8f0",
            }
      }
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#eff6ff"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "#f8faff"; }}
    >
      {label}
      <span
        className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
        style={{
          background: active ? "rgba(255,255,255,0.22)" : "#e2e8f0",
          color: active ? "#fff" : "#64748b",
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onClick }) {
  return (
    <div
      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 12px 32px rgba(26,86,219,0.11)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-gray-50">
        <img
          src={project.img || "https://placehold.co/400x208?text=Project"}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = "https://placehold.co/400x208?text=Project"; }}
        />
        <span
          className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.93)",
            color: "#1a56db",
            border: "1px solid #dbeafe",
            backdropFilter: "blur(4px)",
          }}
        >
          {project.cat}
        </span>
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "rgba(26,86,219,0.55)" }}
        >
          <span
            className="text-white text-sm font-black px-4 py-2 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)" }}
          >
            View Details
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-[10px] text-gray-400 mb-1.5 font-medium">{project.date}</p>
        <h3
          className="font-black text-base mb-2 leading-snug group-hover:text-blue-700 transition-colors duration-200 line-clamp-2"
          style={{ color: "#1a2744" }}
        >
          {project.title}
        </h3>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 flex-1">
          {project.description}
        </p>
        <div
          className="flex items-center justify-between mt-4 pt-3"
          style={{ borderTop: "1.5px solid #f1f5f9" }}
        >
          <span
            className="text-xs font-bold flex items-center gap-1"
            style={{ color: "#1a56db" }}
          >
            View Details
            <svg
              className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200"
              fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
          {project.link && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
            >
              Live
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function OurProjects() {
  const dispatch = useDispatch();

  // ✅ Fixed: reads from s.projectContent (matches store key)
  // ✅ Fixed: safe fallbacks on every selector prevent the .map() crash
  const projects        = useSelector((s) => Array.isArray(s.projectContent?.projects)        ? s.projectContent.projects        : []);
  const projectsLoading = useSelector((s) => s.projectContent?.projectsLoading ?? false);
  const projectsError   = useSelector((s) => s.projectContent?.projectsError   ?? null);

  const [activeFilter,     setActiveFilter]     = useState("All");
  const [selectedProject,  setSelectedProject]  = useState(null);
  const [visibleCount,     setVisibleCount]      = useState(6);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Derived — all safe because projects is always an array
  const categories = [
    "All",
    ...Array.from(new Set(projects.map((p) => p.cat).filter(Boolean))),
  ];

  const filtered =
    activeFilter === "All"
      ? projects
      : projects.filter((p) => p.cat === activeFilter);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleFilter = (cat) => {
    setActiveFilter(cat);
    setVisibleCount(6);
  };

  return (
    <>
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      <section className="bg-white py-14 px-4">
        <div className="max-w-[1400px] mx-auto">

          {/* ── Header ── */}
          <div className="text-center mb-10">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3"
              style={{ background: "#eff6ff", color: "#1a56db", border: "1px solid #dbeafe" }}
            >
              Portfolio
            </span>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-black mb-3"
              style={{ color: "#1a2744" }}
            >
              Our Projects
            </h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
              Real-world builds using components from our store — Arduino, sensors, robotics and more.
            </p>
          </div>

          {/* ── Filters ── */}
          {!projectsLoading && !projectsError && categories.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap justify-center mb-8">
              {categories.map((cat) => (
                <FilterTab
                  key={cat}
                  label={cat}
                  active={activeFilter === cat}
                  count={
                    cat === "All"
                      ? projects.length
                      : projects.filter((p) => p.cat === cat).length
                  }
                  onClick={() => handleFilter(cat)}
                />
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {projectsError && (
            <div
              className="text-center py-12 rounded-2xl mb-8"
              style={{ background: "#fff5f5", border: "1.5px solid #fee2e2" }}
            >
              <div className="text-3xl mb-3">⚠️</div>
              <p className="text-red-600 font-black text-sm mb-1">Failed to load projects</p>
              <p className="text-red-400 text-xs mb-4">{projectsError}</p>
              <button
                onClick={() => dispatch(fetchProjects())}
                className="px-6 py-2.5 rounded-full text-sm font-bold text-white"
                style={{ background: "#1a56db" }}
                onMouseEnter={e => e.currentTarget.style.background = "#1e3a8a"}
                onMouseLeave={e => e.currentTarget.style.background = "#1a56db"}
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projectsLoading
              ? [...Array(6)].map((_, i) => <ProjectSkeleton key={i} />)
              : visible.length > 0
              ? visible.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onClick={() => setSelectedProject(project)}
                  />
                ))
              : !projectsError && (
                  <div className="col-span-full text-center py-16">
                    <div className="text-4xl mb-3">📂</div>
                    <p className="text-gray-400 font-bold text-sm">
                      No projects found{activeFilter !== "All" ? ` in "${activeFilter}"` : ""}.
                    </p>
                  </div>
                )}
          </div>

          {/* ── Load More ── */}
          {hasMore && !projectsLoading && (
            <div className="text-center mt-10">
              <button
                onClick={() => setVisibleCount((v) => v + 6)}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm text-white transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #1a56db 0%, #1e3a8a 100%)",
                  boxShadow: "0 4px 16px rgba(26,86,219,0.28)",
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(26,86,219,0.42)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,86,219,0.28)"}
              >
                Load More Projects
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <p className="text-xs text-gray-400 mt-3 font-medium">
                Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} projects
              </p>
            </div>
          )}

          {/* ── All shown ── */}
          {!hasMore && !projectsLoading && filtered.length > 0 && (
            <p className="text-center text-xs text-gray-400 mt-6 font-medium">
              All {filtered.length} project{filtered.length !== 1 ? "s" : ""} shown
            </p>
          )}

        </div>
      </section>
    </>
  );
}

export default OurProjects;