// src/pages/Checkout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// MATCHED TO BACKEND (orderController.js + orderRoute.js):
//
//  ✅ createRazorpayOrder  → POST /api/order/razorpay
//     Body: { userId, items, address, couponCode, customerNote }
//     Response: { success, razorpayOrderId, orderId (MongoDB _id), amount, currency }
//
//  ✅ verifyRazorpayPayment → POST /api/order/verify-payment
//     Body: { orderId (MongoDB _id), razorpay_order_id, razorpay_payment_id, razorpay_signature }
//
//  ✅ placeCODOrder → POST /api/order/place
//     Body: { userId, items, address, couponCode, customerNote }
//
//  ✅ mongoOrderId stored from createRazorpayOrder.fulfilled payload
//     and forwarded to verifyRazorpayPayment — no stale closure issue
//
//  ✅ On order success (COD or Razorpay) → clears cart, resets order,
//     navigates directly to /orders
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Link, useNavigate }        from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiChevronRight, FiCheck, FiShield, FiTruck,
  FiRotateCcw, FiLock, FiMapPin, FiPhone, FiMail,
  FiUser, FiHome, FiAlertCircle, FiEdit2,
  FiCreditCard, FiDollarSign,
  FiArrowLeft, FiPackage, FiTag, FiInfo,
} from "react-icons/fi";

import { clearCart }      from "../app/cartSlice";
import {
  setPaymentMethod,
  setOrderError,
  clearOrderError,
  resetOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  placeCODOrder,
  selectOrderStatus,
  selectOrderError,
  selectOrderId,
  selectPaymentId,
  selectPaymentMethod,
  selectIsPlacingOrder,
  selectAllOrders,
} from "../app/orderSlice";
import PaymentModal from "../components/PaymentModal";

// ─────────────────────────────────────────────────────────────────────────────
// GST CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const GST_INCLUSIVE    = false;
const DEFAULT_GST_RATE = 18;

