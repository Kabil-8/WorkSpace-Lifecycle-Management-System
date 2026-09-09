import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface SpecularButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  loading?: boolean
}

export const SpecularButton: React.FC<SpecularButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-sm gap-2 rounded-xl',
    lg: 'px-6 py-3 text-base gap-2.5 rounded-2xl',
  }

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 text-white shadow-lg shadow-indigo-500/20 border border-white/20 hover:shadow-indigo-500/40',
    secondary:
      'bg-slate-800/80 hover:bg-slate-700/80 text-white border border-white/10 backdrop-blur-md',
    ghost:
      'bg-transparent hover:bg-white/10 text-slate-300 hover:text-white',
    outline:
      'bg-transparent border border-indigo-500/30 hover:border-indigo-500 text-indigo-400 hover:text-indigo-300 backdrop-blur-sm',
    danger:
      'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/20 border border-white/20 hover:shadow-red-500/40',
  }

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02, y: disabled || loading ? 0 : -1 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center font-medium transition-all duration-200 overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {/* Specular highlight glow */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}

      <span>{children}</span>
    </motion.button>
  )
}
