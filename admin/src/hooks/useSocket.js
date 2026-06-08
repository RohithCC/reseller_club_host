// hooks/useSocket.js
// 🔌 Real-time WebSocket connection to the backend via Socket.io
// Provides a singleton socket that reconnects automatically.

import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000'

let socketInstance = null

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    })

    socketInstance.on('connect', () => {
      console.log('[WS] Connected:', socketInstance.id)
      // Join admin room so we receive admin-targeted events
      socketInstance.emit('join-admin')
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason)
    })

    socketInstance.on('connect_error', (err) => {
      console.log('[WS] Connection error:', err.message)
    })
  }
  return socketInstance
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

// ─── Hook: listen for new-order events ────────────────────────────────────────
export function useNewOrderSocket(onNewOrder) {
  const handlerRef = useRef(onNewOrder)

  // Always keep the latest callback reference
  useEffect(() => {
    handlerRef.current = onNewOrder
  }, [onNewOrder])

  useEffect(() => {
    const socket = getSocket()

    const handler = (order) => {
      handlerRef.current?.(order)
    }

    socket.on('new-order', handler)

    return () => {
      socket.off('new-order', handler)
    }
  }, []) // stable mount — handlerRef keeps callback updated
}
