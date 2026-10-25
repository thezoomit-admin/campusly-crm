import { useEffect, useState } from 'react'
import { FullScreenIcon, MinimizeScreenIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const DEFAULT_ICON_BTN =
  'relative grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-[color-mix(in_srgb,var(--color-primary)_16%,white)] text-primary-active transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--color-primary)_24%,white)] dark:bg-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] dark:text-nav-active dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_32%,transparent)]'

type FullscreenToggleProps = {
  className?: string
}

function fullscreenElement() {
  const doc = document as Document & { webkitFullscreenElement?: Element | null }
  return doc.fullscreenElement || doc.webkitFullscreenElement || null
}

export default function FullscreenToggle({ className = DEFAULT_ICON_BTN }: FullscreenToggleProps) {
  const [active, setActive] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => void
    }
    setSupported(Boolean(root.requestFullscreen || root.webkitRequestFullscreen))
    setActive(Boolean(fullscreenElement()))

    function sync() {
      setActive(Boolean(fullscreenElement()))
    }

    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  if (!supported) return null

  async function toggle() {
    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void
    }
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void
    }

    try {
      if (fullscreenElement()) {
        if (doc.exitFullscreen) await doc.exitFullscreen()
        else await doc.webkitExitFullscreen?.()
        return
      }
      if (root.requestFullscreen) await root.requestFullscreen()
      else await root.webkitRequestFullscreen?.()
    } catch {
      // The browser can reject fullscreen outside a user gesture or inside a restricted frame.
    }
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={active ? 'Exit full screen' : 'Enter full screen'}
      aria-pressed={active}
      title={active ? 'Exit full screen' : 'Full screen'}
      onClick={() => void toggle()}
    >
      <HugeiconsIcon
        icon={active ? MinimizeScreenIcon : FullScreenIcon}
        size={18}
        color="currentColor"
        strokeWidth={1.8}
      />
    </button>
  )
}
