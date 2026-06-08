// src/pages/BlogPost.jsx
//
// ✅ API alignment to actual backend:
//
//   GET  /api/blog/list       → { success, blogs[], total, page, totalPages }
//   GET  /api/blog/:id        → { success, blog: { ...fields, content?, comments[]? } }
//   POST /api/blog/comment/add → { success, message }
//   POST /api/blog/like        → { success }
//
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiCalendar, FiUser, FiTag, FiClock, FiArrowLeft,
  FiArrowRight, FiShare2, FiChevronRight, FiEye,
  FiCheck, FiSearch, FiX, FiGrid, FiList,
} from "react-icons/fi";

const BACKEND  = import.meta.env.VITE_BACKEND_URL || "http://localhost:10000";
const API_BASE = `${BACKEND}/api`;

// Resolve relative image paths to full backend URLs
const imgUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BACKEND}${path}`;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}
function readTime(text = "") {
  const words = (text || "").trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

// ─── PostContent ──────────────────────────────────────────────────────────────
// Renders HTML content from the Tiptap rich text editor (BlogManager).
function PostContent({ content }) {
  if (!content) return null;
  return (
    <div
      className="blog-content text-gray-600 text-sm sm:text-base leading-relaxed"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ className }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />;
}
function BlogPostSkeleton() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-[1200px] mx-auto"><Sk className="h-4 w-64" /></div>
      </div>
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div>
            <Sk className="h-4 w-28 mb-5" />
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <Sk className="h-72 w-full rounded-none" />
              <div className="p-8 space-y-4">
                <Sk className="h-3 w-48" />
                <Sk className="h-8 w-full" /><Sk className="h-8 w-3/4" />
                <Sk className="h-4 w-full" /><Sk className="h-4 w-5/6" />
                <Sk className="h-4 w-full" /><Sk className="h-4 w-4/5" />
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <Sk className="h-40 w-full" />
            <Sk className="h-48 w-full" />
            <Sk className="h-40 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogListSkeleton() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-[1200px] mx-auto"><Sk className="h-4 w-32" /></div>
      </div>
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="text-center mb-10"><Sk className="h-8 w-48 mx-auto mb-2" /><Sk className="h-4 w-72 mx-auto" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <Sk className="h-48 w-full rounded-none" />
              <div className="p-5 space-y-2"><Sk className="h-3 w-16" /><Sk className="h-5 w-full" /><Sk className="h-3 w-full" /><Sk className="h-3 w-4/5" /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN BLOG POST PAGE ──────────────────────────────────────────────────────
export default function BlogPost() {
  const { id }   = useParams();
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────────
  const [post,        setPost]        = useState(null);
  const [allPosts,    setAllPosts]    = useState([]);
  const [prevPost,    setPrevPost]    = useState(null);
  const [nextPost,    setNextPost]    = useState(null);

  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [fetchError,  setFetchError]  = useState("");
  const [copied,      setCopied]      = useState(false);

  // ── Blog list state (when no :id, show all published posts) ──────────────
  const [listPosts,   setListPosts]   = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError,   setListError]   = useState('');

  // ── Blog list fetch (when no :id) ─────────────────────────────────────────
  useEffect(() => {
    if (id) return;
    setListLoading(true);
    setListError('');
    setLoading(false);
    fetch(`${API_BASE}/blog/list?published=true&limit=50`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setListPosts(data.blogs ?? []);
        else setListError(data.message || 'Failed to load.');
      })
      .catch(() => setListError('Failed to load blog posts.'))
      .finally(() => setListLoading(false));
  }, [id]);

  // ── Single post fetch (when :id present) ──────────────────────────────────
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      setFetchError("");
      setPost(null);
      setPrevPost(null);
      setNextPost(null);

      try {
        const [postRes, listRes] = await Promise.all([
          fetch(`${API_BASE}/blog/${id}`),
          fetch(`${API_BASE}/blog/list`),
        ]);

        const [postData, listData] = await Promise.all([
          postRes.json(),
          listRes.json(),
        ]);

        if (cancelled) return;

        const blogs = listData.success ? (listData.blogs ?? []) : [];
        setAllPosts(blogs);

        if (!postData.success || !postData.blog) {
          setNotFound(true);
          return;
        }

        const fetchedPost = postData.blog;
        setPost(fetchedPost);


        const currentIdx = blogs.findIndex((p) => p._id === fetchedPost._id);

        setPrevPost(currentIdx > 0                ? blogs[currentIdx - 1] : null);
        setNextPost(currentIdx < blogs.length - 1 ? blogs[currentIdx + 1] : null);

      } catch {
        if (!cancelled) {
          setFetchError("Failed to load article. Please check your connection.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  // ── SEO: Set document title & meta description when post loads ──────────
  // ⚠ IMPORTANT: This useEffect MUST be before any early return statements
  // because React requires all hooks to be called in the same order on every render.
  useEffect(() => {
    if (post) {
      document.title = `${post.title} - Amulya Electronics Blog`;

      let desc = document.querySelector('meta[name="description"]');
      if (!desc) {
        desc = document.createElement('meta');
        desc.name = 'description';
        document.head.appendChild(desc);
      }
      desc.content = post.description?.slice(0, 160) || `${post.title} - Read the full article on Amulya Electronics Blog`;

      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.content = `${post.title} - Amulya Electronics`;

      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.content = post.description?.slice(0, 160) || '';

      if (post.image) {
        let ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) {
          ogImage = document.createElement('meta');
          ogImage.setAttribute('property', 'og:image');
          document.head.appendChild(ogImage);
        }
        ogImage.content = imgUrl(post.image);
      }

      let ogUrl = document.querySelector('meta[property="og:url"]');
      if (!ogUrl) {
        ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrl);
      }
      ogUrl.content = window.location.href;

      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = window.location.href;

      return () => {
        document.title = 'Amulya Electronics - Blog & Updates';
      };
    } else if (!id && !loading) {
      document.title = 'Blog & Updates - Amulya Electronics';
    }
  }, [post, id, loading]);

  // ── Blog list filter state ─────────────────────────────────────────────────
  const [filterCategory, setFilterCategory]     = useState("All");
  const [categories,     setCategories]         = useState(["All"]);
  const [searchQuery,    setSearchQuery]         = useState("");
  const [searchInput,    setSearchInput]         = useState("");
  const [listView,       setListView]            = useState("grid");
  const [listPage,       setListPage]            = useState(1);
  const PAGE_SIZE = 6;

  // ── Extract categories from posts ────────────────────────────────────────
  useEffect(() => {
    const cats = [...new Set(listPosts.map(p => p.category).filter(Boolean))];
    setCategories(["All", ...cats]);
  }, [listPosts]);

  // ── Filtered blog posts (client-side) ────────────────────────────────────
  const filteredListPosts = listPosts.filter(p => {
    if (filterCategory !== "All" && p.category !== filterCategory) return false;
    if (searchQuery && !p.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalFiltered = filteredListPosts.length;
  const totalPages    = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safePage      = Math.min(listPage, totalPages);
  const startIdx      = (safePage - 1) * PAGE_SIZE;
  const paginatedPosts = filteredListPosts.slice(startIdx, startIdx + PAGE_SIZE);

  const featuredPost = listPosts[0];
  const showFeatured = listPage === 1 && filterCategory === "All" && !searchQuery && featuredPost;
  const gridPosts    = showFeatured ? paginatedPosts.filter(p => p._id !== featuredPost._id) : paginatedPosts;

  // ── Share handler — copies current page URL to clipboard ─────────────────────
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── TOC — extracted from HTML headings in content ───────────────────────────
  const tocHeadings = post
    ? (() => {
        const html = post.content || "";
        const result = [];
        // Matches <h2> or <h3> with optional attributes
        const regex = /<h([23])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
        let match;
        while ((match = regex.exec(html)) !== null && result.length < 7) {
          const headingText = match[2].replace(/<[^>]+>/g, "").trim();
          if (headingText) result.push({ level: Number(match[1]), text: headingText });
        }
        return result;
      })()
    : [];

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER GUARDS — all hooks MUST be declared above this line
  // ═══════════════════════════════════════════════════════════════════════════
  if (loading)    return <BlogPostSkeleton />;

  if (fetchError) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-5xl mb-4">{'⚠️'}</p>
        <h2 className="text-xl font-black text-gray-700 mb-3">{fetchError}</h2>
        <button onClick={() => window.location.reload()}
          className="text-xs font-black bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all">
          Retry
        </button>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-5xl mb-4">{'📄'}</p>
        <h2 className="text-2xl font-black text-gray-700 mb-4">Post not found</h2>
        <Link to="/blog" className="text-blue-600 hover:underline font-bold">
          {'←'} Back to Blog
        </Link>
      </div>
    </div>
  );

  if (!id) {
    if (listLoading) return <BlogListSkeleton />;
    if (listError) return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">{'⚠️'}</p>
          <h2 className="text-xl font-black text-gray-700 mb-3">{listError}</h2>
          <button onClick={() => window.location.reload()}
            className="text-xs font-black bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all">
            Retry
          </button>
        </div>
      </div>
    );
    return (
      <div className="bg-gray-50 min-h-screen">

        {/* ── SIMPLE HEADER ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="pt-4 pb-2 flex items-center gap-2 text-xs text-gray-400">
              <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <FiChevronRight size={10} />
              <span className="text-blue-600 font-semibold">Blog</span>
            </div>
            <div className="py-6 sm:py-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5">Blog</h1>
              <p className="text-sm text-gray-500">Tutorials, guides, and updates from Amulya Electronics.</p>
              <div className="mt-4 max-w-md">
                <div className="relative flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
                  <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setSearchQuery(searchInput.trim()); setListPage(1); } }}
                    placeholder="Search articles…" aria-label="Search articles"
                    className="w-full bg-transparent text-gray-700 placeholder-gray-400 pl-10 pr-9 py-2.5 text-sm outline-none" />
                  {searchInput && (
                    <button onClick={() => { setSearchInput(''); setSearchQuery(''); setListPage(1); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"><FiX size={14} /></button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CATEGORY FILTERS ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <button key={cat} onClick={() => { setFilterCategory(cat); setListPage(1); }}
                aria-pressed={filterCategory === cat}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {cat === 'All' ? 'All' : cat}
              </button>
            ))}
            {searchQuery && (
              <span className="ml-auto flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                "{searchQuery}"
                <button onClick={() => { setSearchInput(''); setSearchQuery(''); setListPage(1); }}><FiX size={12} /></button>
              </span>
            )}
            {totalFiltered > 0 && !searchQuery && (
              <span className="ml-auto text-xs text-gray-400">{totalFiltered} article{totalFiltered !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* ── POSTS GRID ── */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {listPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">{'📝'}</p>
              <h3 className="text-lg font-bold text-gray-700 mb-1">No posts yet</h3>
              <p className="text-sm text-gray-400">Check back soon for new articles.</p>
            </div>
          ) : filteredListPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">{'🔍'}</p>
              <h3 className="text-lg font-bold text-gray-700 mb-1">No results</h3>
              <p className="text-sm text-gray-400 mb-4">Try a different category or search term.</p>
              <button onClick={() => { setFilterCategory('All'); setSearchInput(''); setSearchQuery(''); setListPage(1); }}
                className="text-xs font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedPosts.map(p => (
                  <Link key={p._id} to={`/blog/${p.slug || p._id}`}
                    className="group bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all overflow-hidden flex flex-col">
                    <div className="relative h-32 sm:h-36 overflow-hidden bg-gray-50 flex-shrink-0">
                      <img src={imgUrl(p.image)} alt={p.title} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = `https://placehold.co/400x208/e2e8f0/64748b?text=${encodeURIComponent(p.category || 'Article')}`; }} />
                      <span className="absolute top-2 left-2 text-[10px] font-medium bg-white/90 text-gray-700 px-2 py-0.5 rounded-md shadow-xs">
                        {p.category}
                      </span>
                    </div>
                    <div className="p-3.5 flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors mb-1">
                        {p.title}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 flex-1 mb-2">
                        {p.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 pt-2 border-t border-gray-50">
                        <span className="flex items-center gap-1">
                          <FiCalendar size={8} />
                          {p.date ? new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock size={8} />
                          {readTime(p.content || p.description)}
                        </span>
                        <span className="ml-auto text-blue-600 font-medium group-hover:gap-1.5 transition-all flex items-center gap-0.5">
                          Read <FiArrowRight size={8} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1.5">
                  <button onClick={() => setListPage(safePage - 1)} disabled={safePage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <FiArrowLeft size={12} />
                  </button>
                  {(() => {
                    const pages = [];
                    const l = Math.max(2, safePage - 2);
                    const r = Math.min(totalPages - 1, safePage + 2);
                    pages.push(1);
                    if (l > 2) pages.push('...');
                    for (let i = l; i <= r; i++) pages.push(i);
                    if (r < totalPages - 1) pages.push('...');
                    if (totalPages > 1) pages.push(totalPages);
                    return pages;
                  })().map((pg, i) =>
                    pg === '...' ? (
                      <span key={`d${i}`} className="w-8 h-8 flex items-center justify-center text-gray-300 text-xs">…</span>
                    ) : (
                      <button key={pg} onClick={() => setListPage(pg)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                          pg === safePage
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}>{pg}</button>
                    )
                  )}
                  <button onClick={() => setListPage(safePage + 1)} disabled={safePage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <FiArrowRight size={12} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (!post) return null;

  // ── Resolved display fields ───────────────────────────────────────────────────
  const postDate     = post.date ? formatDate(post.date) : "";
  const leadText     = post.content && post.description ? post.description : null;
  const bodyContent  = post.content || null;
  const bodyFallback = !post.content ? post.description : null;
  const author       = post.author  || "Admin";
  const tags         = Array.isArray(post.tags)     ? post.tags     : [];


  return (
    <div className="bg-gray-50 min-h-screen">

      {/* BREADCRUMB */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-[1200px] mx-auto flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <FiChevronRight size={12} className="text-gray-300" />
          <Link to="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>
          <FiChevronRight size={12} className="text-gray-300" />
          <span className="text-blue-600 font-semibold">{post.category}</span>
          <FiChevronRight size={12} className="text-gray-300" />
          <span className="text-gray-700 font-semibold line-clamp-1 max-w-[200px]">{post.title}</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

          {/* ARTICLE */}
          <article>
            <Link to="/blog"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline mb-5 group">
              <FiArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
              Back to Blog
            </Link>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Hero image */}
              <div className="relative h-52 sm:h-64 md:h-80 overflow-hidden bg-gray-100">
                <img src={imgUrl(post.image)} alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "https://placehold.co/800x400?text=Blog+Post"; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

                {/* Category badge */}
                <div className="absolute top-5 left-5">
                  <span className="bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                    {post.category}
                  </span>
                </div>

                {/* Share button */}
                <div className="absolute top-5 right-5">
                  <button onClick={handleShare} title="Copy link"
                    className="w-9 h-9 bg-white/90 hover:bg-white rounded-full backdrop-blur-sm flex items-center justify-center shadow text-gray-600 transition-all">
                    {copied ? <FiCheck size={14} className="text-green-600" /> : <FiShare2 size={14} />}
                  </button>
                </div>


              </div>

              <div className="p-6 sm:p-8">

                {/* Meta row */}
                <div className="flex items-center flex-wrap gap-4 text-xs text-gray-400 mb-4 pb-4 border-b border-gray-100">
                  {postDate && (
                    <span className="flex items-center gap-1.5">
                      <FiCalendar size={12} className="text-blue-400" /> {postDate}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <FiUser size={12} className="text-blue-400" /> {author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiClock size={12} className="text-blue-400" />
                    {readTime(post.content || post.description)}
                  </span>

                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">
                  {post.title}
                </h1>

                {/* Lead paragraph */}
                {leadText && (
                  <p className="text-base text-gray-500 leading-relaxed mb-6 pb-6 border-b border-gray-100 italic">
                    {leadText}
                  </p>
                )}

                {/* Body */}
                {bodyContent
                  ? <PostContent content={bodyContent} />
                  : bodyFallback
                    ? <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{bodyFallback}</p>
                    : null
                }



                {/* Tags */}
                {tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FiTag size={12} /> Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((t) => (
                        <button key={t} onClick={() => navigate("/blog")}
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 font-semibold px-3 py-1 rounded-full transition-all">
                          #{t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share strip */}
                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
                  <p className="text-sm font-black text-gray-700">Found this helpful? Share it!</p>
                  <div className="flex gap-2">
                    {[
                      { label: "Twitter",  href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}` },
                      { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(post.title + " " + window.location.href)}` },
                      { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}` },
                    ].map(({ label, href }) => (
                      <a key={label} href={href} target="_blank" rel="noreferrer"
                        className="text-xs font-bold bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-all">
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PREV / NEXT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {prevPost ? (
                <Link to={`/blog/${prevPost.slug || prevPost._id}`}
                  className="group flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                    <img src={imgUrl(prevPost.image)} alt={prevPost.title} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => { e.target.src = "https://placehold.co/48x48?text=📝"; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                      <FiArrowLeft size={10} /> Older
                    </p>
                    <p className="text-sm font-black text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mt-0.5">
                      {prevPost.title}
                    </p>
                  </div>
                </Link>
              ) : <div />}

              {nextPost ? (
                <Link to={`/blog/${nextPost.slug || nextPost._id}`}
                  className="group flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-right justify-end">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1 justify-end">
                      Newer <FiArrowRight size={10} />
                    </p>
                    <p className="text-sm font-black text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mt-0.5">
                      {nextPost.title}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                    <img src={imgUrl(nextPost.image)} alt={nextPost.title} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => { e.target.src = "https://placehold.co/48x48?text=📝"; }} />
                  </div>
                </Link>
              ) : <div />}
            </div>


          </article>

          {/* SIDEBAR */}
          <aside className="space-y-5">

            {/* Table of Contents */}
            {tocHeadings.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-black text-gray-900 text-sm mb-3">In This Article</h3>
                <ul className="space-y-2">
                  {tocHeadings.map((h, i) => (
                    <li key={i} className={`flex items-center gap-2 text-xs ${h.level === 3 ? 'ml-3' : ''} text-gray-500 hover:text-blue-600 cursor-pointer transition-colors`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${h.level === 3 ? 'bg-blue-300' : 'bg-blue-400'} flex-shrink-0`} /> {h.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* All Articles */}
            {allPosts.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-black text-gray-900 text-sm mb-3">
                  All Articles
                  <span className="ml-1 text-xs text-gray-400 font-bold">({allPosts.length})</span>
                </h3>
                <div className="space-y-1">
                  {allPosts.map((p) => {
                    const isCurrent = post && p._id === post._id;
                    return (
                      <Link key={p._id} to={`/blog/${p.slug || p._id}`}
                        className={`flex items-start gap-2 px-3 py-2 rounded-xl text-xs transition-all ${
                          isCurrent
                            ? "bg-blue-50 text-blue-700 font-black border border-blue-100"
                            : "text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-semibold"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
                          isCurrent ? "bg-blue-600" : "bg-gray-300"
                        }`} />
                        <span className="line-clamp-2 leading-snug">{p.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Post Info */}
            {post && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                <h3 className="font-black text-gray-900 text-sm">Post Info</h3>
                <div className="space-y-2">
                  {[
                    { label: "Published", value: postDate || '—'                            },
                    { label: "Author",    value: author                                      },
                    { label: "Category",  value: post.category || '—'                       },
                    { label: "Read time", value: readTime(post.content || post.description) },

                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-semibold">{row.label}</span>
                      <span className="text-xs text-gray-700 font-black">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Store CTA */}
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-5 text-white text-center">
              <p className="text-2xl mb-2">{'🏪'}</p>
              <h3 className="font-black text-sm mb-1">Amulya Electronics</h3>
              <p className="text-blue-200 text-xs mb-1">Dharwad, Karnataka</p>
              <p className="text-blue-300 text-xs mb-4 font-medium">Mon–Sun · 9:00 AM – 8:00 PM</p>
              <div className="space-y-1.5 text-xs text-blue-200 mb-4">
                <p>{'📞'} 8310787546 / 8217317884</p>
                <p>{'📧'} amulyaelectronics1@gmail.com</p>
              </div>
              <Link to="/collection/Voltmeter"
                className="block w-full bg-white text-blue-700 hover:bg-yellow-300 hover:text-gray-900 py-2.5 rounded-xl font-black text-xs transition-all text-center">
                Shop All Products {'→'}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
