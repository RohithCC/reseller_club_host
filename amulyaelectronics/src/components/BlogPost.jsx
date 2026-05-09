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
  FiArrowRight, FiShare2, FiBookmark, FiChevronRight,
  FiCheck, FiHeart, FiEye,
  FiMessageCircle, FiSend, FiAlertCircle,
} from "react-icons/fi";

const BACKEND  = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const API_BASE = `${BACKEND}/api`;

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
function PostContent({ content }) {
  if (!content) return null;
  const lines = content.split("\n");
  const elements = [];
  let listItems = [];
  let key = 0;

  const flushList = () => {
    if (!listItems.length) return;
    elements.push(
      <ul key={`ul-${key++}`} className="space-y-2 my-5 pl-2">
        {listItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-gray-600 text-sm leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
            <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) { flushList(); continue; }
    if (t.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={key++} className="text-lg font-black text-gray-900 mt-7 mb-3">{t.slice(4)}</h3>);
    } else if (t.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={key++} className="text-xl font-black text-gray-900 mt-8 mb-3">{t.slice(3)}</h2>);
    } else if (t.match(/^\*\*[^*]+\*\*$/) && t.split(" ").length <= 8) {
      flushList();
      elements.push(<p key={key++} className="text-base font-black text-gray-800 mt-5 mb-2">{t.slice(2, -2)}</p>);
    } else if (t.startsWith("* ") || t.startsWith("- ")) {
      listItems.push(t.slice(2));
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4"
          dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.*?)\*\*/g, "<strong class='font-black text-gray-800'>$1</strong>") }} />
      );
    }
  }
  flushList();
  return <div>{elements}</div>;
}

