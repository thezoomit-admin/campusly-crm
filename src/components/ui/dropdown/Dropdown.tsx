import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

const CLOSE_MS = 180

type DropdownProps = {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Dropdown({ isOpen, onClose, children, className = '' }: DropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isRendered, setIsRendered] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      setIsVisible(false)
      let innerFrame = 0
      const outerFrame = window.requestAnimationFrame(() => {
        innerFrame = window.requestAnimationFrame(() => setIsVisible(true))
      })
      return () => {
        window.cancelAnimationFrame(outerFrame)
        window.cancelAnimationFrame(innerFrame)
      }
    }

    setIsVisible(false)
    const timeout = window.setTimeout(() => setIsRendered(false), CLOSE_MS)
    return () => window.clearTimeout(timeout)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !target.closest('.dropdown-toggle')
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isRendered) return null

  return (
    <div
      ref={dropdownRef}
      className={[
        'absolute right-0 z-40 mt-2 rounded-xl border border-card-border bg-surface shadow-card',
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0',
        'transition-[opacity,transform] duration-180 ease-out',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
