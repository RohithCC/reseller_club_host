// Product.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ShoppingCart, Heart, ArrowLeft, Star, ChevronLeft, ChevronRight,
  Share2, Shield, RotateCcw, Zap, Users, Check, Plus, Minus, Loader2,
  Lightbulb, BookOpen, Wrench, Code2, Cpu, FlaskConical, Radio, Layers
} from "lucide-react";
import { addToCart, updateItemQty } from "../app/cartSlice";
import { toggleWishlist }           from "../app/wishlistSlice";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:10000";

// ─── StarRating ───────────────────────────────────────────────────────────────
function StarRating({ rating, size = 16, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s} size={size}
          fill={(interactive ? hovered || rating : rating) >= s ? "#f59e0b" : "none"}
          stroke={(interactive ? hovered || rating : rating) >= s ? "#f59e0b" : "#d1d5db"}
          style={{ cursor: interactive ? "pointer" : "default", transition: "all 0.15s" }}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate?.(s)}
        />
      ))}
    </div>
  );
}

// ─── ImageCarousel ────────────────────────────────────────────────────────────
function ImageCarousel({ images = [], productName }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomed,    setZoomed]    = useState(false);
  const prev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setActiveIdx((i) => (i + 1) % images.length);

  if (!images.length) return (
    <div style={{ aspectRatio: "1/1", background: "#f8fafc", borderRadius: 16,
      display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
      No Image
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{ position: "relative", background: "#f8fafc", borderRadius: 16,
          overflow: "hidden", border: "1px solid #e2e8f0", aspectRatio: "1/1",
          cursor: zoomed ? "zoom-out" : "zoom-in",
          display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={() => setZoomed(!zoomed)}
      >
        <img
          src={images[activeIdx]} alt={productName}
          style={{ width: "100%", height: "100%", objectFit: "contain", padding: 24,
            transform: zoomed ? "scale(1.6)" : "scale(1)", transition: "transform 0.3s ease" }}
        />
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); prev(); }} style={carouselBtn("left")}><ChevronLeft size={18} /></button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} style={carouselBtn("right")}><ChevronRight size={18} /></button>
          </>
        )}
        <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
          {images.map((_, i) => (
            <span key={i} onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
              style={{ width: i === activeIdx ? 20 : 8, height: 8, borderRadius: 9999,
                background: i === activeIdx ? "#3b82f6" : "#cbd5e1",
                transition: "all 0.3s", cursor: "pointer", display: "inline-block" }} />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {images.map((img, i) => (
          <button key={i} onClick={() => setActiveIdx(i)}
            style={{ width: 72, height: 72, borderRadius: 10,
              border: i === activeIdx ? "2px solid #3b82f6" : "2px solid #e2e8f0",
              overflow: "hidden", background: "#f8fafc", padding: 4,
              cursor: "pointer", flexShrink: 0, transition: "border-color 0.2s" }}>
            <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function carouselBtn(side) {
  return {
    position: "absolute", top: "50%", [side]: 10, transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.9)", border: "1px solid #e2e8f0", borderRadius: 999,
    width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", color: "#374151", zIndex: 2
  };
}

// ─── RatingBar ────────────────────────────────────────────────────────────────
function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
      <span style={{ minWidth: 28, color: "#6b7280" }}>{star}★</span>
      <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#f59e0b",
          borderRadius: 999, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ minWidth: 24, color: "#9ca3af" }}>{count}</span>
    </div>
  );
}

// ─── SimilarCard ─────────────────────────────────────────────────────────────
function SimilarCard({ product }) {
  const dispatch      = useDispatch();
  const cartItems     = useSelector((s) => s.cart.items);
  const wishlistItems = useSelector((s) => s.wishlist.items);
  const [flash, setFlash] = useState(false);

  const pid      = product._id || product.id;
  const price    = product.price ?? 0;
  const mrp      = product.originalPrice ?? product.mrp ?? price;
  const image    = Array.isArray(product.image) ? product.image[0] : (product.image || "");
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const inCart = cartItems.some((i) => i.id === pid);
  const wished = wishlistItems.some((i) => i.id === pid);

  const cartProduct = { id: pid, name: product.name, category: product.category, price, mrp, inStock: product.inStock, image };

  const handleAdd = (e) => {
    e.preventDefault();
    dispatch(addToCart(cartProduct));
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    dispatch(toggleWishlist(cartProduct));
  };

  return (
    <Link to={`/product/${pid}`}
      style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb",
        overflow: "hidden", textDecoration: "none", display: "flex",
        flexDirection: "column", transition: "box-shadow 0.2s, transform 0.2s", position: "relative" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(59,130,246,0.12)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {product.bestseller && (
        <span style={{ position: "absolute", top: 10, left: 10, background: "#3b82f6",
          color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, zIndex: 1 }}>
          Best Seller
        </span>
      )}
      <button onClick={handleWishlist}
        style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.9)",
          border: "1px solid #e5e7eb", borderRadius: "50%", width: 32, height: 32,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 1, color: wished ? "#ef4444" : "#9ca3af" }}>
        <Heart size={15} fill={wished ? "#ef4444" : "none"} />
      </button>
      <div style={{ background: "#f8fafc", padding: 16, display: "flex",
        alignItems: "center", justifyContent: "center", aspectRatio: "1/1" }}>
        <img src={image} alt={product.name}
          style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: 140 }}
          onError={(e) => { e.target.src = "https://placehold.co/200x160?text=Product"; }} />
      </div>
      <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.06em" }}>{product.category}</p>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.4, flex: 1 }}>{product.name}</h4>
        <StarRating rating={Math.round(product.averageRating ?? 0)} size={13} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>₹{price}</span>
          {mrp > price && (
            <>
              <span style={{ fontSize: 13, color: "#9ca3af", textDecoration: "line-through" }}>₹{mrp}</span>
              <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>{discount}% off</span>
            </>
          )}
        </div>
        <button onClick={handleAdd}
          style={{ marginTop: 4, padding: "8px 0",
            background: flash || inCart ? "#22c55e" : "#3b82f6",
            color: "#fff", border: "none", borderRadius: 10, fontWeight: 700,
            fontSize: 13, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.2s" }}>
          <ShoppingCart size={14} /> {flash || inCart ? "Added!" : "Add to Cart"}
        </button>
      </div>
    </Link>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveReviewDate(r) {
  const raw = r.createdAt ?? r.date ?? null;
  if (!raw) return "";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function resolveReviewName(r) {
  return r.userName || r.name || "Anonymous";
}

// ─── Use-case icon map ────────────────────────────────────────────────────────
// Keys match ICON_OPTIONS in Add.jsx / List.jsx exactly
const USE_CASE_ICONS = {
  IoT:          <Radio size={20} />,
  Prototyping:  <Wrench size={20} />,
  Learning:     <BookOpen size={20} />,
  Automation:   <Cpu size={20} />,
  Robotics:     <Zap size={20} />,
  Sensor:       <FlaskConical size={20} />,
  Arduino:      <Code2 size={20} />,
  Raspberry:    <Layers size={20} />,
  Default:      <Lightbulb size={20} />,
};

// 1) exact stored hint  2) scan label text  3) fallback Default
function getUseCaseIcon(iconHint = "", label = "") {
  if (iconHint && USE_CASE_ICONS[iconHint]) return USE_CASE_ICONS[iconHint];
  const key = Object.keys(USE_CASE_ICONS).find(
    (k) => k !== "Default" && label.toLowerCase().includes(k.toLowerCase())
  );
  return USE_CASE_ICONS[key] ?? USE_CASE_ICONS["Default"];
}

// ─── WhatYouCanDoTab ──────────────────────────────────────────────────────────
// Priority: product.useCases (DB) → tags (auto) → generic defaults
function WhatYouCanDoTab({ product }) {
  const storedUseCases = product.useCases      ?? [];
  const tags           = product.tags          ?? [];
  const features       = product.keyFeatures   ?? [];
  const category       = product.category      ?? "";
  const specs          = product.specifications ?? {};

  const isCurated = storedUseCases.length > 0;

  const useCases = isCurated
    ? storedUseCases
    : tags.length > 0
      ? tags.map((tag) => ({
          label: tag.replace(/^#/, ""),
          desc:  `Use this product in your ${tag.replace(/^#/, "")} projects to build innovative solutions.`,
          icon:  "Default",
        }))
      : [
          { label: "Prototyping",  desc: "Rapidly prototype circuits and test ideas on a breadboard.", icon: "Prototyping" },
          { label: "Learning",     desc: "Perfect for students and hobbyists exploring electronics.",  icon: "Learning"    },
          { label: "IoT Projects", desc: "Connect and control devices in your smart home or IoT setup.", icon: "IoT"      },
        ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Hero banner */}
      <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
        borderRadius: 16, padding: "24px 28px", border: "1px solid #bfdbfe",
        display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#3b82f6",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
          <Lightbulb size={26} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
            What Can You Build?
          </h3>
          <p style={{ fontSize: 14, color: "#475569", margin: 0, lineHeight: 1.6 }}>
            Explore project ideas, use cases, and applications for the{" "}
            <strong>{product.name}</strong>.
          </p>
        </div>
      </div>

      {/* Use-case cards grid */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Project Ideas &amp; Use Cases
          </h4>
          {isCurated && (
            <span style={{ fontSize: 11, fontWeight: 700, background: "#eff6ff",
              color: "#3b82f6", padding: "2px 10px", borderRadius: 999 }}>
              Curated
            </span>
          )}
        </div>

        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {useCases.map((uc, i) => {
            const label = (uc.label ?? "").replace(/^#/, "");
            return (
              <div key={i}
                style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
                  padding: "20px 18px", display: "flex", flexDirection: "column", gap: 12,
                  transition: "box-shadow 0.2s, transform 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(59,130,246,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
                  {getUseCaseIcon(uc.icon ?? "", label)}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>
                    #{label}
                  </p>
                  {uc.desc && (
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
                      {uc.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key features — "what it does" */}
      {features.length > 0 && (
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
            What This Product Does
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10,
                background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
                <Check size={15} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical highlights from specs */}
      {Object.keys(specs).length > 0 && (
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
            Technical Highlights
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {Object.entries(specs).slice(0, 8).map(([key, val]) => (
              <div key={key} style={{ background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: 10, padding: "10px 16px", fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: "#374151" }}>{key}: </span>
                <span style={{ color: "#6b7280" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Who is this for? */}
      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa",
        borderRadius: 14, padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#9a3412", margin: 0 }}>Who Is This For?</h4>
        </div>
        <p style={{ fontSize: 13, color: "#7c2d12", margin: 0, lineHeight: 1.8 }}>
          This <strong>{category}</strong> component is ideal for{" "}
          <strong>electronics hobbyists</strong>, <strong>engineering students</strong>,{" "}
          <strong>makers</strong>, and <strong>professionals</strong> looking to integrate it
          into custom circuits, educational kits, robotics systems, or IoT prototypes.
          Whether you're a beginner or an advanced developer, this component provides the
          reliability and specifications needed to bring your ideas to life.
        </p>
      </div>

      {/* Warranty & returns callout */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { icon: <Shield size={18} />,    title: product.warranty     || "1 Year Warranty", color: "#3b82f6", bg: "#eff6ff" },
          { icon: <RotateCcw size={18} />, title: product.returnPolicy || "30-Day Returns",  color: "#16a34a", bg: "#f0fdf4" },
        ].map((b) => (
          <div key={b.title} style={{ display: "flex", alignItems: "center", gap: 10,
            background: b.bg, borderRadius: 12, padding: "12px 18px", flex: 1, minWidth: 180 }}>
            <span style={{ color: b.color }}>{b.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{b.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Product Page ────────────────────────────────────────────────────────
export default function Product() {
  const { productId } = useParams();
  const navigate      = useNavigate();
  const dispatch      = useDispatch();

  const cartItems     = useSelector((s) => s.cart.items);
  const wishlistItems = useSelector((s) => s.wishlist.items);
  const token = useSelector((s) => s.auth?.token ?? "") || localStorage.getItem("token") || "";

  const [product,        setProduct]        = useState(null);
  const [similar,        setSimilar]        = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productError,   setProductError]   = useState(null);

  const [qty,         setQty]         = useState(1);
  const [activeTab,   setActiveTab]   = useState("description");
  const [sortReviews, setSortReviews] = useState("newest");

  const [reviewRating,     setReviewRating]     = useState(0);
  const [reviewText,       setReviewText]       = useState("");
  const [reviewName,       setReviewName]       = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError,      setReviewError]      = useState(null);
  const [reviewSuccess,    setReviewSuccess]    = useState(false);
  const [localReviews,     setLocalReviews]     = useState([]);

  // ── Fetch product ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!productId) return;
    setLoadingProduct(true);
    setProductError(null);
    setLocalReviews([]);

    axios.post(`${BACKEND_URL}/api/product/single`, { productId })
      .then(({ data }) => {
        if (data.success) {
          setProduct(data.product);
          setLocalReviews(data.product.reviews ?? []);
        } else {
          setProductError(data.message || "Product not found.");
        }
      })
      .catch((err) => setProductError(err?.response?.data?.message || "Failed to load product."))
      .finally(() => setLoadingProduct(false));
  }, [productId]);

  // ── Fetch similar ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!product) return;
    axios.post(`${BACKEND_URL}/api/product/similar`, {
      productId: product._id,
      category:  product.category,
      limit:     4,
    })
      .then(({ data }) => { if (data.success) setSimilar(data.products || []); })
      .catch(() => {});
  }, [product]);

  // ── Submit review ─────────────────────────────────────────────────────────
  const handleReviewSubmit = async () => {
    setReviewError(null);
    if (!reviewRating)      return setReviewError("Please select a rating.");
    if (!reviewName.trim()) return setReviewError("Please enter your name.");
    if (!reviewText.trim()) return setReviewError("Please write your review.");

    setReviewSubmitting(true);
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/product/review/add`,
        { productId: product._id, userName: reviewName.trim(), name: reviewName.trim(), rating: reviewRating, comment: reviewText.trim() },
        { headers: { token } }
      );

      if (data.success) {
        const newReview = {
          _id: `temp-${Date.now()}`, userName: reviewName.trim(), name: reviewName.trim(),
          rating: reviewRating, comment: reviewText.trim(),
          createdAt: new Date().toISOString(), date: new Date().toISOString(),
        };
        setLocalReviews((prev) => [newReview, ...prev]);
        setProduct((prev) => {
          const allReviews = [newReview, ...(prev.reviews ?? [])];
          const avg = parseFloat((allReviews.reduce((a, r) => a + r.rating, 0) / allReviews.length).toFixed(1));
          return { ...prev, averageRating: avg, totalReviews: allReviews.length, reviews: allReviews };
        });
        setReviewSuccess(true);
        setReviewRating(0); setReviewName(""); setReviewText("");
      } else {
        setReviewError(data.message || "Failed to submit review.");
      }
    } catch (err) {
      setReviewError(err?.response?.data?.message || err?.response?.data?.error || err?.message || "Something went wrong. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ── Loading / Error guards ────────────────────────────────────────────────
  if (loadingProduct) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, color: "#6b7280" }}>
        <Loader2 size={40} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ fontSize: 15, fontWeight: 600 }}>Loading product...</p>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (productError || !product) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Product Not Found</h2>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>{productError}</p>
        <Link to="/" style={{ background: "#3b82f6", color: "#fff", padding: "12px 28px", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>Go Home</Link>
      </div>
    </div>
  );

  // ── Derived values ────────────────────────────────────────────────────────
  const pid      = product._id;
  const images   = Array.isArray(product.image) ? product.image : [product.image].filter(Boolean);
  const price    = product.price ?? 0;
  const mrp      = product.originalPrice ?? product.mrp ?? price;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const rating   = product.averageRating ?? 0;
  const specs    = product.specifications ?? {};
  const features = product.keyFeatures    ?? [];
  const tags     = product.tags           ?? [];

  const cartItem = cartItems.find((i) => i.id === pid);
  const inCart   = Boolean(cartItem);
  const cartQty  = cartItem?.quantity ?? 0;
  const wished   = wishlistItems.some((i) => i.id === pid);

  const cartProduct = {
    id: pid, name: product.name, category: product.category,
    subCategory: product.subCategory ?? product.subcat ?? product.subcategory ?? "",
    price, mrp, inStock: product.inStock, image: images[0] ?? "",
  };

  const handleAddToCart = () => dispatch(addToCart({ ...cartProduct, quantity: qty }));
  const handleInc       = () => dispatch(updateItemQty({ id: pid, quantity: cartQty + 1 }));
  const handleDec       = () => { if (cartQty > 1) dispatch(updateItemQty({ id: pid, quantity: cartQty - 1 })); };
  const handleWishlist  = () => dispatch(toggleWishlist(cartProduct));

  const ratingBreakdown = [5, 4, 3, 2, 1].map((s) => ({
    star: s, count: localReviews.filter((r) => r.rating === s).length,
  }));

  const sortedReviews = [...localReviews].sort((a, b) => {
    if (sortReviews === "highest") return b.rating - a.rating;
    if (sortReviews === "lowest")  return a.rating - b.rating;
    return new Date(b.createdAt ?? b.date) - new Date(a.createdAt ?? a.date);
  });

  const tabs = [
    { key: "description",     label: "Description"                      },
    { key: "what-you-can-do", label: "What You Can Do"                  },
    { key: "specifications",  label: "Specifications"                   },
    { key: "reviews",         label: `Reviews (${localReviews.length})` },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280" }}>
          <Link to="/" style={{ color: "#3b82f6", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link to={`/collection/${encodeURIComponent(product.category)}`} style={{ color: "#3b82f6", textDecoration: "none" }}>{product.category}</Link>
          <span>/</span>
          <span style={{ color: "#374151", fontWeight: 500 }}>{product.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>

        <Link to={`/collection/${encodeURIComponent(product.category)}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#3b82f6",
            textDecoration: "none", fontSize: 14, fontWeight: 600, marginBottom: 24,
            padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 999 }}>
          <ArrowLeft size={15} /> Back to Products
        </Link>

        {/* ── PRODUCT MAIN ── */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.2fr)",
          gap: 32, background: "#fff", borderRadius: 20, padding: 32,
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)", marginBottom: 32 }}
          className="product-grid">

          <ImageCarousel images={images} productName={product.name} />

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.08em", background: "#eff6ff", padding: "4px 12px", borderRadius: 999 }}>
                {product.category}
              </span>
              {product.bestseller && <span style={{ fontSize: 12, background: "#fef3c7", color: "#b45309", fontWeight: 700, padding: "4px 12px", borderRadius: 999 }}>Best Seller</span>}
              {product.isHot      && <span style={{ fontSize: 12, background: "#fff7ed", color: "#ea580c", fontWeight: 700, padding: "4px 12px", borderRadius: 999 }}>🔥 Hot</span>}
              {product.isFeatured && <span style={{ fontSize: 12, background: "#f3e8ff", color: "#7c3aed", fontWeight: 700, padding: "4px 12px", borderRadius: 999 }}>Featured</span>}
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1.3, margin: 0 }}>{product.name}</h1>

            {/* Rating + views */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StarRating rating={Math.round(rating)} size={18} />
                <span style={{ fontWeight: 700, color: "#f59e0b" }}>{rating}</span>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>({product.totalReviews ?? localReviews.length} reviews)</span>
              </div>
              {product.views > 0 && (
                <span style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                  <Users size={14} color="#3b82f6" /> {product.views} views
                </span>
              )}
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: "#0f172a" }}>₹{price}.00</span>
              {mrp > price && (
                <>
                  <span style={{ fontSize: 18, color: "#9ca3af", textDecoration: "line-through" }}>₹{mrp}.00</span>
                  <span style={{ background: "#dcfce7", color: "#15803d", fontWeight: 700, fontSize: 14, padding: "4px 12px", borderRadius: 999 }}>{discount}% OFF</span>
                </>
              )}
            </div>

            {/* Stock */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: product.inStock ? "#22c55e" : "#ef4444", display: "inline-block" }} />
              <span style={{ color: product.inStock ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                {product.inStock ? `In Stock${product.stockCount ? ` (${product.stockCount} left)` : ""}` : "Out of Stock"}
              </span>
            </div>

            {/* Key features preview (max 4) */}
            {features.length > 0 && (
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 18px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: 10 }}>Key Features</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {features.slice(0, 4).map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#374151" }}>
                      <Check size={14} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* QTY + ACTIONS */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>

              {!inCart && (
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 40, height: 44, background: "#f8fafc", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}><Minus size={14} /></button>
                  <span style={{ width: 44, textAlign: "center", fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(10, q + 1))} style={{ width: 40, height: 44, background: "#f8fafc", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}><Plus size={14} /></button>
                </div>
              )}

              {inCart ? (
                <div style={{ display: "flex", alignItems: "center", border: "2px solid #3b82f6", borderRadius: 10, overflow: "hidden" }}>
                  <button onClick={handleDec} disabled={cartQty <= 1}
                    style={{ width: 42, height: 44, background: "#eff6ff", border: "none", cursor: cartQty <= 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", opacity: cartQty <= 1 ? 0.4 : 1 }}>
                    <Minus size={14} />
                  </button>
                  <span style={{ padding: "0 16px", textAlign: "center", fontWeight: 800, fontSize: 15, color: "#1d4ed8", borderLeft: "2px solid #bfdbfe", borderRight: "2px solid #bfdbfe" }}>
                    {cartQty} in cart
                  </span>
                  <button onClick={handleInc} disabled={cartQty >= 10}
                    style={{ width: 42, height: 44, background: "#eff6ff", border: "none", cursor: cartQty >= 10 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", opacity: cartQty >= 10 ? 0.4 : 1 }}>
                    <Plus size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={handleAddToCart} disabled={!product.inStock}
                  style={{ flex: 1, minWidth: 140, height: 44, background: product.inStock ? "#3b82f6" : "#e5e7eb", color: product.inStock ? "#fff" : "#9ca3af", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: product.inStock ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  onMouseEnter={(e) => { if (product.inStock) e.currentTarget.style.background = "#2563eb"; }}
                  onMouseLeave={(e) => { if (product.inStock) e.currentTarget.style.background = "#3b82f6"; }}>
                  <ShoppingCart size={17} /> {product.inStock ? "Add to Cart" : "Out of Stock"}
                </button>
              )}

              <button onClick={() => { dispatch(addToCart({ ...cartProduct, quantity: qty })); navigate("/cart"); }} disabled={!product.inStock}
                style={{ flex: 1, minWidth: 120, height: 44, background: product.inStock ? "#0f172a" : "#e5e7eb", color: product.inStock ? "#fff" : "#9ca3af", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: product.inStock ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Zap size={16} /> Buy Now
              </button>

              <button onClick={handleWishlist}
                style={{ width: 44, height: 44, border: `1px solid ${wished ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 10, background: wished ? "#fef2f2" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: wished ? "#ef4444" : "#9ca3af", transition: "all 0.2s" }}>
                <Heart size={18} fill={wished ? "#ef4444" : "none"} />
              </button>

              <button onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
                style={{ width: 44, height: 44, border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}
                title="Copy link">
                <Share2 size={18} />
              </button>
            </div>

            {inCart && (
              <button onClick={() => navigate("/cart")}
                style={{ alignSelf: "flex-start", padding: "8px 20px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={14} /> View Cart ({cartQty} item{cartQty > 1 ? "s" : ""})
              </button>
            )}

            {/* Tags — always prefix # */}
            {tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tags.map((t) => (
                  <span key={t} style={{ fontSize: 12, background: "#f1f5f9", color: "#475569", padding: "4px 12px", borderRadius: 999, fontWeight: 500 }}>
                    {t.startsWith("#") ? t : `#${t}`}
                  </span>
                ))}
              </div>
            )}

            {/* Warranty / Returns */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
              {[
                { icon: <Shield size={16} />,    text: product.warranty     || "1 Year Warranty" },
                { icon: <RotateCcw size={16} />, text: product.returnPolicy || "30-Day Returns"  },
              ].map((b) => (
                <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", fontWeight: 500 }}>
                  <span style={{ color: "#3b82f6" }}>{b.icon}</span>{b.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", marginBottom: 32, overflow: "hidden" }}>

          {/* Tab bar — horizontally scrollable on mobile */}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", overflowX: "auto" }}>
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ padding: "18px 24px", border: "none", background: "none", cursor: "pointer",
                  fontSize: 14, fontWeight: 700, whiteSpace: "nowrap",
                  color: activeTab === tab.key ? "#3b82f6" : "#6b7280",
                  borderBottom: activeTab === tab.key ? "2px solid #3b82f6" : "2px solid transparent",
                  marginBottom: -1, transition: "color 0.2s", flexShrink: 0 }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 32 }}>

            {/* Description */}
            {activeTab === "description" && (
              <div>
                <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.8, marginBottom: 24, whiteSpace: "pre-line" }}>
                  {product.description}
                </p>
                {features.length > 0 && (
                  <>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>All Features</h3>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {features.map((f, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#374151", background: "#f8fafc", padding: "12px 14px", borderRadius: 10 }}>
                          <Check size={15} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />{f}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* What You Can Do — uses stored useCases with tag/default fallback */}
            {activeTab === "what-you-can-do" && (
              <WhatYouCanDoTab product={product} />
            )}

            {/* Specifications */}
            {activeTab === "specifications" && (
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Technical Specifications</h3>
                {Object.keys(specs).length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <tbody>
                      {Object.entries(specs).map(([key, val], i) => (
                        <tr key={key} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: "#374151", width: "40%", borderBottom: "1px solid #e5e7eb" }}>{key}</td>
                          <td style={{ padding: "12px 16px", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: "#9ca3af", fontSize: 14 }}>No specifications available.</p>
                )}
              </div>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

                {/* Rating summary */}
                <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start" }}>
                  <div style={{ textAlign: "center", minWidth: 120 }}>
                    <div style={{ fontSize: 56, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{rating}</div>
                    <StarRating rating={Math.round(rating)} size={20} />
                    <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>{localReviews.length} reviews</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 8 }}>
                    {ratingBreakdown.map((r) => (
                      <RatingBar key={r.star} star={r.star} count={r.count} total={localReviews.length} />
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Customer Reviews</h3>
                  <select value={sortReviews} onChange={(e) => setSortReviews(e.target.value)}
                    style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#374151", background: "#fff", cursor: "pointer" }}>
                    <option value="newest">Newest</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                  </select>
                </div>

                {/* Review cards */}
                {sortedReviews.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
                    No reviews yet. Be the first to review!
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {sortedReviews.map((r) => (
                      <div key={r._id || r.id || Math.random()} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 24 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>
                              {resolveReviewName(r)[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{resolveReviewName(r)}</div>
                              <div style={{ fontSize: 12, color: "#9ca3af" }}>{resolveReviewDate(r)}</div>
                            </div>
                          </div>
                          <StarRating rating={r.rating} size={15} />
                        </div>
                        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.7, margin: 0 }}>{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Write a review */}
                <div style={{ background: "#f8fafc", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Write a Review</h3>

                  {reviewSuccess ? (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 10, color: "#16a34a", fontWeight: 700 }}>
                        <Check size={18} /> Review submitted! Thank you.
                      </span>
                      <button onClick={() => setReviewSuccess(false)}
                        style={{ fontSize: 12, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}>
                        Write another
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Your Rating *</label>
                        <StarRating rating={reviewRating} size={28} interactive onRate={setReviewRating} />
                        {reviewRating > 0 && (
                          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewRating]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Name *</label>
                        <input value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Your name"
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                      </div>

                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Your Review *</label>
                        <textarea rows={4} value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your experience with this product..."
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                      </div>

                      {reviewError && (
                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
                          ⚠️ {reviewError}
                        </div>
                      )}

                      {!token && (
                        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>
                          💡 <strong>Tip:</strong>{" "}
                          <Link to="/login" style={{ color: "#3b82f6", fontWeight: 700 }}>Login</Link>{" "}
                          to submit a verified review.
                        </div>
                      )}

                      <button onClick={handleReviewSubmit} disabled={reviewSubmitting}
                        style={{ alignSelf: "flex-start", padding: "12px 28px", background: reviewSubmitting ? "#93c5fd" : "#3b82f6", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: reviewSubmitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                        {reviewSubmitting
                          ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</>
                          : "Submit Review"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products */}
        {similar.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>Similar Products</h2>
                <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>You might also like</p>
              </div>
              <Link to={`/collection/${encodeURIComponent(product.category)}`}
                style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
                View All →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
              {similar.map((p) => <SimilarCard key={p._id || p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:768px){
          .product-grid{grid-template-columns:1fr!important;}
        }
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}