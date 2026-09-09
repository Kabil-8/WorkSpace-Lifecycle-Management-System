import { useAppSelector } from '../../hooks/useStore'
import Hyperspeed from '../reactbits/Hyperspeed'
import { hyperspeedPresets } from '../reactbits/HyperSpeedPresets'

export default function PageSkeletonLoader() {
  const theme = useAppSelector(s => s.ui.theme)
  const isLight = theme === 'light'

  return (
    <div
      className="relative w-full h-full min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden transition-colors duration-300"
      style={{
        background: isLight ? '#F0F4FF' : 'var(--bg-base)',
      }}
    >
      {/* ── ReactBits Hyperspeed Canvas Only ── */}
      <div className="absolute inset-0 z-0 opacity-100">
        <Hyperspeed effectOptions={isLight ? hyperspeedPresets.light : hyperspeedPresets.one} />
      </div>
    </div>
  )
}
