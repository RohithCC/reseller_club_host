// src/components/OrderReport.jsx
//
// ✅ Opens as a full-screen modal with a print-ready invoice preview
// ✅ "Download PDF" triggers window.print() scoped to the invoice only
// ✅ Only renders/shows for delivered orders (enforced by MyOrders.jsx)
// ✅ Fields: order.billing, order.items[].mrp, order.grandTotal,
//            order.payment, order.createdAt, order.orderNumber,
//            order.subtotal, order.deliveryCharge, order.coupon
// ✅ No server or third-party PDF library needed — pure HTML/CSS + print

import { useEffect, useRef } from "react";
import {
  FiX, FiDownload, FiPrinter, FiCheck,
  FiPackage, FiMapPin, FiCreditCard, FiTruck,
} from "react-icons/fi";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";
const fmtPrice = (n) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DEFAULT_GST = 18;
const getGstRate  = (item) => item.gstRate ?? item.taxRate ?? DEFAULT_GST;
const getBaseFromGst = (price, rate) => Math.round((price / (1 + rate / 100)) * 100) / 100;

// ─── Print styles injected into <head> during print ──────────────────────────
const PRINT_STYLES = `
  @media print {
    body > *:not(#order-report-print-root) { display: none !important; }
    #order-report-print-root { display: block !important; position: static !important; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 12mm; }
  }
`;

