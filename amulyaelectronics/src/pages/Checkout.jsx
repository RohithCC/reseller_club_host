// src/pages/Checkout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONS over previous version:
//
//  📦 DYNAMIC COURIER CHARGE ENGINE
//   ✅ Calculates weight from cart items (item.weight in grams, fallback 200g)
//   ✅ Origin: Dharwad, Karnataka (580001)
//   ✅ Zone-based pricing: Local / Zone A / Zone B / Zone C / Zone D / Zone E
//   ✅ Zone determined by destination state → India Post domestic zone matrix
//   ✅ Rate slabs: first 500g + per 500g extra (like Delhivery/Shiprocket logic)
//   ✅ COD surcharge: ₹40 or 1.5% of order value whichever is higher
//   ✅ Fuel surcharge: 3% of freight (industry standard)
//   ✅ Free shipping threshold still honoured (overrides dynamic rate if met)
//   ✅ Minimum charge floor per zone
//
//  🗺️  GOOGLE MAPS LOCATION PICKER
//   ✅ "Pick from Map" button opens a modal with Google Maps Places Autocomplete
//   ✅ Falls back gracefully if Maps API key is missing — manual form only
//   ✅ Auto-fills: address, city, state, pincode from place result
//   ✅ Manual address form always visible as alternative
//   ✅ Uses VITE_GOOGLE_MAPS_API_KEY env var
//
//  💰 LIVE COURIER CHARGE PREVIEW
//   ✅ Charge re-calculated whenever state, pincode, or cart weight changes
//   ✅ Breakdown shown: freight + fuel surcharge + COD surcharge
//   ✅ "Free delivery above ₹X" banner when threshold not met
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import { Link, useNavigate }        from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios                        from "axios";
import {
  FiChevronRight, FiCheck, FiShield, FiTruck,
  FiRotateCcw, FiLock, FiMapPin, FiPhone, FiMail,
  FiUser, FiHome, FiAlertCircle, FiEdit2,
  FiCreditCard, FiDollarSign,
  FiArrowLeft, FiPackage, FiTag, FiInfo, FiX,
  FiNavigation, FiCornerUpLeft,
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
// ENV
// ─────────────────────────────────────────────────────────────────────────────
const backendUrl       = import.meta.env.VITE_BACKEND_URL       || 'http://localhost:10000';
const resolveUrl       = (path) => path?.startsWith('http') ? path : `${backendUrl}${path}`;
const RAZORPAY_KEY_ID  = import.meta.env.VITE_RAZORPAY_KEY_ID  || "";
const GOOGLE_MAPS_KEY  = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

if (import.meta.env.DEV && backendUrl.includes("localhost")) {
  console.info("[Checkout] Dev: using localhost backend.");
}
if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID.includes("XXXX")) {
  console.error("[Checkout] ⚠️  VITE_RAZORPAY_KEY_ID missing or placeholder.");
}

// ─────────────────────────────────────────────────────────────────────────────
// GST CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const GST_INCLUSIVE    = false;
const DEFAULT_GST_RATE = 18;

const getGstRate     = (item) => item.gstRate ?? item.taxRate ?? DEFAULT_GST_RATE;
const getBasePrice   = (item) => {
  const raw  = item.price ?? item.salePrice ?? 0;
  if (GST_INCLUSIVE) return Math.round((raw / (1 + getGstRate(item) / 100)) * 100) / 100;
  return raw;
};
const getPriceWithGst = (item) => {
  const base = getBasePrice(item);
  return Math.round(base * (1 + getGstRate(item) / 100) * 100) / 100;
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
const selectCoupon       = (s) => s.cart.coupon   ?? null;
const selectUser         = (s) => s.auth.user      ?? null;
const selectIsLoggedIn   = (s) => s.auth.isLoggedIn ?? false;

// ─────────────────────────────────────────────────────────────────────────────
//  DELIVERY — uses backend /api/delivery/calculate + /api/cod/check
// ─────────────────────────────────────────────────────────────────────────────
const FREE_DELIVERY_THRESHOLD = 999;

/**
 * Calculate total weight of cart in grams.
 * Uses item.weight (grams) if present, else 200g default per unit.
 */
function calcTotalWeightGrams(cartItems) {
  return cartItems.reduce((sum, item) => {
    const qty = item.quantity ?? item.qty ?? 1;
    const w   = item.weight ?? item.weightGrams ?? 200; // grams per unit
    return sum + w * qty;
  }, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE MAPS SDK LOADER (singleton)
// ─────────────────────────────────────────────────────────────────────────────
let _mapsPromise = null;
function loadGoogleMapsSDK(apiKey) {
  if (!apiKey) return Promise.resolve(false);
  if (window.google?.maps?.places) return Promise.resolve(true);
  if (_mapsPromise) return _mapsPromise;
  _mapsPromise = new Promise((resolve) => {
    const script     = document.createElement("script");
    script.src       = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async     = true;
    script.defer     = true;
    script.onload    = () => { _mapsPromise = null; resolve(true); };
    script.onerror   = () => { _mapsPromise = null; resolve(false); };
    document.head.appendChild(script);
  });
  return _mapsPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// RAZORPAY SDK LOADER (singleton)
// ─────────────────────────────────────────────────────────────────────────────
let _rzpSdkPromise = null;
function loadRazorpaySDK() {
  if (window.Razorpay) return Promise.resolve(true);
  if (_rzpSdkPromise) return _rzpSdkPromise;
  const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
  if (existing) {
    _rzpSdkPromise = new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      existing.addEventListener("load",  () => { _rzpSdkPromise = null; resolve(true);  });
      existing.addEventListener("error", () => { _rzpSdkPromise = null; resolve(false); });
    });
    return _rzpSdkPromise;
  }
  _rzpSdkPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src     = "https://checkout.razorpay.com/v1/checkout.js";
    s.async   = true; s.defer = true;
    s.onload  = () => { _rzpSdkPromise = null; resolve(true);  };
    s.onerror = () => { _rzpSdkPromise = null; resolve(false); };
    document.body.appendChild(s);
  });
  return _rzpSdkPromise;
}

