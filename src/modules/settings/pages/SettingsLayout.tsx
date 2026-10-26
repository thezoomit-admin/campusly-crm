import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  OfficeIcon,
  Plug01Icon,
  SlidersHorizontalIcon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { adminPage } from '@/styles/admin'

const TAB_ICON_SIZE = 18

const SECTIONS = [
  { to: '/settings/workspace', label: 'Workspace', icon: OfficeIcon },
  { to: '/settings/leads', label: 'Lead operations', icon: UserMultiple02Icon },
  { to: '/settings/integrations', label: 'Integrations', icon: Plug01Icon },
  { to: '/settings/preferences', label: 'My preferences', icon: SlidersHorizontalIcon },
]

export default function SettingsLayout() {
  const location = useLocation()
  if (location.pathname === '/settings') {
    return <Navigate to="/settings/workspace" replace />
  }

  return (
    <div className={adminPage}>
      <PageMeta
        title="Settings"
        description="Workspace identity, lead defaults, integration status, and personal display preferences."
      />
      <PageHeader
        title="Settings"
        subtitle="Workspace defaults for the whole team, and display preferences that stay on your account."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Settings' }]}
      />

      <nav className="flex gap-1 overflow-x-auto border-b border-border-subtle" aria-label="Settings sections">
        {SECTIONS.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            className={({ isActive }) =>
              [
                'inline-flex shrink-0 items-center gap-2 border-0 border-b-2 bg-transparent px-3 py-2.5 text-[0.88rem] whitespace-nowrap no-underline',
                isActive
                  ? 'border-primary font-semibold text-primary'
                  : 'border-transparent font-medium text-text-muted hover:text-text-strong',
              ].join(' ')
            }
          >
            <HugeiconsIcon icon={section.icon} size={TAB_ICON_SIZE} color="currentColor" strokeWidth={1.5} />
            {section.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