const getGstRate     = (item) => item.gstRate ?? item.taxRate ?? DEFAULT_GST_RATE;
const getBasePrice   = (item) => {
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

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────
const selectCartItems    = (s) => s.cart.items;
const selectCartSubtotal = (s) =>
  s.cart.items.reduce((sum, i) => sum + getPriceWithGst(i) * (i.quantity ?? i.qty ?? 1), 0);
const selectCartMrpTotal = (s) =>
  s.cart.items.reduce((sum, i) => sum + (i.mrp ?? getPriceWithGst(i)) * (i.quantity ?? i.qty ?? 1), 0);
const selectTotalGst     = (s) =>
  s.cart.items.reduce((sum, i) => sum + getGstAmount(i) * (i.quantity ?? i.qty ?? 1), 0);
const selectTotalBase    = (s) =>
  s.cart.items.reduce((sum, i) => sum + getBasePrice(i) * (i.quantity ?? i.qty ?? 1), 0);
const selectCoupon       = (s) => s.cart.coupon ?? null;
const selectUser         = (s) => s.auth.user       ?? null;
const selectIsLoggedIn   = (s) => s.auth.isLoggedIn ?? false;

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const RAZORPAY_KEY_ID         = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_XXXXXXXXXXXXXXXX";
const FREE_DELIVERY_THRESHOLD = 499;
const DELIVERY_CHARGE         = 49;
const COD_MINIMUM             = 199;

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli",
  "Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const PAYMENT_METHODS = [
  {
    id:         "razorpay",
    label:      "Pay Online",
    icon:       <FiCreditCard size={18} />,
    desc:       "UPI · Cards · Net Banking · Wallets (via Razorpay)",
    badge:      "RECOMMENDED",
    badgeColor: "bg-blue-600",
  },
  {
    id:    "cod",
    label: "Cash on Delivery",
    icon:  <FiDollarSign size={18} />,
    desc:  "Pay in cash when your order arrives",
    badge: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// RAZORPAY SDK LOADER
// ─────────────────────────────────────────────────────────────────────────────
function loadRazorpaySDK() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener("load",  () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script   = document.createElement("script");
    script.src     = "https://checkout.razorpay.com/v1/checkout.js";
    script.async   = true;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const InputField = memo(function InputField({
  label, name, type = "text", value, onChange,
  error, placeholder, required, icon, span2 = false,
}) {
  return (
    <div className={span2 ? "col-span-2" : "col-span-2 sm:col-span-1"}>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={name}
          className={`w-full rounded-xl border-2 py-3 text-sm outline-none transition-all duration-200
            ${icon ? "pl-9 pr-4" : "px-4"}
            ${error
              ? "border-red-300 bg-red-50 focus:border-red-400 placeholder-red-300"
              : "border-gray-200 bg-white focus:border-blue-500 hover:border-gray-300 placeholder-gray-300"
            }`}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5 font-medium">
          <FiAlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
});

const SectionCard = memo(function SectionCard({ title, icon, children, number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm shadow-blue-200">
          {number}
        </div>
        <div className="flex items-center gap-2 text-gray-800 font-black text-sm tracking-tight">
          <span className="text-blue-500">{icon}</span>
          {title}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
});

const OrderItem = memo(function OrderItem({ item }) {
  const rawImage     = Array.isArray(item.image) ? item.image[0] : (item.image || null);
  const displayImage = rawImage || null;
  const qty          = item.quantity ?? item.qty ?? 1;
  const priceGst     = getPriceWithGst(item);
  const gstAmt       = getGstAmount(item);
  const gstRate      = getGstRate(item);
  const mrp          = item.mrp ?? priceGst;
  const disc         = mrp > priceGst ? Math.round(((mrp - priceGst) / mrp) * 100) : 0;

  return (
    <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0 items-center">
      <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-1.5 overflow-hidden">
        {displayImage ? (
          <img src={displayImage} alt={item.name}
            className="max-w-full max-h-full object-contain"
            onError={(e) => { e.target.src = "https://placehold.co/56x56?text=📦"; }} />
        ) : (
          <img src="https://placehold.co/56x56?text=📦" alt={item.name}
            className="max-w-full max-h-full object-contain" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{item.name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{item.subcat} · Qty {qty}</p>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {disc > 0 && (
            <span className="text-[10px] bg-green-50 text-green-600 font-bold px-1.5 py-0.5 rounded-full border border-green-100">
              {disc}% off
            </span>
          )}
          <span className="text-[9px] bg-amber-50 text-amber-600 font-bold px-1.5 py-0.5 rounded-full border border-amber-100">
            GST {gstRate}%
          </span>
        </div>
        <p className="text-[9px] text-gray-400 mt-0.5">
          ₹{getBasePrice(item).toFixed(2)} + ₹{gstAmt.toFixed(2)} GST / unit
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black text-gray-900">₹{(priceGst * qty).toFixed(2)}</p>
        {mrp > priceGst && (
          <p className="text-[10px] text-gray-400 line-through">₹{(mrp * qty).toFixed(2)}</p>
        )}
        <p className="text-[9px] text-gray-400">incl. GST</p>
      </div>
    </div>
  );
});

const GstBreakdownSection = memo(function GstBreakdownSection({
  cartItems, totalGst, totalBase, subtotal, showGstBreakdown, onToggle,
}) {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex items-start gap-3">
      <FiInfo className="text-amber-500 flex-shrink-0 mt-0.5" size={14} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-amber-700">
          Total GST on this order: ₹{totalGst.toFixed(2)}
        </p>
        <button onClick={onToggle} className="text-[10px] text-amber-600 underline mt-0.5">
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
                      <td className="px-3 py-2 text-gray-700 font-semibold truncate max-w-[120px]">{item.name}</td>
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
  );
});

const SummaryPanel = memo(function SummaryPanel({
  cartItems, totalItems, mrpTotal, savedOnMrp,
  totalBase, totalGst, subtotal, deliveryCharge,
  grandTotal, paymentMethod, showGstBreakdown, onToggleGst,
  appliedCoupon, couponDiscount,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-gray-900 text-base">Order Summary</h2>
        <Link to="/cart" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
          <FiEdit2 size={11} /> Edit
        </Link>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {cartItems.map((item) => <OrderItem key={item.id} item={item} />)}
      </div>
      <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
        <div className="flex justify-between text-gray-500">
          <span>MRP ({totalItems} item{totalItems > 1 ? "s" : ""})</span>
          <span className="font-semibold text-gray-700">₹{mrpTotal.toFixed(2)}</span>
        </div>
        {savedOnMrp > 0 && (
          <div className="flex justify-between text-green-600 font-semibold">
            <span>Discount on MRP</span>
            <span>− ₹{savedOnMrp.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-400 text-xs">
          <span>Subtotal (excl. GST)</span>
          <span>₹{totalBase.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-amber-600 text-xs font-semibold">
          <span className="flex items-center gap-1"><FiTag size={10} /> GST ({DEFAULT_GST_RATE}% avg)</span>
          <span>+ ₹{totalGst.toFixed(2)}</span>
        </div>
        {couponDiscount > 0 && appliedCoupon && (
          <div className="flex justify-between text-green-600 font-semibold">
            <span className="flex items-center gap-1"><FiTag size={11} /> Coupon ({appliedCoupon.code})</span>
            <span>− ₹{couponDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-500">
          <span>Delivery</span>
          {deliveryCharge === 0
            ? <span className="font-bold text-green-600">FREE</span>
            : <span className="font-semibold text-gray-700">₹{deliveryCharge}</span>}
        </div>
      </div>
      <div className="flex justify-between items-center border-t-2 border-gray-100 pt-3">
        <span className="font-black text-gray-900">Total</span>
        <div className="text-right">
          <span className="font-black text-gray-900 text-xl">₹{grandTotal.toFixed(2)}</span>
          <p className="text-[10px] text-amber-600">incl. ₹{totalGst.toFixed(2)} GST</p>
        </div>
      </div>
      {(savedOnMrp > 0 || couponDiscount > 0) && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-center">
          <p className="text-xs text-green-700 font-black">
            🎉 You save ₹{(savedOnMrp + couponDiscount).toFixed(2)} on this order!
          </p>
        </div>
      )}
      <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2.5">
        <div className="text-blue-500">{PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.icon}</div>
        <p className="text-xs font-bold text-blue-700">{PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}</p>
      </div>
      <div className="space-y-2.5 border-t border-gray-100 pt-4">
        {[
          { icon: <FiLock      className="text-blue-500"   size={13} />, text: "100% Secure Payments"     },
          { icon: <FiTruck     className="text-green-500"  size={13} />, text: "Free delivery above ₹499" },
          { icon: <FiRotateCcw className="text-orange-500" size={13} />, text: "30-day easy returns"      },
          { icon: <FiShield    className="text-purple-500" size={13} />, text: "1-year warranty"          },
        ].map((b) => (
          <div key={b.text} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">{b.icon}</div>
            <p className="text-xs text-gray-500">{b.text}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-4">
        <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-wider mb-2">Accepted Payments</p>
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {["UPI", "Visa", "Mastercard", "RuPay", "Wallets", "COD"].map((m) => (
            <span key={m} className="text-[10px] font-bold bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-lg">{m}</span>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-100 pt-3">
        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          All prices are inclusive of GST as per Indian tax regulations.{" "}
          <button onClick={onToggleGst} className="text-amber-500 underline">View GST details</button>
        </p>
      </div>
    </div>
  );
});

// ─── AuthGuardModal ────────────────────────────────────────────────────────
function AuthGuardModal({ onLogin, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiUser className="text-blue-600 text-3xl" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Login Required</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Please login to your account to proceed with checkout and place your order.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={onLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black text-sm transition-colors">
            Login / Sign Up
          </button>
          <button onClick={onClose}
            className="w-full border-2 border-gray-200 text-gray-600 hover:border-gray-300 py-3 rounded-xl font-bold text-sm transition-colors">
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CHECKOUT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartItems      = useSelector(selectCartItems);
  const subtotal       = useSelector(selectCartSubtotal);
  const mrpTotal       = useSelector(selectCartMrpTotal);
  const totalGst       = useSelector(selectTotalGst);
  const totalBase      = useSelector(selectTotalBase);
  const user           = useSelector(selectUser);
  const isLoggedIn     = useSelector(selectIsLoggedIn);
  const orderStatus    = useSelector(selectOrderStatus);
  const orderError     = useSelector(selectOrderError);
  const orderId        = useSelector(selectOrderId);
  const paymentId      = useSelector(selectPaymentId);
  const paymentMethod  = useSelector(selectPaymentMethod);
  const isPlacingOrder = useSelector(selectIsPlacingOrder);
  const allOrders      = useSelector(selectAllOrders);
  const appliedCoupon  = useSelector(selectCoupon);

  const couponDiscount = (() => {
    if (!appliedCoupon || subtotal === 0) return 0;
    const { type, value, maxDiscount } = appliedCoupon;
    let d = type === "percent"
      ? Math.round((subtotal * (value ?? 0)) / 100)
      : (value ?? 0);
    if (maxDiscount) d = Math.min(d, maxDiscount);
    return Math.min(d, subtotal);
  })();

  const [checkoutStep,     setCheckoutStep]    = useState(1);
  const [showAuthModal,    setShowAuthModal]    = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showGstBreakdown, setShowGstBreakdown] = useState(false);
  const [errors,           setErrors]           = useState({});
  const [rzpLoading,       setRzpLoading]       = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    phone: "", address: "", apartment: "",
    city: "", state: "", pincode: "",
    country: "India", orderNotes: "",
  });

  // ── stableRef: always fresh values inside async Razorpay callbacks ─────────
  const stableRef = useRef({});

  const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const grandTotal     = Math.max(subtotal + deliveryCharge - couponDiscount, 0);
  const totalItems     = cartItems.reduce((s, i) => s + (i.quantity ?? i.qty ?? 1), 0);
  const savedOnMrp     = Math.max(mrpTotal - subtotal, 0);
  const isCODEligible  = grandTotal >= COD_MINIMUM;

  // Items passed to backend — keep full cart item data + flatten image
  const normalizedItems = cartItems.map((item) => ({
    ...item,
    image: Array.isArray(item.image) ? item.image[0] : (item.image || ""),
    price: getPriceWithGst(item),
  }));

  // Address object shaped for backend orderController.js
  const addressObj = {
    firstName:  form.firstName,
    lastName:   form.lastName,
    email:      form.email,
    phone:      form.phone,
    street:     form.address,
    apartment:  form.apartment,
    city:       form.city,
    state:      form.state,
    pincode:    form.pincode,
    country:    form.country,
  };

  stableRef.current = {
    grandTotal,
    deliveryCharge,
    totalGst,
    totalItems,
    normalizedItems,
    addressObj,
    form,
    appliedCoupon,
    couponDiscount,
    userId: user?._id ?? user?.id ?? null,
  };

  // ── Pre-load SDK on mount ──────────────────────────────────────────────────
  useEffect(() => { loadRazorpaySDK(); }, []);

  // ── Pre-fill form from logged-in user ──────────────────────────────────────
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || user?.name?.split(" ")[0]                 || "",
        lastName:  prev.lastName  || user?.name?.split(" ").slice(1).join(" ") || "",
        email:     prev.email     || user?.email || "",
        phone:     prev.phone     || user?.phone || "",
      }));
    }
  }, [user]);

  // ── React to orderStatus ───────────────────────────────────────────────────
  // ✅ FIX: On success, clear cart + reset order state, then navigate to /orders.
  //    The old checkoutStep === 3 / OrderSuccess screen is removed entirely.
  useEffect(() => {
    if (orderStatus === "success") {
      setShowPaymentModal(false);
      setRzpLoading(false);
      dispatch(clearCart());
      dispatch(resetOrder());
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate("/orders");
    }
    if (orderStatus === "failed") {
      setRzpLoading(false);
      setShowPaymentModal(false);
    }
  }, [orderStatus, dispatch, navigate]);

  const handleToggleGst = useCallback(() => setShowGstBreakdown((v) => !v), []);

  // ─── EMPTY CART GUARD ──────────────────────────────────────────────────────
  // ✅ FIX: Removed `&& checkoutStep !== 3` — no longer needed since we
  //    navigate away on success instead of showing a step-3 screen.
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm max-w-sm w-full">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-xl font-black text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-6">Add products before proceeding to checkout.</p>
          <Link to="/collection/Voltmeter"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold text-sm transition-colors">
            <FiPackage size={15} /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // ─── VALIDATION ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    const v = (f) => form[f]?.trim() || "";

    if (!v("firstName"))               e.firstName = "First name is required";
    else if (v("firstName").length < 2) e.firstName = "Must be at least 2 characters";
    if (!v("lastName"))                e.lastName  = "Last name is required";
    else if (v("lastName").length < 2) e.lastName  = "Must be at least 2 characters";
    if (!v("email"))                   e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email"))) e.email = "Enter a valid email address";

    const rawPhone   = v("phone").replace(/[\s\-().]/g, "");
    const digitsOnly = rawPhone.replace(/^\+91|^91|^0/, "");
    if (!rawPhone)                              e.phone = "Mobile number is required";
    else if (!/^[6-9]\d{9}$/.test(digitsOnly)) e.phone = "Enter a valid 10-digit Indian mobile number";

    if (!v("address"))                e.address = "Street address is required";
    else if (v("address").length < 5) e.address = "Please enter a complete address";
    if (!v("city"))                   e.city    = "City is required";
    if (!form.state)                  e.state   = "Please select your state";
    if (!v("pincode"))                e.pincode = "PIN code is required";
    else if (!/^\d{6}$/.test(v("pincode"))) e.pincode = "Enter a valid 6-digit PIN code";

    if (paymentMethod === "cod" && grandTotal < COD_MINIMUM)
      e._cod = `COD requires a minimum order of ₹${COD_MINIMUM}. Current total: ₹${grandTotal.toFixed(2)}`;

    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleContinue = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setCheckoutStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── COD ──────────────────────────────────────────────────────────────────
  const handleConfirmCOD = useCallback(() => {
    if (!isCODEligible) {
      dispatch(setOrderError(`COD requires a minimum order of ₹${COD_MINIMUM}.`));
      return;
    }
    const s = stableRef.current;
    dispatch(placeCODOrder({
      userId:       s.userId,
      items:        s.normalizedItems,
      address:      s.addressObj,
      couponCode:   s.appliedCoupon?.code ?? "",
      customerNote: s.form.orderNotes     ?? "",
    }));
  }, [isCODEligible, dispatch]);

  // ─── RAZORPAY ─────────────────────────────────────────────────────────────
  const initiateRazorpay = useCallback(async () => {
    dispatch(clearOrderError());
    setShowPaymentModal(false);
    setRzpLoading(true);

    // 1. Load SDK
    const sdkLoaded = await loadRazorpaySDK();
    if (!sdkLoaded) {
      dispatch(setOrderError("Payment gateway failed to load. Check your internet connection and try again."));
      setRzpLoading(false);
      return;
    }

    // 2. Read fresh values
    const s = stableRef.current;

    // 3. POST /api/order/razorpay → creates DB order + Razorpay order
    //    Returns: { id (razorpayOrderId), amount (paise), currency, orderId (MongoDB _id) }
    const result = await dispatch(createRazorpayOrder({
      userId:       s.userId,
      items:        s.normalizedItems,
      address:      s.addressObj,
      couponCode:   s.appliedCoupon?.code ?? "",
      customerNote: s.form.orderNotes     ?? "",
    }));

    if (createRazorpayOrder.rejected.match(result)) {
      setRzpLoading(false);
      return;
    }

    const fresh    = stableRef.current;
    const rzpOrder = result.payload; // { id, amount, currency, orderId }

    // ── KEY: store MongoDB orderId so verify-payment can find the DB record ──
    const mongoOrderId = rzpOrder.orderId;

    // 4. Razorpay options
    const options = {
      key:         RAZORPAY_KEY_ID,
      amount:      rzpOrder.amount,
      currency:    rzpOrder.currency || "INR",
      name:        "Amulya Electronics",
      description: `Order for ${fresh.totalItems} item${fresh.totalItems > 1 ? "s" : ""} (incl. GST)`,
      image:       "https://amulyaelectronics.com/wp-content/uploads/2026/01/CONNECT-WITH-ELECTRONICS-1.png",
      order_id:    rzpOrder.id,       // Razorpay order ID (rzp_order_xxx)
      prefill: {
        name:    `${fresh.form.firstName} ${fresh.form.lastName}`,
        email:   fresh.form.email,
        contact: fresh.form.phone,
      },
      notes: {
        address:         `${fresh.form.address}, ${fresh.form.city}, ${fresh.form.state} - ${fresh.form.pincode}`,
        gst_total:       fresh.totalGst.toFixed(2),
        coupon_code:     fresh.appliedCoupon?.code ?? "",
        coupon_discount: fresh.couponDiscount.toFixed(2),
      },
      theme:             { color: "#2563eb" },
      remember_customer: false,

      // ── SUCCESS HANDLER ──────────────────────────────────────────────────
      // Razorpay calls this after user pays successfully in the iframe.
      // We POST to /api/order/verify-payment with the MongoDB orderId +
      // the three Razorpay tokens for HMAC-SHA256 verification on the backend.
      handler: async (response) => {
        dispatch(verifyRazorpayPayment({
          orderId:             mongoOrderId,              // MongoDB _id from step 3
          razorpay_order_id:   response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature:  response.razorpay_signature,
        }));
      },

      modal: {
        ondismiss:    () => { dispatch(clearOrderError()); setRzpLoading(false); },
        backdropclose: false,
        escape:        true,
      },
    };

    // 5. Open popup
    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", (response) => {
      const msg =
        response?.error?.description ||
        response?.error?.reason      ||
        "Payment failed. Please try a different payment method or try again.";
      dispatch(setOrderError(msg));
      setRzpLoading(false);
    });

    rzp.open();
  }, [dispatch]);

  // ─── PLACE ORDER BUTTON ───────────────────────────────────────────────────
  const handlePlaceOrderClick = () => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    if (paymentMethod === "cod" && !isCODEligible) {
      dispatch(setOrderError(`COD requires a minimum order of ₹${COD_MINIMUM}. Switch to online payment or add more items.`));
      return;
    }
    if (paymentMethod === "razorpay") {
      initiateRazorpay();
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleLoginRedirect = () => { setShowAuthModal(false); navigate("/login", { state: { from: "/checkout" } }); };
  const handleGuestContinue = () => { setShowAuthModal(false); handlePlaceOrderClick(); };

  const gstBreakdownProps = { cartItems, totalGst, totalBase, subtotal, showGstBreakdown, onToggle: handleToggleGst };
  const summaryProps      = {
    cartItems, totalItems, mrpTotal, savedOnMrp, totalBase, totalGst,
    subtotal, deliveryCharge, grandTotal, paymentMethod,
    showGstBreakdown, onToggleGst: handleToggleGst,
    appliedCoupon, couponDiscount,
  };

  return (
    <>
      {showAuthModal && <AuthGuardModal onLogin={handleLoginRedirect} onClose={handleGuestContinue} />}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          if (!["placingCOD"].includes(orderStatus)) {
            setShowPaymentModal(false);
            dispatch(clearOrderError());
          }
        }}
        grandTotal={grandTotal}        totalGst={totalGst}
        paymentMethod={paymentMethod}  orderStatus={orderStatus}
        orderError={orderError}        orderId={orderId}
        paymentId={paymentId}          allOrders={allOrders}
        onConfirmCOD={handleConfirmCOD}
        onRetry={() => { dispatch(clearOrderError()); setShowPaymentModal(false); }}
      />

      <div className="bg-gray-50 min-h-screen">

        {/* BREADCRUMB */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-[1200px] mx-auto flex items-center gap-1.5 text-sm text-gray-400">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <FiChevronRight size={12} />
            <Link to="/cart" className="hover:text-blue-600 transition-colors">Cart</Link>
            <FiChevronRight size={12} />
            <span className="text-gray-700 font-semibold">Checkout</span>
            <span className="ml-auto text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-semibold hidden sm:inline-block">
              All prices inclusive of GST
            </span>
          </div>
        </div>

        {/* PROGRESS STEPS */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="max-w-[1200px] mx-auto flex items-center justify-center">
            {[{ n: 1, label: "Billing Details" }, { n: 2, label: "Review Order" }, { n: 3, label: "Confirmation" }].map((s, i) => (
              <div key={s.n} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300
                    ${checkoutStep > s.n  ? "bg-green-500 text-white shadow-sm shadow-green-200"  :
                      checkoutStep === s.n ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-gray-100 text-gray-400"}`}>
                    {checkoutStep > s.n ? <FiCheck size={13} strokeWidth={3} /> : s.n}
                  </div>
                  <span className={`text-xs font-bold hidden sm:block transition-colors ${
                    checkoutStep === s.n ? "text-blue-600" : checkoutStep > s.n ? "text-green-600" : "text-gray-400"
                  }`}>{s.label}</span>
                </div>
                {i < 2 && (
                  <div className={`w-10 sm:w-20 h-0.5 mx-2 transition-all duration-500 rounded-full ${checkoutStep > s.n ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            {checkoutStep === 2 && (
              <button onClick={() => setCheckoutStep(1)}
                className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-blue-600">
                <FiArrowLeft size={18} />
              </button>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              {checkoutStep === 1 ? "Billing Details" : "Review Your Order"}
            </h1>
          </div>

          {isLoggedIn && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-sm font-bold text-blue-800">Logged in as <span className="text-blue-600">{user?.name || user?.email}</span></p>
                <p className="text-xs text-blue-500">Your details have been pre-filled below</p>
              </div>
            </div>
          )}

          {!isLoggedIn && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <FiAlertCircle className="text-amber-500 flex-shrink-0" size={18} />
                <p className="text-sm text-amber-800 font-medium"><span className="font-black">Not logged in.</span> Login to track your orders easily.</p>
              </div>
              <Link to="/login" state={{ from: "/checkout" }}
                className="text-xs font-black text-blue-600 hover:underline bg-white px-3 py-1.5 rounded-full border border-blue-100 flex-shrink-0">
                Login / Sign Up
              </Link>
            </div>
          )}

          {appliedCoupon && couponDiscount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
              <FiTag className="text-green-500 flex-shrink-0" size={16} />
              <p className="text-sm font-bold text-green-700">
                Coupon <span className="font-black">{appliedCoupon.code}</span> applied — you save ₹{couponDiscount.toFixed(2)}
              </p>
              <Link to="/cart" className="ml-auto text-xs text-blue-600 font-bold hover:underline flex-shrink-0">Change</Link>
            </div>
          )}

          {orderError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
              <FiAlertCircle className="text-red-500 flex-shrink-0" size={18} />
              <p className="text-sm text-red-700 font-medium">{orderError}</p>
              <button onClick={() => dispatch(clearOrderError())} className="ml-auto text-red-400 hover:text-red-600 text-lg leading-none">✕</button>
            </div>
          )}

          {errors._cod && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
              <FiAlertCircle className="text-red-500 flex-shrink-0" size={18} />
              <p className="text-sm text-red-700 font-medium">{errors._cod}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-4">

              {/* ════════ STEP 1 ════════ */}
              {checkoutStep === 1 && (
                <>
                  <SectionCard title="Contact Information" icon={<FiUser size={14} />} number="1">
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="First Name"    name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} placeholder="Rohith"           required icon={<FiUser  size={13} />} />
                      <InputField label="Last Name"     name="lastName"  value={form.lastName}  onChange={handleChange} error={errors.lastName}  placeholder="Kumar"                     />
                      <InputField label="Email Address" name="email"     value={form.email}     onChange={handleChange} error={errors.email}     placeholder="rohith@email.com" required icon={<FiMail  size={13} />} span2 type="email" />
                      <InputField label="Mobile Number" name="phone"     value={form.phone}     onChange={handleChange} error={errors.phone}     placeholder="9876543210"      required icon={<FiPhone size={13} />} span2 type="tel" />
                    </div>
                  </SectionCard>

                  <SectionCard title="Delivery Address" icon={<FiMapPin size={14} />} number="2">
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Street Address"               name="address"   value={form.address}   onChange={handleChange} error={errors.address} placeholder="House No., Street, Colony" required icon={<FiHome size={13} />} span2 />
                      <InputField label="Apartment / Floor (Optional)" name="apartment" value={form.apartment} onChange={handleChange} placeholder="Flat 4B, 2nd Floor" span2 />
                      <InputField label="City / Town"                  name="city"      value={form.city}      onChange={handleChange} error={errors.city}    placeholder="Bengaluru" required />
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          State <span className="text-red-500">*</span>
                        </label>
                        <select name="state" value={form.state} onChange={handleChange}
                          className={`w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition-all bg-white cursor-pointer appearance-none
                            ${errors.state ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 focus:border-blue-500 hover:border-gray-300 text-gray-700"}`}>
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.state && (
                          <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5 font-medium">
                            <FiAlertCircle size={11} /> {errors.state}
                          </p>
                        )}
                      </div>
                      <InputField label="PIN Code" name="pincode" value={form.pincode} onChange={handleChange} error={errors.pincode} placeholder="560001" required />
                      <InputField label="Country"  name="country" value={form.country} onChange={handleChange} placeholder="India" span2 />
                    </div>
                  </SectionCard>

                  <SectionCard title="Payment Method" icon={<FiCreditCard size={14} />} number="3">
                    <div className="space-y-3">
                      {PAYMENT_METHODS.map((pm) => {
                        const disabled = pm.id === "cod" && !isCODEligible;
                        return (
                          <div key={pm.id} onClick={() => !disabled && dispatch(setPaymentMethod(pm.id))}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                              disabled ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                              : paymentMethod === pm.id ? "border-blue-400 bg-blue-50 shadow-sm shadow-blue-100 cursor-pointer"
                              : "border-gray-200 hover:border-gray-300 bg-white cursor-pointer"
                            }`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${paymentMethod === pm.id && !disabled ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                              {paymentMethod === pm.id && !disabled && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${paymentMethod === pm.id && !disabled ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                              {pm.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-black text-gray-800">{pm.label}</p>
                                {pm.badge && !disabled && <span className={`text-[10px] ${pm.badgeColor} text-white font-black px-2 py-0.5 rounded-full`}>{pm.badge}</span>}
                                {disabled && <span className="text-[10px] bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full">Min ₹{COD_MINIMUM}</span>}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">{pm.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {paymentMethod === "razorpay" && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-2"><FiShield size={13} /> Secured by Razorpay</p>
                        <p className="text-xs text-blue-600 leading-relaxed">You'll be redirected to Razorpay's secure payment window. Supports UPI, credit/debit cards, net banking, and popular wallets.</p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {["GPay","PhonePe","Paytm","BHIM","Visa","Mastercard","RuPay"].map((m) => (
                            <span key={m} className="text-[10px] bg-white border border-blue-200 text-blue-600 font-bold px-2 py-0.5 rounded-lg">{m}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {paymentMethod === "cod" && (
                      <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                        <span className="text-2xl flex-shrink-0">💵</span>
                        <div>
                          <p className="text-sm font-black text-amber-800 mb-1">Cash on Delivery</p>
                          <p className="text-xs text-amber-700 leading-relaxed">Pay in cash when your order is delivered. <span className="font-black">COD available on orders ₹{COD_MINIMUM} and above.</span></p>
                        </div>
                      </div>
                    )}
                  </SectionCard>

                  <GstBreakdownSection {...gstBreakdownProps} />

                  <SectionCard title="Order Notes (Optional)" icon={<FiEdit2 size={14} />} number="4">
                    <textarea name="orderNotes" value={form.orderNotes} onChange={handleChange} rows={3}
                      placeholder="Special instructions for delivery, packaging, or handling..."
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none hover:border-gray-300 transition-colors placeholder-gray-300" />
                  </SectionCard>

                  <div className="lg:hidden"><SummaryPanel {...summaryProps} /></div>

                  <button onClick={handleContinue}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-4 rounded-xl font-black text-base shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all flex items-center justify-center gap-2">
                    Continue to Review <FiChevronRight size={18} />
                  </button>
                </>
              )}

              {/* ════════ STEP 2 ════════ */}
              {checkoutStep === 2 && (
                <>
                  <SectionCard title="Billing & Shipping Details" icon={<FiMapPin size={14} />} number="1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Contact</p>
                        <p className="font-bold text-gray-900">{form.firstName} {form.lastName}</p>
                        <p className="text-gray-500 mt-0.5">{form.email}</p>
                        <p className="text-gray-500">{form.phone}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Delivery Address</p>
                        <p className="text-gray-700 leading-relaxed text-xs">
                          {form.address}{form.apartment ? `, ${form.apartment}` : ""}<br />
                          {form.city}, {form.state} – {form.pincode}<br />
                          {form.country}
                        </p>
                      </div>
                    </div>
                    {form.orderNotes && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Order Notes</p>
                        <p className="text-xs text-gray-600 italic">"{form.orderNotes}"</p>
                      </div>
                    )}
                    <button onClick={() => setCheckoutStep(1)} className="mt-4 flex items-center gap-1.5 text-xs font-black text-blue-600 hover:underline">
                      <FiEdit2 size={11} /> Edit Details
                    </button>
                  </SectionCard>

                  <SectionCard title="Payment Method" icon={<FiCreditCard size={14} />} number="2">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl text-blue-600 flex items-center justify-center flex-shrink-0">
                        {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.icon}
                      </div>
                      <div>
                        <p className="font-black text-gray-800 text-sm">{PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}</p>
                        <p className="text-xs text-gray-400">{PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.desc}</p>
                      </div>
                      <button onClick={() => setCheckoutStep(1)} className="ml-auto flex items-center gap-1 text-xs font-black text-blue-600 hover:underline flex-shrink-0">
                        <FiEdit2 size={11} /> Change
                      </button>
                    </div>
                  </SectionCard>

                  <SectionCard title={`Order Items · ${totalItems} item${totalItems > 1 ? "s" : ""}`} icon={<FiPackage size={14} />} number="3">
                    {cartItems.map((item) => <OrderItem key={item.id} item={item} />)}
                  </SectionCard>

                  <GstBreakdownSection {...gstBreakdownProps} />
                  <div className="lg:hidden"><SummaryPanel {...summaryProps} /></div>

                  <button onClick={handlePlaceOrderClick} disabled={isPlacingOrder || rzpLoading}
                    className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-base shadow-lg shadow-green-100 hover:shadow-green-200 transition-all flex items-center justify-center gap-2">
                    {(isPlacingOrder || rzpLoading) ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                        {rzpLoading && orderStatus !== "verifying" && "Opening Payment Gateway..."}
                        {orderStatus === "creatingOrder" && "Creating Order..."}
                        {orderStatus === "verifying"     && "Verifying Payment..."}
                        {orderStatus === "placingCOD"    && "Placing Order..."}
                      </>
                    ) : (
                      <>
                        <FiLock size={16} />
                        {paymentMethod === "razorpay" ? `Pay ₹${grandTotal.toFixed(2)} via Razorpay` : `Place Order · ₹${grandTotal.toFixed(2)} (COD)`}
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-amber-600 font-medium">Amount includes ₹{totalGst.toFixed(2)} GST</p>

                  {!isLoggedIn && (
                    <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <FiAlertCircle className="text-amber-500 flex-shrink-0" size={15} />
                      <p className="text-xs text-amber-700 font-medium text-center">
                        You'll be prompted to{" "}
                        <button onClick={() => setShowAuthModal(true)} className="font-black text-blue-600 underline">login</button>
                        {" "}before payment is processed.
                      </p>
                    </div>
                  )}

                  <p className="text-center text-xs text-gray-400 leading-relaxed">
                    By placing this order, you agree to our{" "}
                    <Link to="/terms-conditions" className="text-blue-500 hover:underline">Terms & Conditions</Link>
                    {" "}and{" "}
                    <Link to="/refund-cancellation-policy" className="text-blue-500 hover:underline">Refund Policy</Link>.
                  </p>
                </>
              )}
            </div>

            <div className="hidden lg:block">
              <SummaryPanel {...summaryProps} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}