function sanitizeStr(val = "") {
  return String(val).trim().replace(/[<>]/g, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const COD_MINIMUM = 199;

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
    desc:  "Pay in cash when your order arrives.",
    badge: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ═══════════════  GOOGLE MAPS PICKER MODAL  ══════════════════════════════════
// ─────────────────────────────────────────────────────────────────────────────
function MapPickerModal({ onClose, onSelect }) {
  const inputRef    = useRef(null);
  const mapRef      = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapErr,    setMapErr]    = useState("");
  const [selected,  setSelected]  = useState(null);
  const googleMapRef = useRef(null);
  const markerRef    = useRef(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) {
      setMapErr("Google Maps API key (VITE_GOOGLE_MAPS_API_KEY) is not configured.");
      return;
    }
    loadGoogleMapsSDK(GOOGLE_MAPS_KEY).then((ok) => {
      if (!ok) { setMapErr("Failed to load Google Maps. Check your API key."); return; }
      setMapLoaded(true);
    });
  }, []);

  // Init map + autocomplete after SDK loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !inputRef.current) return;
    const maps = window.google.maps;

    // Center on Dharwad as default
    const center = { lat: 15.4589, lng: 75.0078 };
    googleMapRef.current = new maps.Map(mapRef.current, {
      center, zoom: 12,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
    });

    markerRef.current = new maps.Marker({ map: googleMapRef.current, draggable: true });

    // Autocomplete
    const ac = new maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "in" },
      fields: ["address_components", "formatted_address", "geometry"],
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.geometry) return;
      const loc = place.geometry.location;
      googleMapRef.current.setCenter(loc);
      googleMapRef.current.setZoom(15);
      markerRef.current.setPosition(loc);
      const parsed = parsePlaceComponents(place.address_components, place.formatted_address);
      setSelected(parsed);
    });

    // Click on map
    googleMapRef.current.addListener("click", (e) => {
      const loc = e.latLng;
      markerRef.current.setPosition(loc);
      // Reverse geocode
      const geocoder = new maps.Geocoder();
      geocoder.geocode({ location: loc }, (results, status) => {
        if (status === "OK" && results[0]) {
          const parsed = parsePlaceComponents(results[0].address_components, results[0].formatted_address);
          setSelected(parsed);
          if (inputRef.current) inputRef.current.value = results[0].formatted_address;
        }
      });
    });

    // Drag marker
    markerRef.current.addListener("dragend", () => {
      const loc = markerRef.current.getPosition();
      const geocoder = new maps.Geocoder();
      geocoder.geocode({ location: loc }, (results, status) => {
        if (status === "OK" && results[0]) {
          const parsed = parsePlaceComponents(results[0].address_components, results[0].formatted_address);
          setSelected(parsed);
          if (inputRef.current) inputRef.current.value = results[0].formatted_address;
        }
      });
    });
  }, [mapLoaded]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FiNavigation className="text-blue-600" size={18} />
            <h3 className="font-black text-gray-900">Pick Delivery Location</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <FiX className="text-gray-500" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for your address, landmark, or area..."
              className="w-full border-2 border-gray-200 focus:border-blue-400 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-colors"
            />
          </div>
          {mapErr && (
            <div className="mt-2 flex items-center gap-2 text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
              <FiAlertCircle size={13} /> {mapErr}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-[300px]">
          {!mapLoaded && !mapErr && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">Loading map…</p>
              </div>
            </div>
          )}
          {mapErr && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center px-8">
                <div className="text-4xl mb-3">🗺️</div>
                <p className="text-sm text-gray-500 mb-2">Map unavailable</p>
                <p className="text-xs text-gray-400">You can still enter your address manually in the form below.</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className={`w-full h-full ${!mapLoaded || mapErr ? "hidden" : ""}`} style={{ minHeight: 300 }} />
        </div>

        {/* Selected address preview */}
        {selected && (
          <div className="px-5 py-3 bg-blue-50 border-t border-blue-100">
            <p className="text-xs font-bold text-blue-700 mb-0.5">Selected Address:</p>
            <p className="text-xs text-blue-600">{selected.fullAddress}</p>
            {selected.state && <p className="text-[10px] text-blue-500 mt-0.5">{selected.city}, {selected.state} – {selected.pincode}</p>}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:border-gray-300 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (selected) { onSelect(selected); onClose(); } }}
            disabled={!selected}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3 rounded-xl font-black text-sm transition-colors flex items-center justify-center gap-2">
            <FiCheck size={15} />
            Use This Location
          </button>
        </div>
      </div>
    </div>
  );
}

