// pages/Collection.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiSearch, FiHeart, FiShoppingCart, FiStar, FiGrid,
  FiList, FiChevronDown, FiX, FiFilter, FiMinus, FiPlus,
  FiSliders, FiCheck, FiRefreshCw, FiChevronLeft, FiChevronRight, FiImage,
} from "react-icons/fi";
import axios from "axios";

import { addToCart, updateItemQty } from "../app/cartSlice";
import { toggleWishlist }           from "../app/wishlistSlice";
import {
  fetchCategoryTree,
  selectCategoryNames,
  selectCategoryStatus,
  selectSubCategories,
} from "../app/categorySlice";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const RATINGS     = [4, 3, 2, 1];
const PER_PAGE    = 10;     // items shown per UI page (client-side pagination)
const FETCH_LIMIT = 100;    // items requested per backend round-trip while loading all

// ── Convert "some-slug-name" → "some slug name" for fuzzy matching ─────────
function slugToWords(slug) {
  return decodeURIComponent(slug).replace(/-/g, " ").toLowerCase();
}

// ── Match URL segment against categoryNames list ───────────────────────────
// Priority: 1) exact (case-insensitive)  2) slug→words match  3) first cat
function matchCategory(urlSegment, categoryNames) {
  if (!urlSegment || categoryNames.length === 0) return categoryNames[0] || "";
  const decoded = decodeURIComponent(urlSegment);
  // 1. Exact match (handles names like "JUMPER WIRE AND WIRES")
  const exact = categoryNames.find(
    (n) => n.toLowerCase() === decoded.toLowerCase()
  );
  if (exact) return exact;
  // 2. Slug match (handles legacy links like "jumper-wire-and-wires")
  const words = slugToWords(urlSegment);
  const slugMatch = categoryNames.find(
    (n) => n.toLowerCase() === words
  );
  if (slugMatch) return slugMatch;
  // 3. Fallback
  return categoryNames[0] || "";
}

