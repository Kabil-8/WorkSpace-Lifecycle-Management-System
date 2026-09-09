import React, { useRef, useState } from 'react'

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  spotlightColor?: string
  borderColor?: string
}

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(168, 85, 247, 0.20)',
  borderColor = 'rgba(168, 85, 247, 0.45)',
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return
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

  const handleFocus = () => {
    setIsFocused(true)
    setOpacity(0.6)
    divRef.current?.style.setProperty('--glow-intensity', '0.8')
  }

  const handleBlur = () => {
    setIsFocused(false)
    setOpacity(0)
    divRef.current?.style.setProperty('--glow-intensity', '0')
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
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`card spotlight-card card--border-glow relative rounded-2xl border transition-all duration-300 overflow-hidden ${className}`}
      style={{
        background: 'var(--card)',
        borderColor: opacity > 0 ? borderColor : 'var(--border)',
      }}
      {...props}
    >
      {/* Radial Spotlight Surface Glow */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
