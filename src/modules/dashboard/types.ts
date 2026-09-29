export type DashIconName =
  | 'users'
  | 'calendar'
  | 'graduate'
  | 'revenue'
  | 'phone'
  | 'mail'
  | 'clock'
  | 'plus'
  | 'file'
  | 'card'
  | 'bell'
  | 'quote'

export type DashTone = 'blue' | 'green' | 'purple' | 'orange' | 'rose' | 'primary'

export type DashboardStat = {
  key: string
  label: string
  value: string
  change: number
  tone: Exclude<DashTone, 'primary'>
  icon: DashIconName
}

export type DashboardSource = {
  label: string
  value: number
  percent: number
  color: string
}

export type DashboardTrendPoint = {
  label: string
  value: number
}

export type DashboardLead = {
  id: string
  name: string
  email: string
  country: string
  flag: string
  source: string
  status: string
  created: string
}

export type DashboardFollowUp = {
  id: string
  title: string
  detail: string
  tone: Exclude<DashTone, 'primary'>
  icon: DashIconName
}

export type DashboardFollowUpMetrics = {
  overdue: number
  dueToday: number
  completedToday: number
  pending: number
}

export type DashboardOverview = {
  stats: DashboardStat[]
  followUpMetrics?: DashboardFollowUpMetrics
  leadSources: DashboardSource[]
  leadTrend: DashboardTrendPoint[]
  recentLeads: DashboardLead[]
  upcomingFollowUps: DashboardFollowUp[]
  calendarEvents: Record<string, string[]>
}

export type DashboardQuickAction = {
  label: string
  hint: string
  tone: DashTone
  icon: DashIconName
  to: string
}
