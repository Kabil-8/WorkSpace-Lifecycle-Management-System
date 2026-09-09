import React, { useEffect, useRef } from 'react'

interface GlobalSpotlightProps {
  glowColor?: string // RGB comma-separated e.g. "168, 85, 247"
  radius?: number
  enableAmbientSpotlight?: boolean
}

export const GlobalSpotlight: React.FC<GlobalSpotlightProps> = ({
  glowColor = '168, 85, 247',
  radius = 320,
  enableAmbientSpotlight = true,
}) => {
  const ambientRef = useRef<HTMLDivElement>(null)
  const isPointerFine = useRef(true)

  useEffect(() => {
    // Check if pointer is fine (mouse/trackpad, not touch)
    const media = window.matchMedia('(pointer: fine)')
    isPointerFine.current = media.matches

    const handleMediaChange = (e: MediaQueryListEvent) => {
      isPointerFine.current = e.matches
    }
    media.addEventListener?.('change', handleMediaChange)

    let rafId: number | null = null
    let lastX = -1000
    let lastY = -1000
    let isInside = false

    // Query candidates with caching to ensure high performance
    let cachedCards: HTMLElement[] = []
    let lastQueryTime = 0

    const getCards = (): HTMLElement[] => {
      const now = performance.now()
      if (now - lastQueryTime > 500 || cachedCards.length === 0) {
        cachedCards = Array.from(
          document.querySelectorAll<HTMLElement>(
            '.card, .stat-card, .glass-card, .twin-metric-card, .spotlight-card, .card--border-glow, [data-glow]'
          )
        )
        lastQueryTime = now
      }
      return cachedCards
    }

    const PROXIMITY = radius * 0.55
    const FADE = radius

    const updateGlow = () => {
      rafId = null
      if (!isPointerFine.current) return

      if (!isInside) {
        if (ambientRef.current) {
          ambientRef.current.style.opacity = '0'
        }
        cachedCards.forEach(card => {
          if (card.dataset.spotlightActive === 'true') {
            card.style.setProperty('--glow-intensity', '0')
            card.dataset.spotlightActive = 'false'
          }
        })
        return
      }

      if (ambientRef.current) {
        ambientRef.current.style.transform = `translate3d(${lastX}px, ${lastY}px, 0) translate(-50%, -50%)`
        ambientRef.current.style.opacity = '0.7'
      }

      const cards = getCards()

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]
        const rect = card.getBoundingClientRect()

        // Quick AABB rejection: card is too far from cursor
        if (
          lastX < rect.left - FADE ||
          lastX > rect.right + FADE ||
          lastY < rect.top - FADE ||
          lastY > rect.bottom + FADE ||
          rect.width === 0 ||
          rect.height === 0
        ) {
          if (card.dataset.spotlightActive === 'true') {
            card.style.setProperty('--glow-intensity', '0')
            card.dataset.spotlightActive = 'false'
          }
          continue
        }

        // Exact distance from cursor to nearest point on the card's boundary
        const nearestX = Math.max(rect.left, Math.min(lastX, rect.right))
        const nearestY = Math.max(rect.top, Math.min(lastY, rect.bottom))
        const distance = Math.hypot(lastX - nearestX, lastY - nearestY)

        let intensity = 0
        if (distance <= PROXIMITY) {
          intensity = 1
        } else if (distance <= FADE) {
          intensity = (FADE - distance) / (FADE - PROXIMITY)
        }

        const relativeX = ((lastX - rect.left) / rect.width) * 100
        const relativeY = ((lastY - rect.top) / rect.height) * 100

        card.style.setProperty('--glow-x', `${relativeX.toFixed(1)}%`)
        card.style.setProperty('--glow-y', `${relativeY.toFixed(1)}%`)
        card.style.setProperty('--glow-intensity', intensity.toFixed(3))
        card.style.setProperty('--glow-radius', `${radius}px`)
        card.dataset.spotlightActive = 'true'
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      lastX = e.clientX
      lastY = e.clientY
      isInside = true

      if (rafId === null) {
        rafId = requestAnimationFrame(updateGlow)
      }
    }

    const onPointerLeave = () => {
      isInside = false
      if (rafId === null) {
        rafId = requestAnimationFrame(updateGlow)
      }
    }

    const onScroll = () => {
      if (isInside && rafId === null) {
        rafId = requestAnimationFrame(updateGlow)
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

    // When DOM updates (navigation, dynamic elements), invalidate cache
    const observer = new MutationObserver(() => {
      cachedCards = []
      lastQueryTime = 0
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('scroll', onScroll)
      observer.disconnect()
      media.removeEventListener?.('change', handleMediaChange)
    }
  }, [radius])

  return (
    <>
      {enableAmbientSpotlight && (
        <div
          ref={ambientRef}
          className="global-ambient-spotlight pointer-events-none fixed top-0 left-0 z-40 rounded-full transition-opacity duration-300 ease-out"
          style={{
            width: '750px',
            height: '750px',
            background: `radial-gradient(circle,
              rgba(var(--glow-rgb, 168, 85, 247), 0.12) 0%,
              rgba(var(--glow-rgb, 168, 85, 247), 0.06) 20%,
              rgba(var(--glow-rgb, 168, 85, 247), 0.02) 45%,
              transparent 70%
            )`,
            opacity: 0,
            transform: 'translate3d(-1000px, -1000px, 0) translate(-50%, -50%)',
            mixBlendMode: 'screen',
            willChange: 'transform, opacity',
          }}
        />
      )}
    </>
  )
}

export default GlobalSpotlight