// ─── CommentsSection ──────────────────────────────────────────────────────────
function CommentsSection({ postId, comments = [] }) {
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [message,    setMessage]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");

  const approved = comments.filter((c) => c.approved !== false);

  const handleSubmit = async () => {
    if (!name.trim() || !message.trim()) {
      setError("Name and message are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/blog/comment/add`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ blogId: postId, name, email, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setName(""); setEmail(""); setMessage("");
      } else {
        setError(data.message || "Failed to submit comment.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
      <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
        <FiMessageCircle className="text-blue-600" size={20} />
        Comments
        {approved.length > 0 && (
          <span className="text-sm font-bold text-gray-400">({approved.length})</span>
        )}
      </h3>

      {approved.length > 0 ? (
        <div className="space-y-4 mb-8">
          {approved.map((c, i) => (
            <div key={c._id || i} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-black text-sm">
                  {c.name?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1 bg-gray-50 rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-black text-gray-800">{c.name}</p>
                  {(c.date || c.createdAt) && (
                    <p className="text-[10px] text-gray-400">
                      {formatDate(c.date ?? c.createdAt)}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{c.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-6">No comments yet. Be the first!</p>
      )}

      <div className="border-t border-gray-100 pt-6">
        <p className="text-sm font-black text-gray-800 mb-4">Leave a Comment</p>
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <FiCheck className="text-green-500 mx-auto mb-2" size={20} />
            <p className="text-sm font-bold text-green-700">
              Comment submitted! It'll appear after approval.
            </p>
            <button onClick={() => setSuccess(false)}
              className="mt-3 text-xs text-blue-600 font-bold hover:underline">
              Write another
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name *"
                className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50" />
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional)"
                className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50" />
            </div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your comment here... *" rows={3}
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 resize-none" />
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <FiAlertCircle size={11} /> {error}
              </p>
            )}
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 text-xs font-black bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm">
              {submitting ? "Submitting…" : <><FiSend size={12} /> Post Comment</>}
            </button>
          </div>
        )}
      </div>
    </div>
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

// ─── MAIN BLOG POST PAGE ──────────────────────────────────────────────────────
export default function BlogPost() {
  const { id }   = useParams();
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────────
  const [post,        setPost]        = useState(null);
  const [allPosts,    setAllPosts]    = useState([]);

  // ✅ prevPost and nextPost stored in state so they are set atomically
  // together with `post` — no risk of rendering before they're computed
  const [prevPost,    setPrevPost]    = useState(null);
  const [nextPost,    setNextPost]    = useState(null);

  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [fetchError,  setFetchError]  = useState("");
  const [bookmarked,  setBookmarked]  = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [likes,       setLikes]       = useState(0);
  const [liked,       setLiked]       = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // ── ✅ CORE FIX: Promise.all — both requests fire simultaneously ──────────────
  //
  // OLD (broken):
  //   await fetch(single)   ← sets post
  //   await fetch(list)     ← sets allPosts (too late — currentIdx already -1)
  //   currentIdx = allPosts.findIndex(...)  ← always -1 on first render
  //
  // NEW (fixed):
  //   [postData, listData] = await Promise.all([fetch(single), fetch(list)])
  //   compute prev/next immediately from listData.blogs
  //   store in state → available on very first render
  //
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
        // Fire both requests in parallel — neither blocks the other
        const [postRes, listRes] = await Promise.all([
          fetch(`${API_BASE}/blog/${id}`),
          fetch(`${API_BASE}/blog/list`),
        ]);

        // Parse both JSON payloads in parallel too
        const [postData, listData] = await Promise.all([
          postRes.json(),
          listRes.json(),
        ]);

        if (cancelled) return;

        // ── Resolve blog list ────────────────────────────────────────────────
        // ✅ response field is "blogs" (not "posts")
        const blogs = listData.success ? (listData.blogs ?? []) : [];
        setAllPosts(blogs);

        // ── Resolve single post ──────────────────────────────────────────────
        if (!postData.success || !postData.blog) {
          setNotFound(true);
          return;
        }

        const fetchedPost = postData.blog;
        setPost(fetchedPost);
        setLikes(fetchedPost.likes ?? 0);

        // Restore liked state from localStorage
        const likedBlogs = JSON.parse(localStorage.getItem("likedBlogs") || "[]");
        setLiked(likedBlogs.includes(fetchedPost._id));

        // ── ✅ Compute prev/next right here — both datasets are available ────
        // Use fetchedPost._id (not the URL param `id`) for reliable matching
        // because the URL param could be a slug, but _id is always canonical
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

  // ── Like handler ──────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (liked || likeLoading || !post) return;
    setLikeLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/blog/like`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ blogId: post._id }),
      });
      const data = await res.json();
      if (data.success) {
        setLikes((l) => l + 1);
        setLiked(true);
        const arr = JSON.parse(localStorage.getItem("likedBlogs") || "[]");
        if (!arr.includes(post._id)) arr.push(post._id);
        localStorage.setItem("likedBlogs", JSON.stringify(arr));
      }
    } catch {
      // fail silently
    } finally {
      setLikeLoading(false);
    }
  };

  // ── Share handler ─────────────────────────────────────────────────────────────
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── TOC — extracted from markdown headings in content ────────────────────────
  const tocHeadings = post
    ? (post.content || "").split("\n")
        .filter((l) => {
          const t = l.trim();
          return (
            t.startsWith("### ") || t.startsWith("## ") ||
            (t.match(/^\*\*[^*]+\*\*$/) && t.split(" ").length <= 8)
          );
        })
        .slice(0, 7)
        .map((l) => l.trim().replace(/^#{2,3}\s/, "").replace(/\*\*/g, ""))
    : [];

  // ── Render guards ─────────────────────────────────────────────────────────────
  if (loading)    return <BlogPostSkeleton />;

  if (fetchError) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-5xl mb-4">⚠️</p>
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
        <p className="text-5xl mb-4">📄</p>
        <h2 className="text-2xl font-black text-gray-700 mb-4">Post not found</h2>
        <Link to="/blog" className="text-blue-600 hover:underline font-bold">
          ← Back to Blog
        </Link>
      </div>
    </div>
  );

  if (!post) return null;

  // ── Resolved display fields ───────────────────────────────────────────────────
  const postDate     = post.date ? formatDate(post.date) : "";
  const leadText     = post.content && post.description ? post.description : null;
  const bodyContent  = post.content || null;
  const bodyFallback = !post.content ? post.description : null;
  const author       = post.author  || "Admin";
  const tags         = Array.isArray(post.tags)     ? post.tags     : [];
  const comments     = Array.isArray(post.comments) ? post.comments : [];

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
                <img src={post.image} alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "https://placehold.co/800x400?text=Blog+Post"; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

                {/* Category badge */}
                <div className="absolute top-5 left-5">
                  <span className="bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                    {post.category}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="absolute top-5 right-5 flex gap-2">
                  <button onClick={() => setBookmarked(!bookmarked)}
                    className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center shadow transition-all ${
                      bookmarked ? "bg-blue-600 text-white" : "bg-white/90 text-gray-600 hover:bg-white"
                    }`}>
                    <FiBookmark size={14} fill={bookmarked ? "currentColor" : "none"} />
                  </button>
                  <button onClick={handleShare}
                    className="w-9 h-9 bg-white/90 hover:bg-white rounded-full backdrop-blur-sm flex items-center justify-center shadow text-gray-600 transition-all">
                    {copied ? <FiCheck size={14} className="text-green-600" /> : <FiShare2 size={14} />}
                  </button>
                </div>

                {/* Views + Likes overlay */}
                <div className="absolute bottom-4 left-5 flex items-center gap-3">
                  <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                    <FiEye size={11} /> {post.views ?? 0}
                  </span>
                  <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                    <FiHeart size={11} /> {likes}
                  </span>
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
                  <span className="flex items-center gap-1.5 ml-auto">
                    <FiEye size={12} className="text-blue-400" /> {post.views ?? 0} views
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

                {/* Like button */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-4">
                  <button onClick={handleLike} disabled={liked || likeLoading}
                    className={`flex items-center gap-2 text-sm font-black px-5 py-2.5 rounded-2xl border-2 transition-all ${
                      liked
                        ? "bg-red-50 border-red-200 text-red-500 cursor-default"
                        : "border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-500 text-gray-500"
                    }`}>
                    <FiHeart size={15} fill={liked ? "currentColor" : "none"} />
                    {liked ? "Liked!" : "Like this article"}
                    <span className="text-xs font-bold opacity-60">{likes}</span>
                  </button>
                  <p className="text-xs text-gray-400">Found this helpful?</p>
                </div>

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

            {/* ── PREV / NEXT ── */}
            {/* ✅ prevPost & nextPost are in state — set atomically with post data */}
            {/* They are NEVER null due to a timing issue — both are computed     */}
            {/* inside Promise.all before any setState is called                  */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {prevPost ? (
                <Link to={`/blog/${prevPost._id}`}
                  className="group flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                    <img src={prevPost.image} alt={prevPost.title} loading="lazy"
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
                <Link to={`/blog/${nextPost._id}`}
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
                    <img src={nextPost.image} alt={nextPost.title} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => { e.target.src = "https://placehold.co/48x48?text=📝"; }} />
                  </div>
                </Link>
              ) : <div />}
            </div>

            {/* COMMENTS */}
            <CommentsSection postId={post._id} comments={comments} />
          </article>

          {/* SIDEBAR */}
          <aside className="space-y-5">

            {/* Table of Contents */}
            {tocHeadings.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-black text-gray-900 text-sm mb-3">In This Article</h3>
                <ul className="space-y-2">
                  {tocHeadings.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 cursor-pointer transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" /> {h}
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
                    // ✅ compare against post._id (not URL param `id`) — always canonical
                    const isCurrent = post && p._id === post._id;
                    return (
                      <Link key={p._id} to={`/blog/${p._id}`}
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
                    { label: "Published", value: postDate || "—"                            },
                    { label: "Author",    value: author                                      },
                    { label: "Category",  value: post.category || "—"                       },
                    { label: "Read time", value: readTime(post.content || post.description) },
                    { label: "Views",     value: `${post.views ?? 0}`                       },
                    { label: "Likes",     value: `${likes}`                                 },
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
              <p className="text-2xl mb-2">🏪</p>
              <h3 className="font-black text-sm mb-1">Amulya Electronics</h3>
              <p className="text-blue-200 text-xs mb-1">Dharwad, Karnataka</p>
              <p className="text-blue-300 text-xs mb-4 font-medium">Mon–Sun · 9:00 AM – 8:00 PM</p>
              <div className="space-y-1.5 text-xs text-blue-200 mb-4">
                <p>📞 8310787546 / 8217317884</p>
                <p>📧 amulyaelectronics1@gmail.com</p>
              </div>
              <Link to="/collection/Voltmeter"
                className="block w-full bg-white text-blue-700 hover:bg-yellow-300 hover:text-gray-900 py-2.5 rounded-xl font-black text-xs transition-all text-center">
                Shop All Products →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
