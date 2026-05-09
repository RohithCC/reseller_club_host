// src/pages/OrderDetails.jsx  —  Route: /orders/:orderNumber
//
// ✅ Field mapping from REAL API response:
//   order.status              → lowercase: "placed"|"confirmed"|"shipped"|"delivered"|"cancelled"
//   order.grandTotal          → total (NOT order.amount)
//   order.savedAmount         → directly on order
//   order.createdAt           → ISO string (NOT order.date unix ms)
//   order.payment             → OBJECT { method, status, razorpayOrderId, razorpayPaymentId, paidAt }
//   order.billing             → address { firstName, lastName, email, phone, address, apartment, city, state, pincode, country, orderNotes }
//   order.items[].mrp         → original price (NOT item.originalPrice)
//   order.tracking            → { provider, courierName, trackingId, trackingNumber, trackingUrl }
//   order.statusHistory       → [{ status, message, location, updatedBy, at }]  ★ admin updates feed here
//
// ✅ Cancel rules:
//   - Only visible for status "placed" or "confirmed"
//   - HIDDEN when payment is already "paid" (online paid users must contact support for refund)
//   - COD pending orders CAN be self-cancelled
//
import { useEffect, useState }          from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector }     from "react-redux";
import {
  FiArrowLeft, FiPackage, FiMapPin, FiCreditCard,
  FiCheck, FiAlertCircle, FiClock, FiTruck,
  FiX, FiRefreshCw, FiDollarSign,
  FiShield, FiCopy, FiChevronRight, FiMessageSquare,
} from "react-icons/fi";
import {
  fetchOrderDetail,
  cancelUserOrder,
  clearCurrentOrder,
  clearOrderErrors,
  selectCurrentOrder,
  selectLoadingOrder,
  selectOrderError,
  selectCancelling,
  selectCancelError,
} from "../app/orderDetailsSlice";
import { selectIsLoggedIn } from "../app/authSlice";
 
