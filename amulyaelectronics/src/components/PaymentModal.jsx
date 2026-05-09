// src/components/PaymentModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// CHANGES vs original:
//  • Accepts `allOrders` prop — array of { orderId, paymentId, amount, method }
//  • Shows cumulative "Total Paid This Session" when user has multiple orders
//  • Each new order gets its own card in the success view
//  • All edge-cases guarded (NaN, empty arrays, undefined props)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiX, FiLock, FiCheck, FiAlertCircle,
  FiCreditCard, FiDollarSign, FiRefreshCw,
  FiShield, FiClock, FiPackage, FiTag,
  FiList,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────────
// ORDER STATUS → MODAL STAGE MAP
// ─────────────────────────────────────────────────────────────────────────────
const STAGES = {
  idle:          { type: "idle"    },
  creatingOrder: { type: "loading", label: "Connecting to payment gateway…", sub: "Setting up your secure payment session"  },
  verifying:     { type: "loading", label: "Verifying payment…",             sub: "Confirming transaction with our server"   },
  placingCOD:    { type: "loading", label: "Placing your order…",            sub: "Saving your Cash on Delivery order"       },
  success:       { type: "success" },
  error:         { type: "error"   },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Safe currency formatter — always returns "0.00" for bad values */
function rupee(val) {
  const n = parseFloat(val);
  return isNaN(n) ? "0.00" : n.toFixed(2);
}

function Spinner({ size = 12, color = "border-blue-500" }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full border-4 border-gray-100 ${color} border-t-transparent animate-spin`}
    />
  );
}

function SuccessIcon() {
  return (
    <div className="relative w-20 h-20 mx-auto">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <FiCheck className="text-green-500" size={36} strokeWidth={2.5} />
      </div>
      <div className="absolute -top-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs animate-bounce">
        🎉
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INFO ROW — reusable label / value pair inside summary cards
// ─────────────────────────────────────────────────────────────────────────────
function InfoRow({ label, children, border = false }) {
  return (
    <div className={`flex justify-between items-center ${border ? "border-t border-blue-100 pt-2 mt-1" : ""}`}>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION SUMMARY — shown when 2+ orders placed this session
// ─────────────────────────────────────────────────────────────────────────────
function SessionSummary({ allOrders }) {
  if (!Array.isArray(allOrders) || allOrders.length < 2) return null;

  const sessionTotal = allOrders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
  const sessionGst   = allOrders.reduce((sum, o) => sum + (parseFloat(o.gst)    || 0), 0);

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-left space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <FiList className="text-indigo-500" size={13} />
        <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
          Session Summary · {allOrders.length} Orders
        </span>
      </div>

      {allOrders.map((o, idx) => (
        <div key={o.orderId || idx} className="flex justify-between items-center text-xs border-b border-indigo-100 pb-2 last:border-0 last:pb-0">
          <div>
            <span className="font-bold text-gray-700">Order #{o.orderId}</span>
            <span className={`ml-2 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
              o.method === "cod" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
            }`}>
              {o.method === "cod" ? "COD" : "Paid"}
            </span>
          </div>
          <span className="font-black text-gray-900">₹{rupee(o.amount)}</span>
        </div>
      ))}

      <div className="flex justify-between items-center border-t-2 border-indigo-200 pt-2">
        <span className="text-xs font-black text-indigo-700">Total Paid This Session</span>
        <div className="text-right">
          <span className="text-base font-black text-indigo-700">₹{rupee(sessionTotal)}</span>
          {sessionGst > 0 && (
            <p className="text-[9px] text-amber-600 mt-0.5">incl. ₹{rupee(sessionGst)} GST</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
//
// Props received from Checkout.jsx:
//   isOpen          — boolean
//   onClose         — fn
//   grandTotal      — number  (GST-inclusive subtotal + delivery, current order)
//   totalGst        — number  (GST portion of grandTotal, current order)
//   paymentMethod   — "razorpay" | "cod"
//   orderStatus     — "idle" | "creatingOrder" | "verifying" | "placingCOD" | "success" | "error"
//   orderError      — string | null
//   orderId         — string  (backend order ID, current order)
//   paymentId       — string  (Razorpay payment_id, if online, current order)
//   allOrders       — Array<{ orderId, paymentId, amount, gst, method }>  ← NEW
//   onConfirmCOD    — fn  (COD confirm handler)
//   onRetry         — fn  (retry after error)
// ─────────────────────────────────────────────────────────────────────────────
export default function PaymentModal({
  isOpen,
  onClose,
  grandTotal    = 0,
  totalGst      = 0,
  paymentMethod = "razorpay",
  orderStatus   = "idle",
  orderError    = "",
  orderId       = "",
  paymentId     = "",
  allOrders     = [],       // ← NEW: all orders placed this session
  onConfirmCOD,
  onRetry,
}) {
  const overlayRef = useRef(null);
  const navigate   = useNavigate();

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Escape key to close (only when not mid-payment)
  useEffect(() => {
    const handle = (e) => {
      if (
        e.key === "Escape" &&
        isOpen &&
        !["creatingOrder", "verifying", "placingCOD"].includes(orderStatus)
      ) onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen, orderStatus, onClose]);

  if (!isOpen) return null;

  // ── Stage derivation ────────────────────────────────────────────────────
  const stage       = STAGES[orderStatus] || STAGES.idle;
  const isCOD       = paymentMethod === "cod";
  const isLoading   = stage.type === "loading";
  const isSuccess   = stage.type === "success";
  const isError     = stage.type === "error";
  const showConfirm = stage.type === "idle" && isCOD;
  const showRzpIdle = stage.type === "idle" && !isCOD;

  // ── Session totals ───────────────────────────────────────────────────────
  const safeAllOrders   = Array.isArray(allOrders) ? allOrders : [];
  const isMultiOrder    = safeAllOrders.length >= 2;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current && !isLoading) onClose();
  };

  const handleViewOrder = () => {
    onClose();
    if (orderId) navigate(`/orders/${orderId}`);
  };

  // ── Dynamic header values ────────────────────────────────────────────────
  const headerBg = isSuccess
    ? "bg-green-50"
    : isError
    ? "bg-red-50"
    : showConfirm
    ? "bg-amber-50"
    : "bg-gray-50";

  const headerIcon = isSuccess
    ? <FiCheck       className="text-green-600" size={15} />
    : isError
    ? <FiAlertCircle className="text-red-500"   size={15} />
    : isCOD
    ? <FiDollarSign  className="text-amber-500" size={15} />
    : <FiLock        className="text-blue-600"  size={15} />;

  const headerTitle = isSuccess
    ? `Order #${orderId} Confirmed!`
    : isError
    ? "Payment Failed"
    : showConfirm
    ? "Confirm COD Order"
    : isLoading
    ? "Processing Payment"
    : "Secure Checkout";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[300] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={headerTitle}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[92vh] flex flex-col">

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className={`px-6 py-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0 ${headerBg}`}>
          <div className="flex items-center gap-2">
            {headerIcon}
            <span className="font-black text-sm text-gray-800">{headerTitle}</span>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <FiX size={13} />
            </button>
          )}
        </div>

        {/* ── SCROLLABLE BODY ─────────────────────────────────────────────── */}
        <div className="px-6 py-6 space-y-5 overflow-y-auto flex-1 text-center">

          {/* ══════════════════ LOADING ══════════════════ */}
          {isLoading && (
            <>
              <div className="flex justify-center pt-2">
                <Spinner />
              </div>

              <div>
                <p className="font-black text-gray-900 text-base">{stage.label}</p>
                <p className="text-xs text-gray-400 mt-1">{stage.sub}</p>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left space-y-2">
                <InfoRow label="Charging">
                  <span className="text-base font-black text-gray-900">₹{rupee(grandTotal)}</span>
                </InfoRow>
                {totalGst > 0 && (
                  <InfoRow label="Incl. GST">
                    <span className="text-xs font-bold text-amber-600">₹{rupee(totalGst)}</span>
                  </InfoRow>
                )}
                <InfoRow label="Method">
                  <span className="text-xs font-bold text-gray-600">
                    {isCOD ? "Cash on Delivery" : "Razorpay · Online"}
                  </span>
                </InfoRow>
              </div>

              <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <FiShield className="text-blue-500 flex-shrink-0" size={15} />
                <p className="text-xs text-blue-700 text-left leading-relaxed">
                  Please do not close this window while we process your payment.
                </p>
              </div>

              <div className="flex justify-center gap-1.5 pt-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-blue-300 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </>
          )}

          {/* ══════════════════ SUCCESS ══════════════════ */}
          {isSuccess && (
            <>
              <SuccessIcon />

              <div>
                <p className="font-black text-gray-900 text-lg">
                  {isMultiOrder ? "Another Order Placed!" : "Payment Successful!"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {isMultiOrder
                    ? `You've placed ${safeAllOrders.length} orders this session.`
                    : "Your order has been placed and confirmed."}
                </p>
              </div>

              {/* Current order details */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 text-left space-y-2.5">
                <InfoRow label="Order ID">
                  <span className="text-sm font-black text-blue-700">#{orderId}</span>
                </InfoRow>

                {paymentId && (
                  <InfoRow label="Payment ID">
                    <span className="text-[10px] font-bold text-gray-600 font-mono truncate max-w-[160px] block">
                      {paymentId}
                    </span>
                  </InfoRow>
                )}

                <InfoRow label="Payment Method">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isCOD ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  }`}>
                    {isCOD ? "Cash on Delivery" : "✓ Paid Online"}
                  </span>
                </InfoRow>

                <InfoRow label="This Order" border>
                  <span className="text-sm font-black text-green-700">₹{rupee(grandTotal)}</span>
                  {totalGst > 0 && (
                    <p className="text-[9px] text-amber-600 mt-0.5">
                      incl. ₹{rupee(totalGst)} GST
                    </p>
                  )}
                </InfoRow>

                <InfoRow label="Est. Delivery">
                  <span className="text-xs font-black text-gray-700 flex items-center gap-1">
                    <FiClock size={10} /> 4–7 Business Days
                  </span>
                </InfoRow>
              </div>

              {/* ── Session summary (only when 2+ orders) ── */}
              {isMultiOrder && <SessionSummary allOrders={safeAllOrders} />}

              <p className="text-[10px] text-gray-400 leading-relaxed">
                A confirmation email with your GST invoice has been sent to your registered email address.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleViewOrder}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-black text-sm transition-colors shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                >
                  <FiPackage size={15} /> View This Order
                </button>

                {isMultiOrder && (
                  <button
                    onClick={() => { onClose(); navigate("/orders"); }}
                    className="w-full border-2 border-indigo-200 hover:border-indigo-400 text-indigo-700 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <FiList size={14} /> View All Orders ({safeAllOrders.length})
                  </button>
                )}
              </div>
            </>
          )}

          {/* ══════════════════ ERROR ══════════════════ */}
          {isError && (
            <>
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertCircle className="text-red-500" size={36} />
              </div>

              <div>
                <p className="font-black text-gray-900 text-base">Payment Failed</p>
                <p className="text-xs text-red-600 mt-1 leading-relaxed bg-red-50 rounded-xl px-3 py-2 border border-red-100">
                  {orderError || "Something went wrong. Please try again."}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-left space-y-1.5">
                <InfoRow label="Amount">
                  <span className="text-sm font-black text-gray-900">₹{rupee(grandTotal)}</span>
                </InfoRow>
                {totalGst > 0 && (
                  <InfoRow label="GST">
                    <span className="text-xs font-bold text-amber-600">₹{rupee(totalGst)}</span>
                  </InfoRow>
                )}
                <InfoRow label="Method">
                  <span className="text-xs font-semibold text-gray-600">
                    {isCOD ? "Cash on Delivery" : "Razorpay · Online"}
                  </span>
                </InfoRow>
              </div>

              {/* Show previous successful orders even on error */}
              {safeAllOrders.length > 0 && <SessionSummary allOrders={safeAllOrders} />}

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { onRetry && onRetry(); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <FiRefreshCw size={14} /> Try Again
                </button>
                <button
                  onClick={onClose}
                  className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-600 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* ══════════════════ COD CONFIRMATION ══════════════════ */}
          {showConfirm && (
            <>
              <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center text-4xl">
                💵
              </div>

              <div>
                <p className="font-black text-gray-900 text-lg">Confirm COD Order</p>
                <p className="text-xs text-gray-400 mt-1">
                  Pay when your order arrives at your doorstep.
                </p>
              </div>

              {/* Validation: COD minimum ₹199 */}
              {parseFloat(grandTotal) < 199 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2 text-left">
                  <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={13} />
                  <p className="text-xs text-red-700 leading-relaxed font-medium">
                    COD is only available on orders of{" "}
                    <span className="font-black">₹199 and above.</span>{" "}
                    Your order total is ₹{rupee(grandTotal)}.
                  </p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left space-y-2">
                <InfoRow label="Order Total">
                  <span className="font-black text-gray-900 text-base">₹{rupee(grandTotal)}</span>
                </InfoRow>

                {totalGst > 0 && (
                  <InfoRow label="GST Included">
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                      <FiTag size={9} /> ₹{rupee(totalGst)}
                    </span>
                  </InfoRow>
                )}

                <InfoRow label="Payment Mode">
                  <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                    Cash on Delivery
                  </span>
                </InfoRow>

                <InfoRow label="Est. Delivery" border>
                  <span className="text-xs font-black text-gray-700 flex items-center gap-1">
                    <FiClock size={10} /> 4–7 Business Days
                  </span>
                </InfoRow>
              </div>

              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-start gap-2 text-left">
                <FiAlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={13} />
                <p className="text-xs text-gray-500 leading-relaxed">
                  Keep exact change of{" "}
                  <span className="font-black text-gray-700">₹{rupee(grandTotal)}</span>{" "}
                  ready for the delivery executive.
                </p>
              </div>

              {/* Show previous session orders if any */}
              {safeAllOrders.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-left">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-1">
                    Previous orders this session
                  </p>
                  <p className="text-xs text-indigo-700 font-bold">
                    {safeAllOrders.length} order{safeAllOrders.length > 1 ? "s" : ""} · ₹
                    {rupee(safeAllOrders.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0))} paid
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => { onConfirmCOD && onConfirmCOD(); }}
                  disabled={parseFloat(grandTotal) < 199}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-black text-sm transition-colors shadow-lg shadow-amber-100 flex items-center justify-center gap-2"
                >
                  <FiCheck size={15} /> Confirm Order · ₹{rupee(grandTotal)}
                </button>
                <button
                  onClick={onClose}
                  className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-600 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >
                  Go Back
                </button>
              </div>
            </>
          )}

          {/* ══════════════════ RAZORPAY IDLE — SDK loading ══════════════════ */}
          {showRzpIdle && (
            <>
              <div className="flex justify-center pt-2">
                <Spinner size={10} color="border-blue-400" />
              </div>

              <div>
                <p className="font-black text-gray-900 text-base">Opening Payment Window…</p>
                <p className="text-xs text-gray-400 mt-1">
                  Razorpay's secure checkout will appear in a moment.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left space-y-2">
                <InfoRow label="Amount to Pay">
                  <span className="text-base font-black text-gray-900">₹{rupee(grandTotal)}</span>
                </InfoRow>
                {totalGst > 0 && (
                  <InfoRow label="GST Included">
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                      <FiTag size={9} /> ₹{rupee(totalGst)}
                    </span>
                  </InfoRow>
                )}
                <InfoRow label="Gateway">
                  <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                    <FiShield size={10} /> Razorpay · Secure
                  </span>
                </InfoRow>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <FiShield className="text-blue-400" size={13} />
                <span>256-bit SSL encrypted · PCI DSS compliant</span>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5">
                {["GPay","PhonePe","Paytm","Visa","Mastercard","RuPay","NetBanking"].map((m) => (
                  <span
                    key={m}
                    className="text-[10px] font-bold bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-lg"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── FOOTER — trust row (not shown on success/error/confirm) ──────── */}
        {!isSuccess && !isError && !showConfirm && (
          <div className="px-6 pb-5 flex-shrink-0 border-t border-gray-50 pt-4">
            <div className="flex items-center justify-center gap-5 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <FiLock size={10} className="text-blue-400" /> Secure
              </span>
              <span className="flex items-center gap-1">
                <FiShield size={10} className="text-blue-400" /> Razorpay
              </span>
              <span className="flex items-center gap-1">
                <FiCreditCard size={10} className="text-blue-400" /> PCI DSS
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}