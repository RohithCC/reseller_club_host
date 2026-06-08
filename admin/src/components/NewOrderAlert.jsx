// components/NewOrderAlert.jsx
// Real-time new order alert system
// Uses WebSocket for instant delivery + Polls backend every 30s as fallback

import { useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNewOrderSocket } from '../hooks/useSocket'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000'
const POLL_INTERVAL = 30000 // 30 seconds

// ─── Send desktop push notification ───────────────────────────────────────────
const sendDesktopNotification = (order) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const title = `🛒 New Order! ${order.orderNumber}`
    const method = order.delivery?.method === 'pickup' ? 'Pickup'
      : order.payment?.method === 'razorpay' ? 'Razorpay' : 'COD'
    const body = `${fmtCurrency(order.grandTotal)} · ${method} · ${order.billing?.firstName || 'Customer'}`
    const notif = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'new-order-' + (order._id || order.orderNumber),
      requireInteraction: true,
    })
    setTimeout(() => notif.close(), 12000)
  } catch { /* silent */ }
}

// ─── Generate notification chime using Web Audio API ─────────────────────────
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)     // A5
    oscillator.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15) // D6
    oscillator.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.30) // E6

    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
  } catch {
    // Audio not available — silently skip
  }
}

// ─── Format currency ─────────────────────────────────────────────────────────
const fmtCurrency = (n = 0) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

// ─── Payment method badge text ───────────────────────────────────────────────
const getMethodLabel = (order) => {
  if (order.delivery?.method === 'pickup') return '📦 Pickup'
  if (order.payment?.method === 'razorpay') return '💳 Razorpay'
  return '💵 COD'
}

// ─── Request notification permission (can be called from a click handler) ────
let _permRequested = false
export function requestNotifPermission() {
  if (_permRequested) return
  _permRequested = true
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted' || Notification.permission === 'denied') return
  Notification.requestPermission().catch(() => {})
}

// ─── Reusable toast content ───────────────────────────────────────────────────
const ToastContent = ({ order }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    cursor: 'pointer',
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, flexShrink: 0,
    }}>
      🛒
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{
        margin: 0, fontSize: 13, fontWeight: 700, color: '#111827',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>New Order! {order.orderNumber || '...'}</p>
      <p style={{
        margin: '2px 0 0', fontSize: 11, color: '#6b7280',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontWeight: 700, color: '#059669' }}>{fmtCurrency(order.grandTotal)}</span>
        <span>·</span>
        <span>{getMethodLabel(order)}</span>
        <span>·</span>
        <span>{order.billing?.firstName || 'Customer'}</span>
      </p>
    </div>
  </div>
)

// ─── Track shown order IDs globally (module-level, persists across remounts) ──
let _toastShown = {}

const processIncomingOrder = (order) => {
  const id = order._id || order.orderNumber
  if (_toastShown[id]) return
  _toastShown[id] = true

  playNotificationSound()
  sendDesktopNotification(order)

  toast(
    () => <ToastContent order={order} />,
    {
      toastId: 'new-order-' + id,
      position: 'bottom-right',
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      style: {
        background: '#fff',
        border: '1px solid #bfdbfe',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(79,70,229,0.15)',
        padding: '12px 16px',
      },
    }
  )
}

export default function NewOrderAlert() {
  const pollTimerRef = useRef(null)

  // ── WebSocket: instant new-order events ───────────────────────────────────
  useNewOrderSocket((order) => {
    processIncomingOrder(order)
  })

  // ── Polling fallback (every 30s) ──────────────────────────────────────────
  const lastCheckedRef = useRef(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const checkForNewOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const since = lastCheckedRef.current
      const params = new URLSearchParams({ since })

      const { data } = await axios.get(`${API_BASE}/api/order/new-orders?${params.toString()}`, {
        headers: { Authorization: 'Bearer ' + token },
      })

      if (data.success) {
        if (data.newOrders > 0 && data.orders) {
          const newestOrder = data.orders[0]
          const orderTime = new Date(newestOrder.createdAt).getTime()
          const currentLatest = new Date(lastCheckedRef.current).getTime()
          if (orderTime > currentLatest) {
            lastCheckedRef.current = new Date(orderTime + 1).toISOString()
          }

          for (const order of data.orders) {
            processIncomingOrder(order)
          }
        } else {
          lastCheckedRef.current = since
        }
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    checkForNewOrders()
    pollTimerRef.current = setInterval(checkForNewOrders, POLL_INTERVAL)
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [checkForNewOrders])

  // This component renders nothing — it's a background notification listener
  return null
}