// ── Status config — lowercase matching real API ───────────────────────────────
const STATUS_META = {
  placed:     { label: "Order Placed",     color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500"     },
  confirmed:  { label: "Confirmed",        color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500"   },
  processing: { label: "Processing",       color: "bg-amber-100 text-amber-700",   dot: "bg-amber-500"    },
  shipped:    { label: "Out for Delivery", color: "bg-purple-100 text-purple-700", dot: "bg-purple-500"   },
  delivered:  { label: "Delivered",        color: "bg-green-100 text-green-700",   dot: "bg-green-500"    },
  cancelled:  { label: "Cancelled",        color: "bg-red-100 text-red-700",       dot: "bg-red-500"      },
  refunded:   { label: "Refunded",         color: "bg-gray-100 text-gray-700",     dot: "bg-gray-500"     },
};
const DEFAULT_STATUS = { label: "Order Placed", color: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
 
const ORDER_STEPS = [
  { key: "placed",    label: "Placed"    },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped",   label: "Shipped"   },
  { key: "delivered", label: "Delivered" },
];
 
const CANCELLABLE_STATUSES = ["placed", "confirmed"];
 
// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
  : "—";
const fmtDateTime = (d) => d
  ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "—";
const fmtPrice = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
 
// ── Small components ──────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="ml-1 text-gray-300 hover:text-blue-500 transition-colors">
      {copied ? <FiCheck size={11} className="text-green-500" /> : <FiCopy size={11} />}
    </button>
  );
}
 
function Badge({ label, colorClass }) {
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${colorClass}`}>{label}</span>;
}
 
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-semibold">{label}</span>
      <span className="text-xs font-bold text-gray-800">{value}</span>
    </div>
  );
}
 
function SectionCard({ title, Icon, children, accent = "blue" }) {
  const colors = { blue: "text-blue-500", green: "text-green-500", amber: "text-amber-500", purple: "text-purple-500" };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
        <Icon className={colors[accent] ?? "text-blue-500"} size={15} />
        <h3 className="font-black text-gray-800 text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
 
// ── Order progress timeline (top-level status stepper) ───────────────────────
function OrderTimeline({ status }) {
  const isBad = ["cancelled", "refunded"].includes(status);
  const idx   = ORDER_STEPS.findIndex((s) => s.key === status);
 
  if (isBad) return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
        <FiX className="text-red-600" size={14} />
      </div>
      <div>
        <p className="text-sm font-black text-red-700">
          {status === "refunded" ? "Order Refunded" : "Order Cancelled"}
        </p>
        <p className="text-xs text-red-400 mt-0.5">This order cannot be modified.</p>
      </div>
    </div>
  );
 
  return (
    <div className="relative">
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100" />
      <div className="absolute top-4 left-4 h-0.5 bg-blue-400 transition-all duration-700"
        style={{ width: idx >= 0 ? `${(idx / (ORDER_STEPS.length - 1)) * 100}%` : "0%" }} />
      <div className="relative flex justify-between">
        {ORDER_STEPS.map((step, i) => {
          const done = idx >= i;
          const cur  = idx === i;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300
                ${done ? cur ? "border-blue-500 bg-blue-500 shadow-md shadow-blue-200" : "border-green-500 bg-green-500" : "border-gray-200 bg-white"}`}>
                {done ? <FiCheck className="text-white" size={13} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
              </div>
              <span className={`text-[9px] font-bold text-center leading-tight ${done ? cur ? "text-blue-600" : "text-green-600" : "text-gray-300"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
 
// ── ★ NEW — Status History Timeline ──────────────────────────────────────────
// Displays every admin update (from order.statusHistory) as a vertical feed:
// status badge, message, location, timestamp. Newest at top.
function StatusHistoryTimeline({ history }) {
  if (!Array.isArray(history) || history.length === 0) {
    return (
      <div className="text-center py-6">
        <FiClock className="text-gray-200 mx-auto mb-2" size={32} />
        <p className="text-xs text-gray-400">No updates yet — we'll notify you as your order progresses.</p>
      </div>
    );
  }
 
  // newest first
  const sorted = [...history].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
 
  return (
    <div className="relative pl-6 border-l-2 border-gray-100 space-y-5">
      {sorted.map((entry, i) => {
        const meta = STATUS_META[entry.status] ?? DEFAULT_STATUS;
        const isLatest = i === 0;
        return (
          <div key={i} className="relative">
            {/* Dot on the timeline */}
            <span className={`absolute -left-[29px] top-1 w-4 h-4 rounded-full border-[3px] border-white shadow ${
              isLatest ? meta.dot : "bg-gray-300"
            }`} />
 
            {/* Header: status badge + timestamp */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge label={meta.label} colorClass={meta.color} />
              {isLatest && (
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Latest</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mb-1.5">{fmtDateTime(entry.at)}</p>
 
            {/* Admin-written message */}
            {entry.message && (
              <div className="flex items-start gap-1.5 bg-gray-50 rounded-lg px-3 py-2 mb-1">
                <FiMessageSquare className="text-gray-400 flex-shrink-0 mt-0.5" size={11} />
                <p className="text-xs text-gray-700 leading-relaxed">{entry.message}</p>
              </div>
            )}
 
            {/* Location */}
            {entry.location && (
              <p className="flex items-center gap-1 text-[11px] text-gray-500">
                <FiMapPin size={10} className="text-gray-400" /> {entry.location}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
 
// ── Payment banner ────────────────────────────────────────────────────────────
function PaymentBanner({ payment, grandTotal }) {
  if (!payment) return null;
  const isCOD  = payment.method === "cod";
  const isPaid = payment.status === "paid";
 
  if (isCOD && !isPaid) return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4">
      <div className="w-9 h-9 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 text-lg">💵</div>
      <div>
        <p className="text-sm font-black text-amber-800">Cash on Delivery</p>
        <p className="text-xs text-amber-700 mt-0.5">{fmtPrice(grandTotal)} will be collected at your doorstep.</p>
      </div>
    </div>
  );
 
  if (isPaid) return (
    <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-2xl px-4 py-4">
      <div className="w-9 h-9 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
        <FiCheck className="text-green-700" size={16} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-green-800">Payment Successful</p>
        <p className="text-xs text-green-600 mt-0.5">
          {fmtPrice(grandTotal)} paid via {isCOD ? "Cash on Delivery" : "Razorpay"}
        </p>
        {payment.razorpayPaymentId && (
          <p className="text-[10px] text-green-500 mt-1 font-mono flex items-center gap-1">
            {payment.razorpayPaymentId}<CopyBtn text={payment.razorpayPaymentId} />
          </p>
        )}
        {payment.paidAt && (
          <p className="text-[10px] text-green-400 mt-0.5">{fmtDateTime(payment.paidAt)}</p>
        )}
      </div>
      <FiShield className="text-green-400 flex-shrink-0" size={14} />
    </div>
  );
 
  if (!isCOD && !isPaid) return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4">
      <div className="w-9 h-9 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
        <FiAlertCircle className="text-red-600" size={16} />
      </div>
      <div>
        <p className="text-sm font-black text-red-800">Payment Pending</p>
        <p className="text-xs text-red-600 mt-0.5">Your payment was not completed.</p>
        <Link to="/checkout" className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:underline mt-2">
          Retry Payment <FiChevronRight size={11} />
        </Link>
      </div>
    </div>
  );
 
  return null;
}
 
// ── Cancel modal ──────────────────────────────────────────────────────────────
function CancelModal({ orderNumber, onConfirm, onClose, cancelling, cancelError }) {
  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiAlertCircle className="text-red-500" size={28} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Cancel Order?</h3>
        <p className="text-gray-500 text-sm mb-2">Cancel order <span className="font-black text-gray-800">#{orderNumber}</span>?</p>
        <p className="text-xs text-gray-400 mb-6">This cannot be undone.</p>
        {cancelError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4 text-xs text-red-600 font-medium">{cancelError}</div>
        )}
        <div className="flex flex-col gap-2">
          <button onClick={onConfirm} disabled={cancelling}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-3 rounded-xl font-black text-sm transition-colors flex items-center justify-center gap-2">
            {cancelling
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Cancelling…</>
              : <><FiX size={14} />Yes, Cancel</>}
          </button>
          <button onClick={onClose} disabled={cancelling}
            className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-600 py-2.5 rounded-xl font-bold text-sm transition-colors">
            Keep Order
          </button>
        </div>
      </div>
    </div>
  );
}
 
// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function OrderDetails() {
  const { orderNumber } = useParams();
  const dispatch        = useDispatch();
  const navigate        = useNavigate();
  const [showCancel, setShowCancel] = useState(false);
 
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const order      = useSelector(selectCurrentOrder);
  const loading    = useSelector(selectLoadingOrder);
  const error      = useSelector(selectOrderError);
  const cancelling = useSelector(selectCancelling);
  const cancelError= useSelector(selectCancelError);
 
  useEffect(() => {
    if (!isLoggedIn) { navigate("/login", { state: { from: `/orders/${orderNumber}` } }); return; }
    dispatch(fetchOrderDetail({ orderNumber }));
    return () => dispatch(clearCurrentOrder());
  }, [orderNumber, isLoggedIn, dispatch, navigate]);
 
  const handleCancelConfirm = async () => {
    const result = await dispatch(cancelUserOrder({ orderNumber }));
    if (cancelUserOrder.fulfilled.match(result)) setShowCancel(false);
  };
 
  if (!isLoggedIn) return null;
 
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 font-medium">Loading order details…</p>
      </div>
    </div>
  );
 
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-red-500" size={28} />
        </div>
        <h2 className="text-lg font-black text-gray-900 mb-1">Order Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <Link to="/orders"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors">
          <FiArrowLeft size={14} /> My Orders
        </Link>
      </div>
    </div>
  );
 
  if (!order) return null;
 
  // ── Derived values from REAL model fields ───────────────────────────────
  const statusMeta = STATUS_META[order.status] ?? DEFAULT_STATUS;
 
  // ★ Cancel rules:
  //   - Status must still be "placed" or "confirmed"
  //   - Payment must NOT be paid yet (paid orders require support contact for refund)
  const isPaid    = order.payment?.status === "paid";
  const canCancel = CANCELLABLE_STATUSES.includes(order.status) && !isPaid;
 
  const savedAmount = order.savedAmount ?? order.items?.reduce(
    (s, i) => s + (i.mrp - i.price) * i.quantity, 0
  ) ?? 0;
 
  const billing = order.billing ?? {};
 
  // Tracking supports both legacy (trackingId/provider) and new (trackingNumber/courierName) fields
  const trackingNumber = order.tracking?.trackingNumber || order.tracking?.trackingId  || "";
  const courierName    = order.tracking?.courierName    || order.tracking?.provider    || "";
  const trackingUrl    = order.tracking?.trackingUrl    || "";
  const hasTracking    = Boolean(trackingNumber);
 
  return (
    <>
      {showCancel && (
        <CancelModal
          orderNumber={order.orderNumber}
          onConfirm={handleCancelConfirm}
          onClose={() => { setShowCancel(false); dispatch(clearOrderErrors()); }}
          cancelling={cancelling}
          cancelError={cancelError}
        />
      )}
 
      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-[1100px] mx-auto flex items-center gap-1.5 text-sm text-gray-400">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <FiChevronRight size={12} />
            <Link to="/orders" className="hover:text-blue-600 transition-colors">My Orders</Link>
            <FiChevronRight size={12} />
            <span className="text-gray-700 font-semibold">{order.orderNumber}</span>
          </div>
        </div>
 
        <div className="max-w-[1100px] mx-auto px-4 py-6">
          {/* Page header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate("/orders")}
              className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-400 hover:text-blue-600">
              <FiArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">Order #{order.orderNumber}</h1>
                <Badge label={statusMeta.label} colorClass={statusMeta.color} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => dispatch(fetchOrderDetail({ orderNumber }))}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 bg-white border border-gray-200 hover:border-blue-200 px-3 py-2 rounded-xl transition-all">
                <FiRefreshCw size={12} /> Refresh
              </button>
              {/* ★ Cancel button hidden when paid */}
              {canCancel && (
                <button onClick={() => setShowCancel(true)}
                  className="flex items-center gap-1.5 text-xs font-black text-red-500 hover:text-red-700 border-2 border-red-100 hover:border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-all">
                  <FiX size={13} /> Cancel
                </button>
              )}
            </div>
          </div>
 
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
            {/* LEFT */}
            <div className="space-y-4">
              <PaymentBanner payment={order.payment} grandTotal={order.grandTotal} />
 
              {/* Progress timeline */}
              <SectionCard title="Order Progress" Icon={FiTruck} accent="blue">
                <OrderTimeline status={order.status} />
                {order.estimatedDelivery &&
                  !["delivered", "cancelled", "refunded"].includes(order.status) && (
                  <div className="mt-4 flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
                    <FiClock className="text-blue-400" size={13} />
                    <p className="text-xs text-blue-700 font-semibold">
                      Estimated delivery by <span className="font-black">{fmtDate(order.estimatedDelivery)}</span>
                    </p>
                  </div>
                )}
                {hasTracking && (
                  <div className="mt-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Tracking ID</p>
                    <p className="text-sm font-black text-purple-700 font-mono flex items-center gap-1 mt-1">
                      {trackingNumber}<CopyBtn text={trackingNumber} />
                    </p>
                    {courierName && (
                      <p className="text-xs text-gray-400 mt-0.5">{courierName}</p>
                    )}
                    {trackingUrl && (
                      <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-black text-purple-600 hover:underline mt-1">
                        Track Package →
                      </a>
                    )}
                  </div>
                )}
              </SectionCard>
 
              {/* ★ NEW — Status History / Shipment Updates */}
              <SectionCard title="Shipment Updates" Icon={FiClock} accent="purple">
                <StatusHistoryTimeline history={order.statusHistory} />
              </SectionCard>
 
              {/* Order items */}
              <SectionCard title={`Order Items · ${order.items?.length ?? 0} item${order.items?.length !== 1 ? "s" : ""}`} Icon={FiPackage} accent="blue">
                <div className="divide-y divide-gray-50">
                  {order.items?.map((item, idx) => {
                    const disc = item.mrp > item.price
                      ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
                    return (
                      <div key={idx} className="flex gap-3 py-3 items-center">
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center p-1.5">
                          <img src={item.image} alt={item.name}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => { e.target.src = "https://placehold.co/56x56?text=📦"; }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{item.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {item.subcat ? `${item.subcat} · ` : ""}Qty {item.quantity}
                          </p>
                          {disc > 0 && (
                            <span className="text-[10px] bg-green-50 text-green-600 font-bold px-1.5 py-0.5 rounded-full border border-green-100">
                              {disc}% off
                            </span>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-gray-900">{fmtPrice(item.price * item.quantity)}</p>
                          {disc > 0 && (
                            <p className="text-[10px] text-gray-400 line-through">{fmtPrice(item.mrp * item.quantity)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
 
              {/* Delivery address */}
              <SectionCard title="Delivery Address" Icon={FiMapPin} accent="purple">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Contact</p>
                    <p className="font-bold text-gray-900 text-sm">{billing.firstName} {billing.lastName}</p>
                    {billing.email && <p className="text-xs text-gray-500 mt-0.5">{billing.email}</p>}
                    {billing.phone && <p className="text-xs text-gray-500">{billing.phone}</p>}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Ship To</p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {billing.address}{billing.apartment ? `, ${billing.apartment}` : ""}<br />
                      {billing.city}{billing.state ? `, ${billing.state}` : ""}
                      {billing.pincode ? ` – ${billing.pincode}` : ""}<br />
                      {billing.country}
                    </p>
                  </div>
                </div>
                {billing.orderNotes && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Order Notes</p>
                    <p className="text-xs text-gray-600 italic">"{billing.orderNotes}"</p>
                  </div>
                )}
              </SectionCard>
            </div>
 
            {/* RIGHT */}
            <div className="space-y-4">
              {/* Price breakdown */}
              <SectionCard title="Price Details" Icon={FiDollarSign} accent="green">
                <InfoRow label={`MRP (${order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0} items)`}
                  value={fmtPrice((order.subtotal ?? 0) + savedAmount)} />
                {savedAmount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs text-green-600 font-semibold">Discount</span>
                    <span className="text-xs font-bold text-green-600">− {fmtPrice(savedAmount)}</span>
                  </div>
                )}
                {order.couponDiscount > 0 && order.coupon?.code && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs text-green-600 font-semibold">Coupon ({order.coupon.code})</span>
                    <span className="text-xs font-bold text-green-600">− {fmtPrice(order.couponDiscount)}</span>
                  </div>
                )}
                <InfoRow
                  label="Delivery"
                  value={order.deliveryCharge === 0 ? "FREE" : fmtPrice(order.deliveryCharge)}
                />
                <div className="flex justify-between items-center border-t-2 border-gray-100 pt-3 mt-1">
                  <span className="font-black text-gray-900">Total Paid</span>
                  <span className="font-black text-gray-900 text-lg">{fmtPrice(order.grandTotal)}</span>
                </div>
                {savedAmount > 0 && (
                  <div className="mt-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-center">
                    <p className="text-xs text-green-700 font-black">🎉 You saved {fmtPrice(savedAmount)}!</p>
                  </div>
                )}
              </SectionCard>
 
              {/* Payment info */}
              <SectionCard title="Payment Info" Icon={FiCreditCard} accent="amber">
                <InfoRow label="Method"
                  value={order.payment?.method === "razorpay" ? "Online (Razorpay)" : "Cash on Delivery"} />
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-400 font-semibold">Status</span>
                  <Badge
                    label={order.payment?.status === "paid" ? "Paid" : order.payment?.method === "cod" ? "COD" : "Pending"}
                    colorClass={order.payment?.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}
                  />
                </div>
                {order.payment?.razorpayOrderId && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-400 font-semibold">Order Ref</span>
                    <span className="text-[10px] font-mono text-gray-600 flex items-center gap-1">
                      …{order.payment.razorpayOrderId.slice(-10)}<CopyBtn text={order.payment.razorpayOrderId} />
                    </span>
                  </div>
                )}
                {order.payment?.razorpayPaymentId && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-400 font-semibold">Payment ID</span>
                    <span className="text-[10px] font-mono text-gray-600 flex items-center gap-1">
                      {order.payment.razorpayPaymentId}<CopyBtn text={order.payment.razorpayPaymentId} />
                    </span>
                  </div>
                )}
                {order.payment?.paidAt && (
                  <InfoRow label="Paid At" value={fmtDateTime(order.payment.paidAt)} />
                )}
              </SectionCard>
 
              {/* Quick links */}
              <div className="space-y-2">
                <Link to="/orders"
                  className="flex items-center justify-between bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50 rounded-xl px-4 py-3 transition-all group">
                  <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">View All Orders</span>
                  <FiChevronRight className="text-gray-300 group-hover:text-blue-400" size={15} />
                </Link>
                <Link to="/collection"
                  className="flex items-center justify-between bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50 rounded-xl px-4 py-3 transition-all group">
                  <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">Continue Shopping</span>
                  <FiChevronRight className="text-gray-300 group-hover:text-blue-400" size={15} />
                </Link>
                {/* ★ Cancel button hidden for paid orders */}
                {canCancel && (
                  <button onClick={() => setShowCancel(true)}
                    className="w-full flex items-center justify-between bg-red-50 border border-red-100 hover:border-red-200 hover:bg-red-100 rounded-xl px-4 py-3 transition-all group">
                    <span className="text-sm font-bold text-red-600">Cancel This Order</span>
                    <FiX className="text-red-300 group-hover:text-red-500" size={15} />
                  </button>
                )}
              </div>
 
              {/* ★ NEW — Support note shown for paid orders in place of Cancel */}
              {isPaid && CANCELLABLE_STATUSES.includes(order.status) && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1">
                    Need to cancel?
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Since this order is already paid, please{" "}
                    <Link to="/contact" className="text-blue-600 font-black hover:underline">
                      contact support
                    </Link>{" "}
                    to request a refund. Razorpay refunds take 5–7 business days.
                  </p>
                </div>
              )}
 
              {/* Support */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Need Help?</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Contact us with Order ID <span className="font-black text-gray-700">#{order.orderNumber}</span> for any issues.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}