import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

export interface ChromaItem {
  image: string
  title: string
  subtitle: string
  handle?: string
  borderColor?: string
  gradient?: string
  url?: string
}

interface ChromaGridProps {
  items: ChromaItem[]
  radius?: number
  damping?: number
  fadeOut?: number
  ease?: string
  className?: string
}

export default function ChromaGrid({
  items,
  radius = 300,
  className = '',
}: ChromaGridProps) {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseLeave = () => {
    setMousePos({ x: -1000, y: -1000 })
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 overflow-hidden rounded-2xl ${className}`}
    >
      {/* Dynamic Cursor Radial Glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
        style={{
          background: `radial-gradient(${radius}px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.18), transparent 80%)`,
        }}
      />

      {items.map((item, index) => (
        <motion.div
          key={index}
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="group relative z-10 rounded-2xl p-5 border overflow-hidden transition-all duration-300 backdrop-blur-md flex flex-col justify-between"
          style={{
            background: item.gradient || 'linear-gradient(145deg, rgba(var(--rgb-white),0.05), rgba(var(--rgb-white),0.01))',
            borderColor: item.borderColor || 'var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          {/* Card Content */}
          <div className="flex items-center gap-4">
            <img
              src={item.image}
              alt={item.title}
              className="w-14 h-14 rounded-2xl object-cover border-2 flex-shrink-0"
              style={{ borderColor: item.borderColor || '#3B82F6' }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold group-hover:text-blue-500 transition-colors truncate" style={{ color: 'var(--text-primary)' }}>
                {item.title}
              </h3>
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                {item.subtitle}
              </p>
              {item.handle && (
                <p className="text-2xs font-mono text-purple-400 mt-0.5">{item.handle}</p>
              )}
            </div>
          </div>

          {item.url && (
            <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <span className="text-2xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>View Profile</span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                style={{
                  background: `${item.borderColor || '#3B82F6'}20`,
                  color: item.borderColor || '#60A5FA',
                  border: `1px solid ${item.borderColor || '#3B82F6'}40`,
                }}
              >
                Connect →
              </a>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
