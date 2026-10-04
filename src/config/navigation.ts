import { MASTER_DATA_NAV_GROUPS } from './masterData'

export type NavIconName =
  | 'grid'
  | 'users'
  | 'file'
  | 'graduate'
  | 'folder'
  | 'card'
  | 'bell'
  | 'chart'
  | 'id'
  | 'user'
  | 'shield'
  | 'database'
  | 'settings'
  | 'activity'
  | 'message'

export type NavItem = {
  to: string
  label: string
  icon: NavIconName
  permission?: string
  children?: NavItem[]
}

export type NavGroup = {
  id: string
  label: string
  items: NavItem[]
}

export const APP_NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: 'grid' }],
  },
  {
    id: 'crm',
    label: 'CRM',
    items: [
      {
        to: '/leads',
        label: 'Leads',
        icon: 'users',
        permission: 'lead:view',
        children: [
          { to: '/leads', label: 'All Leads', icon: 'users', permission: 'lead:view' },
          { to: '/leads/mine', label: 'My Leads', icon: 'users', permission: 'lead:view' },
          { to: '/leads/pool', label: 'Lead Pool', icon: 'users', permission: 'lead:assign' },
        ],
      },
      { to: '/applications', label: 'Applications', icon: 'file', permission: 'lead:convert' },
      { to: '/students', label: 'Students', icon: 'graduate', permission: 'lead:convert' },
      { to: '/service-items', label: 'Services & Packages', icon: 'card', permission: 'service:view' },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    items: [
      { to: '/follow-ups', label: 'Follow-ups', icon: 'bell', permission: 'follow_up:view' },
      {
        to: '/communications',
        label: 'Communication',
        icon: 'message',
        permission: 'communication:view',
        children: [
          { to: '/communications', label: 'Communication Hub', icon: 'message', permission: 'communication:view' },
          { to: '/whatsapp', label: 'WhatsApp', icon: 'message', permission: 'communication:view' },
          { to: '/email', label: 'Email', icon: 'message', permission: 'communication:view' },
        ],
      },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { to: '/campaigns', label: 'Campaigns', icon: 'chart', permission: 'campaign:view' },
      { to: '/meta-leads', label: 'Meta Lead Ads', icon: 'chart', permission: 'communication:view' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { to: '/documents', label: 'Documents', icon: 'folder', permission: 'document:view' },
      { to: '/payments', label: 'Payments', icon: 'card', permission: 'payment:view' },
      { to: '/activity-history', label: 'Activity History', icon: 'activity', permission: 'activity:view' },
      { to: '/reports', label: 'Reports', icon: 'chart', permission: 'report:view' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { to: '/employees', label: 'Employees', icon: 'id', permission: 'employee:view' },
      { to: '/users', label: 'Users', icon: 'user', permission: 'user:view' },
      { to: '/roles', label: 'Roles & Permissions', icon: 'shield', permission: 'role:view' },
      { to: '/audit-logs', label: 'Audit Log', icon: 'file', permission: 'audit:view' },
      {
        to: '/master-data',
        label: 'Master Data',
        icon: 'database',
        permission: 'master_data:view',
        children: MASTER_DATA_NAV_GROUPS.map((group) => ({
          to: `/master-data/${group.slug}`,
          label: group.name,
          icon: 'database' as const,
          permission: 'master_data:view',
        })),
      },
      { to: '/settings', label: 'Settings', icon: 'settings', permission: 'settings:view' },
    ],
  },
]

export const APP_NAV_ITEMS = APP_NAV_GROUPS.flatMap((group) => group.items)

export type SearchablePage = {
  to: string
  label: string
  group: string
  keywords: string[]
}

const PAGE_KEYWORDS: Record<string, string[]> = {
  '/dashboard': ['home', 'overview', 'summary'],
  '/leads': ['prospect', 'enquiry', 'inquiry'],
  '/leads/mine': ['assigned', 'my leads', 'workload', 'follow-up'],
  '/leads/pool': ['unassigned', 'queue', 'assign', 'distribution'],
  '/applications': ['admission', 'apply'],
  '/students': ['learner', 'client'],
  '/service-items': ['services', 'catalog', 'pricing', 'offer', 'package'],
  '/documents': ['files', 'papers'],
  '/payments': ['invoice', 'fee', 'billing'],
  '/follow-ups': ['reminder', 'task'],
  '/communications': ['hub', 'whatsapp', 'email', 'meta', 'website', 'enquiry', 'inbox'],
  '/whatsapp': ['whatsapp', 'chat', 'inbox', 'conversation', 'message', 'reply'],
  '/email': ['email', 'inbox', 'mail', 'thread', 'reply', 'attachment'],
  '/campaigns': ['source', 'utm', 'roi', 'ads', 'marketing'],
  '/meta-leads': ['facebook', 'instagram', 'meta', 'lead ads', 'campaign'],
  '/activity-history': ['timeline', 'calls', 'meetings', 'log'],
  '/reports': ['analytics', 'stats'],
  '/employees': ['staff', 'hr', 'people', 'directory'],
  '/users': ['accounts', 'login', 'access'],
  '/roles': ['permissions', 'access'],
  '/audit-logs': ['logs', 'history', 'security'],
  '/master-data': ['catalog', 'dropdowns', 'settings'],
  '/settings': ['config', 'preferences'],
  '/profile': ['me', 'photo', 'account'],
  '/account': ['password', 'security'],
}

export function flattenSearchablePages(): SearchablePage[] {
  const pages: SearchablePage[] = [
    { to: '/profile', label: 'Profile', group: 'Account', keywords: PAGE_KEYWORDS['/profile'] },
    { to: '/account', label: 'Change password', group: 'Account', keywords: PAGE_KEYWORDS['/account'] },
  ]

  for (const group of APP_NAV_GROUPS) {
    for (const item of group.items) {
      if (item.children?.length) {
        if (!item.children.some((child) => child.to === item.to)) {
          pages.push({
            to: item.to,
            label: item.label,
            group: group.label,
            keywords: PAGE_KEYWORDS[item.to] ?? [],
          })
        }
        for (const child of item.children) {
          pages.push({
            to: child.to,
            label: child.label,
            group: item.label,
            keywords: [...(PAGE_KEYWORDS[child.to] ?? []), item.label, group.label],
          })
        }
      } else {
        pages.push({
          to: item.to,
          label: item.label,
          group: group.label,
          keywords: PAGE_KEYWORDS[item.to] ?? [],
        })
      }
    }
  }

  return pages
}
