import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiStar } from "react-icons/fi";
import { fetchTestimonials, fetchBlogs } from "../app/Contentslice";
// ⚠️  Adjust the import path above to match your project structure.
//     e.g. if your slice is at src/store/slices/contentSlice.js use:
//     import { fetchTestimonials, fetchBlogs } from "../store/slices/contentSlice";

// ─── Skeleton loaders ─────────────────────────────────────────────────────────
function TestimonialSkeleton() {
  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 animate-pulse">
      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-4 h-4 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-4/6" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="space-y-1">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-2 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

function BlogSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-4 bg-gray-200 rounded-full w-16" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}

// ─── STORE INFO (static) ──────────────────────────────────────────────────────
const STORE_INFO = [
  {
    icon: "📍",
    title: "Our Store",
    lines: ["Shree Banashankari Avenue", "Opp. NTTF College, Dharwad – 580001"],
  },
  {
    icon: "📞",
    title: "Call Us",
    lines: ["8310787546", "8217317884"],
  },
  {
    icon: "📧",
    title: "Email",
    lines: ["amulyaelectronics1@gmail.com"],
  },
  {
    icon: "🕐",
    title: "Working Hours",
    lines: ["Mon – Sun", "9:00 AM – 8:00 PM"],
  },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function TestimonialsAndBlog() {
  const dispatch = useDispatch();

  // Individual selectors — safe even if state.content hasn't loaded yet
  // because the slice initialState guarantees these keys always exist.
  const testimonials        = useSelector((state) => state.content.testimonials);
  const testimonialsLoading = useSelector((state) => state.content.testimonialsLoading);
  const testimonialsError   = useSelector((state) => state.content.testimonialsError);

  const blogs        = useSelector((state) => state.content.blogs);
  const blogsLoading = useSelector((state) => state.content.blogsLoading);
  const blogsError   = useSelector((state) => state.content.blogsError);

  useEffect(() => {
    dispatch(fetchTestimonials());
    dispatch(fetchBlogs());
  }, [dispatch]);

  return (
    <section className="bg-white py-14 px-4">
      <div className="max-w-[1400px] mx-auto space-y-16">

        {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-2">
              Our Testimonials
            </h2>
            <p className="text-gray-500 text-sm">What our customers say about us</p>
          </div>

          {testimonialsError && (
            <p className="text-center text-red-500 text-sm py-6">
              Failed to load testimonials: {testimonialsError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonialsLoading
              ? [...Array(4)].map((_, i) => <TestimonialSkeleton key={i} />)
              : testimonials.map((t) => (
                  <div
                    key={t._id}
                    className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex mb-3">
                      {[...Array(t.rating)].map((_, j) => (
                        <FiStar key={j} className="fill-yellow-400 text-yellow-400 text-sm" />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">
                      "{t.text}"
                    </p>
                    <div className="flex items-center gap-3">
                      {t.avatar ? (
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                          {t.name?.[0] ?? "?"}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-gray-900 text-sm">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* ── BLOG ──────────────────────────────────────────────────────── */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-2">
              Our Articles
            </h2>
            <p className="text-gray-500 text-sm">
              Learn about electronic components and modules
            </p>
          </div>

          {blogsError && (
            <p className="text-center text-red-500 text-sm py-6">
              Failed to load articles: {blogsError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {blogsLoading
              ? [...Array(3)].map((_, i) => <BlogSkeleton key={i} />)
              : blogs.map((post) => (
                  <Link
                    key={post._id}
                    className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="h-44 overflow-hidden bg-gray-50">
                      <img
                        src={post.img}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = "https://placehold.co/400x176?text=Blog";
                        }}
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          {post.cat}
                        </span>
                        <span className="text-[10px] text-gray-400">{post.date}</span>
                      </div>
                      <h3 className="font-black text-gray-900 text-base mb-2 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                      <p className="text-blue-600 text-xs font-bold mt-3">
                        Continue reading →
                      </p>
                    </div>
                  </Link>
                ))}
          </div>
        </div>

        {/* ── STORE INFO (static) ───────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-3xl p-7 sm:p-10 grid grid-cols-2 lg:grid-cols-4 gap-6 text-white">
          {STORE_INFO.map((info) => (
            <div key={info.title} className="flex gap-3">
              <span className="text-2xl flex-shrink-0">{info.icon}</span>
              <div>
                <p className="font-black text-white text-sm mb-1">{info.title}</p>
                {info.lines.map((l) => (
                  <p key={l} className="text-blue-200 text-xs leading-relaxed">{l}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default TestimonialsAndBlog;