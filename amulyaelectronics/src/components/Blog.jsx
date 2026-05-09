import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiCalendar, FiUser, FiClock, FiSearch,
  FiChevronLeft, FiChevronRight, FiEye, FiHeart,
  FiArrowRight, FiGrid, FiList, FiX,
} from "react-icons/fi";

const API_BASE  = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const PAGE_SIZE = 6;

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function readTime(text = "") {
  const words = (text || "").trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-full" />
        <div className="h-5 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  );
}

// ── All links use post._id ✅ ────────────────────────────────────────────────
function BlogCard({ post, view }) {
  if (view === "list") {
    return (
      <Link to={`/blog/${post._id}`}
        className="group flex gap-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all p-4 overflow-hidden">

        <div className="w-28 sm:w-36 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 h-24 sm:h-28">
          <img
            src={post.image}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { e.target.src = "https://placehold.co/144x112?text=Blog"; }}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {post.category}
            </span>

            <h3 className="font-black text-gray-900 text-sm mt-1.5 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
              {post.title}
            </h3>

            <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
              {post.description}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <FiCalendar size={9} /> {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1">
              <FiUser size={9} /> {post.author || "Admin"}
            </span>
            <span className="flex items-center gap-1">
              <FiEye size={9} /> {post.views || 0}
            </span>
            <span className="flex items-center gap-1">
              <FiHeart size={9} /> {post.likes || 0}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/blog/${post._id}`}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">

      <div className="relative h-48 overflow-hidden bg-gray-50 flex-shrink-0">
        <img
          src={post.image}
          alt={post.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { e.target.src = "https://placehold.co/400x192?text=Blog"; }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-black bg-blue-600 text-white px-2.5 py-1 rounded-full shadow">
            {post.category}
          </span>
        </div>

        <div className="absolute bottom-3 right-3 flex gap-1.5">
          <span className="flex items-center gap-1 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">
            <FiEye size={9} /> {post.views || 0}
          </span>
          <span className="flex items-center gap-1 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">
            <FiHeart size={9} /> {post.likes || 0}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-black text-gray-900 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
          {post.title}
        </h3>

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 flex-1">
          {post.description}
        </p>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {post.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <FiCalendar size={9} /> {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1">
              <FiClock size={9} /> {readTime(post.description)}
            </span>
          </div>

          <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 group-hover:gap-2 transition-all">
            Read <FiArrowRight size={10} />
          </span>
        </div>
      </div>
    </Link>
  );
}
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const left  = Math.max(2, page - 2);
  const right = Math.min(totalPages - 1, page + 2);
  pages.push(1);
  if (left > 2) pages.push("...");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      <button onClick={() => onPage(page - 1)} disabled={page === 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
        <FiChevronLeft size={15} />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`d${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
        ) : (
          <button key={p} onClick={() => onPage(p)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
              p === page
                ? "bg-blue-600 text-white border-2 border-blue-600 shadow-sm"
                : "border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
            }`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
        <FiChevronRight size={15} />
      </button>
    </div>
  );
}

export default function Blog() {
  const [blogs, setBlogs]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState("");
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setCategory] = useState("All");
  const [view, setView]               = useState("grid");
  const [categories, setCategories]   = useState(["All"]);

  const loaderRef     = useRef(null);
  const usePagination = totalPages > 3;

  const fetchBlogs = useCallback(async (targetPage, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: targetPage, limit: PAGE_SIZE });
      if (activeCategory !== "All") params.set("category", activeCategory);
      if (search)                   params.set("search", search);

      const res  = await fetch(`${API_BASE}/blog/list?${params}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Failed to load");

      const incoming = data.blogs || [];
      setBlogs((prev) => append ? [...prev, ...incoming] : incoming);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setPage(targetPage);

      if (!append && targetPage === 1 && incoming.length > 0) {
        const newCats = [...new Set(incoming.map((b) => b.category).filter(Boolean))];
        setCategories((prev) => ["All", ...new Set([...prev.slice(1), ...newCats])]);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, [activeCategory, search]);

  useEffect(() => {
    setBlogs([]);
    fetchBlogs(1, false);
  }, [activeCategory, search]);

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchBlogs(p, false);
  };

  useEffect(() => {
    if (usePagination || !loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !loading && page < totalPages) {
          fetchBlogs(page + 1, true);
        }
      },
      { rootMargin: "120px" }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [usePagination, loadingMore, loading, page, totalPages, fetchBlogs]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput.trim()); };
  const clearSearch  = () => { setSearchInput(""); setSearch(""); };

  const featured = blogs[0];
  const rest      = blogs.slice(1);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 py-10 sm:py-14">
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">Electronics Knowledge Hub</p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 leading-tight">Amulya Electronics Blog</h1>
          <p className="text-gray-500 text-sm max-w-xl">Tutorials, project guides, and component deep-dives from our store in Dharwad.</p>
          <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-md">
            <div className="relative flex-1">
              <FiSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search articles…"
                className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50" />
              {searchInput && (
                <button type="button" onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <FiX size={13} />
                </button>
              )}
            </div>
            <button type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-sm">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex gap-2 flex-wrap flex-1">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`text-xs font-black px-3.5 py-1.5 rounded-full transition-all border ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {total > 0 && !loading && (
              <span className="text-xs text-gray-400 font-semibold hidden sm:block">
                {total} article{total !== 1 ? "s" : ""}
              </span>
            )}
            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setView("grid")}
                className={`px-3 py-2 transition-all ${view === "grid" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-blue-600"}`}>
                <FiGrid size={13} />
              </button>
              <button onClick={() => setView("list")}
                className={`px-3 py-2 transition-all ${view === "list" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-blue-600"}`}>
                <FiList size={13} />
              </button>
            </div>
          </div>
        </div>

        {search && (
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs text-gray-500">Results for:</span>
            <span className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full">
              "{search}" <button onClick={clearSearch}><FiX size={11} /></button>
            </span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
            <p className="text-sm font-bold text-red-600 mb-3">{error}</p>
            <button onClick={() => fetchBlogs(1, false)}
              className="text-xs font-black bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-all">
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className={view === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            : "flex flex-col gap-4"}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !error && blogs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📭</p>
            <h3 className="text-xl font-black text-gray-700 mb-2">No articles found</h3>
            <p className="text-sm text-gray-400 mb-6">Try a different category or search term.</p>
            <button onClick={() => { setCategory("All"); clearSearch(); }}
              className="text-xs font-black bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all">
              Clear Filters
            </button>
          </div>
        )}

        {!loading && blogs.length > 0 && (
          <>
            {page === 1 && view === "grid" && !search && activeCategory === "All" && featured && (
  <Link to={`/blog/${featured._id}`}
    className="group block bg-white rounded-3xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden mb-7">

    <div className="grid grid-cols-1 md:grid-cols-[1fr_420px]">
      <div className="relative h-56 md:h-auto overflow-hidden bg-gray-50">
        <img src={featured.image} alt={featured.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      </div>

      <div className="p-7">
        <h2 className="text-xl font-black">{featured.title}</h2>
        <p className="text-sm text-gray-500">{featured.description}</p>
      </div>
    </div>

  </Link>
)}
            <div className={view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              : "flex flex-col gap-4"}>
              {(page === 1 && view === "grid" && !search && activeCategory === "All"
                ? rest : blogs
              ).map((post) => (
                <BlogCard key={post._id} post={post} view={view} />
              ))}
            </div>

            {!usePagination && (
              <div ref={loaderRef} className="py-6 flex justify-center">
                {loadingMore && (
                  <div className="flex gap-1.5 items-center text-xs text-blue-500 font-semibold">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }} />
                    ))}
                    <span className="ml-2">Loading more…</span>
                  </div>
                )}
                {!loadingMore && page >= totalPages && blogs.length > 0 && (
                  <p className="text-xs text-gray-400 font-semibold">✓ All {total} articles loaded</p>
                )}
              </div>
            )}

            {usePagination && (
              <>
                <div className="mt-6 flex items-center justify-between text-xs text-gray-400 px-1 flex-wrap gap-2">
                  <span>Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} articles</span>
                  <span>Page {page} of {totalPages}</span>
                </div>
                <Pagination page={page} totalPages={totalPages} onPage={handlePageChange} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
