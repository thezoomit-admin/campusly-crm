import type { ReactNode } from 'react'

export type PageCardProps = {
  children: ReactNode
  className?: string
  rounded?: '3xl' | 'lg'
  padded?: boolean
}

export default function PageCard({
  children,
  className = '',
  rounded = '3xl',
  padded = true,
}: PageCardProps) {
  const radius = rounded === '3xl' ? 'rounded-3xl' : 'rounded-lg'
  const padding = padded ? 'p-6' : ''
  return (
    <div className={`min-w-0 max-w-full border border-card-border bg-surface ${radius} ${padding} ${className}`.trim()}>
      {children}
    </div>
  )
}
