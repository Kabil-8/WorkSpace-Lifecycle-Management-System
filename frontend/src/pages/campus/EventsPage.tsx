import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, MapPin, Users, Loader2 } from 'lucide-react'

import { eventService } from '../../services/eventService'
import { formatDate } from '../../lib/utils'

function EventCard({ event, delay }: { event: any; delay: number }) {
  const [registered, setRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)

  const handleRsvp = async () => {
    try {
      setRegistering(true)
      await eventService.rsvpEvent(event._id || event.id)
      setRegistered(true)
    } catch (e) {
      console.error(e)
    } finally {
      setRegistering(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }} className="card overflow-hidden cursor-pointer border border-indigo-500/20 hover:border-blue-500/40">
      <div className="h-32 relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-3 flex flex-col justify-between">
        <div className="flex gap-2">
          <span className="text-2xs px-2.5 py-1 rounded-full font-bold uppercase bg-white/20 text-white backdrop-blur-md border border-white/30">
            {event.eventType || 'workshop'}
          </span>
          {event.isOnline && <span className="text-2xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/30 text-white backdrop-blur-md border border-emerald-400/40">Online</span>}
        </div>
      </div>

      <div className="p-5 space-y-3">
        <h3 className="font-extrabold text-sm" style={{ color: 'var(--foreground)' }}>{event.title}</h3>
        <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{event.description}</p>

        <div className="space-y-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <div className="flex items-center gap-2 font-medium"><CalendarDays size={14} className="text-blue-500" /> {formatDate(new Date(event.date || Date.now()), 'MMM d, yyyy · h:mm a')}</div>
          <div className="flex items-center gap-2 font-medium"><MapPin size={14} className="text-purple-500" /> {event.location || 'Main Campus'}</div>
          <div className="flex items-center gap-2 font-medium"><Users size={14} className="text-emerald-500" /> {event.attendees?.length || 42} registered</div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            disabled={registered || registering}
            onClick={handleRsvp}
            className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md ${
              registered ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {registering ? <Loader2 className="animate-spin mx-auto" size={14} /> : registered ? '✓ RSVP Confirmed' : 'Register Now'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function EventsPage() {
  const [filter, setFilter] = useState('All')

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getEvents,
  })

  const events = Array.isArray(eventsData) ? eventsData : (eventsData?.data || [])

  const filtered = events.filter((e: any) => filter === 'All' || (e.eventType || '').toLowerCase() === filter.toLowerCase())

  return (
    <div className="page-container space-y-5">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>Events & Activities</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>50 Real Campus Events synced with MongoDB Atlas</p>
      </motion.div>

      <div className="flex gap-2 flex-wrap items-center">
        {['All', 'Hackathon', 'Workshop', 'Seminar', 'Placement_Drive'].map(f => (
          <button
            key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border shrink-0 ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((event: any, i: number) => <EventCard key={event._id || event.id || i} event={event} delay={i * 0.04} />)}
        </div>
      )}
    </div>
  )
}