export default function OrderReport({ order, onClose }) {
  const printRef    = useRef(null);
  const styleTagRef = useRef(null);

  // Inject print styles and set the print root id
  useEffect(() => {
    const tag = document.createElement("style");
    tag.innerHTML = PRINT_STYLES;
    document.head.appendChild(tag);
    styleTagRef.current = tag;
    return () => { document.head.removeChild(tag); };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handlePrint = () => {
    if (printRef.current) {
      printRef.current.id = "order-report-print-root";
    }
    window.print();
    if (printRef.current) {
      printRef.current.id = "";
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────
  const billing       = order.billing  ?? {};
  const items         = order.items    ?? [];
  const payment       = order.payment  ?? {};
  const couponCode    = order.coupon?.code ?? "";

  const subtotal      = order.subtotal      ?? items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const deliveryCharge = order.deliveryCharge ?? 0;
  const grandTotal    = order.grandTotal    ?? subtotal + deliveryCharge;
  const savings       = order.savedAmount   ?? 0;
  const couponDiscount = order.coupon?.discount ?? (order.couponDiscount ?? 0);

  // Total GST across all items
  const totalGst = items.reduce((s, i) => {
    const rate = getGstRate(i);
    const base = getBaseFromGst(i.price ?? 0, rate);
    return s + (i.price - base) * (i.quantity ?? 1);
  }, 0);

  const totalBase = subtotal - totalGst;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">

      {/* ── Outer wrapper (action bar + invoice card) ── */}
      <div className="w-full max-w-[700px] flex flex-col gap-3">

        {/* Action bar — no-print */}
        <div className="no-print flex items-center justify-between bg-white rounded-2xl shadow-xl px-5 py-3 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <FiCheck className="text-green-600" size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">Invoice · #{order.orderNumber}</p>
              <p className="text-xs text-gray-400">Delivered · {fmtDate(order.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-200"
            >
              <FiDownload size={14} /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <FiPrinter size={14} /> Print
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* ══ Invoice Card (print target) ══════════════════════════════════════ */}
        <div
          ref={printRef}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
        >

          {/* ── Invoice Header ────────────────────────────────────────────── */}
          <div className="relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700" />
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />

            <div className="relative z-10 px-8 py-7 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <FiPackage className="text-white" size={16} />
                  </div>
                  <span className="text-white font-black text-lg tracking-tight">Amulya Electronics</span>
                </div>
                <p className="text-blue-100 text-xs">amulyaelectronics.com</p>
                <p className="text-blue-100 text-xs mt-0.5">GSTIN: 29XXXXX1234X1ZX</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Tax Invoice</p>
                <p className="text-white font-black text-2xl mt-0.5">#{order.orderNumber}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-green-400/20 border border-green-300/30 rounded-full px-3 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-300" />
                  <span className="text-green-200 text-[10px] font-black uppercase tracking-wider">Delivered</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Meta Row ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            {[
              { label: "Invoice Date",    value: fmtDate(order.createdAt)  },
              { label: "Payment Method",  value: payment.method === "cod" ? "Cash on Delivery" : "Online (Razorpay)" },
              { label: "Payment Status",  value: payment.status === "paid" ? "✓ Paid" : "Pending" },
            ].map((m) => (
              <div key={m.label} className="px-5 py-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{m.label}</p>
                <p className="text-xs font-bold text-gray-800">{m.value}</p>
              </div>
            ))}
          </div>

          {/* ── Billing Address ───────────────────────────────────────────── */}
          <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-3">
              <FiMapPin className="text-blue-500" size={13} />
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Delivered To</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-black text-gray-900">{billing.firstName} {billing.lastName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{billing.email}</p>
                <p className="text-xs text-gray-500">{billing.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {billing.address}{billing.apartment ? `, ${billing.apartment}` : ""}<br />
                  {billing.city}, {billing.state} – {billing.pincode}<br />
                  {billing.country || "India"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Items Table ───────────────────────────────────────────────── */}
          <div className="px-8 py-5 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <FiPackage className="text-blue-500" size={13} />
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Order Items</p>
            </div>

            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left pb-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Item</th>
                  <th className="text-right pb-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">MRP</th>
                  <th className="text-right pb-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Unit Price</th>
                  <th className="text-right pb-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">GST</th>
                  <th className="text-right pb-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                  <th className="text-right pb-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const gstRate    = getGstRate(item);
                  const unitPrice  = item.price ?? 0;
                  const basePrice  = getBaseFromGst(unitPrice, gstRate);
                  const gstAmt     = unitPrice - basePrice;
                  const qty        = item.quantity ?? 1;
                  const lineTotal  = unitPrice * qty;
                  const mrp        = item.mrp ?? unitPrice;
                  const discPct    = mrp > unitPrice ? Math.round(((mrp - unitPrice) / mrp) * 100) : 0;

                  return (
                    <tr key={idx} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 p-1">
                            <img
                              src={item.image || "https://placehold.co/36x36?text=📦"}
                              alt={item.name}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => { e.target.src = "https://placehold.co/36x36?text=📦"; }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-snug max-w-[180px]">{item.name}</p>
                            {item.category && <p className="text-[9px] text-gray-400">{item.category}</p>}
                            {discPct > 0 && (
                              <span className="text-[9px] bg-green-50 text-green-600 font-bold px-1.5 py-0.5 rounded-full border border-green-100">
                                {discPct}% off
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        {mrp > unitPrice
                          ? <span className="text-gray-400 line-through">{fmtPrice(mrp)}</span>
                          : <span className="text-gray-400">—</span>
                        }
                      </td>
                      <td className="py-3 text-right font-semibold text-gray-700">
                        {fmtPrice(basePrice)}
                        <p className="text-[9px] text-gray-400">excl. GST</p>
                      </td>
                      <td className="py-3 text-right text-amber-600 font-semibold">
                        {fmtPrice(gstAmt)}
                        <p className="text-[9px] text-gray-400">{gstRate}%</p>
                      </td>
                      <td className="py-3 text-right font-bold text-gray-700">{qty}</td>
                      <td className="py-3 text-right font-black text-gray-900">{fmtPrice(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Price Breakdown ───────────────────────────────────────────── */}
          <div className="px-8 py-5 border-b border-gray-100">
            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal (excl. GST)</span>
                <span className="font-semibold">{fmtPrice(totalBase)}</span>
              </div>
              <div className="flex justify-between text-xs text-amber-600 font-semibold">
                <span>Total GST</span>
                <span>+ {fmtPrice(totalGst)}</span>
              </div>
              {deliveryCharge > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Delivery Charge</span>
                  <span className="font-semibold">{fmtPrice(deliveryCharge)}</span>
                </div>
              )}
              {deliveryCharge === 0 && (
                <div className="flex justify-between text-xs text-green-600 font-semibold">
                  <span>Delivery</span>
                  <span>FREE</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-xs text-green-600 font-semibold">
                  <span>Coupon {couponCode ? `(${couponCode})` : "Discount"}</span>
                  <span>− {fmtPrice(couponDiscount)}</span>
                </div>
              )}
              {savings > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Total Savings</span>
                  <span className="font-bold">− {fmtPrice(savings)}</span>
                </div>
              )}
              <div className="border-t-2 border-gray-900 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-black text-gray-900">Grand Total</span>
                <span className="text-lg font-black text-gray-900">{fmtPrice(grandTotal)}</span>
              </div>
              <p className="text-[9px] text-amber-600 text-right font-semibold">
                Includes GST of {fmtPrice(totalGst)}
              </p>
            </div>
          </div>

          {/* ── Payment + Tracking info ───────────────────────────────────── */}
          <div className="px-8 py-5 grid grid-cols-2 gap-6 border-b border-gray-100 bg-gray-50/50">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FiCreditCard className="text-blue-500" size={12} />
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Payment</p>
              </div>
              <p className="text-xs font-bold text-gray-800">
                {payment.method === "cod" ? "Cash on Delivery" : "Online Payment (Razorpay)"}
              </p>
              {payment.razorpayPaymentId && (
                <p className="text-[9px] text-gray-400 font-mono mt-0.5">{payment.razorpayPaymentId}</p>
              )}
              <p className={`text-[10px] font-black mt-1 ${payment.status === "paid" ? "text-green-600" : "text-amber-600"}`}>
                {payment.status === "paid" ? "✓ Payment Confirmed" : "Pending"}
              </p>
              {payment.paidAt && (
                <p className="text-[9px] text-gray-400 mt-0.5">Paid on {fmtDate(payment.paidAt)}</p>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FiTruck className="text-blue-500" size={12} />
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Delivery</p>
              </div>
              {order.tracking?.trackingId ? (
                <>
                  <p className="text-xs font-bold text-gray-800">{order.tracking.courierName || order.tracking.provider || "Courier"}</p>
                  <p className="text-[9px] font-mono text-gray-500 mt-0.5">{order.tracking.trackingId}</p>
                </>
              ) : (
                <p className="text-xs text-gray-500">Delivered</p>
              )}
              {order.estimatedDelivery && (
                <p className="text-[9px] text-gray-400 mt-0.5">
                  Est. {fmtDate(order.estimatedDelivery)}
                </p>
              )}
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-gray-400 leading-relaxed">
                This is a computer-generated invoice.<br />
                For support: support@amulyaelectronics.com
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-400">For Amulya Electronics</p>
              <p className="text-xs font-black text-gray-700 mt-3">Authorised Signatory</p>
            </div>
          </div>

          {/* GST disclaimer */}
          <div className="px-8 py-3 bg-amber-50 border-t border-amber-100">
            <p className="text-[9px] text-amber-700 text-center leading-relaxed">
              All prices are inclusive of applicable GST as per Indian tax regulations.
              This invoice is valid for warranty and return claims. · Generated on {fmtDate(new Date())}
            </p>
          </div>
        </div>
        {/* end invoice card */}

        {/* Bottom close button — no-print */}
        <button
          onClick={onClose}
          className="no-print w-full bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
        >
          <FiX size={14} /> Close Invoice
        </button>
      </div>
    </div>
  );
}