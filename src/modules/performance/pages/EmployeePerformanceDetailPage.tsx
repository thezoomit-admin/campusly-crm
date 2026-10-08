import { useState } from 'react'
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { PageMeta } from '@/components/common/Meta'
import { Spinner } from '@/components/common/Loading'
import { PrimaryButton } from '@/components/ui'
import { getApiError } from '@/lib/api'
import { adminCard, adminPage, adminTable, muted, tableWrap } from '@/styles/admin'
import type { AuthSession } from '@/types'
import { useGetPerformanceDetailQuery, useLazyGetPerformanceDrillQuery, type DrillResponse } from '../api/performanceApi'
import { kpiTone, kpiValue, minutes, money, percent, when } from '../format'

function readFilters(params: URLSearchParams) {
  return {
    preset: params.get('preset') || 'this_month',
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
    country: params.get('country') || undefined,
    source: params.get('source') || undefined,
    campaignId: params.get('campaignId') || undefined,
    status: params.get('status') || undefined,
    priority: params.get('priority') || undefined,
    scoreMin: params.get('scoreMin') || undefined,
    scoreMax: params.get('scoreMax') || undefined,
  }
}

function DrillModal({ title, data, onClose }: { title: string; data: DrillResponse | undefined; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[80vh] w-full max-w-4xl overflow-auto rounded-2xl bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="m-0 text-lg">{title}</h2>
          <PrimaryButton size="sm" variant="outline" label="Close" onClick={onClose} />
        </div>
        {!data?.rows.length ? <p className={muted}>No performance data available for the selected period.</p> : (
          <div className={tableWrap}>
            <table className={adminTable}>
              <thead>
                <tr>
                  <th>Lead ID</th>
                  <th>Student</th>
                  <th>Country</th>
                  <th>Source</th>
                  <th>Score</th>
                  <th>Service</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={`${row.kind}-${row.id}`}>
                    <td><Link to={`/leads/${row.leadId}`}>{row.code}</Link></td>
                    <td>{row.name}</td>
                    <td>{row.country}</td>
                    <td>{row.source}</td>
                    <td>{row.score}</td>
                    <td>{row.service}</td>
                    <td>{when(row.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Breakdown({ title, rows }: { title: string; rows: Array<{ label: string; assigned: number; converted: number; conversionRate: number }> }) {
  return (
    <section className={adminCard}>
      <h2 className="mb-3 mt-0 text-base">{title}</h2>
      {!rows.length ? <p className={muted}>No performance data available for the selected period.</p> : (
        <div className={tableWrap}>
          <table className={adminTable}>
            <thead>
              <tr>
                <th>{title.replace(' performance', '')}</th>
                <th>Assigned</th>
                <th>Converted</th>
                <th>Conv. rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.assigned}</td>
                  <td>{row.converted}</td>
                  <td>{percent(row.conversionRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default function EmployeePerformanceDetailPage() {
  const { userId: routeUserId = '' } = useParams()
  useOutletContext<AuthSession>()
  const [params, setParams] = useSearchParams()
  const userId = routeUserId || params.get('detail') || ''

  function backToList() {
    const next = new URLSearchParams(params)
    next.delete('detail')
    next.set('tab', 'employee-performance')
    setParams(next)
  }
  const filters = readFilters(params)
  const { data, isLoading, isError, error } = useGetPerformanceDetailQuery({ userId, ...filters }, { skip: !userId })
  const [loadDrill, drill] = useLazyGetPerformanceDrillQuery()
  const [drillTitle, setDrillTitle] = useState('')

  async function openDrill(metric: string, title: string) {
    setDrillTitle(title)
    await loadDrill({ ...filters, userId, metric })
  }

  const metrics = data?.metrics
  const period = data ? `${new Date(data.from).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}` : ''

  return (
    <div className={adminPage}>
      <PageMeta title={data?.employee.name || 'Employee Performance'} description="Employee lead-handling performance detail." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg">{data?.employee.name || 'Employee Performance'}</h2>
          <p className="mb-0 mt-1 text-sm text-text-muted">
            {data ? `${data.employee.departmentName} · ${data.employee.employeeCode || 'No employee code'} · ${period}` : 'Performance detail'}
          </p>
        </div>
        <PrimaryButton size="sm" variant="outline" label="Back to list" onClick={backToList} />
      </div>

      {isLoading ? <Spinner /> : null}
      {isError ? <p className={adminCard}>{getApiError(error, 'Unable to load employee performance.')}</p> : null}
      {data?.message ? <p className={adminCard}>{data.message}</p> : null}

      {metrics && data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button type="button" className={`${adminCard} text-left`} onClick={() => void openDrill('assigned', 'Assigned Leads')}><span className={muted}>Assigned</span><strong className="block text-xl">{metrics.assigned}</strong></button>
            <button type="button" className={`${adminCard} text-left`} onClick={() => void openDrill('contacted', 'Contacted Leads')}><span className={muted}>Contact rate</span><strong className="block text-xl">{percent(metrics.contactRate)}</strong></button>
            <div className={adminCard}><span className={muted}>Average response</span><strong className="block text-xl">{minutes(metrics.avgResponseMinutes)}</strong></div>
            <button type="button" className={`${adminCard} text-left`} onClick={() => void openDrill('follow_ups', 'Follow-ups')}><span className={muted}>Follow-up on time</span><strong className="block text-xl">{percent(metrics.followUpOnTimeRate)}</strong></button>
            <button type="button" className={`${adminCard} text-left`} onClick={() => void openDrill('qualified', 'Qualified Leads')}><span className={muted}>Qualified</span><strong className="block text-xl">{metrics.qualified}</strong></button>
            <button type="button" className={`${adminCard} text-left`} onClick={() => void openDrill('converted', `Converted Leads: ${metrics.converted}`)}><span className={muted}>Converted</span><strong className="block text-xl">{metrics.converted}</strong></button>
            <div className={adminCard}><span className={muted}>Conversion rate</span><strong className="block text-xl">{percent(metrics.conversionRate)}</strong><span className={muted}>Assigned-to-conversion {percent(metrics.assignedToConversionRate)}</span></div>
            <button type="button" className={`${adminCard} text-left`} onClick={() => void openDrill('overdue', 'Overdue Follow-ups')}>
              <span className={muted}>Overdue follow-ups</span>
              <strong className="block text-xl">{metrics.followUpsOverdue}</strong>
              <span className="text-sm text-primary">View Leads</span>
            </button>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <article className={adminCard}>
              <h2 className="mt-0 text-base">Lead handling</h2>
              <p className="m-0">Assigned {metrics.assigned} · Accepted {metrics.accepted} · Contacted {metrics.contacted} · Unreachable {metrics.unreachable}</p>
              <p className="mb-0">Active now {metrics.activeLeads} · Pending follow-ups {metrics.pendingFollowUps}</p>
            </article>
            <article className={adminCard}>
              <h2 className="mt-0 text-base">Lead status breakdown</h2>
              {!data.statusBreakdown.length ? <p className={muted}>No performance data available for the selected period.</p> : (
                <ul className="m-0 grid gap-1 pl-4">
                  {data.statusBreakdown.map((row) => <li key={row.status}>{row.status}: {row.count}</li>)}
                </ul>
              )}
            </article>
            <article className={adminCard}>
              <h2 className="mt-0 text-base">Follow-up performance</h2>
              <p className="m-0">Due {metrics.followUpsDue} · Completed {metrics.followUpsCompleted} · On time {metrics.followUpsOnTime} · Overdue {metrics.followUpsOverdue} · Missed {metrics.followUpsMissed}</p>
              <p className="mb-0">Completion {percent(metrics.followUpCompletionRate)} · On-time {percent(metrics.followUpOnTimeRate)}</p>
            </article>
            <article className={adminCard}>
              <h2 className="mt-0 text-base">Qualification and counselling</h2>
              <p className="m-0">Qualified {metrics.qualified} · Potential {metrics.potential} · Unqualified {metrics.unqualified} · Pending {metrics.qualificationPending}</p>
              <p className="m-0">Qualification rate {percent(metrics.qualificationRate)}</p>
              <p className="mb-0">Counselling scheduled {metrics.counsellingScheduled} · Completed {metrics.counsellingCompleted} · Missed {metrics.counsellingMissed} · Rescheduled {metrics.counsellingRescheduled}</p>
            </article>
            <article className={adminCard}>
              <h2 className="mt-0 text-base">Service offer and file opening</h2>
              <p className="m-0">Offers {metrics.offersCreated} · Accepted {metrics.offersAccepted} · Rejected {metrics.offersRejected} · Pending {metrics.offersPending}</p>
              <p className="m-0">Offer acceptance {percent(metrics.offerAcceptanceRate)} · Payment initiated {metrics.paymentInitiated}</p>
              <p className="mb-0">Converted {metrics.converted} · Files opened {metrics.filesOpened} · File opening rate {percent(metrics.fileOpeningRate)} · Avg conversion {metrics.avgConversionDays} days</p>
            </article>
            <article className={adminCard}>
              <h2 className="mt-0 text-base">Lead quality and high priority</h2>
              <p className="m-0">Average lead score {metrics.avgLeadScore} · High {metrics.highPriority} · Medium {metrics.mediumPriority} · Low {metrics.lowPriority}</p>
              <p className="mb-0">High priority assigned {metrics.highPriorityAssigned} · Contacted {metrics.highPriorityContacted} · Followed up {metrics.highPriorityFollowedUp} · Converted {metrics.highPriorityConverted}</p>
            </article>
            <article className={adminCard}>
              <h2 className="mt-0 text-base">Current workload</h2>
              <p className="mb-0">Active leads {metrics.activeLeads} · Pending follow-ups {metrics.pendingFollowUps} · Today {metrics.todaysFollowUps} · Overdue {metrics.overdueFollowUps} · High priority {metrics.highPriorityLeads}</p>
            </article>
            {metrics.collectionVisible ? (
              <article className={adminCard}>
                <h2 className="mt-0 text-base">Collection</h2>
                <p className="mb-0 text-xl font-semibold">{money(metrics.collectionAmount)}</p>
              </article>
            ) : null}
          </section>

          <Breakdown title="Country performance" rows={data.countries} />
          <Breakdown title="Lead source performance" rows={data.sources} />
          <Breakdown title="Campaign performance" rows={data.campaigns} />

          <section className="grid gap-3 lg:grid-cols-2">
            <article className={adminCard}>
              <h2 className="mt-0 text-base">Performance history</h2>
              <div className={tableWrap}>
                <table className={adminTable}>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Leads</th>
                      <th>Converted</th>
                      <th>Follow-up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.history.map((row) => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td>{row.assigned}</td>
                        <td>{row.converted}</td>
                        <td>{percent(row.followUpOnTimeRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <article className={adminCard}>
              <h2 className="mt-0 text-base">Recent activity</h2>
              {!data.recentActivity.length ? <p className={muted}>No performance data available for the selected period.</p> : (
                <ul className="m-0 grid gap-2 pl-0">
                  {data.recentActivity.map((item) => (
                    <li key={`${item.at}-${item.leadId}-${item.label}`} className="list-none">
                      <span className="text-text-muted">{when(item.at)}</span> {item.label}{' '}
                      <Link to={`/leads/${item.leadId}`}>{item.leadCode}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          <section className={adminCard}>
            <h2 className="mt-0 text-base">Overdue follow-ups</h2>
            {!data.overdue.length ? <p className={muted}>No overdue follow-ups.</p> : (
              <div className={tableWrap}>
                <table className={adminTable}>
                  <thead>
                    <tr>
                      <th>Lead ID</th>
                      <th>Student</th>
                      <th>Follow-up due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.overdue.map((row) => (
                      <tr key={row.followUpId}>
                        <td>{row.leadId ? <Link to={`/leads/${row.leadId}`}>{row.leadCode}</Link> : row.leadCode}</td>
                        <td>{row.leadName}</td>
                        <td>{when(row.dueAt)}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={adminCard}>
            <h2 className="mt-0 text-base">KPI vs target</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {data.kpis.filter((item) => item.isActive).map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                  <div>
                    <strong className="block">{item.name}</strong>
                    <span className={muted}>Actual {kpiValue(item.unit, item.actual)} · Target {kpiValue(item.unit, item.target)}{item.weight ? ` · Weight ${item.weight}%` : ''}</span>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${kpiTone[item.status]}`}>{item.status}</span>
                </div>
              ))}
            </div>
            {data.overallScoreEnabled ? <p className="mb-0 mt-3">Overall Performance Score: {metrics.overallScore ?? '—'}/100. This score is separate from Lead Score.</p> : null}
          </section>
        </>
      ) : null}

      {drillTitle ? <DrillModal title={drillTitle} data={drill.data} onClose={() => setDrillTitle('')} /> : null}
    </div>
  )
}
