import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiTag,
  FiTruck, FiShield, FiRotateCcw, FiChevronRight,
  FiCheck, FiX, FiPackage, FiAlertCircle, FiGift,
  FiArrowLeft, FiInfo,
} from "react-icons/fi";

import {
  loadCart,
  removeItem,
  updateItemQty,
  clearAll,
  saveCoupon,
} from "../app/cartSlice";

import api from "../../utils/api";

// ─── GST CONFIGURATION ───────────────────────────────────────────────
const GST_INCLUSIVE    = false;
const DEFAULT_GST_RATE = 18;

const getGstRate    = (item) => item.gstRate ?? item.taxRate ?? DEFAULT_GST_RATE;
const getBasePrice  = (item) => {
  const raw = item.price ?? item.salePrice ?? 0;
  if (GST_INCLUSIVE) {
    const rate = getGstRate(item);
    return Math.round((raw / (1 + rate / 100)) * 100) / 100;
  }
  return raw;
};
const getPriceWithGst = (item) => {
  const base = getBasePrice(item);
  const rate = getGstRate(item);
  return Math.round(base * (1 + rate / 100) * 100) / 100;
};
const getGstAmount = (item) =>
  Math.round((getPriceWithGst(item) - getBasePrice(item)) * 100) / 100;

// ─── TRUST BADGE ─────────────────────────────────────────────────────
function TrustBadge({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── GST BADGE ───────────────────────────────────────────────────────
function GstBadge({ rate }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-50 text-amber-600 font-bold px-1.5 py-0.5 rounded-full border border-amber-100">
      GST {rate}%
    </span>
  );
}

// ─── CART ITEM ROW ───────────────────────────────────────────────────
function CartItem({ item, onQtyChange, onRemove }) {
  const qty       = item.quantity ?? item.qty ?? 1;
  const basePrice = getBasePrice(item);
  const priceGst  = getPriceWithGst(item);
  const gstAmt    = getGstAmount(item);
  const gstRate   = getGstRate(item);
  const mrp       = item.mrp ?? item.originalPrice ?? priceGst;
  // FIX: guard against empty string / null / undefined image
  const rawImage  = Array.isArray(item.images) ? item.images[0] : (item.image ?? null);
  const image     = rawImage || null; // null → don't render src at all
  const subcat    = item.subCategory || item.subcat || "";
  const disc      = mrp > priceGst ? Math.round(((mrp - priceGst) / mrp) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 transition-all duration-200">
      <Link to={`/product/${item.id}`} className="flex-shrink-0">
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center p-2">
          {/* FIX: only render <img> when src is a non-empty string */}
          {image ? (
            <img
              src={image}
              alt={item.name}
              className="max-w-full max-h-full object-contain"
              onError={(e) => { e.target.src = "https://placehold.co/120x120?text=Product"; }}
            />
          ) : (
            <img
              src="https://placehold.co/120x120?text=Product"
              alt={item.name}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
        <div>
          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-0.5">{subcat}</p>
          <Link to={`/product/${item.id}`}>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug hover:text-blue-600 transition-colors line-clamp-2">
              {item.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {disc > 0 && (
              <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                {disc}% OFF
              </span>
            )}
            <GstBadge rate={gstRate} />
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-black text-gray-900">₹{priceGst.toFixed(2)}</span>
              {mrp > priceGst && (
                <span className="text-xs text-gray-400 line-through">₹{mrp}</span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5">
              ₹{basePrice.toFixed(2)} + ₹{gstAmt.toFixed(2)} GST
            </span>
          </div>

          <div className="flex items-stretch border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => onQtyChange(item.id, qty - 1)} disabled={qty <= 1}
              className="w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-30 transition-colors active:bg-gray-200">
              <FiMinus size={12} />
            </button>
            <span className="w-10 h-9 flex items-center justify-center text-sm font-black text-gray-900 border-x border-gray-200 bg-white">
              {qty}
            </span>
            <button onClick={() => onQtyChange(item.id, qty + 1)} disabled={qty >= 10}
              className="w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-30 transition-colors active:bg-gray-200">
              <FiPlus size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between flex-shrink-0">
        <button onClick={() => onRemove(item.id)}
          className="p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all" title="Remove">
          <FiTrash2 size={15} />
        </button>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 mb-0.5">Subtotal</p>
          <p className="text-base font-black text-gray-900">₹{(priceGst * qty).toFixed(2)}</p>
          <p className="text-[9px] text-gray-400">incl. GST</p>
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY CART ──────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-12 sm:p-16 text-center">
      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <FiShoppingCart className="text-4xl text-blue-300" />
      </div>
      <h2 className="text-2xl font-black text-gray-800 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
        Looks like you haven't added anything yet. Explore our products and start building!
      </p>
      <Link to="/collection/VOLTMETER"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-colors shadow-lg shadow-blue-100 text-sm">
        <FiPackage size={16} /> Browse Products
      </Link>
    </div>
  );
}

// ─── MAIN CART PAGE ──────────────────────────────────────────────────
export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items: cartItems, loading, coupon: reduxCoupon } =
    useSelector((state) => state.cart);

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponCode,       setCouponCode]       = useState("");
  const [couponError,      setCouponError]      = useState("");
  const [couponSuccess,    setCouponSuccess]    = useState("");
  const [applying,         setApplying]         = useState(false);
  const [showGstBreakdown, setShowGstBreakdown] = useState(false);

  const appliedCoupon = reduxCoupon ?? null;

  const [deliveryInfo, setDeliveryInfo] = useState({
    charge: 0, freeAbove: 499, freeDelivery: false, amountToFreeDelivery: 0,
    estimatedDaysMin: 4, estimatedDaysMax: 7, method: "standard", loading: false,
  });

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // ─── TOTALS ───────────────────────────────────────────────────────
  const { totalItems, subtotal, mrpTotal, savedOnMrp, totalGst, totalBase } = useMemo(() => {
    const totals = cartItems.reduce(
      (acc, i) => {
        const q    = i.quantity ?? i.qty ?? 1;
        const gstP = getPriceWithGst(i);
        const base = getBasePrice(i);
        const mrp  = i.mrp ?? i.originalPrice ?? gstP;
        acc.totalItems += q;
        acc.subtotal   += gstP * q;
        acc.mrpTotal   += mrp  * q;
        acc.totalBase  += base * q;
        acc.totalGst   += (gstP - base) * q;
        return acc;
      },
      { totalItems: 0, subtotal: 0, mrpTotal: 0, totalBase: 0, totalGst: 0 }
    );
    totals.savedOnMrp = totals.mrpTotal - totals.subtotal;
    return totals;
  }, [cartItems]);

  // ─── COUPON DISCOUNT ─────────────────────────────────────────────
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || subtotal === 0) return 0;
    const { type, value, maxDiscount } = appliedCoupon;
    let d = type === "percent"
      ? Math.round((subtotal * (value ?? 0)) / 100)
      : (value ?? 0);
    if (maxDiscount) d = Math.min(d, maxDiscount);
    return Math.min(d, subtotal);
  }, [appliedCoupon, subtotal]);

  // ─── LIVE DELIVERY ────────────────────────────────────────────────
  const liveDelivery = useMemo(() => {
    if (cartItems.length === 0) return { charge: 0, freeDelivery: false, amountToFreeDelivery: 0 };
    if (subtotal >= deliveryInfo.freeAbove) return { charge: 0, freeDelivery: true, amountToFreeDelivery: 0 };
    return {
      charge: deliveryInfo.charge > 0 ? deliveryInfo.charge : 49,
      freeDelivery: false,
      amountToFreeDelivery: Math.max(deliveryInfo.freeAbove - subtotal, 0),
    };
  }, [subtotal, cartItems.length, deliveryInfo.freeAbove, deliveryInfo.charge]);

  // ─── GRAND TOTAL ──────────────────────────────────────────────────
  const grandTotal  = Math.max(subtotal + liveDelivery.charge - couponDiscount, 0);
  const totalSaving = (savedOnMrp > 0 ? savedOnMrp : 0) + couponDiscount;

  // ── Load cart on mount ──
  useEffect(() => { dispatch(loadCart()); }, [dispatch]);

  // ── Fetch public coupons ──
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/api/coupons/public");
        if (alive && data.success) setAvailableCoupons(data.coupons || []);
      } catch (err) { console.error("Failed to load coupons:", err); }
    })();
    return () => { alive = false; };
  }, []);

  // ── Delivery debounce ──
  const deliveryTimer = useRef(null);
  useEffect(() => {
    if (cartItems.length === 0) return;
    clearTimeout(deliveryTimer.current);
    setDeliveryInfo((d) => ({ ...d, loading: true }));
    deliveryTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.post("/api/delivery/calculate", { subtotal, method: "standard" });
        if (!data.success) return;
        setDeliveryInfo({
          charge: data.charge,
          freeAbove: data.rule.freeAbove,
          freeDelivery: data.freeDelivery,
          amountToFreeDelivery: data.amountToFreeDelivery,
          estimatedDaysMin: data.estimatedDaysMin,
          estimatedDaysMax: data.estimatedDaysMax,
          method: data.rule.method,
          loading: false,
        });
      } catch { setDeliveryInfo((d) => ({ ...d, loading: false })); }
    }, 400);
    return () => clearTimeout(deliveryTimer.current);
  }, [subtotal, cartItems.length]);

  // ── Re-validate applied coupon whenever subtotal changes ──────────
  // FIX: Added `appliedCoupon` to deps and guard at the TOP of the effect
  // (not just inside setTimeout) so the API call is NEVER made when there
  // is no coupon. Previously the guard was only checked after the 500ms
  // timer fired, but the effect still ran on mount (causing the 400 error).
  const couponTimer = useRef(null);
  const appliedCouponCode = appliedCoupon?.code ?? null; // stable primitive for dep array
  useEffect(() => {
    // Guard: bail out immediately if no coupon is applied or cart is empty.
    // This is the fix for the 400 Bad Request — the old code only guarded
    // inside the setTimeout callback, so the effect still fired on mount
    // with an empty/undefined code, producing a 400 from the backend.
    if (!appliedCouponCode || subtotal === 0) return;

    clearTimeout(couponTimer.current);
    couponTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.post("/api/coupons/apply", {
          code: appliedCouponCode,
          subtotal,
        });
        if (!data.success) {
          dispatch(saveCoupon(null));
          setCouponError(data.message);
        } else {
          dispatch(saveCoupon({ ...data.coupon, discount: data.discount }));
        }
      } catch {
        // Ignore network errors silently — don't invalidate the coupon
        // just because of a temporary connectivity issue
      }
    }, 500);
    return () => clearTimeout(couponTimer.current);
  }, [subtotal, appliedCouponCode, dispatch]);
  // Note: `dispatch` is stable; `appliedCouponCode` is a string primitive
  // that only changes when the coupon itself changes — safe dep array.

  // ── Apply coupon ──────────────────────────────────────────────────
  const handleApplyCoupon = async (codeOverride) => {
    const code = (codeOverride ?? couponCode).trim().toUpperCase();
    setCouponError(""); setCouponSuccess("");
    if (!code)          { setCouponError("Please enter a coupon code."); return; }
    if (subtotal === 0) { setCouponError("Add items to the cart first."); return; }
    setApplying(true);
    try {
      const { data } = await api.post("/api/coupons/apply", { code, subtotal });
      if (!data.success) {
        setCouponError(data.message);
        dispatch(saveCoupon(null));
      } else {
        const coupon = { ...data.coupon, discount: data.discount };
        dispatch(saveCoupon(coupon));
        setCouponSuccess(data.message);
        setCouponCode("");
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || "Failed to apply coupon.");
    } finally {
      setApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(saveCoupon(null));
    setCouponSuccess(""); setCouponError("");
  };

  const handleRemove    = (id)           => dispatch(removeItem(id));
  const handleQtyChange = (id, quantity) => {
    if (quantity < 1 || quantity > 10) return;
    dispatch(updateItemQty({ id, quantity }));
  };

  const handleClearCart = () => {
    dispatch(clearAll());
    setCouponSuccess("");
    setCouponError("");
  };

  const handleCheckout = () => {
    setCheckoutLoading(true);
    setTimeout(() => { setCheckoutLoading(false); navigate("/checkout"); }, 1000);
  };

  if (loading && cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-semibold">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-[1300px] mx-auto flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <FiChevronRight size={12} className="text-gray-300" />
          <span className="text-gray-800 font-semibold">Shopping Cart</span>
          {totalItems > 0 && (
            <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
          )}
          <span className="ml-auto text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-semibold hidden sm:inline-block">
            All prices inclusive of GST
          </span>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-3 sm:px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">My Cart</h1>
            <p className="text-xs text-gray-400 mt-0.5 sm:hidden">All prices include GST</p>
          </div>
          {cartItems.length > 0 && (
            <button onClick={handleClearCart}
              className="flex items-center gap-1.5 text-sm text-red-500 font-semibold hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full transition-all">
              <FiTrash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            {/* ── LEFT COLUMN ── */}
            <div className="space-y-3">

              {/* Free-delivery banner */}
              {!liveDelivery.freeDelivery && liveDelivery.amountToFreeDelivery > 0 ? (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FiTruck className="text-blue-600 flex-shrink-0" size={16} />
                    <p className="text-sm font-bold text-blue-800">
                      Add <span className="text-blue-600">₹{liveDelivery.amountToFreeDelivery.toFixed(2)}</span> more to get{" "}
                      <span className="text-blue-600">FREE delivery!</span>
                    </p>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((subtotal / deliveryInfo.freeAbove) * 100, 100)}%` }} />
                  </div>
                  <p className="text-xs text-blue-400 mt-1.5">₹{subtotal.toFixed(2)} of ₹{deliveryInfo.freeAbove}</p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-3 flex items-center gap-3">
                  <FiCheck className="text-green-500 flex-shrink-0" size={16} />
                  <p className="text-sm font-bold text-green-700">
                    🎉 You've unlocked <span className="underline">FREE delivery</span> on this order!
                  </p>
                </div>
              )}

              {/* Cart items */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <CartItem key={item.id} item={item}
                    onQtyChange={handleQtyChange}
                    onRemove={handleRemove} />
                ))}
              </div>

              {/* GST summary strip */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex items-start gap-3">
                <FiInfo className="text-amber-500 flex-shrink-0 mt-0.5" size={14} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-amber-700">
                    Total GST on this order: ₹{totalGst.toFixed(2)}
                  </p>
                  <button onClick={() => setShowGstBreakdown(v => !v)}
                    className="text-[10px] text-amber-600 underline mt-0.5">
                    {showGstBreakdown ? "Hide" : "View"} item-wise GST breakdown
                  </button>

                  {showGstBreakdown && (
                    <div className="mt-3 overflow-x-auto rounded-xl border border-amber-100 bg-white">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-amber-50">
                            <th className="text-left px-3 py-2 text-amber-600 font-bold">Item</th>
                            <th className="text-right px-3 py-2 text-amber-600 font-bold whitespace-nowrap">Qty</th>
                            <th className="text-right px-3 py-2 text-amber-600 font-bold whitespace-nowrap">Base</th>
                            <th className="text-right px-3 py-2 text-amber-600 font-bold whitespace-nowrap">GST%</th>
                            <th className="text-right px-3 py-2 text-amber-600 font-bold whitespace-nowrap">GST Amt</th>
                            <th className="text-right px-3 py-2 text-amber-600 font-bold whitespace-nowrap">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cartItems.map((item) => {
                            const qty   = item.quantity ?? item.qty ?? 1;
                            const base  = getBasePrice(item);
                            const gstA  = getGstAmount(item);
                            const gstR  = getGstRate(item);
                            const total = getPriceWithGst(item) * qty;
                            return (
                              <tr key={item.id} className="border-b border-gray-50 last:border-0">
                                <td className="px-3 py-2 text-gray-700 font-semibold truncate max-w-[140px]">{item.name}</td>
                                <td className="px-3 py-2 text-right text-gray-500">{qty}</td>
                                <td className="px-3 py-2 text-right text-gray-500">₹{(base * qty).toFixed(2)}</td>
                                <td className="px-3 py-2 text-right text-amber-600 font-bold">{gstR}%</td>
                                <td className="px-3 py-2 text-right text-amber-600 font-bold">₹{(gstA * qty).toFixed(2)}</td>
                                <td className="px-3 py-2 text-right text-gray-900 font-black">₹{total.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-amber-50">
                            <td colSpan={2} className="px-3 py-2 text-amber-700 font-black">Total</td>
                            <td className="px-3 py-2 text-right text-gray-700 font-black">₹{totalBase.toFixed(2)}</td>
                            <td className="px-3 py-2" />
                            <td className="px-3 py-2 text-right text-amber-600 font-black">₹{totalGst.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-gray-900 font-black">₹{subtotal.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Coupon */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <h3 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <FiTag className="text-blue-500" size={15} /> Coupon / Promo Code
                </h3>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FiCheck className="text-green-500" size={16} />
                      <div>
                        <p className="text-sm font-black text-green-700">{appliedCoupon.code}</p>
                        <p className="text-xs text-green-600">{appliedCoupon.label}</p>
                        {couponDiscount > 0 && (
                          <p className="text-[10px] text-green-500 mt-0.5">You save ₹{couponDiscount.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    <button onClick={handleRemoveCoupon}
                      className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-all">
                      <FiX size={15} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input type="text" value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        placeholder="Enter coupon code"
                        className="flex-1 border-2 border-gray-100 focus:border-blue-400 rounded-xl px-4 py-2.5 text-sm outline-none font-semibold tracking-widest uppercase transition-colors" />
                      <button onClick={() => handleApplyCoupon()} disabled={applying}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-colors min-w-[80px]">
                        {applying ? "…" : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="flex items-center gap-1.5 text-xs text-red-500 font-semibold mt-2">
                        <FiAlertCircle size={12} /> {couponError}
                      </p>
                    )}
                    {couponSuccess && (
                      <p className="flex items-center gap-1.5 text-xs text-green-600 font-semibold mt-2">
                        <FiCheck size={12} /> {couponSuccess}
                      </p>
                    )}
                    {availableCoupons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <p className="text-[10px] text-gray-400 w-full">Available coupons:</p>
                        {availableCoupons.map((c) => (
                          <button key={c.code} onClick={() => handleApplyCoupon(c.code)}
                            className="flex items-center gap-1 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 font-black px-2.5 py-1 rounded-full border border-blue-100 transition-colors"
                            title={c.label}>
                            <FiGift size={9} /> {c.code}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Trust badges */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                <TrustBadge icon={<FiTruck size={18} />}      title="Free Delivery"   subtitle={`On orders above ₹${deliveryInfo.freeAbove}`} />
                <div className="sm:pl-4"><TrustBadge icon={<FiRotateCcw size={18} />} title="Easy Returns"    subtitle="30-day hassle-free returns" /></div>
                <div className="sm:pl-4"><TrustBadge icon={<FiShield size={18} />}    title="Secure Checkout" subtitle="100% safe & encrypted" /></div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Link to="/collection/VOLTMETER" className="flex items-center gap-2 text-sm text-blue-600 font-bold hover:underline">
                  <FiArrowLeft size={14} /> Continue Shopping
                </Link>
                <p className="text-xs text-gray-400">{totalItems} item{totalItems > 1 ? "s" : ""} in cart</p>
              </div>
            </div>

            {/* ── RIGHT: Order Summary ── */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
                <h2 className="font-black text-gray-900 text-base mb-5">Order Summary</h2>

                <div className="space-y-3 text-sm border-b border-gray-100 pb-4 mb-4">
                  <div className="flex justify-between text-gray-500">
                    <span>Price ({totalItems} item{totalItems > 1 ? "s" : ""})</span>
                    <span className="font-semibold text-gray-700">₹{mrpTotal.toFixed(2)}</span>
                  </div>

                  {savedOnMrp > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount on MRP</span>
                      <span className="font-bold">− ₹{savedOnMrp.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-400 text-xs">
                    <span>Subtotal (excl. GST)</span>
                    <span>₹{totalBase.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-amber-600 text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <FiTag size={10} /> GST ({DEFAULT_GST_RATE}% avg)
                    </span>
                    <span>+ ₹{totalGst.toFixed(2)}</span>
                  </div>

                  {couponDiscount > 0 && appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1">
                        <FiTag size={11} /> Coupon ({appliedCoupon.code})
                      </span>
                      <span className="font-bold">− ₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-500">
                    <span>Delivery Charges</span>
                    {deliveryInfo.loading && subtotal < deliveryInfo.freeAbove
                      ? <span className="text-xs italic">calculating…</span>
                      : liveDelivery.charge === 0
                        ? <span className="font-bold text-green-600">FREE</span>
                        : <span className="font-semibold text-gray-700">₹{liveDelivery.charge}</span>}
                  </div>
                </div>

                {/* Grand total */}
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-gray-900 text-base">Total Amount</span>
                  <span className="font-black text-gray-900 text-xl">₹{grandTotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-gray-400 text-right mb-2">
                  Incl. ₹{totalGst.toFixed(2)} GST
                </p>

                {totalSaving > 0 && (
                  <div className="bg-green-50 rounded-xl px-3 py-2 mb-4 mt-1">
                    <p className="text-xs text-green-700 font-bold text-center">
                      🎉 You save ₹{totalSaving.toFixed(2)} on this order!
                    </p>
                  </div>
                )}

                <button onClick={handleCheckout} disabled={checkoutLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-black text-sm shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 mt-2">
                  {checkoutLoading ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing...</>
                  ) : (<>Proceed to Checkout <FiChevronRight size={16} /></>)}
                </button>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-center text-[11px] text-gray-400 mb-3 font-semibold uppercase tracking-wide">Accepted Payment Methods</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {["UPI", "Cards", "Net Banking", "COD", "Wallets"].map((m) => (
                      <span key={m} className="text-[10px] font-bold bg-gray-50 border border-gray-200 text-gray-500 px-2.5 py-1 rounded-lg">{m}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delivery & returns policy */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-black text-gray-900 text-sm mb-4">Delivery & Returns Policy</h3>
                <div className="space-y-4">
                  {[
                    { icon: <FiTruck     className="text-blue-600"   size={15} />, bg: "bg-blue-50",   title: "Standard Delivery",
                      lines: [`Estimated: ${deliveryInfo.estimatedDaysMin}–${deliveryInfo.estimatedDaysMax} business days`,
                              `Free above ₹${deliveryInfo.freeAbove} · ₹${deliveryInfo.charge || 49} otherwise`] },
                    { icon: <FiPackage   className="text-orange-500" size={15} />, bg: "bg-orange-50", title: "Express Delivery",
                      lines: ["1–2 business days (select pin codes)", "Additional charges apply at checkout"] },
                    { icon: <FiRotateCcw className="text-green-600"  size={15} />, bg: "bg-green-50",  title: "30-Day Return Policy",
                      lines: ["Unused items in original packaging eligible", "Damaged/defective items replaced free"] },
                    { icon: <FiShield    className="text-purple-600" size={15} />, bg: "bg-purple-50", title: "1 Year Warranty",
                      lines: ["On select electronic components & modules"] },
                  ].map((b) => (
                    <div key={b.title} className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full ${b.bg} flex items-center justify-center flex-shrink-0`}>{b.icon}</div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{b.title}</p>
                        {b.lines.map((l, i) => (<p key={i} className="text-xs text-gray-500 mt-0.5">{l}</p>))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}