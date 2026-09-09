import { useEffect, useRef } from 'react'

interface LightfallProps {
  colors?: string[]
  backgroundColor?: string
  speed?: number
  streakCount?: number
  streakWidth?: number
  streakLength?: number
  density?: number
  twinkle?: number
  glow?: number
  backgroundGlow?: number
  zoom?: number
  opacity?: number
  mouseInteraction?: boolean
  mouseStrength?: number
  mouseRadius?: number
  className?: string
}

export default function Lightfall({
  colors = ['#A6C8FF', '#340dd0', '#FF9FFC'],
  backgroundColor = '#0A29FF',
  speed = 0.5,
  streakCount = 2,
  streakWidth = 1,
  streakLength = 1,
  density = 0.6,
  twinkle = 1,
  glow = 1,
  backgroundGlow = 0.5,
  zoom = 3,
  opacity = 1,
  mouseInteraction = true,
  mouseStrength = 0.5,
  mouseRadius = 1,
  className = '',
}: LightfallProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800)
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.parentElement?.clientWidth || 800
      height = canvas.height = canvas.parentElement?.clientHeight || 600
    }

    window.addEventListener('resize', handleResize)

    let mouseX = -1000
    let mouseY = -1000

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInteraction || !canvas) return
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }
    
    const handleMouseLeave = () => {
      mouseX = -1000
      mouseY = -1000
    }

    window.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    const actualStreakCount = Math.floor(width * density * streakCount * 0.1)
    
    interface Particle {
      x: number
      y: number
      len: number
      speedY: number
      color: string
      alpha: number
      twinkleSpeed: number
    }

    const particles: Particle[] = Array.from({ length: actualStreakCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 2 - height, // Start above and throughout
      len: (Math.random() * 100 + 50) * streakLength * zoom,
      speedY: (Math.random() * 10 + 5) * speed * zoom,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random(),
      twinkleSpeed: (Math.random() * 0.05 + 0.02) * twinkle,
    }))

    const render = () => {
      ctx.globalAlpha = 1
      // Background with slight trail effect
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)
      
      // Background Glow
      if (backgroundGlow > 0) {
        ctx.fillStyle = `rgba(var(--rgb-white), ${backgroundGlow * 0.05})`
        ctx.fillRect(0, 0, width, height)
      }

      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = opacity

      particles.forEach(p => {
        p.y += p.speedY
        p.alpha += p.twinkleSpeed
        if (p.alpha > 1 || p.alpha < 0) p.twinkleSpeed *= -1
        
        let pX = p.x
        // Mouse interaction
        if (mouseInteraction) {
          const dx = mouseX - p.x
          const dy = mouseY - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const interactionRadius = mouseRadius * 200
          if (dist < interactionRadius) {
            const force = (interactionRadius - dist) / interactionRadius
            pX -= (dx / dist) * force * mouseStrength * 50
          }
        }

        // Wrap around
        if (p.y > height + p.len) {
          p.y = -p.len
          p.x = Math.random() * width
          p.speedY = (Math.random() * 10 + 5) * speed * zoom
        }

        const currentAlpha = Math.max(0, Math.min(1, Math.abs(p.alpha)))
        
        ctx.beginPath()
        ctx.moveTo(pX, p.y)
        ctx.lineTo(pX, p.y - p.len)
        ctx.lineWidth = streakWidth * zoom
        
        // Gradient for streak
        const grad = ctx.createLinearGradient(pX, p.y, pX, p.y - p.len)
        grad.addColorStop(0, p.color)
        grad.addColorStop(1, 'transparent')
        
        ctx.strokeStyle = grad
        
        if (glow > 0) {
          ctx.shadowBlur = glow * 10 * zoom
          ctx.shadowColor = p.color
        } else {
          ctx.shadowBlur = 0
        }
        
        ctx.globalAlpha = currentAlpha * opacity
        ctx.stroke()
      })
      
      ctx.globalCompositeOperation = 'source-over'
      ctx.shadowBlur = 0

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [colors, backgroundColor, speed, streakCount, streakWidth, streakLength, density, twinkle, glow, backgroundGlow, zoom, opacity, mouseInteraction, mouseStrength, mouseRadius])

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  )
}
