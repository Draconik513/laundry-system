import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export const useNotifications = () => useContext(NotificationContext)

const POLL_INTERVAL = 60_000 // 60 detik

export const NotificationProvider = ({ children }) => {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(() => new Set(JSON.parse(localStorage.getItem('readNotifIds') || '[]')))
  const readIdsRef = useRef(new Set(JSON.parse(localStorage.getItem('readNotifIds') || '[]')))
  const prevOrdersRef = useRef(null)

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length

  const buildNotifications = (orders) => {
    const notifs = []
    const now = new Date()

    orders.forEach((o) => {
      // Pesanan baru (pending_pickup, dibuat < 5 menit lalu)
      const createdAt = new Date(o.created_at)
      const ageMin = (now - createdAt) / 60000
      if (o.status === 'pending_pickup' && ageMin < 5) {
        notifs.push({
          id: `new-${o.id}`,
          type: 'new',
          title: 'Pesanan Baru Masuk',
          body: `${o.customer_name} — ${o.service_name}`,
          orderId: o.id,
          code: o.code,
          time: createdAt,
        })
      }

      // Siap diantar
      if (o.status === 'ready_for_delivery') {
        notifs.push({
          id: `ready-${o.id}`,
          type: 'ready',
          title: 'Siap Diantar',
          body: `${o.customer_name} (${o.code}) menunggu pengiriman`,
          orderId: o.id,
          code: o.code,
          time: new Date(o.updated_at),
        })
      }

      // Pesanan pending > 24 jam
      if (o.status === 'pending_pickup' && ageMin > 1440) {
        notifs.push({
          id: `stale-${o.id}`,
          type: 'stale',
          title: 'Pesanan Belum Dijemput',
          body: `${o.customer_name} (${o.code}) sudah > 1 hari`,
          orderId: o.id,
          code: o.code,
          time: createdAt,
        })
      }
    })

    // Urutkan terbaru dulu
    notifs.sort((a, b) => b.time - a.time)
    return notifs
  }

  const fetchAndUpdate = async () => {
    if (!token) return
    try {
      const { data } = await api.get('/orders')
      const orders = data || []
      const notifs = buildNotifications(orders)
      setNotifications(notifs)
      prevOrdersRef.current = orders
    } catch {
      // silent fail
    }
  }

  useEffect(() => {
    if (!token) return
    fetchAndUpdate()
    const interval = setInterval(fetchAndUpdate, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [token])

  const persistAndSet = (newSet) => {
    readIdsRef.current = newSet
    localStorage.setItem('readNotifIds', JSON.stringify([...newSet]))
    setReadIds(new Set(newSet))
  }

  const markAllRead = () => {
    const next = new Set(readIdsRef.current)
    notifications.forEach((n) => next.add(n.id))
    persistAndSet(next)
  }

  const markRead = (id) => {
    const next = new Set(readIdsRef.current)
    next.add(id)
    persistAndSet(next)
  }

  return (
    <NotificationContext.Provider value={{ notifications, readIds, unreadCount, markAllRead, markRead, refresh: fetchAndUpdate }}>
      {children}
    </NotificationContext.Provider>
  )
}
