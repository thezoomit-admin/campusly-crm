import type {
  CounsellorRow,
  FunnelStage,
  InsightItem,
  KpiCard,
  MetricRow,
  RecentReport,
  ReportTabId,
  SavedReport,
  SourceSegment,
  TrendSeriesPoint,
} from '../types'

export const REPORT_TABS: Array<{ id: ReportTabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'lead-conversion', label: 'Lead & Conversion' },
  { id: 'lead-quality', label: 'Lead Quality' },
  { id: 'employee-performance', label: 'Employee Performance' },
  { id: 'follow-up', label: 'Follow-up & Activity' },
  { id: 'service-file', label: 'Service & File' },
  { id: 'payment', label: 'Payment & Collection' },
  { id: 'closure', label: 'Closure & Outcome' },
  { id: 'document', label: 'Document Status' },
]

export const OVERVIEW_KPIS: KpiCard[] = [
  { key: 'total-leads', label: 'Total Leads', value: '2,482', change: 12, tone: 'blue' },
  { key: 'converted', label: 'Converted Leads', value: '312', change: 18, tone: 'green' },
  { key: 'conversion-rate', label: 'Conversion Rate', value: '12.6%', change: 2.4, tone: 'purple' },
  { key: 'files-opened', label: 'Files Opened', value: '298', change: 16, tone: 'orange' },
  { key: 'collection', label: 'Total Collection', value: '৳ 4,850,000', change: 22, tone: 'rose' },
]

export const FUNNEL_STAGES: FunnelStage[] = [
  { label: 'Total Leads', value: 2482, percent: 100, color: '#3b82f6' },
  { label: 'Contacted', value: 1892, percent: 76.2, color: '#60a5fa' },
  { label: 'Qualified', value: 1246, percent: 50.2, color: '#8b5cf6' },
  { label: 'Converted', value: 312, percent: 12.6, color: '#22c55e' },
  { label: 'Lost', value: 145, percent: 5.8, color: '#f43f5e' },
]

export const CONVERSION_TREND: TrendSeriesPoint[] = [
  { label: 'Nov', totalLeads: 310, convertedLeads: 28 },
  { label: 'Dec', totalLeads: 355, convertedLeads: 34 },
  { label: 'Jan', totalLeads: 390, convertedLeads: 41 },
  { label: 'Feb', totalLeads: 420, convertedLeads: 48 },
  { label: 'Mar', totalLeads: 455, convertedLeads: 56 },
  { label: 'Apr', totalLeads: 552, convertedLeads: 105 },
]

export const LEAD_SOURCES: SourceSegment[] = [
  { label: 'Website', value: 868, percent: 35, color: '#3b82f6' },
  { label: 'Meta Lead Ads', value: 546, percent: 22, color: '#8b5cf6' },
  { label: 'WhatsApp', value: 447, percent: 18, color: '#22c55e' },
  { label: 'Email', value: 298, percent: 12, color: '#f59e0b' },
  { label: 'Manual Entry', value: 199, percent: 8, color: '#06b6d4' },
  { label: 'Others', value: 124, percent: 5, color: '#94a3b8' },
]

export const TOP_COUNSELLORS: CounsellorRow[] = [
  { id: '1', name: 'Nusrat Jahan', leads: 186, converted: 42, rate: 22.6, change: 4.2 },
  { id: '2', name: 'Rahim Uddin', leads: 172, converted: 35, rate: 20.3, change: 2.8 },
  { id: '3', name: 'Farhana Akter', leads: 158, converted: 31, rate: 19.6, change: 1.5 },
  { id: '4', name: 'Tanvir Hasan', leads: 144, converted: 26, rate: 18.1, change: 0.9 },
  { id: '5', name: 'Sadia Rahman', leads: 132, converted: 22, rate: 16.7, change: -0.6 },
]

export const EMPLOYEE_PERFORMANCE: CounsellorRow[] = [
  { id: 'e1', name: 'Karim Ahmed', leads: 98, converted: 18, rate: 18.4, change: 3.1 },
  { id: 'e2', name: 'Mehedi Hasan', leads: 86, converted: 15, rate: 17.4, change: 1.8 },
  { id: 'e3', name: 'Ayesha Siddiqua', leads: 79, converted: 13, rate: 16.5, change: 2.2 },
  { id: 'e4', name: 'Imran Hossain', leads: 74, converted: 11, rate: 14.9, change: -1.1 },
  { id: 'e5', name: 'Lamia Chowdhury', leads: 68, converted: 10, rate: 14.7, change: 0.4 },
]

export const QUICK_INSIGHTS: InsightItem[] = [
  {
    id: 'i1',
    tone: 'success',
    text: 'Conversion rate increased by 2.4% compared to the previous 30 days.',
  },
  {
    id: 'i2',
    tone: 'warning',
    text: 'Follow-ups are overdue for 18 leads. Prioritize counsellor callbacks today.',
  },
  {
    id: 'i3',
    tone: 'info',
    text: 'Website remains the top source at 35% of total leads this month.',
  },
  {
    id: 'i4',
    tone: 'success',
    text: 'Total collection is up 22% — strongest month in the current quarter.',
  },
  {
    id: 'i5',
    tone: 'warning',
    text: '32 documents are pending verification across active files.',
  },
]

export const SAVED_REPORTS: SavedReport[] = [
  { id: 's1', name: 'Monthly Conversion', tabId: 'lead-conversion' },
  { id: 's2', name: 'Outstanding Due', tabId: 'payment' },
  { id: 's3', name: 'Employee Performance', tabId: 'employee-performance' },
]

