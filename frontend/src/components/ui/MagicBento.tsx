import React from 'react'

interface MagicBentoProps {
  children: React.ReactNode
  className?: string
}

export const MagicBento: React.FC<MagicBentoProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 ${className}`}>
      {children}
    </div>
  )
}

interface MagicBentoItemProps {
  children: React.ReactNode
  colSpan?: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2 | 3
  className?: string
}

export const MagicBentoItem: React.FC<MagicBentoItemProps> = ({
  children,
  colSpan = 1,
  rowSpan = 1,
  className = '',
}) => {
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'col-span-1 md:col-span-2',
    3: 'col-span-1 lg:col-span-3',
    4: 'col-span-1 md:col-span-2 lg:col-span-4',
  }

  const rowSpanClasses = {
    1: 'row-span-1',
    2: 'row-span-1 md:row-span-2',
    3: 'row-span-1 md:row-span-3',
  }

  return (
    <div
      className={`card card--border-glow spotlight-card rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/10 ${colSpanClasses[colSpan]} ${rowSpanClasses[rowSpan]} ${className}`}
    >
      {children}
    </div>
  )
}
