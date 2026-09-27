import type { ReactNode, MouseEvent } from 'react'
import { Link } from 'react-router-dom'

type DropdownItemProps = {
  tag?: 'a' | 'button'
  to?: string
  onClick?: () => void
  onItemClick?: () => void
  baseClassName?: string
  className?: string
  children: ReactNode
}

export function DropdownItem({
  tag = 'button',
  to,
  onClick,
  onItemClick,
  baseClassName = 'block w-full px-4 py-2 text-left text-sm text-text-strong hover:bg-hover-bg',
  className = '',
  children,
}: DropdownItemProps) {
  const combinedClasses = `${baseClassName} ${className}`.trim()

  function handleClick(event: MouseEvent) {
    if (tag === 'button') event.preventDefault()
    onClick?.()
    onItemClick?.()
  }

  if (tag === 'a' && to) {
    return (
      <Link to={to} className={combinedClasses} onClick={handleClick}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" onClick={handleClick} className={combinedClasses}>
      {children}
    </button>
  )
}
