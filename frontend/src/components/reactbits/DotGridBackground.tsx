import React from 'react'

interface DotGridBackgroundProps {
  children?: React.ReactNode
  className?: string
  dotColor?: string
  glowColor?: string
}

export default function DotGridBackground({
  children,
  className = '',
  dotColor,
  glowColor = 'rgba(168, 85, 247, 0.15)',
}: DotGridBackgroundProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Dot Grid Layer */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: dotColor
            ? `radial-gradient(${dotColor} 1.2px, transparent 1.2px)`
            : undefined,
          backgroundSize: '24px 24px',
        }}
      />
      {/* Top Ambient Glow / Aurora */}
      <div
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[450px] rounded-full pointer-events-none blur-[120px] z-0"
        style={{
          background: glowColor,
        }}
      />
      {/* Content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}
