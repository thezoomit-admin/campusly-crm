import { io, type Socket } from 'socket.io-client'
import { config } from '@/config'

export const SOCKET_EVENTS = {
  notificationCreated: 'notification:created',
  emailInbound: 'email:inbound',
} as const

export type EmailInboundEvent = {
  threadId: string
  messageId: string
  leadId: string | null
  fromEmail: string
  preview: string
}

export type SocketNotification = {
  id: string
  title: string
  body: string | null
  link: string | null
  type: string | null
  status: string
  leadId: string | null
  followUpId: string | null
  createdAt: string
  readAt: string | null
}

export type NotificationCreatedEvent = {
  notification: SocketNotification
  unreadCount: number
}

let socket: Socket | null = null

/** Socket.IO connects to API origin (strip trailing `/api` when absolute). */
function resolveSocketUrl() {
  if (config.api.startsWith('http://') || config.api.startsWith('https://')) {
    return config.api.replace(/\/api\/?$/, '')
  }
  // Same-origin via Vite proxy (`/socket.io` → API).
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return undefined
}

export function getSocket() {
  return socket
}

export function connectSocket() {
  if (socket?.connected) return socket
  if (socket) {
    socket.connect()
    return socket
  }

  socket = io(resolveSocketUrl(), {
    path: '/socket.io',
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  })

  socket.on('connect_error', (error) => {
    if (import.meta.env.DEV) {
      console.warn('[socket] connect_error:', error.message)
    }
  })

  return socket
}

export function disconnectSocket() {
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
}
