interface ShinyTextProps {
  text: string
  disabled?: boolean
  speed?: number
  className?: string
}

export default function ShinyText({
  text,
  disabled = false,
  speed = 5,
  className = '',
}: ShinyTextProps) {
  const animationDuration = `${speed}s`

  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${disabled ? '' : 'animate-shine'} ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.85) 50%, rgba(255, 255, 255, 0) 60%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animationDuration,
      }}
    >
      {text}
    </span>
  )
}
