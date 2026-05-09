// src/pages/MyOrders.jsx  —  Route: /orders
//
// ✅ Features:
//   - Search by order number, product name, or city
//   - Filter tabs: All | Active | Delivered | Cancelled
//   - Client-side pagination (10 per page)
//   - PDF report download (delivered orders only) via OrderReport component
//   - Field mapping: order.grandTotal, order.billing, order.payment (object),
//     order.createdAt (ISO), order.status (lowercase), order.items[].mrp

import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate }                     from "react-router-dom";
import { useDispatch, useSelector }              from "react-redux";
import {
  FiPackage, FiChevronRight, FiAlertCircle,
  FiClock, FiCheck, FiX, FiTruck, FiRefreshCw,
  FiShoppingBag, FiFilter, FiSearch, FiDownload,
  FiChevronLeft, FiFileText, FiXCircle,
} from "react-icons/fi";
import {
  fetchMyOrders,
  selectMyOrders,
  selectLoadingOrders,
  selectOrdersError,
} from "../app/orderDetailsSlice";
import { selectIsLoggedIn } from "../app/authSlice";
import OrderReport          from "../components/OrderReport";

// ─── Constants ────────────────────────────────────────────────────────────────
const ORDERS_PER_PAGE = 10;

const STATUS_META = {
  placed:     { label: "Order Placed",     color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500",    Icon: FiPackage   },
  confirmed:  { label: "Confirmed",        color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500",  Icon: FiCheck     },
  processing: { label: "Processing",       color: "bg-amber-100 text-amber-700",   dot: "bg-amber-500",   Icon: FiRefreshCw },
  shipped:    { label: "Out for Delivery", color: "bg-purple-100 text-purple-700", dot: "bg-purple-500",  Icon: FiTruck     },
  delivered:  { label: "Delivered",        color: "bg-green-100 text-green-700",   dot: "bg-green-500",   Icon: FiCheck     },
  cancelled:  { label: "Cancelled",        color: "bg-red-100 text-red-700",       dot: "bg-red-500",     Icon: FiX         },
  refunded:   { label: "Refunded",         color: "bg-gray-100 text-gray-600",     dot: "bg-gray-400",    Icon: FiRefreshCw },
};
const DEFAULT_STATUS = { label: "Placed", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400", Icon: FiPackage };

const FILTER_TABS = [
  { value: "",                                    label: "All",       count: null },
  { value: "placed,confirmed,processing,shipped", label: "Active",    count: null },
  { value: "delivered",                           label: "Delivered", count: null },
  { value: "cancelled,refunded",                  label: "Cancelled", count: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate  = (d) => d
  ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  : "—";
const fmtPrice = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// ─── OrderCard ────────────────────────────────────────────────────────────────
function OrderCard({ order, onDownloadReport }) {
  const meta        = STATUS_META[order.status] ?? DEFAULT_STATUS;
  const StatusIcon  = meta.Icon;
  const totalItems  = order.items?.reduce((s, i) => s + (i.quantity ?? 1), 0) ?? 0;
  const isPaid      = order.payment?.status === "paid";
  const isCOD       = order.payment?.method === "cod";
  const isDelivered = order.status === "delivered";

  const payLabel = isCOD
    ? (isPaid ? "COD · Paid" : "Cash on Delivery")
    : (isPaid ? "Online · Paid" : "Payment Pending");
  const payColor = isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 overflow-hidden group">
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 bg-gray-50/80 group-hover:bg-blue-50/60 transition-colors">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
          <span className="text-xs font-black text-gray-700 tracking-tight">#{order.orderNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${payColor}`}>{payLabel}</span>
          {isDelivered && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDownloadReport(order); }}
              title="Download Invoice PDF"
              className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
            >
              <FiDownload size={9} /> Invoice
            </button>
          )}
        </div>
      </div>

      {/* Card Body — clicking navigates to detail */}
      <Link to={`/orders/${order.orderNumber}`} className="block p-5">
        <div className="flex items-start gap-4">
          {/* Thumbnails */}
          <div className="flex -space-x-2 flex-shrink-0">
            {order.items?.slice(0, 3).map((item, idx) => (
              <div key={idx}
                style={{ zIndex: 3 - idx }}
                className="w-12 h-12 rounded-xl bg-gray-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center p-1">
                <img
                  src={item.image || "https://placehold.co/48x48?text=📦"}
                  alt={item.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => { e.target.src = "https://placehold.co/48x48?text=📦"; }}
                />
              </div>
            ))}
            {order.items?.length > 3 && (
              <div className="w-12 h-12 rounded-xl bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-gray-500">
                +{order.items.length - 3}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900 truncate leading-snug">
              {order.items?.[0]?.name ?? "Order"}
              {order.items?.length > 1 && (
                <span className="text-gray-400 font-semibold text-xs"> +{order.items.length - 1} more</span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalItems} item{totalItems !== 1 ? "s" : ""} ·{" "}
              <span className="font-bold text-gray-600">{fmtPrice(order.grandTotal)}</span>
            </p>
            {order.savedAmount > 0 && (
              <p className="text-[10px] text-green-600 font-bold mt-0.5">
                🎉 Saved {fmtPrice(order.savedAmount)}
              </p>
            )}
            {/* Delivery address city */}
            {order.billing?.city && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                📍 {order.billing.city}{order.billing.state ? `, ${order.billing.state}` : ""}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${meta.color}`}>
                <StatusIcon size={9} />
                {meta.label}
              </span>
            </div>
          </div>

          {/* Price + date */}
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-black text-gray-900">{fmtPrice(order.grandTotal)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 justify-end">
              <FiClock size={9} /> {fmtDate(order.createdAt)}
            </p>
            <FiChevronRight className="text-gray-300 group-hover:text-blue-400 transition-colors ml-auto mt-2" size={14} />
          </div>
        </div>

        {/* Est. delivery banner */}
        {order.estimatedDelivery && !["delivered","cancelled","refunded"].includes(order.status) && (
          <div className="mt-3 flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-1.5">
            <FiTruck className="text-blue-400 flex-shrink-0" size={11} />
            <p className="text-[10px] text-blue-700 font-semibold">
              Est. delivery by{" "}
              <span className="font-black">
                {new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            </p>
          </div>
        )}

        {/* Razorpay pending warning */}
        {order.payment?.method === "razorpay" && order.payment?.status !== "paid" && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
            <FiAlertCircle className="text-red-400 flex-shrink-0" size={11} />
            <p className="text-[10px] text-red-600 font-semibold">Payment pending — tap to complete</p>
          </div>
        )}

        {/* Tracking number */}
        {order.tracking?.trackingId && order.status === "shipped" && (
          <div className="mt-3 flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-1.5">
            <FiTruck className="text-purple-400 flex-shrink-0" size={11} />
            <p className="text-[10px] text-purple-700 font-semibold">
              Tracking: <span className="font-black font-mono">{order.tracking.trackingId}</span>
            </p>
          </div>
        )}
      </Link>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function OrderSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="px-5 py-3 border-b border-gray-50 bg-gray-50 flex justify-between items-center">
        <div className="h-3 w-32 bg-gray-200 rounded-full" />
        <div className="h-3 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="p-5 flex items-start gap-4">
        <div className="flex -space-x-2">
          {[0,1,2].map((i) => <div key={i} className="w-12 h-12 rounded-xl bg-gray-200 border-2 border-white" />)}
        </div>
        <div className="flex-1 space-y-2.5">
          <div className="h-3 w-48 bg-gray-200 rounded-full" />
          <div className="h-2.5 w-24 bg-gray-200 rounded-full" />
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-14 bg-gray-200 rounded-full ml-auto" />
          <div className="h-2.5 w-20 bg-gray-200 rounded-full ml-auto" />
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);

  // Show max 5 page buttons with ellipsis logic
  const getVisible = () => {
    if (total <= 5) return pages;
    if (current <= 3) return [...pages.slice(0, 5), "…", total];
    if (current >= total - 2) return [1, "…", ...pages.slice(total - 5)];
    return [1, "…", current - 1, current, current + 1, "…", total];
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <FiChevronLeft size={15} />
      </button>

      {getVisible().map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
              p === current
                ? "bg-blue-600 text-white shadow-sm shadow-blue-200 border border-blue-600"
                : "border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <FiChevronRight size={15} />
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MyOrders() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();

  const isLoggedIn = useSelector(selectIsLoggedIn);
  const orders     = useSelector(selectMyOrders);
  const loading    = useSelector(selectLoadingOrders);
  const error      = useSelector(selectOrdersError);

  const [activeFilter,   setActiveFilter]   = useState("");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [currentPage,    setCurrentPage]    = useState(1);
  const [reportOrder,    setReportOrder]    = useState(null);   // order to render PDF for
  const searchRef = useRef(null);

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn) navigate("/login", { state: { from: "/orders" } });
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (isLoggedIn) dispatch(fetchMyOrders());
  }, [isLoggedIn, dispatch]);

  // Reset to page 1 whenever filter or search changes
  useEffect(() => { setCurrentPage(1); }, [activeFilter, searchQuery]);

  if (!isLoggedIn) return null;

  // ── Count badges per tab ─────────────────────────────────────────────────
  const tabCounts = useMemo(() => ({
    "":                                    orders.length,
    "placed,confirmed,processing,shipped": orders.filter((o) => ["placed","confirmed","processing","shipped"].includes(o.status)).length,
    "delivered":                           orders.filter((o) => o.status === "delivered").length,
    "cancelled,refunded":                  orders.filter((o) => ["cancelled","refunded"].includes(o.status)).length,
  }), [orders]);

  // ── Filter + search pipeline ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (activeFilter) {
      const statuses = activeFilter.split(",");
      result = result.filter((o) => statuses.includes(o.status));
    }

    // Search: order number, product names, billing city/name
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((o) =>
        (o.orderNumber ?? "").toLowerCase().includes(q) ||
        (o.items ?? []).some((i) => i.name?.toLowerCase().includes(q)) ||
        (o.billing?.city ?? "").toLowerCase().includes(q) ||
        (o.billing?.firstName ?? "").toLowerCase().includes(q) ||
        (o.billing?.lastName  ?? "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, activeFilter, searchQuery]);

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages   = Math.max(1, Math.ceil(filtered.length / ORDERS_PER_PAGE));
  const safePage     = Math.min(currentPage, totalPages);
  const paginated    = filtered.slice((safePage - 1) * ORDERS_PER_PAGE, safePage * ORDERS_PER_PAGE);

  const handlePageChange = (p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Error ───────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-red-500" size={28} />
        </div>
        <h2 className="text-lg font-black text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => dispatch(fetchMyOrders())}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors"
        >
          <FiRefreshCw size={14} /> Try Again
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* PDF Report Modal */}
      {reportOrder && (
        <OrderReport
          order={reportOrder}
          onClose={() => setReportOrder(null)}
        />
      )}

      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-[860px] mx-auto flex items-center gap-1.5 text-sm text-gray-400">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <FiChevronRight size={12} />
            <span className="text-gray-700 font-semibold">My Orders</span>
          </div>
        </div>

        <div className="max-w-[860px] mx-auto px-4 py-6">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-black text-gray-900">My Orders</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {loading
                  ? "Loading…"
                  : `${filtered.length} order${filtered.length !== 1 ? "s" : ""}${searchQuery ? ` matching "${searchQuery}"` : ""}`}
              </p>
            </div>
            <button
              onClick={() => dispatch(fetchMyOrders())}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-100 px-3 py-2 rounded-xl transition-all"
            >
              <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {/* ── Search Bar ───────────────────────────────────────────────── */}
          <div className="relative mb-4">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, product name, or city…"
              className="w-full bg-white border-2 border-gray-200 focus:border-blue-400 rounded-2xl pl-10 pr-10 py-3 text-sm outline-none transition-all placeholder-gray-300 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <FiXCircle size={15} />
              </button>
            )}
          </div>

          {/* ── Filter Tabs ───────────────────────────────────────────────── */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            {FILTER_TABS.map((tab) => {
              const count = tabCounts[tab.value] ?? 0;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveFilter(tab.value)}
                  className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all ${
                    activeFilter === tab.value
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    activeFilter === tab.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* "Delivered orders can download invoice" hint */}
            {tabCounts["delivered"] > 0 && (
              <div className="flex-shrink-0 flex items-center gap-1.5 text-[10px] text-gray-400 ml-auto pl-2">
                <FiFileText size={10} />
                <span>Delivered orders have invoice</span>
              </div>
            )}
          </div>

          {/* ── Summary Stats Row ─────────────────────────────────────────── */}
          {!loading && orders.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: "Total Orders",   value: orders.length,                    color: "text-gray-900"   },
                { label: "Active",         value: tabCounts["placed,confirmed,processing,shipped"], color: "text-blue-600" },
                { label: "Delivered",      value: tabCounts["delivered"],            color: "text-green-600"  },
                { label: "Cancelled",      value: tabCounts["cancelled,refunded"],   color: "text-red-500"    },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-3 text-center">
                  <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Order List ────────────────────────────────────────────────── */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <OrderSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="text-5xl mb-4">
                {searchQuery ? "🔍" : "📦"}
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">
                {searchQuery ? "No results found" : activeFilter ? "No orders here" : "No Orders Yet"}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {searchQuery
                  ? `No orders match "${searchQuery}". Try a different search.`
                  : activeFilter
                  ? "Try a different filter."
                  : "You haven't placed any orders yet. Start shopping!"}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {(searchQuery || activeFilter) && (
                  <button
                    onClick={() => { setSearchQuery(""); setActiveFilter(""); }}
                    className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-full font-bold text-sm transition-colors"
                  >
                    <FiFilter size={14} /> Clear Filters
                  </button>
                )}
                <Link
                  to="/collection"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors"
                >
                  <FiShoppingBag size={15} /> Shop Now
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginated.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onDownloadReport={setReportOrder}
                  />
                ))}
              </div>

              {/* Pagination info */}
              {filtered.length > ORDERS_PER_PAGE && (
                <p className="text-center text-xs text-gray-400 mt-4">
                  Showing {(safePage - 1) * ORDERS_PER_PAGE + 1}–{Math.min(safePage * ORDERS_PER_PAGE, filtered.length)} of {filtered.length} orders
                </p>
              )}

              <Pagination
                current={safePage}
                total={totalPages}
                onChange={handlePageChange}
              />
            </>
          )}

          {/* Continue Shopping */}
          {!loading && filtered.length > 0 && (
            <div className="mt-8 text-center">
              <Link
                to="/collection"
                className="inline-flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-8 py-3 rounded-full font-bold text-sm transition-all"
              >
                <FiShoppingBag size={15} /> Continue Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}