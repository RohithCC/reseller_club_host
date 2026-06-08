import { useState, useEffect } from "react";
import { FiPlay, FiX, FiYoutube } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:10000";

// ─── YOUTUBE THUMBNAIL ───────────────────────────────────────────────────────
const VIDEO_PLACEHOLDER = "https://placehold.co/480x360/1e40af/ffffff?text=YouTube+Video";
const getThumbnail = (id) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

// ─── VIDEO CARD ─────────────────────────────────────────────────────────────
function VideoCard({ videoId, title, onPlay }) {
  const [imgErr, setImgErr] = useState(false);
  const thumbSrc = imgErr ? VIDEO_PLACEHOLDER : getThumbnail(videoId);

  return (
    <div className="group cursor-pointer" onClick={() => onPlay(videoId)}>
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[9/16] sm:aspect-[3/4] shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
        {/* Thumbnail */}
        <img
          src={thumbSrc}
          alt={title || "YouTube video"}
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient overlay at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl shadow-red-600/40 transition-all duration-300 group-hover:scale-110 group-hover:bg-red-500">
            <FiPlay className="text-white text-2xl sm:text-3xl ml-0.5" fill="white" />
          </div>
        </div>

        {/* Pill badge at top */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <FiYoutube className="text-red-500" size={10} />
          YouTube
        </div>

        {/* Duration pill */}
        <div className="absolute top-3 right-3 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
          Short
        </div>
      </div>

      {/* Title */}
      {title && (
        <p className="text-sm font-semibold text-gray-800 mt-2.5 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
          {title}
        </p>
      )}
    </div>
  );
}

// ─── VIDEO MODAL ────────────────────────────────────────────────────────────
function VideoModal({ videoId, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!videoId) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[500px] bg-black rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <FiX size={18} />
        </button>

        {/* YouTube embed — 9:16 aspect (portrait/reel style) */}
        <div className="relative" style={{ paddingBottom: "177.78%" /* 9:16 */ }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}

// ─── YOUTUBE REELS SECTION ──────────────────────────────────────────────────
export default function YouTubeReels() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tutorials");
  const [playingId, setPlayingId] = useState(null);

  // ── Fetch videos from API ────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/youtube-videos/public`)
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;
        if (data.success && Array.isArray(data.videos)) {
          setVideos(data.videos);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const filtered = videos.filter((v) => v.category === activeTab);
  const tutorials = videos.filter((v) => v.category === "tutorials");
  const reviews = videos.filter((v) => v.category === "reviews");

  // ── Don't render if no videos at all ──────────────────────────────────────
  if (!loading && videos.length === 0) return null;

  return (
    <section className="bg-gray-50 py-12 sm:py-16 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-4 py-1.5 rounded-full mb-3">
            <FiYoutube className="text-lg" />
            Watch & Learn
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
            Tutorials & Reviews
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
            Watch our video guides, project builds, and hear from happy customers.
            Tap a reel to play.
          </p>
        </div>

        {/* Tab switcher — only show if both categories have videos */}
        {tutorials.length > 0 && reviews.length > 0 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveTab("tutorials")}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === "tutorials"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-200 hover:text-blue-600"
              }`}
            >
              📚 Tutorials
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === "reviews"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-200 hover:text-blue-600"
              }`}
            >
              ⭐ Customer Reviews
            </button>
          </div>
        )}

        {/* Loading spinner */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          /* Empty category — show nothing if no videos in this tab */
          null
        ) : (
          <>
            {/* Video grid — horizontal scroll on mobile, grid on sm+ */}
            <div className="sm:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory yt-reels-scroll -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.yt-reels-scroll::-webkit-scrollbar { display: none; }`}</style>
                {filtered.map((video) => (
                  <div key={video._id || video.videoId} className="snap-start flex-shrink-0 w-[200px]">
                    <VideoCard
                      videoId={video.videoId}
                      title={video.title}
                      onPlay={(id) => setPlayingId(id)}
                    />
                  </div>
                ))}
              </div>
              {/* Scroll hint */}
              <p className="text-center text-[10px] text-gray-400 mt-1 sm:hidden">
                ← Swipe to see more →
              </p>
            </div>

            {/* Desktop / tablet grid */}
            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map((video) => (
                <VideoCard
                  key={video._id || video.videoId}
                  videoId={video.videoId}
                  title={video.title}
                  onPlay={(id) => setPlayingId(id)}
                />
              ))}
            </div>

            {/* Channel CTA */}
            <div className="text-center mt-8">
              <a
                href="https://youtube.com/@AmulyaElectronics"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 text-sm"
              >
                <FiYoutube className="text-lg" />
                Subscribe on YouTube
              </a>
            </div>
          </>
        )}
      </div>

      {/* Video modal */}
      {playingId && (
        <VideoModal videoId={playingId} onClose={() => setPlayingId(null)} />
      )}
    </section>
  );
}
