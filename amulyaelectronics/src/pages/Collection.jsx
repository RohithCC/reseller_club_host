// pages/Collection.jsx
// Categories & sub-categories come from Redux (categorySlice → /api/category/tree)
// All original functionality is preserved — zero hardcoded category data
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiSearch, FiHeart, FiShoppingCart, FiStar, FiGrid,
  FiList, FiChevronDown, FiChevronUp, FiX, FiFilter, FiMinus, FiPlus,
  FiSliders, FiCheck, FiRefreshCw,
} from "react-icons/fi";
import axios from "axios";

// ── Redux slices ───────────────────────────────────────────────────────────────
import { addToCart, updateItemQty }   from "../app/cartSlice";   // ← was updateQty
import { toggleWishlist }             from "../app/wishlistSlice";
import {
  fetchCategoryTree,
  selectCategoryTree,
  selectCategoryNames,
  selectCategoryStatus,
  selectSubCategories,
} from "../app/categorySlice";

const BACKEND_URL      = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const BRANDS           = ["Generic", "Arduino", "Raspberry Pi", "ESP", "Texas Instruments"];
const RATINGS          = [4, 3, 2, 1];
const PER_PAGE_OPTIONS = [9, 12, 18, 24];

// ─── FILTER SECTION ────────────────────────────────────────────────────────────
function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-sm font-black text-gray-800 uppercase tracking-wide mb-3"
      >
        {title}
        {open ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ─── STARS ─────────────────────────────────────────────────────────────────────
function Stars({ rating, size = "text-xs" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar
          key={s}
          className={`${size} ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

// ─── SKELETON CARD ─────────────────────────────────────────────────────────────
function SkeletonCard({ view }) {
  if (view === "list") {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 animate-pulse">
        <div className="w-28 h-28 flex-shrink-0 bg-gray-200 rounded-xl" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-5 bg-gray-200 rounded w-1/3 mt-2" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-8 bg-gray-200 rounded-full mt-3" />
      </div>
    </div>
  );
}

// ─── PRODUCT CARD ──────────────────────────────────────────────────────────────
function ProductCard({ product, view }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [flash, setFlash] = useState(false);

  const cartItems     = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  const pid     = product._id  || product.id;
  const price   = product.price   ?? product.salePrice     ?? 0;
  const mrp     = product.mrp     ?? product.originalPrice ?? price;
  const image   = Array.isArray(product.images) ? product.images[0] : (product.image || "");
  const inStock = product.inStock ?? (product.stock > 0)   ?? true;
  const isHot   = product.isHot   ?? product.tags?.includes?.("hot") ?? false;
  const rating  = product.rating  ?? product.averageRating ?? 0;
  const reviews = product.reviews ?? product.reviewCount   ?? 0;
  const subcat  = product.subCategory || product.subcat    || "";
  const disc    = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const cartItem = cartItems.find((i) => i.id === pid);
  const inCart   = Boolean(cartItem);
  const cartQty  = cartItem?.quantity ?? 0;
  const wished   = wishlistItems.some((i) => i.id === pid);

  const cartProduct = { ...product, id: pid, image, price, mrp, inStock };

  const handleAdd = (e) => {
    e.stopPropagation();
    dispatch(addToCart(cartProduct));
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  };

  // ── use updateItemQty (matches cartSlice export name) ─────────────────────
  const handleInc = (e) => {
    e.stopPropagation();
    dispatch(updateItemQty({ id: pid, quantity: cartQty + 1 }));
  };
  const handleDec = (e) => {
    e.stopPropagation();
    if (cartQty <= 1) return;
    dispatch(updateItemQty({ id: pid, quantity: cartQty - 1 }));
  };

  const handleWishlist = (e) => { e.stopPropagation(); dispatch(toggleWishlist(cartProduct)); };
  const handleNav      = () => navigate(`/product/${pid}`);

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div
        onClick={handleNav}
        className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      >
        <div className="relative w-28 h-28 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
          <img
            src={image} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.src = "https://placehold.co/200x160?text=Product"; }}
          />
          {disc > 0 && (
            <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {disc}%
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] text-blue-500 font-semibold uppercase">{product.category}</span>
              <h3 className="font-bold text-gray-900 text-sm leading-tight mt-0.5">{product.name}</h3>
            </div>
            <button onClick={handleWishlist} className="flex-shrink-0 p-1.5 rounded-full hover:bg-red-50 transition-colors">
              <FiHeart className={`text-base ${wished ? "fill-red-500 text-red-500" : "text-gray-300"}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Stars rating={rating} />
            <span className="text-xs text-gray-400">({reviews})</span>
            {isHot && <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">HOT</span>}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-lg font-black text-gray-900">₹{price}</span>
            {mrp > price && <span className="text-sm text-gray-400 line-through">₹{mrp}</span>}
            {disc > 0    && <span className="text-xs font-bold text-green-600">{disc}% off</span>}
          </div>
          <span className={`text-xs font-bold mt-1 block ${inStock ? "text-green-600" : "text-red-500"}`}>
            {inStock ? "✓ In Stock" : "Out of Stock"}
          </span>
        </div>
        <div className="flex flex-col gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
          {inCart ? (
            <div className="flex items-center border border-blue-200 rounded-full overflow-hidden">
              <button onClick={handleDec} className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100">
                <FiMinus size={11} className="text-blue-600" />
              </button>
              <span className="w-8 text-center text-xs font-black text-blue-700 border-x border-blue-100">{cartQty}</span>
              <button onClick={handleInc} className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100">
                <FiPlus size={11} className="text-blue-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd} disabled={!inStock}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all ${
                flash ? "bg-green-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-400"
              }`}
            >
              <FiShoppingCart className="text-sm" />
              {flash ? "Added!" : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── GRID VIEW ──────────────────────────────────────────────────────────────
  return (
    <div
      onClick={handleNav}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative"
    >
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {disc > 0 && <span className="bg-red-500    text-white text-[10px] font-black px-2 py-0.5 rounded-full">-{disc}%</span>}
        {isHot    && <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">HOT</span>}
        {!inStock && <span className="bg-gray-500   text-white text-[10px] font-black px-2 py-0.5 rounded-full">Out of Stock</span>}
      </div>
      <button
        onClick={handleWishlist}
        className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur p-1.5 rounded-full shadow hover:scale-110 transition-transform"
      >
        <FiHeart className={`text-sm ${wished ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
      </button>
      <div className="h-40 bg-gray-50 overflow-hidden flex items-center justify-center p-3">
        <img
          src={image} alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
          onError={(e) => { e.target.src = "https://placehold.co/200x160?text=Product"; }}
        />
      </div>
      <div className="p-3">
        <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">{subcat}</span>
        <h3 className="font-bold text-gray-900 text-xs md:text-sm leading-tight mt-0.5 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-1.5 mb-2">
          <Stars rating={rating} />
          <span className="text-[11px] text-gray-400">({reviews})</span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-base font-black text-gray-900">₹{price}</span>
          {mrp > price && <span className="text-xs text-gray-400 line-through">₹{mrp}</span>}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          {inCart ? (
            <div className="flex items-center justify-between bg-blue-50 rounded-full border border-blue-100 overflow-hidden">
              <button onClick={handleDec} className="w-9 h-9 flex items-center justify-center hover:bg-blue-100 transition-colors">
                <FiMinus size={12} className="text-blue-600" />
              </button>
              <span className="text-sm font-black text-blue-700">{cartQty} in cart</span>
              <button onClick={handleInc} className="w-9 h-9 flex items-center justify-center hover:bg-blue-100 transition-colors">
                <FiPlus size={12} className="text-blue-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd} disabled={!inStock}
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-black transition-all ${
                flash
                  ? "bg-green-500 text-white scale-95"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow hover:shadow-blue-500/20 disabled:bg-gray-100 disabled:text-gray-400"
              }`}
            >
              <FiShoppingCart className="text-sm" />
              {flash ? "Added!" : inStock ? "Add to Cart" : "Out of Stock"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN CATALOG ──────────────────────────────────────────────────────────────
export default function Collection() {
  const { category = "" } = useParams();
  const dispatch          = useDispatch();

  // ── Category data from Redux ───────────────────────────────────────────────
  const categoryNames  = useSelector(selectCategoryNames);
  const categoryStatus = useSelector(selectCategoryStatus);
  const catLoading     = categoryStatus === "loading" || categoryStatus === "idle";

  // ── Fetch category tree once on mount ──────────────────────────────────────
  useEffect(() => {
    if (categoryStatus === "idle") {
      dispatch(fetchCategoryTree());
    }
  }, [dispatch, categoryStatus]);

  // ── Resolve initial category: URL param → first in tree → "" ──────────────
  const resolveCategory = useCallback(
    (urlCat) => {
      if (categoryNames.includes(urlCat)) return urlCat;
      return categoryNames[0] ?? urlCat ?? "";
    },
    [categoryNames]
  );

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [search,            setSearch]            = useState("");
  const [selectedCategory,  setSelectedCategory]  = useState(() => resolveCategory(category));
  const [selectedSubcat,    setSelectedSubcat]    = useState("All");
  const [selectedBrands,    setSelectedBrands]    = useState([]);
  const [priceMin,          setPriceMin]          = useState(0);
  const [priceMax,          setPriceMax]          = useState(500);
  const [minRating,         setMinRating]         = useState(0);
  const [inStockOnly,       setInStockOnly]       = useState(false);
  const [hotOnly,           setHotOnly]           = useState(false);
  const [sortBy,            setSortBy]            = useState("popularity");
  const [perPage,           setPerPage]           = useState(12);
  const [page,              setPage]              = useState(1);
  const [view,              setView]              = useState("grid");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── API state ──────────────────────────────────────────────────────────────
  const [products,   setProducts]   = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  // ── Sub-categories for the currently selected category ─────────────────────
  const rawSubcats  = useSelector(selectSubCategories(selectedCategory));
  const subcatNames = ["All", ...rawSubcats.filter((s) => s.isActive !== false).map((s) => s.name)];

  // ── Sync when category tree finishes loading ───────────────────────────────
  useEffect(() => {
    if (categoryStatus === "succeeded" && categoryNames.length > 0) {
      const resolved = resolveCategory(category);
      setSelectedCategory(resolved);
      setSelectedSubcat("All");
      setPage(1);
    }
  }, [categoryStatus, categoryNames, category, resolveCategory]);

  // ── Sync when URL :category param changes ─────────────────────────────────
  useEffect(() => {
    if (categoryStatus === "succeeded") {
      const resolved = resolveCategory(category);
      setSelectedCategory(resolved);
      setSelectedSubcat("All");
      setPage(1);
    }
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Active filter count ────────────────────────────────────────────────────
  const activeFiltersCount = [
    selectedBrands.length > 0,
    priceMin > 0 || priceMax < 500,
    minRating > 0,
    inStockOnly,
    hotOnly,
    selectedSubcat !== "All",
  ].filter(Boolean).length;

  // ── Build API query string ─────────────────────────────────────────────────
  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (selectedCategory) p.set("category", selectedCategory);
    p.set("page",  page);
    p.set("limit", perPage);
    if (selectedSubcat !== "All") p.set("subCategory", selectedSubcat);
    if (search)                   p.set("search",      search);
    if (priceMin > 0)             p.set("minPrice",    priceMin);
    if (priceMax < 500)           p.set("maxPrice",    priceMax);
    if (minRating > 0)            p.set("minRating",   minRating);
    if (inStockOnly)              p.set("inStock",     "true");
    if (hotOnly)                  p.set("tags",        "hot");
    if (selectedBrands.length)    p.set("brand",       selectedBrands.join(","));
    const sortMap = {
      price_asc:  "price_asc",
      price_desc: "price_desc",
      rating:     "rating_desc",
      newest:     "newest",
      discount:   "discount",
    };
    p.set("sort", sortMap[sortBy] || "popularity");
    return p.toString();
  }, [selectedCategory, selectedSubcat, search, priceMin, priceMax, minRating, inStockOnly, hotOnly, selectedBrands, sortBy, page, perPage]);

  // ── Fetch products ─────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    if (!selectedCategory) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/product/list?${buildQuery()}`);
      if (data.success) {
        const normalised = (data.products || []).map((p) => ({ ...p, id: p._id || p.id }));
        setProducts(normalised);
        setTotalCount(data.total ?? data.totalCount ?? normalised.length);
      } else {
        setError(data.message || "Failed to load products.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [buildQuery, selectedCategory]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const totalPages = Math.ceil(totalCount / perPage);

  const toggleBrand  = (b) => {
    setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);
    setPage(1);
  };
  const resetFilters = () => {
    setSearch(""); setSelectedSubcat("All"); setSelectedBrands([]);
    setPriceMin(0); setPriceMax(500); setMinRating(0);
    setInStockOnly(false); setHotOnly(false); setPage(1);
  };

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="w-full space-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
          <FiSliders className="text-blue-600" /> Filters
          {activeFiltersCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
          )}
        </h3>
        {activeFiltersCount > 0 && (
          <button onClick={resetFilters} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1">
            <FiX size={12} /> Reset
          </button>
        )}
      </div>

      {/* ── Categories from API ── */}
      <FilterSection title="Categories">
        {catLoading ? (
          <div className="space-y-2">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="h-7 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : categoryNames.length === 0 ? (
          <p className="text-xs text-gray-400 px-3">No categories found.</p>
        ) : (
          <div className="space-y-1">
            {categoryNames.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setSelectedSubcat("All"); setPage(1); }}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                  selectedCategory === cat
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>{cat}</span>
                {selectedCategory === cat && <FiChevronDown className="text-blue-500 text-xs" />}
              </button>
            ))}
          </div>
        )}
      </FilterSection>

      {/* ── Sub-categories ── */}
      {subcatNames.length > 1 && (
        <FilterSection title="Sub-Category">
          {catLoading ? (
            <div className="flex flex-wrap gap-2">
              {[1,2,3].map((i) => <div key={i} className="h-7 w-24 bg-gray-100 rounded-full animate-pulse" />)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subcatNames.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSelectedSubcat(s); setPage(1); }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    selectedSubcat === s
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </FilterSection>
      )}

      {/* ── Price Range ── */}
      <FilterSection title="Price Range">
        <div className="px-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-gray-700">₹{priceMin}</div>
            <span className="text-gray-400 text-xs">–</span>
            <div className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-gray-700">₹{priceMax}</div>
          </div>
          <input type="range" min={0} max={500} value={priceMin} onChange={(e) => { setPriceMin(+e.target.value); setPage(1); }} className="w-full accent-blue-600 mb-2" />
          <input type="range" min={0} max={500} value={priceMax} onChange={(e) => { setPriceMax(+e.target.value); setPage(1); }} className="w-full accent-blue-600" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>₹0</span><span>₹500+</span></div>
        </div>
      </FilterSection>

      {/* ── Min Rating ── */}
      <FilterSection title="Min. Rating">
        <div className="space-y-1.5">
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => { setMinRating(minRating === r ? 0 : r); setPage(1); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                minRating === r ? "bg-yellow-50 border border-yellow-300" : "hover:bg-gray-50"
              }`}
            >
              <Stars rating={r} />
              <span className="text-gray-600 text-xs">& above</span>
              {minRating === r && <FiCheck className="ml-auto text-yellow-500 text-xs" />}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* ── Brand ── */}
      <FilterSection title="Brand" defaultOpen={false}>
        {BRANDS.map((b) => (
          <label key={b} className="flex items-center gap-2 py-1 cursor-pointer group">
            <div
              onClick={() => toggleBrand(b)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedBrands.includes(b) ? "bg-blue-600 border-blue-600" : "border-gray-300 group-hover:border-blue-400"
              }`}
            >
              {selectedBrands.includes(b) && <FiCheck className="text-white text-[10px]" />}
            </div>
            <span className="text-sm text-gray-600">{b}</span>
          </label>
        ))}
      </FilterSection>

      {/* ── Availability ── */}
      <FilterSection title="Availability">
        {[
          [inStockOnly, () => { setInStockOnly(!inStockOnly); setPage(1); }, "bg-green-600 border-green-600",   "In Stock Only"],
          [hotOnly,     () => { setHotOnly(!hotOnly); setPage(1); },         "bg-orange-500 border-orange-500", "🔥 Hot Deals Only"],
        ].map(([val, fn, cls, label]) => (
          <label key={label} className="flex items-center gap-2 py-1 cursor-pointer">
            <div
              onClick={fn}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${val ? cls : "border-gray-300"}`}
            >
              {val && <FiCheck className="text-white text-[10px]" />}
            </div>
            <span className="text-sm text-gray-600">{label}</span>
          </label>
        ))}
      </FilterSection>
    </aside>
  );

  // ── Product grid / list renderer ───────────────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <div className={view === "grid" ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4" : "space-y-3"}>
          {Array.from({ length: perPage }).map((_, i) => <SkeletonCard key={i} view={view} />)}
        </div>
      );
    }
    if (error) {
      return (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-black text-gray-700 mb-2">Failed to Load Products</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchProducts}
            className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <FiRefreshCw /> Try Again
          </button>
        </div>
      );
    }
    if (!products.length) {
      return (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-black text-gray-700 mb-2">No Products Found</h3>
          <p className="text-gray-400 mb-6">Try adjusting your filters or search term.</p>
          <button onClick={resetFilters} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors">
            Reset Filters
          </button>
        </div>
      );
    }
    return (
      <div className={view === "grid" ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4" : "space-y-3"}>
        {products.map((p) => <ProductCard key={p.id} product={p} view={view} />)}
      </div>
    );
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <span>›</span>
          {catLoading
            ? <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            : <span className="text-gray-800 font-semibold">{selectedCategory}</span>}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 md:px-4 py-6 flex gap-6">

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-20"><Sidebar /></div>
        </div>

        {/* Mobile Sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
            <div className="relative bg-white w-80 max-w-[85vw] h-full overflow-y-auto p-5 shadow-2xl">
              <button onClick={() => setMobileSidebarOpen(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100">
                <FiX className="text-gray-600" />
              </button>
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="bg-white rounded-2xl shadow-sm p-3 md:p-4 mb-4">
            <div className="flex gap-3 mb-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder={`Search in ${selectedCategory || "products"}...`}
                  className="w-full border-2 border-gray-100 focus:border-blue-400 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <FiX size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold"
              >
                <FiFilter /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-none bg-white cursor-pointer"
                >
                  <option value="popularity">Sort: Popularity</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="newest">Newest First</option>
                  <option value="discount">Biggest Discount</option>
                </select>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="hidden sm:inline">Show:</span>
                  {PER_PAGE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => { setPerPage(n); setPage(1); }}
                      className={`px-2 py-1 rounded-lg transition-colors ${perPage === n ? "bg-blue-600 text-white font-bold" : "hover:bg-gray-100 text-gray-600"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!loading && totalCount > 0 && (
                  <span className="text-xs text-gray-500 hidden sm:block">
                    Showing {Math.min((page - 1) * perPage + 1, totalCount)}–{Math.min(page * perPage, totalCount)} of <strong>{totalCount}</strong>
                  </span>
                )}
                <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-50"}`}><FiGrid size={14} /></button>
                  <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-50"}`}><FiList size={14} /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedSubcat !== "All" && (
                <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                  {selectedSubcat}<button onClick={() => setSelectedSubcat("All")}><FiX size={11} /></button>
                </span>
              )}
              {(priceMin > 0 || priceMax < 500) && (
                <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                  ₹{priceMin}–₹{priceMax}<button onClick={() => { setPriceMin(0); setPriceMax(500); }}><FiX size={11} /></button>
                </span>
              )}
              {minRating > 0 && (
                <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
                  {minRating}★ & above<button onClick={() => setMinRating(0)}><FiX size={11} /></button>
                </span>
              )}
              {inStockOnly && (
                <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                  In Stock<button onClick={() => setInStockOnly(false)}><FiX size={11} /></button>
                </span>
              )}
              {hotOnly && (
                <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
                  🔥 Hot<button onClick={() => setHotOnly(false)}><FiX size={11} /></button>
                </span>
              )}
              <button onClick={resetFilters} className="text-xs text-red-500 font-bold hover:underline px-2">Clear All</button>
            </div>
          )}

          {/* Page title */}
          <h1 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-2">
            {catLoading
              ? <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
              : selectedCategory}
            {!loading && !catLoading && totalCount > 0 && (
              <span className="text-base font-normal text-gray-400">({totalCount} products)</span>
            )}
          </h1>

          {renderContent()}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="bg-white rounded-2xl shadow-sm p-4 mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-gray-500">Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">«</button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">‹ Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                  .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i - 1] > 1) acc.push("..."); acc.push(n); return acc; }, [])
                  .map((item, i) =>
                    item === "..." ? (
                      <span key={`e${i}`} className="px-2 text-gray-400 text-xs">…</span>
                    ) : (
                      <button
                        key={item} onClick={() => setPage(item)}
                        className={`w-8 h-8 text-xs rounded-lg font-bold transition-all ${
                          page === item ? "bg-blue-600 text-white shadow" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next ›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">»</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}