// ── Robustly read a "total count" from any reasonable response shape ───────
function readTotal(data) {
  const candidates = [
    data?.total,
    data?.totalCount,
    data?.count,
    data?.totalProducts,
    data?.totalItems,
    data?.pagination?.total,
    data?.pagination?.totalCount,
    data?.pagination?.count,
    data?.meta?.total,
    data?.meta?.totalCount,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

function extractImages(product) {
  const raw =
    product.images    ||
    product.image     ||
    product.imageUrl  ||
    product.img       ||
    product.photo     ||
    product.thumbnail ||
    null;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string" && raw.trim()) return [raw.trim()];
  return [];
}

function Stars({ rating, size = "text-xs" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <FiStar key={s} className={`${size} ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

function ImageCarousel({ imgs, alt, badges }) {
  const [idx, setIdx] = useState(0);
  const total = imgs.length;
  const src   = imgs[idx] || null;
  const prev  = (e) => { e.stopPropagation(); setIdx((i) => (i - 1 + total) % total); };
  const next  = (e) => { e.stopPropagation(); setIdx((i) => (i + 1) % total); };
  return (
    <div className="relative h-44 bg-gray-50 overflow-hidden flex items-center justify-center group/img select-none">
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">{badges}</div>
      {src ? (
        <img key={src} src={src} alt={`${alt} ${idx + 1}`}
          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover/img:scale-105"
          onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling?.classList.remove("hidden"); }} />
      ) : null}
      <div className={`flex-col items-center justify-center gap-2 text-gray-300 ${src ? "hidden" : "flex"}`}>
        <FiImage size={36} /><span className="text-xs font-medium">No Image</span>
      </div>
      {total > 1 && (
        <>
          <button onClick={prev} className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/95 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all z-20 hover:bg-blue-50">
            <FiChevronLeft size={13} className="text-gray-700" />
          </button>
          <button onClick={next} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/95 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all z-20 hover:bg-blue-50">
            <FiChevronRight size={13} className="text-gray-700" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {imgs.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className={`rounded-full transition-all duration-200 ${i === idx ? "w-5 h-1.5 bg-blue-600" : "w-1.5 h-1.5 bg-black/25 hover:bg-black/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ThumbnailStrip({ imgs, onSelect, activeIdx }) {
  if (imgs.length <= 1) return null;
  return (
    <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide border-t border-gray-50">
      {imgs.slice(0, 5).map((img, i) => (
        <button key={i} onClick={(e) => { e.stopPropagation(); onSelect(i); }}
          className={`flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden border-2 transition-all ${i === activeIdx ? "border-blue-500 shadow-sm" : "border-transparent opacity-50 hover:opacity-80 hover:border-gray-300"}`}>
          <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = ""; }} />
        </button>
      ))}
    </div>
  );
}

function SkeletonCard({ view }) {
  if (view === "list") return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 animate-pulse">
      <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl" />
      <div className="flex-1 space-y-2.5 py-1">
        <div className="h-3 bg-gray-100 rounded w-1/4" /><div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" /><div className="h-8 bg-gray-100 rounded-full w-28 mt-2" />
      </div>
    </div>
  );
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-100" />
      <div className="p-3 space-y-2.5">
        <div className="h-3 bg-gray-100 rounded w-1/3" /><div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" /><div className="h-9 bg-gray-100 rounded-full mt-3" />
      </div>
    </div>
  );
}

function ProductCard({ product, view }) {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const [flash, setFlash]           = useState(false);
  const [thumbIdx, setThumbIdx]     = useState(0);
  const [listImgIdx, setListImgIdx] = useState(0);

  const cartItems     = useSelector((s) => s.cart.items);
  const wishlistItems = useSelector((s) => s.wishlist.items);

  const pid     = product._id || product.id;
  const price   = product.price   ?? product.salePrice     ?? 0;
  const mrp     = product.mrp     ?? product.originalPrice ?? price;
  const imgs    = extractImages(product);
  const inStock = product.inStock ?? ((product.stock ?? 1) > 0);
  const isHot   = product.isHot   ?? product.tags?.includes?.("hot") ?? false;
  const rating  = product.rating  ?? product.averageRating ?? 0;
  const reviews = product.reviews ?? product.reviewCount   ?? 0;
  const subcat  = product.subCategory || product.subcat || "";
  const disc    = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const cartItem    = cartItems.find((i) => i.id === pid);
  const inCart      = Boolean(cartItem);
  const cartQty     = cartItem?.quantity ?? 0;
  const wished      = wishlistItems.some((i) => i.id === pid);
  const cartProduct = { ...product, id: pid, image: imgs[0] ?? "", price, mrp, inStock };

  const handleAdd      = (e) => { e.stopPropagation(); dispatch(addToCart(cartProduct)); setFlash(true); setTimeout(() => setFlash(false), 1500); };
  const handleInc      = (e) => { e.stopPropagation(); dispatch(updateItemQty({ id: pid, quantity: cartQty + 1 })); };
  const handleDec      = (e) => { e.stopPropagation(); if (cartQty <= 1) return; dispatch(updateItemQty({ id: pid, quantity: cartQty - 1 })); };
  const handleWishlist = (e) => { e.stopPropagation(); dispatch(toggleWishlist(cartProduct)); };
  const handleNav      = () => navigate(`/product/${pid}`);

  const badges = (
    <>
      {disc > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">-{disc}%</span>}
      {isHot    && <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">HOT</span>}
      {!inStock && <span className="bg-gray-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">Out of Stock</span>}
    </>
  );

  if (view === "list") {
    const listSrc = imgs[listImgIdx] || null;
    return (
      <div onClick={handleNav} className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4 hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
          {listSrc ? (
            <img src={listSrc} alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.currentTarget.style.display="none"; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300"><FiImage size={24} /></div>
          )}
          {disc > 0 && <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-black px-1 py-0.5 rounded-full">{disc}%</span>}
          {imgs.length > 1 && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              {imgs.slice(0,4).map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setListImgIdx(i); }}
                  className={`rounded-full transition-all ${i === listImgIdx ? "w-3 h-1.5 bg-blue-600" : "w-1.5 h-1.5 bg-white/70"}`} />
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">{subcat || product.category}</span>
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug mt-0.5 line-clamp-2">{product.name}</h3>
            </div>
            <button onClick={handleWishlist} className="flex-shrink-0 p-1 sm:p-1.5 rounded-full hover:bg-red-50 transition-colors ml-1">
              <FiHeart className={`text-sm ${wished ? "fill-red-500 text-red-500" : "text-gray-300"}`} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Stars rating={rating} /><span className="text-[10px] text-gray-400">({reviews})</span>
            {isHot && <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">HOT</span>}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm sm:text-base font-black text-gray-900">₹{price.toLocaleString()}</span>
            {mrp > price && <span className="text-xs text-gray-400 line-through">₹{mrp.toLocaleString()}</span>}
            {disc > 0 && <span className="text-[10px] font-bold text-green-600">{disc}% off</span>}
          </div>
          <span className={`text-[10px] font-bold mt-0.5 block ${inStock ? "text-green-600" : "text-red-500"}`}>
            {inStock ? "✓ In Stock" : "Out of Stock"}
          </span>
        </div>
        <div className="flex flex-col gap-2 justify-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {inCart ? (
            <div className="flex items-center border border-blue-200 rounded-full overflow-hidden">
              <button onClick={handleDec} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100"><FiMinus size={10} className="text-blue-600" /></button>
              <span className="w-6 sm:w-7 text-center text-xs font-black text-blue-700 border-x border-blue-100">{cartQty}</span>
              <button onClick={handleInc} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100"><FiPlus size={10} className="text-blue-600" /></button>
            </div>
          ) : (
            <button onClick={handleAdd} disabled={!inStock}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full text-[10px] sm:text-xs font-black transition-all whitespace-nowrap ${flash ? "bg-green-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-400"}`}>
              <FiShoppingCart size={11} />{flash ? "Added!" : "Add"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div onClick={handleNav} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative flex flex-col">
      <button onClick={handleWishlist} className="absolute top-2 right-2 z-20 bg-white/95 backdrop-blur p-1.5 rounded-full shadow hover:scale-110 transition-transform">
        <FiHeart className={`text-sm ${wished ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
      </button>
      <ImageCarousel imgs={imgs} alt={product.name} badges={badges} />
      <ThumbnailStrip imgs={imgs} activeIdx={thumbIdx} onSelect={setThumbIdx} />
      <div className="p-3 flex flex-col flex-1">
        <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">{subcat}</span>
        <h3 className="font-bold text-gray-900 text-xs md:text-sm leading-snug mt-0.5 line-clamp-2 flex-1">{product.name}</h3>
        <div className="flex items-center gap-1.5 mt-1.5 mb-1.5">
          <Stars rating={rating} /><span className="text-[11px] text-gray-400">({reviews})</span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-2.5 flex-wrap">
          <span className="text-base font-black text-gray-900">₹{price.toLocaleString()}</span>
          {mrp > price && <span className="text-xs text-gray-400 line-through">₹{mrp.toLocaleString()}</span>}
          {disc > 0 && <span className="text-[10px] font-bold text-green-600">{disc}% off</span>}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          {inCart ? (
            <div className="flex items-center justify-between bg-blue-50 rounded-full border border-blue-100 overflow-hidden">
              <button onClick={handleDec} className="w-9 h-9 flex items-center justify-center hover:bg-blue-100 transition-colors"><FiMinus size={12} className="text-blue-600" /></button>
              <span className="text-xs font-black text-blue-700">{cartQty} in cart</span>
              <button onClick={handleInc} className="w-9 h-9 flex items-center justify-center hover:bg-blue-100 transition-colors"><FiPlus size={12} className="text-blue-600" /></button>
            </div>
          ) : (
            <button onClick={handleAdd} disabled={!inStock}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-black transition-all ${flash ? "bg-green-500 text-white scale-95" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-blue-200 disabled:bg-gray-100 disabled:text-gray-400"}`}>
              <FiShoppingCart size={12} />{flash ? "Added!" : inStock ? "Add to Cart" : "Out of Stock"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, setPage, totalCount, loading }) {
  if (loading || totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm mt-6 px-4 py-4">
      <div className="flex sm:hidden items-center justify-between">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-40 hover:bg-gray-50">
          <FiChevronLeft size={14} /> Prev
        </button>
        <span className="text-sm text-gray-500"><strong className="text-gray-800">{page}</strong> / {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-40 hover:bg-gray-50">
          Next <FiChevronRight size={14} />
        </button>
      </div>
      <div className="hidden sm:flex items-center justify-between gap-4">
        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
          {totalCount} products · page <strong className="text-gray-700">{page}</strong> of <strong className="text-gray-700">{totalPages}</strong>
        </span>
        <div className="flex items-center gap-1 flex-wrap justify-center flex-1">
          <button onClick={() => setPage(1)} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-xs disabled:opacity-30 hover:bg-gray-50">«</button>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-xs disabled:opacity-30 hover:bg-gray-50"><FiChevronLeft size={13} /></button>
          {pages.map((item, i) =>
            item === "..." ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span> : (
              <button key={item} onClick={() => setPage(item)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${page === item ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"}`}>
                {item}
              </button>
            )
          )}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-xs disabled:opacity-30 hover:bg-gray-50"><FiChevronRight size={13} /></button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-xs disabled:opacity-30 hover:bg-gray-50">»</button>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">Go to</span>
          <input type="number" min={1} max={totalPages} defaultValue={page} key={page}
            onKeyDown={(e) => { if (e.key === "Enter") { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) setPage(v); }}}
            className="w-14 h-8 border border-gray-200 rounded-lg text-xs text-center outline-none focus:border-blue-400" />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function Collection() {
  const { category: urlCategory = "", subCategory: urlSubCategory = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const categoryNames  = useSelector(selectCategoryNames);
  const categoryStatus = useSelector(selectCategoryStatus);
  const catLoading     = categoryStatus === "loading" || categoryStatus === "idle";

  useEffect(() => {
    if (categoryStatus === "idle") dispatch(fetchCategoryTree());
  }, [dispatch, categoryStatus]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcat,   setSelectedSubcat]   = useState("All");
  const [expandedCat,      setExpandedCat]      = useState("");

  // Track last applied URL values — prevents re-triggering on unrelated renders
  const appliedRef = useRef({ cat: null, sub: null });

  // ── Sync URL → state after tree loads ─────────────────────────────────────
  // matchCategory handles BOTH:
  //   • "JUMPER%20WIRE%20AND%20WIRES"  (exact name, URL-encoded)
  //   • "jumper-wire-and-wires"         (slug from old links)
  useEffect(() => {
    if (categoryStatus !== "succeeded" || categoryNames.length === 0) return;

    const matchedCat = matchCategory(urlCategory, categoryNames);
    const matchedSub = urlSubCategory ? decodeURIComponent(urlSubCategory) : "All";

    const prev = appliedRef.current;
    if (prev.cat === matchedCat && prev.sub === matchedSub) return;

    appliedRef.current = { cat: matchedCat, sub: matchedSub };
    setSelectedCategory(matchedCat);
    setExpandedCat(matchedCat);
    setSelectedSubcat(matchedSub);
    setPage(1);
  }, [categoryStatus, categoryNames, urlCategory, urlSubCategory]);

  const [search,            setSearch]            = useState("");
  const [priceMin,          setPriceMin]          = useState(0);
  const [priceMax,          setPriceMax]          = useState(500);
  const [minRating,         setMinRating]         = useState(0);
  const [inStockOnly,       setInStockOnly]       = useState(false);
  const [hotOnly,           setHotOnly]           = useState(false);
  const [sortBy,            setSortBy]            = useState("popularity");
  const [page,              setPage]              = useState(1);
  const [view,              setView]              = useState("grid");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [products,          setProducts]          = useState([]);  // ALL products for current filters
  const [totalCount,        setTotalCount]        = useState(0);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState(null);

  // Bumped on every new fetch so a stale in-flight loop can't overwrite fresh data
  const fetchIdRef = useRef(0);

  const rawSubcats  = useSelector(selectSubCategories(expandedCat));
  const subcatNames = ["All", ...rawSubcats.filter((s) => s.isActive !== false).map((s) => s.name)];

  // ── All category/subcat changes go through the URL ─────────────────────────
  // Always encode cat.name — Collection will decode + match it
  const navigateTo = useCallback((cat, sub = "All") => {
    const base = `/collection/${encodeURIComponent(cat)}`;
    navigate(sub && sub !== "All" ? `${base}/${encodeURIComponent(sub)}` : base);
  }, [navigate]);

  const activeFiltersCount = [
    priceMin > 0 || priceMax < 500,
    minRating > 0,
    inStockOnly,
    hotOnly,
    selectedSubcat !== "All",
  ].filter(Boolean).length;

  // ── Build the query for ONE backend round-trip ─────────────────────────────
  // page/limit are arguments now, NOT state — so changing the visible UI page
  // does NOT rebuild the query and does NOT trigger a refetch.
  const buildQuery = useCallback((pageNum, limit) => {
    const p = new URLSearchParams();
    if (selectedCategory)         p.set("category",    selectedCategory);
    p.set("page",  pageNum);
    p.set("limit", limit);
    if (selectedSubcat !== "All") p.set("subCategory", selectedSubcat);
    if (search)                   p.set("search",      search);
    if (priceMin > 0)             p.set("minPrice",    priceMin);
    if (priceMax < 500)           p.set("maxPrice",    priceMax);
    if (minRating > 0)            p.set("minRating",   minRating);
    if (inStockOnly)              p.set("inStock",     "true");
    if (hotOnly)                  p.set("tags",        "hot");
    const sortMap = { price_asc:"price_asc", price_desc:"price_desc", rating:"rating_desc", newest:"newest", discount:"discount" };
    p.set("sort", sortMap[sortBy] || "popularity");
    return p.toString();
  }, [selectedCategory, selectedSubcat, search, priceMin, priceMax, minRating, inStockOnly, hotOnly, sortBy]);

  // ── Fetch EVERY matching product, then paginate on the client ──────────────
  // Loops through the backend in FETCH_LIMIT-sized chunks until the full set is
  // collected. Works whether the backend returns a total count or not, and even
  // if it caps how many rows it returns per request.
  const fetchProducts = useCallback(async () => {
    if (!selectedCategory) return;

    const myFetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      let all       = [];
      let pageNum   = 1;
      let total     = null;
      const seen    = new Set();

      while (true) {
        const q = buildQuery(pageNum, FETCH_LIMIT);
        const { data } = await axios.get(`${BACKEND_URL}/api/product/list?${q}`);

        // A newer fetch started while this one was in flight — abandon this one.
        if (myFetchId !== fetchIdRef.current) return;

        if (!data || data.success === false) {
          setError(data?.message || "Failed to load products.");
          all = [];
          break;
        }

        const batch = (data.products || data.items || data.data || [])
          .map((p) => ({ ...p, id: p._id || p.id }))
          .filter((p) => {
            // Guard against duplicates if the backend ever repeats rows
            if (p.id == null) return true;
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });

        all = all.concat(batch);

        const reported = readTotal(data);
        if (reported != null) total = reported;

        // ── Stop conditions ──
        if (batch.length === 0) break;                          // backend has no more rows
        if (total != null && all.length >= total) break;        // collected everything reported
        if (total == null && batch.length < FETCH_LIMIT) break; // no total info + short page = last page

        pageNum += 1;
        if (pageNum > 1000) break;                              // hard safety cap (~100k rows)
      }

      if (myFetchId !== fetchIdRef.current) return;
      setProducts(all);
      setTotalCount(total != null ? Math.max(total, all.length) : all.length);
      setPage(1);
    } catch (err) {
      if (myFetchId !== fetchIdRef.current) return;
      setError(err?.response?.data?.message || "Something went wrong.");
      setProducts([]);
      setTotalCount(0);
    } finally {
      if (myFetchId === fetchIdRef.current) setLoading(false);
    }
  }, [buildQuery, selectedCategory]);

  // Refetch only when filters/category/search/sort change (not on page change)
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // On mobile, scroll past the sticky bottom nav (≈64px)
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  // Client-side page slice — this is what the UI actually renders
  const pagedProducts = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Keep the current page in range when the result set shrinks (e.g. new filter)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const resetFilters = () => {
    setSearch(""); setPriceMin(0); setPriceMax(500);
    setMinRating(0); setInStockOnly(false); setHotOnly(false); setPage(1);
    if (selectedCategory) navigateTo(selectedCategory, "All");
  };

  const handleCategoryClick = (cat) => {
    if (cat === selectedCategory) {
      setExpandedCat((prev) => (prev === cat ? "" : cat));
    } else {
      setExpandedCat(cat);
      navigateTo(cat, "All");
    }
  };

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
          <FiSliders className="text-blue-600" /> Filters
          {activeFiltersCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{activeFiltersCount}</span>
          )}
        </h3>
        {activeFiltersCount > 0 && (
          <button onClick={resetFilters} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1">
            <FiX size={11} /> Reset
          </button>
        )}
      </div>

      {/* CATEGORIES */}
      <div className="border-b border-gray-100 pb-4 mb-4">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Categories</p>
        {catLoading ? (
          <div className="space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="h-9 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : categoryNames.length === 0 ? (
          <p className="text-xs text-gray-400 px-3">No categories found.</p>
        ) : (
          <div className="space-y-1">
            {categoryNames.map((cat) => {
              const isSel = selectedCategory === cat;
              const isExp = expandedCat === cat;
              return (
                <div key={cat}>
                  <button onClick={() => handleCategoryClick(cat)}
                    className={`w-full text-left text-sm px-3 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2 ${isSel ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-200" : "text-gray-600 hover:bg-gray-50 font-medium"}`}>
                    <span className="truncate">{cat}</span>
                    <span className={`flex-shrink-0 transition-transform duration-200 ${isExp ? "rotate-180" : ""}`}>
                      <FiChevronDown size={13} className={isSel ? "text-white/70" : "text-gray-400"} />
                    </span>
                  </button>
                  {isExp && subcatNames.length > 1 && (
                    <div className="ml-4 mt-1 border-l-2 border-blue-100 pl-3 space-y-0.5 pb-1">
                      {subcatNames.map((s) => {
                        const isActiveSub = selectedSubcat === s && selectedCategory === cat;
                        return (
                          <button key={s} onClick={() => navigateTo(cat, s)}
                            className={`w-full text-left text-xs px-2.5 py-2 rounded-lg transition-all flex items-center gap-2 ${isActiveSub ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${isActiveSub ? "bg-blue-600 scale-125" : "bg-gray-300"}`} />
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PRICE RANGE */}
      <div className="border-b border-gray-100 pb-4 mb-4">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Price Range</p>
        <div className="px-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs text-center font-bold text-gray-700">₹{priceMin}</div>
            <span className="text-gray-300">—</span>
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs text-center font-bold text-gray-700">₹{priceMax}</div>
          </div>
          <input type="range" min={0} max={500} value={priceMin} onChange={(e) => { setPriceMin(+e.target.value); setPage(1); }} className="w-full accent-blue-600 mb-2 cursor-pointer" />
          <input type="range" min={0} max={500} value={priceMax} onChange={(e) => { setPriceMax(+e.target.value); setPage(1); }} className="w-full accent-blue-600 cursor-pointer" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>₹0</span><span>₹500+</span></div>
        </div>
      </div>

      {/* MIN RATING */}
      <div className="border-b border-gray-100 pb-4 mb-4">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Min. Rating</p>
        <div className="space-y-1">
          {RATINGS.map((r) => (
            <button key={r} onClick={() => { setMinRating(minRating === r ? 0 : r); setPage(1); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${minRating === r ? "bg-yellow-50 border border-yellow-200" : "hover:bg-gray-50"}`}>
              <Stars rating={r} /><span className="text-gray-500 text-xs">& above</span>
              {minRating === r && <FiCheck className="ml-auto text-yellow-500" size={12} />}
            </button>
          ))}
        </div>
      </div>

      {/* AVAILABILITY */}
      <div>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Availability</p>
        {[
          [inStockOnly, () => { setInStockOnly(!inStockOnly); setPage(1); }, "bg-green-600 border-green-600", "✓ In Stock Only"],
          [hotOnly,     () => { setHotOnly(!hotOnly);         setPage(1); }, "bg-orange-500 border-orange-500", "🔥 Hot Deals Only"],
        ].map(([val, fn, cls, label]) => (
          <label key={label} className="flex items-center gap-2.5 py-2 px-1 cursor-pointer rounded-xl hover:bg-gray-50 transition-colors">
            <div onClick={fn} className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${val ? cls : "border-gray-300"}`}>
              {val && <FiCheck className="text-white" size={9} />}
            </div>
            <span className="text-sm text-gray-600">{label}</span>
          </label>
        ))}
      </div>
    </aside>
  );

  const renderContent = () => {
    if (loading) return (
      <div className={view === "grid" ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4" : "space-y-3"}>
        {Array.from({ length: PER_PAGE }).map((_, i) => <SkeletonCard key={i} view={view} />)}
      </div>
    );
    if (error) return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-black text-gray-700 mb-2">Failed to Load</h3>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <button onClick={fetchProducts} className="bg-blue-600 text-white px-8 py-2.5 rounded-full font-bold hover:bg-blue-700 inline-flex items-center gap-2">
          <FiRefreshCw size={14} /> Try Again
        </button>
      </div>
    );
    if (!products.length) return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-xl font-black text-gray-700 mb-2">No Products Found</h3>
        <p className="text-gray-400 text-sm mb-6">Try adjusting your filters or search term.</p>
        <button onClick={resetFilters} className="bg-blue-600 text-white px-8 py-2.5 rounded-full font-bold hover:bg-blue-700">Reset Filters</button>
      </div>
    );
    return (
      <div className={view === "grid" ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4" : "space-y-3"}>
        {pagedProducts.map((p) => <ProductCard key={p.id} product={p} view={view} />)}
      </div>
    );
  };

  return (
    // pb-20 on mobile so the last card isn't hidden behind the fixed bottom nav bar
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-0">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span className="text-gray-300">›</span>
          {catLoading
            ? <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
            : <button onClick={() => navigateTo(selectedCategory)} className="text-gray-800 font-semibold hover:text-blue-600 transition-colors">{selectedCategory}</button>
          }
          {selectedSubcat !== "All" && (
            <><span className="text-gray-300">›</span><span className="text-blue-600 font-medium">{selectedSubcat}</span></>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 md:px-4 py-5 flex gap-5">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-60 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
            <Sidebar />
          </div>
        </div>

        {/* Mobile Sidebar overlay — pb-20 so filters aren't hidden by bottom nav */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
            <div className="relative bg-white w-80 max-w-[88vw] h-full overflow-y-auto p-5 pb-20 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <span className="font-black text-gray-900 text-base flex items-center gap-2">
                  <FiSliders className="text-blue-600" /> Filter & Browse
                </span>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <FiX className="text-gray-600" />
                </button>
              </div>
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="bg-white rounded-2xl shadow-sm p-3 md:p-4 mb-4">
            <div className="flex gap-2 sm:gap-3 mb-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder={`Search in ${selectedCategory || "products"}...`}
                  className="w-full border-2 border-gray-100 focus:border-blue-400 rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none transition-colors" />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                    <FiX size={14} />
                  </button>
                )}
              </div>
              <button onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2.5 rounded-xl text-sm font-bold flex-shrink-0">
                <FiFilter size={14} /><span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-white/30 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{activeFiltersCount}</span>
                )}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-none bg-white cursor-pointer hover:border-blue-300 transition-colors">
                <option value="popularity">Sort: Popularity</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest First</option>
                <option value="discount">Biggest Discount</option>
              </select>
              <div className="flex items-center gap-2 sm:gap-3">
                {!loading && totalCount > 0 && (
                  <span className="text-xs text-gray-400 hidden sm:block whitespace-nowrap">
                    <strong className="text-gray-700">{Math.min((page-1)*PER_PAGE+1, totalCount)}–{Math.min(page*PER_PAGE, totalCount)}</strong> of <strong className="text-gray-700">{totalCount}</strong>
                  </span>
                )}
                <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setView("grid")} className={`p-2.5 transition-colors ${view==="grid" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-50"}`}><FiGrid size={14} /></button>
                  <button onClick={() => setView("list")} className={`p-2.5 transition-colors ${view==="list" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-50"}`}><FiList size={14} /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedSubcat !== "All" && (
                <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  📂 {selectedSubcat}
                  <button onClick={() => navigateTo(selectedCategory, "All")} className="hover:text-blue-900"><FiX size={10} /></button>
                </span>
              )}
              {(priceMin > 0 || priceMax < 500) && (
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  ₹{priceMin}–₹{priceMax}
                  <button onClick={() => { setPriceMin(0); setPriceMax(500); setPage(1); }} className="hover:text-green-900"><FiX size={10} /></button>
                </span>
              )}
              {minRating > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  {minRating}★+
                  <button onClick={() => { setMinRating(0); setPage(1); }} className="hover:text-yellow-900"><FiX size={10} /></button>
                </span>
              )}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  ✓ In Stock
                  <button onClick={() => { setInStockOnly(false); setPage(1); }} className="hover:text-emerald-900"><FiX size={10} /></button>
                </span>
              )}
              {hotOnly && (
                <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  🔥 Hot
                  <button onClick={() => { setHotOnly(false); setPage(1); }} className="hover:text-orange-900"><FiX size={10} /></button>
                </span>
              )}
              <button onClick={resetFilters} className="text-xs text-red-500 font-bold hover:underline px-1 py-1.5">Clear All</button>
            </div>
          )}

          <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-4 flex items-center gap-2 flex-wrap">
            {catLoading ? <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" /> : selectedCategory}
            {selectedSubcat !== "All" && <span className="text-base font-semibold text-blue-600">/ {selectedSubcat}</span>}
            {!loading && !catLoading && totalCount > 0 && (
              <span className="text-sm md:text-base font-normal text-gray-400">({totalCount} products)</span>
            )}
          </h1>

          {renderContent()}
          <Pagination page={page} totalPages={totalPages} setPage={setPage} totalCount={totalCount} loading={loading} />
        </div>
      </div>
    </div>
  );
}