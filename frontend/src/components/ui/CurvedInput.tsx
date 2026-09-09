import React from 'react'

interface CurvedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  error?: string
}

export const CurvedInput: React.FC<CurvedInputProps> = ({
  label,
  icon,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-300 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && <div className="absolute left-3.5 text-slate-400 pointer-events-none">{icon}</div>}
        <input
          id={inputId}
          className={`w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 backdrop-blur-md focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
    </div>
  )
}
