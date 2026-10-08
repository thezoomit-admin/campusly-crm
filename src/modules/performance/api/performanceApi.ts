import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'

export type PerformanceQuery = {
  preset?: string
  from?: string
  to?: string
  departmentId?: string
  userId?: string
  country?: string
  source?: string
  campaignId?: string
  status?: string
  priority?: string
  scoreMin?: string
  scoreMax?: string
  rankBy?: string
  metric?: string
}

export type KpiResult = {
  key: string
  name: string
  target: number
  unit: 'percent' | 'minutes' | 'currency' | 'count'
  higherIsBetter: boolean
  weight: number
  isActive: boolean
  actual: number
  status: 'Exceeded' | 'Achieved' | 'Below Target'
}

export type PerformanceMetrics = {
  assigned: number
  accepted: number
  contacted: number
  unreachable: number
  contactRate: number
  avgResponseMinutes: number
  qualified: number
  potential: number
  unqualified: number
  qualificationPending: number
  qualificationRate: number
  counsellingScheduled: number
  counsellingCompleted: number
  counsellingMissed: number
  counsellingRescheduled: number
  offersCreated: number
  offersAccepted: number
  offersRejected: number
  offersPending: number
  offerAcceptanceRate: number
  paymentInitiated: number
  converted: number
  lost: number
  conversionRate: number
  assignedToConversionRate: number
  qualifiedToConversionRate: number
  avgConversionDays: number
  followUpsDue: number
  followUpsCompleted: number
  followUpsOnTime: number
  followUpsOverdue: number
  followUpsMissed: number
  followUpCompletionRate: number
  followUpOnTimeRate: number
  filesOpened: number
  fileOpeningRate: number
  collectionAmount: number
  collectionVisible: boolean
  avgLeadScore: number
  highPriority: number
  mediumPriority: number
  lowPriority: number
  highPriorityAssigned: number
  highPriorityContacted: number
  highPriorityFollowedUp: number
  highPriorityConverted: number
  highPriorityLeads: number
  activeLeads: number
  pendingFollowUps: number
  todaysFollowUps: number
  overdueFollowUps: number
  overallScore: number | null
}

export type EmployeePerformanceRow = PerformanceMetrics & {
  userId: string
  employeeId: string | null
  employeeCode: string | null
  name: string
  departmentId: string | null
  departmentName: string
  kpis: KpiResult[]
}

export type PerformanceList = {
  from: string
  to: string
  preset: string
  message: string | null
  summary: PerformanceMetrics
  employees: EmployeePerformanceRow[]
  ranking: Array<{ key: string; label: string; higherIsBetter: boolean; rows: Array<{ userId: string; name: string; value: number; rank: number }> }>
  kpis: KpiResult[]
  overallScoreEnabled: boolean
  options: {
    employees: Array<{ userId: string; name: string; departmentId: string | null; departmentName: string }>
    departments: Array<{ id: string; name: string }>
    countries: string[]
    sources: string[]
    campaigns: Array<{ id: string; name: string }>
    statuses: string[]
    priorities: string[]
  }
}

export type PerformanceDetail = {
  from: string
  to: string
  preset: string
  message: string | null
  employee: {
    userId: string
    employeeId: string | null
    employeeCode: string | null
    name: string
    departmentId: string | null
    departmentName: string
  }
  metrics: PerformanceMetrics
  kpis: KpiResult[]
  overallScoreEnabled: boolean
  statusBreakdown: Array<{ status: string; count: number }>
  countries: Array<{ label: string; assigned: number; converted: number; conversionRate: number }>
  sources: Array<{ label: string; assigned: number; converted: number; conversionRate: number }>
  campaigns: Array<{ label: string; assigned: number; converted: number; conversionRate: number }>
  history: Array<{ month: string; assigned: number; converted: number; followUpOnTimeRate: number }>
  recentActivity: Array<{ at: string; label: string; leadId: string; leadCode: string; leadName: string }>
  overdue: Array<{ followUpId: string; leadId: string; leadCode: string; leadName: string; dueAt: string | null; status: string }>
}

export type DrillResponse = {
  metric: string
  rows: Array<{
    kind: 'lead' | 'follow_up'
    id: string
    leadId: string
    code: string
    name: string
    country: string
    source: string
    score: number
    service: string
    status: string
    priority: string
    date: string | null
  }>
}

export type KpiConfig = {
  overallScoreEnabled: boolean
  kpis: Array<Omit<KpiResult, 'actual' | 'status'>>
}

const performanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPerformance: builder.query<PerformanceList, PerformanceQuery>({
      query: (params) => `/performance${toQuery(params)}`,
      providesTags: ['Performance'],
    }),
    getPerformanceDetail: builder.query<PerformanceDetail, PerformanceQuery & { userId: string }>({
      query: ({ userId, ...params }) => `/performance/${userId}${toQuery(params)}`,
      providesTags: ['Performance'],
    }),
    getPerformanceDrill: builder.query<DrillResponse, PerformanceQuery>({
      query: (params) => `/performance/drill${toQuery(params)}`,
    }),
    updatePerformanceKpis: builder.mutation<KpiConfig, { overallScoreEnabled: boolean; kpis: KpiConfig['kpis'] }>({
      query: (body) => ({ url: '/performance/kpis', method: 'PUT', body }),
      invalidatesTags: ['Performance'],
    }),
  }),
})

export const {
  useGetPerformanceQuery,
  useGetPerformanceDetailQuery,
  useLazyGetPerformanceDrillQuery,
  useUpdatePerformanceKpisMutation,
} = performanceApi
