import { useEffect, useRef } from 'react'

export interface HyperspeedProps {
  effectOptions?: any
  className?: string
}

export default function Hyperspeed({
  effectOptions,
  className = '',
}: HyperspeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    const colors = effectOptions?.colors?.rightCars 
      ? effectOptions.colors.rightCars.map((c: number) => '#' + c.toString(16).padStart(6, '0'))
      : ['#dadafa', '#bebae3', '#8f97e4', '#ff102a']

    const numStars = 200
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * width - width / 2,
      y: Math.random() * height - height / 2,
      z: Math.random() * width,
      color: colors[Math.floor(Math.random() * colors.length)],
      pz: 0
    }))

    const speed = effectOptions?.speedUp || 2

    const render = () => {
      ctx.fillStyle = effectOptions?.colors?.background 
        ? '#' + effectOptions.colors.background.toString(16).padStart(6, '0') 
        : 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2

      stars.forEach(star => {
        star.pz = star.z
        star.z -= speed * 10
        
        if (star.z < 1) {
          star.z = width
          star.x = Math.random() * width - width / 2
          star.y = Math.random() * height - height / 2
          star.pz = star.z
        }

        const sx = (star.x / star.z) * width + cx
        const sy = (star.y / star.z) * height + cy
        const px = (star.x / star.pz) * width + cx
        const py = (star.y / star.pz) * height + cy

        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(sx, sy)
        ctx.lineWidth = Math.max(0.5, (1 - star.z / width) * 3)
        ctx.strokeStyle = star.color
        
        ctx.shadowBlur = 10
        ctx.shadowColor = star.color
        
        ctx.stroke()
        ctx.shadowBlur = 0
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [effectOptions])

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  )
}
