import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bars3Icon, BellIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useNotifications } from '../context/NotificationContext'

const typeStyle = {
  new:   { bg: 'bg-blue-50',   dot: 'bg-blue-500',   label: 'Baru' },
  ready: { bg: 'bg-green-50',  dot: 'bg-green-500',  label: 'Siap' },
  stale: { bg: 'bg-yellow-50', dot: 'bg-yellow-500', label: 'Terlambat' },
}

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { notifications, readIds, unreadCount, markAllRead, markRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = (notif) => {
    markRead(notif.id)
    setOpen(false)
    navigate(`/orders/${notif.code}`)
  }

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center px-4 lg:px-6">
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <div className="hidden lg:block">
          <p className="text-sm text-gray-400">Selamat datang kembali 👋</p>
        </div>

        <div className="ml-auto flex items-center gap-2" ref={dropdownRef}>
          {/* Bell button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors relative"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute top-14 right-4 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">Notifikasi</p>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <CheckIcon className="w-3.5 h-3.5" />
                    Tandai semua dibaca
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <BellIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Tidak ada notifikasi</p>
                    <p className="text-xs text-gray-400 mt-1">Notifikasi pesanan akan muncul di sini</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isRead = readIds.has(notif.id)
                    const style = typeStyle[notif.type] || typeStyle.new
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleClick(notif)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${isRead ? 'bg-white' : style.bg}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${isRead ? 'bg-gray-300' : style.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-gray-900 truncate">{notif.title}</p>
                              <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(notif.time)}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.body}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
