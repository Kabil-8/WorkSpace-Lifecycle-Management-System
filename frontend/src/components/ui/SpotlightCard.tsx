import React, { useRef, useState } from 'react'

interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
  spotlightColor?: string
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(168, 85, 247, 0.20)',
}) => {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setPosition({ x, y })

    const relX = ((x / rect.width) * 100).toFixed(1)
    const relY = ((y / rect.height) * 100).toFixed(1)
    divRef.current.style.setProperty('--glow-x', `${relX}%`)
    divRef.current.style.setProperty('--glow-y', `${relY}%`)
    divRef.current.style.setProperty('--glow-intensity', '1')
  }

  const handleMouseEnter = () => {
    setOpacity(1)
    divRef.current?.style.setProperty('--glow-intensity', '1')
  }

  const handleMouseLeave = () => {
    setOpacity(0)
    divRef.current?.style.setProperty('--glow-intensity', '0')
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`card spotlight-card card--border-glow relative rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/10 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 50%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}
