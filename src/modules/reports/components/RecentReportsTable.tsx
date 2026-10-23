import { Button, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import type { RecentReport } from '../types'

const formatTone: Record<RecentReport['format'], string> = {
  PDF: 'bg-[#ffe8ee] text-[#e11d48] dark:bg-rose-500/20 dark:text-[#fda4af]',
  Excel: 'bg-[#e7f8ef] text-[#16a34a] dark:bg-green-500/20 dark:text-[#86efac]',
  CSV: 'bg-[#e8f1ff] text-[#2563eb] dark:bg-blue-500/20 dark:text-[#93c5fd]',
}

type RecentReportsTableProps = {
  rows: RecentReport[]
  isLoading?: boolean
  onView: (report: RecentReport) => void
  onExport: (report: RecentReport, format: RecentReport['format']) => void
}

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-[#d5e0ec] dark:bg-[#3a4856] ${className}`} aria-hidden="true" />
}

function RecentReportRowsSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <tr key={index} aria-hidden="true">
          <td className="border-t border-border-subtle px-2 py-3">
            <Bone className="h-4 w-44 max-w-full" />
          </td>
          <td className="border-t border-border-subtle px-2 py-3">
            <Bone className="h-4 w-36" />
          </td>
          <td className="border-t border-border-subtle px-2 py-3">
            <Bone className="h-4 w-32" />
          </td>
          <td className="border-t border-border-subtle px-2 py-3">
            <Bone className="h-4 w-24" />
          </td>
          <td className="border-t border-border-subtle px-2 py-3">
            <Bone className="h-6 w-14 rounded-full" />
          </td>
          <td className="border-t border-border-subtle px-2 py-3">
            <div className="flex items-center gap-1.5">
              <Bone className="h-6 w-14 rounded-md" />
              <Bone className="size-6 rounded-md" />
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}

export default function RecentReportsTable({ rows, isLoading = false, onView, onExport }: RecentReportsTableProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="m-0 text-base font-semibold">Recent Reports</h3>
        {isLoading ? (
          <Bone className="h-3.5 w-16" />
        ) : (
          <span className="text-[0.75rem] text-text-muted">{rows.length} generated</span>
        )}
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="text-left text-[0.72rem] text-text-faint">
              <th className="px-2 py-2.5 font-semibold">Report Name</th>
              <th className="px-2 py-2.5 font-semibold">Date Range</th>
              <th className="px-2 py-2.5 font-semibold">Generated On</th>
              <th className="px-2 py-2.5 font-semibold">Created By</th>
              <th className="px-2 py-2.5 font-semibold">Format</th>
              <th className="px-2 py-2.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <RecentReportRowsSkeleton />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-10 text-center text-[0.85rem] text-text-faint">
                  No recent reports for the current filters.
                </td>
              </tr>
            ) : (
              rows.map((report) => {
                const menuItems: MenuProps['items'] = [
                  { key: 'pdf', label: 'Export PDF', onClick: () => onExport(report, 'PDF') },
                  { key: 'excel', label: 'Export Excel', onClick: () => onExport(report, 'Excel') },
                  { key: 'csv', label: 'Export CSV', onClick: () => onExport(report, 'CSV') },
                ]

                return (
                  <tr key={report.id} className="border-t border-border-subtle text-[0.84rem]">
                    <td className="px-2 py-3 font-medium text-text">{report.name}</td>
                    <td className="px-2 py-3 text-text-muted">{report.dateRange}</td>
                    <td className="px-2 py-3 text-text-muted">{report.generatedOn}</td>
                    <td className="px-2 py-3">{report.createdBy}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-bold ${formatTone[report.format]}`}
                      >
                        {report.format}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button size="small" onClick={() => onView(report)}>
                          View
                        </Button>
                        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                          <Button size="small" aria-label="More actions">
                            ⋯
                          </Button>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}
