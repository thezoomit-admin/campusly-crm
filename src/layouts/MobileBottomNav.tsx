import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Activity01Icon,
  Calendar03Icon,
  Home01Icon,
  UserIcon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'

type MobileBottomNavProps = {
  followUpBadge?: number
}

const tabClass = ({ isActive }: { isActive: boolean }) =>
  [
    'relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1.5 text-[0.65rem] font-medium no-underline transition-colors',
    isActive ? 'text-primary' : 'text-text-muted',
  ].join(' ')

function TabIcon({
  isActive,
  children,
  badge,
}: {
  isActive: boolean
  children: ReactNode
  badge?: number
}) {
  return (
    <>
      {isActive ? (
        <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
      ) : null}
      <span
        className={[
          'relative grid size-8 place-items-center rounded-xl',
          isActive ? 'bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]' : '',
        ].join(' ')}
      >
        {children}
        {badge && badge > 0 ? (
          <i className="absolute -top-0.5 -right-0.5 grid min-w-3.5 place-items-center rounded-full bg-red-500 px-1 text-[0.55rem] leading-[14px] font-bold text-white">
            {badge > 9 ? '9+' : badge}
          </i>
        ) : null}
      </span>
    </>
  )
}

export default function MobileBottomNav({ followUpBadge = 0 }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 hidden border-t border-header-border bg-surface/95 px-1 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] backdrop-blur-md max-[960px]:flex"
      aria-label="Primary"
    >
      <NavLink to="/dashboard" className={tabClass} end>
        {({ isActive }) => (
          <>
            <TabIcon isActive={isActive}>
              <HugeiconsIcon icon={Home01Icon} size={20} color="currentColor" strokeWidth={1.6} />
            </TabIcon>
            <span>Home</span>
          </>
        )}
      </NavLink>

      <NavLink to="/leads" className={tabClass}>
        {({ isActive }) => (
          <>
            <TabIcon isActive={isActive}>
              <HugeiconsIcon icon={UserMultiple02Icon} size={20} color="currentColor" strokeWidth={1.6} />
            </TabIcon>
            <span>Leads</span>
          </>
        )}
      </NavLink>

      <NavLink to="/follow-ups" className={tabClass}>
        {({ isActive }) => (
          <>
            <TabIcon isActive={isActive} badge={followUpBadge}>
              <HugeiconsIcon icon={Calendar03Icon} size={20} color="currentColor" strokeWidth={1.6} />
            </TabIcon>
            <span>Follow-ups</span>
          </>
        )}
      </NavLink>

      <NavLink to="/activity-history" className={tabClass}>
        {({ isActive }) => (
          <>
            <TabIcon isActive={isActive}>
              <HugeiconsIcon icon={Activity01Icon} size={20} color="currentColor" strokeWidth={1.6} />
            </TabIcon>
            <span>Activities</span>
          </>
        )}
      </NavLink>

      <NavLink to="/profile" className={tabClass}>
        {({ isActive }) => (
          <>
            <TabIcon isActive={isActive}>
              <HugeiconsIcon icon={UserIcon} size={20} color="currentColor" strokeWidth={1.6} />
            </TabIcon>
            <span>Profile</span>
          </>
        )}
      </NavLink>
    </nav>
  )
}
