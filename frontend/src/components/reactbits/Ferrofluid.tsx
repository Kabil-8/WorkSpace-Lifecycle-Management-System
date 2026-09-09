import { useEffect, useRef } from 'react'

interface FerrofluidProps {
  colors?: string[]
  speed?: number
  scale?: number
  turbulence?: number
  fluidity?: number
  rimWidth?: number
  sharpness?: number
  shimmer?: number
  glow?: number
  flowDirection?: 'down' | 'up' | 'left' | 'right'
  opacity?: number
  mouseInteraction?: boolean
  mouseStrength?: number
  mouseRadius?: number
  className?: string
}

export default function Ferrofluid({
  colors = ['#3B82F6', '#8B5CF6', '#10B981'],
  speed = 0.5,
  scale = 1.6,
  mouseInteraction = true,
  className = '',
}: FerrofluidProps) {
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

    let mouseX = width / 2
    let mouseY = height / 2

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInteraction || !canvas) return
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Particle nodes for liquid ferrofluid effect
    const numParticles = 35
    const particles = Array.from({ length: numParticles }, (_, i) => ({
      x: (i / numParticles) * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * speed * 2,
      vy: (Math.random() - 0.5) * speed * 2,
      radius: Math.random() * 60 + 30,
      color: colors[i % colors.length],
    }))

    let time = 0

    const render = () => {
      time += 0.02 * speed
      ctx.clearRect(0, 0, width, height)

      // Fluid background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height)
      bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.6)')
      bgGrad.addColorStop(1, 'rgba(9, 9, 11, 0.95)')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Render fluid blobs
      particles.forEach((p, idx) => {
        p.x += p.vx + Math.sin(time + idx) * 0.8
        p.y += p.vy + Math.cos(time + idx) * 0.8

        if (p.x < -100) p.x = width + 100
        if (p.x > width + 100) p.x = -100
        if (p.y < -100) p.y = height + 100
        if (p.y > height + 100) p.y = -100

        // Mouse interaction attraction/repulsion
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 200 && mouseInteraction) {
          p.x += (dx / dist) * 2
          p.y += (dy / dist) * 2
        }

        const grad = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.radius * scale
        )
        grad.addColorStop(0, p.color + '80')
        grad.addColorStop(0.5, p.color + '25')
        grad.addColorStop(1, 'transparent')

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * scale, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [colors, speed, scale, mouseInteraction])

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  )
}
