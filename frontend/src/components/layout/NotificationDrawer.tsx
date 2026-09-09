import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../hooks/useStore'
import { setNotificationDrawerOpen } from '../../store/uiSlice'
import { notificationService } from '../../services/notificationService'
import { formatRelativeTime } from '../../lib/utils'
import { X, Bell, CheckCheck, Loader2, Trash2, ArrowRight } from 'lucide-react'

const TYPE_EMOJIS: Record<string, string> = {
  assignment: '📋', attendance: '📋', exam: '📊', placement: '💼',
  gamification: '🏆', system: '⚙️', forum: '💬', event: '🎉', general: '🔔',
}

export default function NotificationDrawer() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const open = useAppSelector(s => s.ui.notificationDrawerOpen)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const { data: notifData, isLoading, refetch } = useQuery({
    queryKey: ['notificationsDrawer'],
    queryFn: () => notificationService.getMyNotifications({ limit: 50 }),
    enabled: open,
  })

  const notifications = notifData?.data || []
  const unread = notifData?.unreadCount || notifications.filter((n: any) => !n.isRead).length

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n: any) => !n.isRead)
    : notifications

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead()
      queryClient.invalidateQueries({ queryKey: ['notificationsNav'] })
      queryClient.invalidateQueries({ queryKey: ['notificationsDrawer'] })
      refetch()
    } catch (e) {
      console.error(e)
    }
  }

  const handleNotificationClick = async (notif: any) => {
    try {
      const notifId = notif._id || notif.id
      if (!notif.isRead && notifId) {
        await notificationService.markRead([notifId])
        queryClient.invalidateQueries({ queryKey: ['notificationsNav'] })
        queryClient.invalidateQueries({ queryKey: ['notificationsDrawer'] })
      }
      if (notif.actionUrl) {
        dispatch(setNotificationDrawerOpen(false))
        navigate(notif.actionUrl)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteNotification = async (e: React.MouseEvent, notif: any) => {
    e.stopPropagation()
    try {
      const notifId = notif._id || notif.id
      if (notifId) {
        await notificationService.deleteNotification(notifId)
        queryClient.invalidateQueries({ queryKey: ['notificationsNav'] })
        queryClient.invalidateQueries({ queryKey: ['notificationsDrawer'] })
        refetch()
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" onClick={() => dispatch(setNotificationDrawerOpen(false))} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-[410px] z-50 flex flex-col bg-slate-900 border-l border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base leading-none">Notifications</h3>
                  <p className="text-2xs text-slate-400 mt-1">Live data-driven alerts</p>
                </div>
                {unread > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-2xs font-bold text-white bg-blue-600 shadow-sm animate-pulse">
                    {unread} new
                  </span>
                )}
              </div>
              <button
                onClick={handleMarkAllRead}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck size={18} />
              </button>
              <button
                onClick={() => dispatch(setNotificationDrawerOpen(false))}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/5 bg-slate-950/40">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filter === 'unread' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Unread ({unread})
              </button>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {isLoading ? (
                <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
                  <Loader2 className="animate-spin text-blue-500" size={22} />
                  <span className="text-xs">Loading notifications...</span>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-3">
                    <Bell size={22} />
                  </div>
                  <p className="text-sm font-medium text-white">No notifications found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                    {filter === 'unread' ? 'You have read all your notifications.' : 'All your latest alerts and domain updates will appear here.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif: any, i: number) => {
                  const notifId = notif._id || notif.id || i
                  const isUrgent = notif.priority === 'urgent' || notif.priority === 'high'

                  return (
                    <div
                      key={notifId}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group flex gap-3 px-5 py-4 cursor-pointer transition-all hover:bg-white/[0.03] ${
                        !notif.isRead ? 'bg-blue-500/[0.06]' : 'bg-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/5 border border-white/10 flex-shrink-0 group-hover:scale-105 transition-transform">
                        {notif.icon || TYPE_EMOJIS[notif.type] || '🔔'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-snug font-medium ${!notif.isRead ? 'text-white font-semibold' : 'text-slate-200'}`}>
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-xs" title="Unread" />
                            )}
                            <button
                              onClick={(e) => handleDeleteNotification(e, notif)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-white/10 transition-all"
                              title="Delete notification"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs mt-1 text-slate-400 line-clamp-2 leading-relaxed">{notif.message}</p>

                        <div className="flex items-center justify-between mt-2.5">
                          <span className="text-[10px] font-medium text-slate-500">
                            {formatRelativeTime(new Date(notif.createdAt || Date.now()))}
                          </span>

                          <div className="flex items-center gap-2">
                            {isUrgent && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                notif.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {notif.priority}
                              </span>
                            )}
                            {notif.actionUrl && (
                              <span className="text-[11px] font-medium text-blue-400 flex items-center gap-0.5 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                                {notif.actionLabel || 'View'} <ArrowRight size={12} />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
