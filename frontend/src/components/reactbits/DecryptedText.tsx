import { useEffect, useState, useRef } from 'react'

interface DecryptedTextProps {
  text: string
  speed?: number
  maxIterations?: number
  sequential?: boolean
  characters?: string
  className?: string
  encryptedClassName?: string
  parentClassName?: string
  animateOn?: 'hover' | 'view'
}

export default function DecryptedText({
  text,
  speed = 40,
  maxIterations = 10,
  sequential = true,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  encryptedClassName = '',
  parentClassName = '',
  animateOn = 'hover',
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text)
  const [isHovering, setIsHovering] = useState(false)
  const [isScrolledIntoView, setIsScrolledIntoView] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    let currentIteration = 0

    const getNextChar = () => characters[Math.floor(Math.random() * characters.length)]

    const triggerAnimation = () => {
      currentIteration = 0
      interval = setInterval(() => {
        setDisplayText(() => {
          return text
            .split('')
            .map((char, index) => {
              if (char === ' ') return ' '
              if (sequential) {
                if (index < (currentIteration / maxIterations) * text.length) {
                  return text[index]
                }
                return getNextChar()
              }
              if (currentIteration >= maxIterations) {
                return text[index]
              }
              return getNextChar()
            })
            .join('')
        })

        currentIteration++
        if (currentIteration > maxIterations + (sequential ? text.length : 0)) {
          clearInterval(interval)
          setDisplayText(text)
        }
      }, speed)
    }

    if (animateOn === 'hover' && isHovering) {
      triggerAnimation()
    } else if (animateOn === 'view' && isScrolledIntoView) {
      triggerAnimation()
    } else {
      setDisplayText(text)
    }

    return () => clearInterval(interval)
  }, [isHovering, isScrolledIntoView, text, speed, maxIterations, sequential, characters, animateOn])

  useEffect(() => {
    if (animateOn !== 'view') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsScrolledIntoView(true)
        }
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [animateOn])

  return (
    <span
      ref={containerRef}
      className={`inline-block ${parentClassName}`}
      onMouseEnter={() => animateOn === 'hover' && setIsHovering(true)}
      onMouseLeave={() => animateOn === 'hover' && setIsHovering(false)}
    >
      <span className={`${className} ${encryptedClassName}`}>{displayText}</span>
    </span>
  )
}