// Parse Google Maps address_components into our form fields
function parsePlaceComponents(components = [], fullAddress = "") {
  const get = (type) =>
    components.find((c) => c.types.includes(type))?.long_name || "";
  const getShort = (type) =>
    components.find((c) => c.types.includes(type))?.short_name || "";

  // Map Google's state names to our INDIAN_STATES list
  const rawState = get("administrative_area_level_1");
  const matchedState = INDIAN_STATES.find((s) =>
    s.toLowerCase() === rawState.toLowerCase() ||
    s.toLowerCase().includes(rawState.toLowerCase())
  ) || rawState;

  const streetNumber = get("street_number");
  const route        = get("route");
  const sublocality  = get("sublocality_level_1") || get("sublocality");
  const street       = [streetNumber, route, sublocality].filter(Boolean).join(", ");

  return {
    address:     street || fullAddress.split(",")[0] || "",
    apartment:   get("sublocality_level_2") || "",
    city:        get("locality") || get("administrative_area_level_2") || "",
    state:       matchedState,
    pincode:     get("postal_code"),
    country:     get("country") || "India",
    fullAddress,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COURIER BREAKDOWN BADGE
// ─────────────────────────────────────────────────────────────────────────────
const CourierBreakdown = memo(function CourierBreakdown({ breakdown, isFree, freeThreshold, subtotal, isCOD, isPickup }) {
  if (isPickup) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
        <FiCornerUpLeft className="text-green-500 flex-shrink-0" size={16} />
        <div>
          <p className="text-sm font-black text-green-700">Office Pickup — Free</p>
          <p className="text-xs text-green-600">Collect from our office after we notify you. No delivery charge.</p>
        </div>
      </div>
    );
  }
  if (isFree) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
        <FiTruck className="text-green-500 flex-shrink-0" size={16} />
        <div>
          <p className="text-sm font-black text-green-700">🎉 Free Delivery!</p>
          <p className="text-xs text-green-600">Orders above ₹{freeThreshold} qualify for free shipping.</p>
        </div>
      </div>
    );
  }
  if (!breakdown) {
    return (
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
        <FiTruck className="text-gray-400 flex-shrink-0" size={16} />
        <p className="text-xs text-gray-500">
          Select your state to see delivery charges. Add items worth ₹{freeThreshold}+ for free delivery.
        </p>
      </div>
    );
  }
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <FiTruck className="text-blue-500 flex-shrink-0" size={15} />
        <p className="text-sm font-black text-blue-800">Delivery — {breakdown.rule?.name || 'Standard'}</p>
        <span className="ml-auto text-xs bg-blue-600 text-white font-black px-2 py-0.5 rounded-full">
          ₹{breakdown.charge}
        </span>
      </div>
      {breakdown.estimatedDaysMin && (
        <p className="text-[10px] text-blue-500 mb-2">
          Est. delivery: {breakdown.estimatedDaysMin}–{breakdown.estimatedDaysMax} business days
        </p>
      )}
      {subtotal > 0 && breakdown.amountToFreeDelivery > 0 && (
        <p className="text-[10px] text-blue-500">
          Add ₹{Math.ceil(breakdown.amountToFreeDelivery)} more for FREE delivery 🎁
        </p>
      )}
      {breakdown.freeDelivery && (
        <p className="text-[10px] text-green-600 font-bold mt-1">Free delivery on this order!</p>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS (unchanged from previous)
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
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">{icon}</div>}
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
      {error && <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5 font-medium"><FiAlertCircle size={11} /> {error}</p>}
    </div>
  );
});

