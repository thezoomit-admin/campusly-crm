export type ReportTabId =
  | 'overview'
  | 'lead-conversion'
  | 'lead-quality'
  | 'employee-performance'
  | 'follow-up'
  | 'service-file'
  | 'payment'
  | 'closure'
  | 'document'

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'custom'

export type EmployeeScope = 'employee' | 'team' | 'department'

export type ReportFiltersState = {
  datePreset: DatePreset
  customFrom: string | null
  customTo: string | null
  employeeScope: EmployeeScope
  employeeId: string
  country: string
  leadSource: string
  service: string
  fileStatus: string
  paymentStatus: string
}

export type KpiCard = {
  key: string
  label: string
  value: string
  change: number
  tone: 'blue' | 'green' | 'purple' | 'orange' | 'rose'
}

export type FunnelStage = {
  label: string
  value: number
  percent: number
  color: string
}

export type TrendSeriesPoint = {
  label: string
  totalLeads: number
  convertedLeads: number
}

export type SourceSegment = {
  label: string
  value: number
  percent: number
  color: string
}

export type CounsellorRow = {
  id: string
  name: string
  leads: number
  converted: number
  rate: number
  change: number
}

export type InsightItem = {
  id: string
  tone: 'success' | 'warning' | 'info'
  text: string
}

export type SavedReport = {
  id: string
  name: string
  tabId: ReportTabId
}

export type RecentReport = {
  id: string
  name: string
  dateRange: string
  generatedOn: string
  createdBy: string
  format: 'PDF' | 'Excel' | 'CSV'
}

export type MetricRow = {
  label: string
  value: string | number
  hint?: string
}

/** Legacy pipeline metric row (existing API). */
export type ReportRow = Record<string, string>

export type ReportFormValues = {
  metric: string
  period: string
  value: string
}