export const RECENT_REPORTS: RecentReport[] = [
  {
    id: 'r1',
    name: 'Lead & Conversion — April',
    dateRange: 'Apr 1 – Apr 30, 2025',
    generatedOn: 'Apr 30, 2025 6:12 PM',
    createdBy: 'Admin',
    format: 'PDF',
  },
  {
    id: 'r2',
    name: 'Payment & Collection Weekly',
    dateRange: 'Apr 21 – Apr 27, 2025',
    generatedOn: 'Apr 28, 2025 9:05 AM',
    createdBy: 'Finance Manager',
    format: 'Excel',
  },
  {
    id: 'r3',
    name: 'Employee Performance Snapshot',
    dateRange: 'Apr 1 – Apr 30, 2025',
    generatedOn: 'Apr 27, 2025 4:40 PM',
    createdBy: 'HR Manager',
    format: 'CSV',
  },
  {
    id: 'r4',
    name: 'Document Status Digest',
    dateRange: 'Apr 1 – Apr 30, 2025',
    generatedOn: 'Apr 26, 2025 11:20 AM',
    createdBy: 'Ops Lead',
    format: 'PDF',
  },
]

export const REPORT_METRICS: Record<Exclude<ReportTabId, 'overview'>, MetricRow[]> = {
  'lead-conversion': [
    { label: 'Total Leads', value: '2,482' },
    { label: 'New Leads', value: '640' },
    { label: 'Contacted Leads', value: '1,892' },
    { label: 'Qualified Leads', value: '1,246' },
    { label: 'Converted Leads', value: '312' },
    { label: 'Lost Leads', value: '145' },
    { label: 'Conversion Rate', value: '12.6%', hint: 'Converted ÷ Total Leads × 100' },
  ],
  'lead-quality': [
    { label: 'Score 80–100', value: '35% conversion', hint: 'High-quality leads' },
    { label: 'Score 60–79', value: '22% conversion' },
    { label: 'Score 40–59', value: '10% conversion' },
    { label: 'Score 0–39', value: '4% conversion' },
    { label: 'Avg Lead Score', value: '68' },
    { label: 'Top Quality Source', value: 'Website' },
  ],
  'employee-performance': [
    { label: 'Assigned Leads', value: '1,840' },
    { label: 'Contacted Leads', value: '1,420' },
    { label: 'Qualified Leads', value: '980' },
    { label: 'Converted Leads', value: '286' },
    { label: 'Follow-ups Completed', value: '1,104' },
    { label: 'Follow-ups Overdue', value: '18' },
    { label: 'Avg Processing Time', value: '6.4 days' },
  ],
  'follow-up': [
    { label: 'Total Follow-ups', value: '1,486' },
    { label: 'Completed', value: '1,104' },
    { label: 'Pending', value: '364' },
    { label: 'Overdue', value: '18' },
    { label: 'Calls', value: '612' },
    { label: 'WhatsApp', value: '428' },
    { label: 'Email', value: '246' },
    { label: 'Notes', value: '200' },
  ],
  'service-file': [
    { label: 'Open Files', value: '298' },
    { label: 'Active Files', value: '214' },
    { label: 'On Hold', value: '36' },
    { label: 'Closure Pending', value: '28' },
    { label: 'Closed Files', value: '162' },
    { label: 'Active Services', value: '240' },
    { label: 'Completed Services', value: '188' },
    { label: 'Avg File Duration', value: '21 days' },
  ],
  payment: [
    { label: 'Total Charge', value: '৳ 6,420,000' },
    { label: 'Total Discount', value: '৳ 220,000' },
    { label: 'Total Paid', value: '৳ 4,850,000' },
    { label: 'Total Due', value: '৳ 1,350,000' },
    { label: 'Due 0–7 Days', value: '৳ 420,000' },
    { label: 'Due 8–15 Days', value: '৳ 310,000' },
    { label: 'Due 16–30 Days', value: '৳ 280,000' },
    { label: 'Due 30+ Days', value: '৳ 340,000' },
  ],
  closure: [
    { label: 'Closed Files', value: '162' },
    { label: 'Successful', value: '118' },
    { label: 'Unsuccessful', value: '22' },
    { label: 'Cancelled', value: '12' },
    { label: 'Client Withdrawn', value: '10' },
    { label: 'Avg File Duration', value: '24 days' },
  ],
  document: [
    { label: 'Required', value: '1,240' },
    { label: 'Received', value: '986' },
    { label: 'Under Review', value: '142' },
    { label: 'Verified', value: '812' },
    { label: 'Rejected', value: '64' },
    { label: 'Pending', value: '254' },
  ],
}

export const FILTER_OPTIONS = {
  employees: [
    { value: 'all', label: 'All Employees' },
    { value: 'nusrat', label: 'Nusrat Jahan' },
    { value: 'rahim', label: 'Rahim Uddin' },
    { value: 'farhana', label: 'Farhana Akter' },
  ],
  countries: [
    { value: 'all', label: 'All Countries' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'us', label: 'United States' },
  ],
  leadSources: [
    { value: 'all', label: 'All Sources' },
    { value: 'website', label: 'Website' },
    { value: 'meta', label: 'Meta Lead Ads' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'Email' },
  ],
  services: [
    { value: 'all', label: 'All Services' },
    { value: 'admission', label: 'Admission' },
    { value: 'visa', label: 'Visa' },
    { value: 'counseling', label: 'Counseling' },
  ],
  fileStatuses: [
    { value: 'all', label: 'All File Statuses' },
    { value: 'opened', label: 'File Opened' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'closed', label: 'Closed' },
  ],
  paymentStatuses: [
    { value: 'all', label: 'All Payment Statuses' },
    { value: 'paid', label: 'Paid' },
    { value: 'partial', label: 'Partial' },
    { value: 'due', label: 'Due' },
  ],
}