const SectionCard = memo(function SectionCard({ title, icon, children, number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm shadow-blue-200">{number}</div>
        <div className="flex items-center gap-2 text-gray-800 font-black text-sm tracking-tight">
          <span className="text-blue-500">{icon}</span>{title}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
});

const OrderItem = memo(function OrderItem({ item }) {
  const rawImage  = Array.isArray(item.image) ? item.image[0] : (item.image || null);
  const qty       = item.quantity ?? item.qty ?? 1;
  const priceGst  = getPriceWithGst(item);
  const gstAmt    = getGstAmount(item);
  const gstRate   = getGstRate(item);
  const mrp       = item.mrp ?? priceGst;
  const disc      = mrp > priceGst ? Math.round(((mrp - priceGst) / mrp) * 100) : 0;
  const weightG   = item.weight ?? item.weightGrams ?? 200;
  return (
    <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0 items-center">
      <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-1.5 overflow-hidden">
        {rawImage ? (
          <img src={resolveUrl(rawImage)} alt={item.name} className="max-w-full max-h-full object-contain"
            onError={(e) => { e.target.src = "https://placehold.co/56x56?text=📦"; }} />
        ) : <img src="https://placehold.co/56x56?text=📦" alt={item.name} className="max-w-full max-h-full object-contain" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{item.name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Qty {qty} · {weightG}g/unit</p>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {disc > 0 && <span className="text-[10px] bg-green-50 text-green-600 font-bold px-1.5 py-0.5 rounded-full border border-green-100">{disc}% off</span>}
          <span className="text-[9px] bg-amber-50 text-amber-600 font-bold px-1.5 py-0.5 rounded-full border border-amber-100">GST {gstRate}%</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black text-gray-900">₹{(priceGst * qty).toFixed(2)}</p>
        {mrp > priceGst && <p className="text-[10px] text-gray-400 line-through">₹{(mrp * qty).toFixed(2)}</p>}
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
        <p className="text-xs font-bold text-amber-700">Total GST on this order: ₹{totalGst.toFixed(2)}</p>
        <button onClick={onToggle} className="text-[10px] text-amber-600 underline mt-0.5">
          {showGstBreakdown ? "Hide" : "View"} item-wise GST breakdown
        </button>
        {showGstBreakdown && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-amber-100 bg-white">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-amber-50">
                  {["Item","Qty","Base","GST%","GST Amt","Total"].map((h) => (
                    <th key={h} className={`${h==="Item"?"text-left":"text-right"} px-3 py-2 text-amber-600 font-bold whitespace-nowrap`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => {
                  const qty = item.quantity ?? item.qty ?? 1;
                  return (
                    <tr key={item.id || item._id} className="border-b border-gray-50 last:border-0">
                      <td className="px-3 py-2 text-gray-700 font-semibold truncate max-w-[100px]">{item.name}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{qty}</td>
                      <td className="px-3 py-2 text-right text-gray-500">₹{(getBasePrice(item)*qty).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-amber-600 font-bold">{getGstRate(item)}%</td>
                      <td className="px-3 py-2 text-right text-amber-600 font-bold">₹{(getGstAmount(item)*qty).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-gray-900 font-black">₹{(getPriceWithGst(item)*qty).toFixed(2)}</td>
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
  totalBase, totalGst, subtotal, deliveryCharge, deliveryInfo, isFreeDelivery,
  grandTotal, paymentMethod, showGstBreakdown, onToggleGst,
  appliedCoupon, couponDiscount, deliveryMethod,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-gray-900 text-base">Order Summary</h2>
        <Link to="/cart" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
          <FiEdit2 size={11} /> Edit
        </Link>
      </div>
      <div className="max-h-56 overflow-y-auto">
        {cartItems.map((item) => <OrderItem key={item.id || item._id} item={item} />)}
      </div>
      <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
        <div className="flex justify-between text-gray-500">
          <span>MRP ({totalItems} item{totalItems > 1 ? "s" : ""})</span>
          <span className="font-semibold text-gray-700">₹{mrpTotal.toFixed(2)}</span>
        </div>
        {savedOnMrp > 0 && (
          <div className="flex justify-between text-green-600 font-semibold">
            <span>Discount on MRP</span><span>− ₹{savedOnMrp.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-400 text-xs">
          <span>Subtotal (excl. GST)</span><span>₹{totalBase.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-amber-600 text-xs font-semibold">
          <span className="flex items-center gap-1"><FiTag size={10} /> GST (~{DEFAULT_GST_RATE}%)</span>
          <span>+ ₹{totalGst.toFixed(2)}</span>
        </div>
        {couponDiscount > 0 && appliedCoupon && (
          <div className="flex justify-between text-green-600 font-semibold">
            <span className="flex items-center gap-1"><FiTag size={11} /> Coupon ({appliedCoupon.code})</span>
            <span>− ₹{couponDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-500">
          <span className="flex items-center gap-1"><FiTruck size={11} /> Delivery</span>
          {deliveryMethod === 'pickup'
            ? <span className="font-bold text-green-600">FREE (Pickup) 🎉</span>
            : isFreeDelivery
              ? <span className="font-bold text-green-600">FREE 🎉</span>
              : deliveryInfo
                ? <span className="font-semibold text-gray-700">₹{deliveryCharge}</span>
                : <span className="text-gray-400 italic text-xs">Select state</span>
          }
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
          <p className="text-xs text-green-700 font-black">🎉 You save ₹{(savedOnMrp + couponDiscount).toFixed(2)} on this order!</p>
        </div>
      )}
      <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2.5">
        <div className="text-blue-500">{PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.icon}</div>
        <p className="text-xs font-bold text-blue-700">{PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}</p>
      </div>
      <div className="space-y-2.5 border-t border-gray-100 pt-4">
        {[
          { icon: <FiLock className="text-blue-500" size={13} />,      text: "100% Secure Payments"     },
          { icon: <FiTruck className="text-green-500" size={13} />,    text: `Free delivery above ₹${FREE_DELIVERY_THRESHOLD}` },
          { icon: <FiRotateCcw className="text-orange-500" size={13}/>, text: "30-day easy returns"     },
          { icon: <FiShield className="text-purple-500" size={13} />,  text: "1-year warranty"          },
        ].map((b) => (
          <div key={b.text} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">{b.icon}</div>
            <p className="text-xs text-gray-500">{b.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

function AuthGuardModal({ onLogin, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiUser className="text-blue-600 text-3xl" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Login Required</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">Please login to proceed with checkout.</p>
        <div className="flex flex-col gap-3">
          <button onClick={onLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black text-sm transition-colors">Login / Sign Up</button>
          <button onClick={onClose} className="w-full border-2 border-gray-200 text-gray-600 hover:border-gray-300 py-3 rounded-xl font-bold text-sm transition-colors">Continue as Guest</button>
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

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || subtotal === 0) return 0;
    const { type, value, maxDiscount } = appliedCoupon;
    let d = type === "percent" ? Math.round((subtotal * (value ?? 0)) / 100) : (value ?? 0);
    if (maxDiscount) d = Math.min(d, maxDiscount);
    return Math.min(d, subtotal);
  }, [appliedCoupon, subtotal]);

  const [checkoutStep,     setCheckoutStep]    = useState(1);
  const [showAuthModal,    setShowAuthModal]    = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMapPicker,    setShowMapPicker]    = useState(false);
  const [showGstBreakdown, setShowGstBreakdown] = useState(false);
  const [errors,           setErrors]           = useState({});
  const [rzpLoading,       setRzpLoading]       = useState(false);
  const [deliveryMethod,   setDeliveryMethod]   = useState('delivery'); // 'delivery' | 'pickup'
  const [deliverySpeed,    setDeliverySpeed]    = useState('standard'); // 'standard' | 'express' | 'same_day'
  const [deliveryInfo,     setDeliveryInfo]     = useState(null);       // from /api/delivery/calculate
  const [codAvailable,     setCodAvailable]     = useState(true);
  const [deliveryLoading,  setDeliveryLoading]  = useState(false);

  const SPEED_OPTIONS = [
    { id: 'standard', label: 'Standard', sub: '4–7 days', charge: 49 },
  ]

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    phone: "", address: "", apartment: "",
    city: "", state: "", pincode: "",
    country: "India", orderNotes: "",
  });

  const stableRef = useRef({});

  // ── WEIGHT CALCULATION ─────────────────────────────────────────────────────
  const totalWeightGrams = useMemo(() => calcTotalWeightGrams(cartItems), [cartItems]);

  // ── DELIVERY CALCULATION (backend API) ────────────────────────────────────
  useEffect(() => {
    if (deliveryMethod === 'pickup') {
      setDeliveryInfo(null)
      return
    }
    if (!form.state) { setDeliveryInfo(null); return }
    let cancelled = false
    const timer = setTimeout(async () => {
      setDeliveryLoading(true)
      try {
        const { data } = await axios.post(`${backendUrl}/api/delivery/calculate`, {
          subtotal:  subtotal - couponDiscount,
          weight:    totalWeightGrams / 1000, // grams → kg
          state:     form.state,
          method:    deliverySpeed,
        })
        if (!cancelled && data.success) setDeliveryInfo(data)
        else if (!cancelled) setDeliveryInfo(null)
      } catch {
        if (!cancelled) setDeliveryInfo(null)
      } finally {
        if (!cancelled) setDeliveryLoading(false)
      }
    }, 400)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [form.state, totalWeightGrams, subtotal, couponDiscount, deliveryMethod, deliverySpeed])

  // ── DERIVED VALUES ────────────────────────────────────────────────────────
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD || deliveryMethod === 'pickup';
  const dc = deliveryMethod === 'pickup' ? 0 : (deliveryInfo?.charge ?? 0);
  const deliveryCharge = isFreeDelivery ? 0 : dc;
  const grandTotal     = Math.max(subtotal + deliveryCharge - couponDiscount, 0);
  const totalItems     = cartItems.reduce((s, i) => s + (i.quantity ?? i.qty ?? 1), 0);
  const savedOnMrp     = Math.max(mrpTotal - subtotal, 0);
  const isCODEligible  = grandTotal >= COD_MINIMUM && codAvailable;

  // ── COD availability check ────────────────────────────────────────────────
  useEffect(() => {
    if (deliveryMethod === 'pickup') { setCodAvailable(false); return }
    if (!form.state) { setCodAvailable(true); return }
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await axios.post(`${backendUrl}/api/cod/check`, { state: form.state, orderValue: grandTotal })
        if (!cancelled) setCodAvailable(data.success && data.available)
      } catch {
        if (!cancelled) setCodAvailable(true)
      }
    })()
    return () => { cancelled = true }
  }, [form.state, grandTotal, deliveryMethod])

  const normalizedItems = cartItems.map((item) => ({
    ...item,
    name:   sanitizeStr(item.name),
    image:  Array.isArray(item.image) ? item.image[0] : (item.image || ""),
    price:  getPriceWithGst(item),
    weight: item.weight ?? item.weightGrams ?? 200,
  }));

  const addressObj = {
    firstName:  sanitizeStr(form.firstName),
    lastName:   sanitizeStr(form.lastName),
    email:      sanitizeStr(form.email).toLowerCase(),
    phone:      sanitizeStr(form.phone),
    street:     sanitizeStr(form.address),
    apartment:  sanitizeStr(form.apartment),
    city:       sanitizeStr(form.city),
    state:      sanitizeStr(form.state),
    pincode:    sanitizeStr(form.pincode),
    country:    sanitizeStr(form.country) || "India",
  };

  stableRef.current = {
    grandTotal, deliveryCharge, totalGst, totalItems,
    normalizedItems, addressObj, form,
    appliedCoupon, couponDiscount,
    userId: user?._id ?? user?.id ?? null,
    deliveryInfo, deliveryMethod, deliverySpeed,
    totalWeightGrams,
  };

  // ── Pre-load SDKs ──────────────────────────────────────────────────────────
  useEffect(() => { loadRazorpaySDK(); }, []);
  useEffect(() => { if (GOOGLE_MAPS_KEY) loadGoogleMapsSDK(GOOGLE_MAPS_KEY); }, []);

  // ── Pre-fill from user ─────────────────────────────────────────────────────
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

  // ── Order status reactions ─────────────────────────────────────────────────
  useEffect(() => {
    if (orderStatus === "success") {
      setShowPaymentModal(false); setRzpLoading(false);
      dispatch(clearCart()); dispatch(resetOrder());
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate("/orders");
    }
    if (orderStatus === "failed") { setRzpLoading(false); setShowPaymentModal(false); }
  }, [orderStatus, dispatch, navigate]);

  const handleToggleGst = useCallback(() => setShowGstBreakdown((v) => !v), []);

  // ── Map location selected ──────────────────────────────────────────────────
  const handleMapSelect = useCallback((parsed) => {
    setForm((prev) => ({
      ...prev,
      address:   parsed.address   || prev.address,
      apartment: parsed.apartment || prev.apartment,
      city:      parsed.city      || prev.city,
      state:     parsed.state     || prev.state,
      pincode:   parsed.pincode   || prev.pincode,
      country:   parsed.country   || prev.country,
    }));
    // Clear relevant errors
    setErrors((prev) => ({
      ...prev, address: "", city: "", state: "", pincode: "",
    }));
  }, []);

  // ─── EMPTY CART GUARD ──────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm max-w-sm w-full">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-xl font-black text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-6">Add products before proceeding to checkout.</p>
          <Link to="/collection" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold text-sm transition-colors">
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
    if (!v("firstName"))                e.firstName = "First name is required";
    else if (v("firstName").length < 2) e.firstName = "Must be at least 2 characters";
    if (!v("lastName"))                 e.lastName  = "Last name is required";
    if (!v("email"))                    e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email"))) e.email = "Enter a valid email";
    const rawPhone   = v("phone").replace(/[\s\-().+]/g, "");
    const digitsOnly = rawPhone.replace(/^91|^0/, "");
    if (!rawPhone)                              e.phone = "Mobile number is required";
    else if (!/^[6-9]\d{9}$/.test(digitsOnly)) e.phone = "Enter a valid 10-digit Indian mobile number";
    if (deliveryMethod !== 'pickup') {
      if (!v("address"))                e.address = "Street address is required";
      else if (v("address").length < 5) e.address = "Please enter a complete address";
      if (!v("city"))    e.city    = "City is required";
      if (!form.state)   e.state   = "Please select your state";
      if (!v("pincode")) e.pincode = "PIN code is required";
      else if (!/^\d{6}$/.test(v("pincode"))) e.pincode = "Enter a valid 6-digit PIN code";
    }
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
    setCheckoutStep(2); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── COD ──────────────────────────────────────────────────────────────────
  const handleConfirmCOD = useCallback(() => {
    if (!isCODEligible) { dispatch(setOrderError(`COD requires minimum ₹${COD_MINIMUM}.`)); return; }
    const s = stableRef.current;
    dispatch(placeCODOrder({
      userId:          s.userId,
      items:           s.normalizedItems,
      address:         s.addressObj,
      couponCode:      sanitizeStr(s.appliedCoupon?.code ?? ""),
      customerNote:    sanitizeStr(s.form.orderNotes ?? ""),
      deliveryCharge:  s.deliveryCharge,
      deliveryMethod:  s.deliveryMethod,
      deliveryName:    s.deliveryInfo?.rule?.name || (s.deliveryMethod === 'pickup' ? 'Office Pickup' : (SPEED_OPTIONS.find(sp => sp.id === s.deliverySpeed)?.label || 'Standard Delivery')),
      totalWeightGrams: s.totalWeightGrams,
    }));
  }, [isCODEligible, dispatch]);

  // ─── RAZORPAY ─────────────────────────────────────────────────────────────
  const initiateRazorpay = useCallback(async () => {
    dispatch(clearOrderError()); setShowPaymentModal(false); setRzpLoading(true);
    if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID.includes("XXXX")) {
      dispatch(setOrderError("Payment gateway not configured.")); setRzpLoading(false); return;
    }
    const sdkLoaded = await loadRazorpaySDK();
    if (!sdkLoaded || !window.Razorpay) {
      dispatch(setOrderError("Payment gateway failed to load.")); setRzpLoading(false); return;
    }
    const s = stableRef.current;
    if (!s.grandTotal || s.grandTotal <= 0) {
      dispatch(setOrderError("Invalid order amount.")); setRzpLoading(false); return;
    }
    const result = await dispatch(createRazorpayOrder({
      userId:          s.userId,
      items:           s.normalizedItems,
      address:         s.addressObj,
      couponCode:      sanitizeStr(s.appliedCoupon?.code ?? ""),
      customerNote:    sanitizeStr(s.form.orderNotes ?? ""),
      deliveryCharge:  s.deliveryCharge,
      deliveryMethod:  s.deliveryMethod,
      deliveryName:    s.deliveryInfo?.rule?.name || (s.deliveryMethod === 'pickup' ? 'Office Pickup' : (SPEED_OPTIONS.find(sp => sp.id === s.deliverySpeed)?.label || 'Standard Delivery')),
      totalWeightGrams: s.totalWeightGrams,
    }));
    if (createRazorpayOrder.rejected.match(result)) { setRzpLoading(false); return; }
    const payload      = result.payload;
    const rzpOrderId   = payload?.razorpayOrderId || payload?.id || "";
    const mongoOrderId = payload?.orderId || payload?._id || "";
    const amountPaise  = payload?.amount;
    const currency     = payload?.currency || "INR";
    if (!rzpOrderId || !rzpOrderId.startsWith("order_")) {
      dispatch(setOrderError("Invalid Razorpay order. (Code: RZP-OID)")); setRzpLoading(false); return;
    }
    if (!amountPaise || !Number.isInteger(amountPaise) || amountPaise <= 0) {
      dispatch(setOrderError("Invalid payment amount. (Code: RZP-AMT)")); setRzpLoading(false); return;
    }
    if (!mongoOrderId) {
      dispatch(setOrderError("Order record missing. (Code: RZP-MID)")); setRzpLoading(false); return;
    }
    const fresh = stableRef.current;
    const options = {
      key: RAZORPAY_KEY_ID, amount: amountPaise, currency,
      name: "Amulya Electronics", order_id: rzpOrderId,
      description: `Order — ${fresh.totalItems} item${fresh.totalItems > 1 ? "s" : ""}`,
      image: "https://amulyaelectronics.com/wp-content/uploads/2026/01/CONNECT-WITH-ELECTRONICS-1.png",
      prefill: {
        name:    sanitizeStr(`${fresh.form.firstName} ${fresh.form.lastName}`),
        email:   sanitizeStr(fresh.form.email).toLowerCase(),
        contact: fresh.form.phone.replace(/[\s\-().]/g, ""),
      },
      notes: { item_count: String(fresh.totalItems), coupon_applied: fresh.appliedCoupon?.code ? "yes" : "no" },
      theme: { color: "#2563eb" }, remember_customer: false,
      handler: (response) => {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          dispatch(setOrderError("Payment verification failed: incomplete tokens.")); setRzpLoading(false); return;
        }
        dispatch(verifyRazorpayPayment({ orderId: mongoOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }));
      },
      modal: { ondismiss: () => { dispatch(clearOrderError()); setRzpLoading(false); }, backdropclose: false, escape: true },
    };
    let rzp;
    try { rzp = new window.Razorpay(options); }
    catch (err) { dispatch(setOrderError("Failed to initialize payment gateway.")); setRzpLoading(false); return; }
    rzp.on("payment.failed", (response) => {
      dispatch(setOrderError(response?.error?.description || "Payment failed. Try a different method."));
      setRzpLoading(false);
    });
    rzp.open();
  }, [dispatch]);

  const handlePlaceOrderClick = () => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    if (paymentMethod === "cod" && !isCODEligible) {
      dispatch(setOrderError(`COD requires minimum ₹${COD_MINIMUM}.`)); return;
    }
    if (paymentMethod === "razorpay") initiateRazorpay();
    else setShowPaymentModal(true);
  };

  const handleLoginRedirect = () => { setShowAuthModal(false); navigate("/login", { state: { from: "/checkout" } }); };
  const handleGuestContinue = () => { setShowAuthModal(false); handlePlaceOrderClick(); };

  const gstBreakdownProps = { cartItems, totalGst, totalBase, subtotal, showGstBreakdown, onToggle: handleToggleGst };
  const summaryProps = {
    cartItems, totalItems, mrpTotal, savedOnMrp, totalBase, totalGst,
    subtotal, deliveryCharge, deliveryInfo, isFreeDelivery,
    grandTotal, paymentMethod, showGstBreakdown, onToggleGst: handleToggleGst,
    appliedCoupon, couponDiscount, deliveryMethod,
  };

  return (
    <>
      {showAuthModal && <AuthGuardModal onLogin={handleLoginRedirect} onClose={handleGuestContinue} />}
      {showMapPicker && <MapPickerModal onClose={() => setShowMapPicker(false)} onSelect={handleMapSelect} />}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => { if (!["placingCOD"].includes(orderStatus)) { setShowPaymentModal(false); dispatch(clearOrderError()); } }}
        grandTotal={grandTotal} totalGst={totalGst}
        paymentMethod={paymentMethod} orderStatus={orderStatus}
        orderError={orderError} orderId={orderId}
        paymentId={paymentId} allOrders={allOrders}
        onConfirmCOD={handleConfirmCOD}
        onRetry={() => { dispatch(clearOrderError()); setShowPaymentModal(false); }}
      />

      <div className="bg-gray-50 min-h-screen">

        {/* BREADCRUMB */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-[1200px] mx-auto flex items-center gap-1.5 text-sm text-gray-400 flex-wrap">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <FiChevronRight size={12} />
            <Link to="/cart" className="hover:text-blue-600 transition-colors">Cart</Link>
            <FiChevronRight size={12} />
            <span className="text-gray-700 font-semibold">Checkout</span>
            <span className="ml-auto text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-semibold hidden sm:inline-block">
              All prices inclusive of GST · Shipped from Dharwad, Karnataka
            </span>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="max-w-[1200px] mx-auto flex items-center justify-center">
            {[{ n: 1, label: "Billing Details" }, { n: 2, label: "Review Order" }, { n: 3, label: "Confirmation" }].map((s, i) => (
              <div key={s.n} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300
                    ${checkoutStep > s.n ? "bg-green-500 text-white shadow-sm shadow-green-200" :
                      checkoutStep === s.n ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-gray-100 text-gray-400"}`}>
                    {checkoutStep > s.n ? <FiCheck size={13} strokeWidth={3} /> : s.n}
                  </div>
                  <span className={`text-xs font-bold hidden sm:block transition-colors ${
                    checkoutStep === s.n ? "text-blue-600" : checkoutStep > s.n ? "text-green-600" : "text-gray-400"
                  }`}>{s.label}</span>
                </div>
                {i < 2 && <div className={`w-10 sm:w-20 h-0.5 mx-2 transition-all duration-500 rounded-full ${checkoutStep > s.n ? "bg-green-400" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            {checkoutStep === 2 && (
              <button onClick={() => setCheckoutStep(1)} className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-blue-600">
                <FiArrowLeft size={18} />
              </button>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              {checkoutStep === 1 ? "Billing Details" : "Review Your Order"}
            </h1>
          </div>

          {/* Banners */}
          {isLoggedIn && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-sm font-bold text-blue-800">Logged in as <span className="text-blue-600">{user?.name || user?.email}</span></p>
                <p className="text-xs text-blue-500">Your details have been pre-filled</p>
              </div>
            </div>
          )}
          {!isLoggedIn && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <FiAlertCircle className="text-amber-500 flex-shrink-0" size={18} />
                <p className="text-sm text-amber-800 font-medium"><span className="font-black">Not logged in.</span> Login to track orders.</p>
              </div>
              <Link to="/login" state={{ from: "/checkout" }} className="text-xs font-black text-blue-600 hover:underline bg-white px-3 py-1.5 rounded-full border border-blue-100 flex-shrink-0">
                Login / Sign Up
              </Link>
            </div>
          )}
          {appliedCoupon && couponDiscount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
              <FiTag className="text-green-500 flex-shrink-0" size={16} />
              <p className="text-sm font-bold text-green-700">
                Coupon <span className="font-black">{appliedCoupon.code}</span> applied — save ₹{couponDiscount.toFixed(2)}
              </p>
              <Link to="/cart" className="ml-auto text-xs text-blue-600 font-bold hover:underline flex-shrink-0">Change</Link>
            </div>
          )}
          {orderError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
              <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700 font-medium flex-1">{orderError}</p>
              <button onClick={() => dispatch(clearOrderError())} className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0">✕</button>
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
                  {/* ── DELIVERY METHOD SELECTOR ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm shadow-blue-200">
                        <FiTruck size={12} />
                      </div>
                      <span className="text-gray-800 font-black text-sm tracking-tight">Delivery Method</span>
                    </div>
                    <div className="p-5">
                      <div className="flex gap-3">
                        {[
                          { id: 'delivery', label: 'Deliver to my address', icon: <FiTruck size={16} />, desc: 'We ship to your door' },
                          { id: 'pickup', label: 'Pick up from office', icon: <FiCornerUpLeft size={16} />, desc: 'Collect from our office — no delivery charge' },
                        ].map((opt) => (
                          <button key={opt.id} type="button" onClick={() => { setDeliveryMethod(opt.id); if (opt.id === 'pickup') dispatch(setPaymentMethod('razorpay')) }}
                            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                              deliveryMethod === opt.id
                                ? 'border-blue-400 bg-blue-50 shadow-sm shadow-blue-100'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}>
                            <span className={`${deliveryMethod === opt.id ? 'text-blue-600' : 'text-gray-400'}`}>{opt.icon}</span>
                            <span className="text-sm font-black text-gray-800">{opt.label}</span>
                            <span className="text-[10px] text-gray-400">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                      {deliveryMethod === 'delivery' && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Speed</p>
                          <div className="flex gap-2">
                            {SPEED_OPTIONS.map(sp => (
                              <button key={sp.id} type="button" onClick={() => setDeliverySpeed(sp.id)}
                                className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-center transition-all ${
                                  deliverySpeed === sp.id
                                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}>
                                <p className={`text-xs font-bold ${deliverySpeed === sp.id ? 'text-blue-700' : 'text-gray-800'}`}>{sp.label}</p>
                                <p className={`text-[10px] ${deliverySpeed === sp.id ? 'text-blue-500' : 'text-gray-400'}`}>{sp.sub}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <SectionCard title="Contact Information" icon={<FiUser size={14} />} number="1">
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="First Name"    name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} placeholder="Rohith"           required icon={<FiUser  size={13} />} />
                      <InputField label="Last Name"     name="lastName"  value={form.lastName}  onChange={handleChange} error={errors.lastName}  placeholder="Kumar"                     />
                      <InputField label="Email Address" name="email"     value={form.email}     onChange={handleChange} error={errors.email}     placeholder="rohith@email.com" required icon={<FiMail  size={13} />} span2 type="email" />
                      <InputField label="Mobile Number" name="phone"     value={form.phone}     onChange={handleChange} error={errors.phone}     placeholder="9876543210"      required icon={<FiPhone size={13} />} span2 type="tel" />
                    </div>
                  </SectionCard>

                  {/* ── DELIVERY ADDRESS with MAP PICKER ── */}
                  {deliveryMethod !== 'pickup' && (
                  <SectionCard title="Delivery Address" icon={<FiMapPin size={14} />} number="2">
                    <div className="mb-4">
                      <button type="button" onClick={() => setShowMapPicker(true)}
                        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl py-3 text-sm font-bold transition-all">
                        <FiNavigation size={15} />
                        📍 Pick Location from Google Maps
                      </button>
                      <p className="text-center text-[10px] text-gray-400 mt-1.5">Or fill in manually below ↓</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Street Address"               name="address"   value={form.address}   onChange={handleChange} error={errors.address} placeholder="House No., Street, Colony" required icon={<FiHome size={13} />} span2 />
                      <InputField label="Apartment / Floor (Optional)" name="apartment" value={form.apartment} onChange={handleChange} placeholder="Flat 4B, 2nd Floor" span2 />
                      <InputField label="City / Town"                  name="city"      value={form.city}      onChange={handleChange} error={errors.city}    placeholder="Bengaluru" required />
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">State <span className="text-red-500">*</span></label>
                        <select name="state" value={form.state} onChange={handleChange}
                          className={`w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition-all bg-white cursor-pointer appearance-none
                            ${errors.state ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 focus:border-blue-500 hover:border-gray-300 text-gray-700"}`}>
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.state && <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5 font-medium"><FiAlertCircle size={11} /> {errors.state}</p>}
                      </div>
                      <InputField label="PIN Code" name="pincode" value={form.pincode} onChange={handleChange} error={errors.pincode} placeholder="560001" required />
                      <InputField label="Country"  name="country" value={form.country} onChange={handleChange} placeholder="India" span2 />
                    </div>
                    <div className="mt-4">
                      <CourierBreakdown
                        breakdown={deliveryInfo}
                        isFree={isFreeDelivery}
                        freeThreshold={FREE_DELIVERY_THRESHOLD}
                        subtotal={subtotal}
                        isPickup={false}
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                      <FiTruck size={11} className="text-gray-400 flex-shrink-0" />
                      <span>Shipped from <span className="font-bold text-gray-600">Dharwad, Karnataka 580001</span> · Total weight: <span className="font-bold text-gray-600">{totalWeightGrams}g</span></span>
                    </div>
                  </SectionCard>
                  )}
                  {deliveryMethod === 'pickup' && (
                    <CourierBreakdown isPickup={true} />
                  )}

                  <SectionCard title="Payment Method" icon={<FiCreditCard size={14} />} number="3">
                    <div className="space-y-3">
                      {PAYMENT_METHODS.map((pm) => {
                        const isCodHidden = pm.id === "cod" && deliveryMethod === 'pickup'
                        const disabled = pm.id === "cod" && (!isCODEligible || deliveryMethod === 'pickup')
                        if (isCodHidden) return null
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
                                {pm.id === "cod" && !disabled && !codAvailable && (
                                  <span className="text-[10px] bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full">Not available for {form.state}</span>
                                )}
                                {disabled && pm.id === "cod" && <span className="text-[10px] bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full">Min ₹{COD_MINIMUM}</span>}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">{pm.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>

                  <GstBreakdownSection {...gstBreakdownProps} />

                      {/*   <SectionCard title="Order Notes (Optional)" icon={<FiEdit2 size={14} />} number="4">
                    <textarea name="orderNotes" value={form.orderNotes} onChange={handleChange} rows={3}
                      placeholder="Special instructions for delivery, packaging, or handling..."
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none hover:border-gray-300 transition-colors placeholder-gray-300" />
                  </SectionCard> */}

                 

                  <div className="lg:hidden"><SummaryPanel {...summaryProps} /></div>

                  <button onClick={handleContinue}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-4 rounded-xl font-black text-base shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all flex items-center justify-center gap-2">
                    procced to payments <FiChevronRight size={18} />
                  </button>
                </>
              )}

              {/* ════════ STEP 2 ════════ */}
              {checkoutStep === 2 && (
                <>
                  <SectionCard title={deliveryMethod === 'pickup' ? 'Contact & Pickup Details' : 'Billing & Shipping Details'} icon={<FiMapPin size={14} />} number="1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Contact</p>
                        <p className="font-bold text-gray-900">{form.firstName} {form.lastName}</p>
                        <p className="text-gray-500 mt-0.5">{form.email}</p>
                        <p className="text-gray-500">{form.phone}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">{deliveryMethod === 'pickup' ? 'Pickup Method' : 'Delivery Address'}</p>
                        {deliveryMethod === 'pickup' ? (
                          <div>
                            <p className="font-bold text-green-700 text-sm">📦 Office Pickup</p>
                            <p className="text-xs text-gray-500 mt-1">Collect from our office after notification &mdash; ₹0 charge</p>
                          </div>
                        ) : (
                          <p className="text-gray-700 leading-relaxed text-xs">
                            {form.address}{form.apartment ? `, ${form.apartment}` : ""}<br />
                            {form.city}, {form.state} – {form.pincode}<br />
                            {form.country}
                          </p>
                        )}
                      </div>
                    </div>
                    {deliveryMethod !== 'pickup' && form.state && (
                      <div className="mt-3">
                        <CourierBreakdown breakdown={deliveryInfo} isFree={isFreeDelivery} freeThreshold={FREE_DELIVERY_THRESHOLD} subtotal={subtotal} isPickup={false} />
                      </div>
                    )}
                    {deliveryMethod === 'pickup' && (
                      <div className="mt-3">
                        <CourierBreakdown isPickup={true} />
                      </div>
                    )}
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
                    {cartItems.map((item) => <OrderItem key={item.id || item._id} item={item} />)}
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
                        {paymentMethod === "razorpay"
                          ? `Pay ₹${grandTotal.toFixed(2)} via Razorpay`
                          : `Place Order · ₹${grandTotal.toFixed(2)} (COD)`}
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-amber-600 font-medium">
                    Amount includes ₹{totalGst.toFixed(2)} GST
                    {!isFreeDelivery && deliveryInfo && ` + ₹${deliveryCharge} delivery (${deliveryInfo?.rule?.name || 'Standard'})`}
                  </p>

                  {!isLoggedIn && (
                    <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <FiAlertCircle className="text-amber-500 flex-shrink-0" size={15} />
                      <p className="text-xs text-amber-700 font-medium text-center">
                        You'll be prompted to{" "}
                        <button onClick={() => setShowAuthModal(true)} className="font-black text-blue-600 underline">login</button>
                        {" "}before payment.
                      </p>
                    </div>
                  )}
                  <p className="text-center text-xs text-gray-400 leading-relaxed">
                    By placing this order, you agree to our{" "}
                    <Link to="/terms-conditions" className="text-blue-500 hover:underline">Terms & Conditions</Link>{" "}and{" "}
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