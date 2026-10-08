import { useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/common/Navigation";
import { PageMeta } from "@/components/common/Meta";
import { Spinner } from "@/components/common/Loading";
import { PrimaryButton } from "@/components/ui";
import { hasPermission } from "@/lib/access";
import { getApiError } from "@/lib/api";
import {
  adminCard,
  adminPage,
  adminTable,
  muted,
  tableWrap,
} from "@/styles/admin";
import type { AuthSession } from "@/types";
import {
  useGetPerformanceQuery,
  useLazyGetPerformanceDrillQuery,
  useUpdatePerformanceKpisMutation,
  type DrillResponse,
  type KpiResult,
  type PerformanceMetrics,
  type PerformanceQuery,
} from "../api/performanceApi";
import {
  PRESETS,
  RANK_OPTIONS,
  kpiTone,
  kpiValue,
  minutes,
  money,
  percent,
  when,
} from "../format";

const selectClass =
  "h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text";

function readQuery(params: URLSearchParams): PerformanceQuery {
  return {
    preset: params.get("preset") || "this_month",
    from: params.get("from") || undefined,
    to: params.get("to") || undefined,
    departmentId: params.get("departmentId") || undefined,
    userId: params.get("userId") || undefined,
    country: params.get("country") || undefined,
    source: params.get("source") || undefined,
    campaignId: params.get("campaignId") || undefined,
    status: params.get("status") || undefined,
    priority: params.get("priority") || undefined,
    scoreMin: params.get("scoreMin") || undefined,
    scoreMax: params.get("scoreMax") || undefined,
    rankBy: params.get("rankBy") || "conversion_rate",
  };
}

function MetricCard({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${adminCard} text-left ${onClick ? "cursor-pointer hover:border-primary" : "cursor-default"}`}
    >
      <span className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <strong className="mt-2 block text-2xl text-text">{value}</strong>
    </button>
  );
}

function DrillModal({
  title,
  data,
  onClose,
}: {
  title: string;
  data: DrillResponse | undefined;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[80vh] w-full max-w-4xl overflow-auto rounded-2xl bg-surface p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="m-0 text-lg">{title}</h2>
          <PrimaryButton
            size="sm"
            variant="outline"
            label="Close"
            onClick={onClose}
          />
        </div>
        {!data?.rows.length ? (
          <p className={muted}>
            No performance data available for the selected period.
          </p>
        ) : (
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
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={`${row.kind}-${row.id}`}>
                    <td>
                      <Link to={`/leads/${row.leadId}`}>{row.code}</Link>
                    </td>
                    <td>{row.name}</td>
                    <td>{row.country}</td>
                    <td>{row.source}</td>
                    <td>{row.score}</td>
                    <td>{row.service}</td>
                    <td>{row.status}</td>
                    <td>{when(row.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiEditor({ kpis, enabled }: { kpis: KpiResult[]; enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [overall, setOverall] = useState(enabled);
  const [rows, setRows] = useState(kpis);
  const [save, { isLoading }] = useUpdatePerformanceKpisMutation();
  const [error, setError] = useState("");

  async function onSave() {
    setError("");
    try {
      await save({
        overallScoreEnabled: overall,
        kpis: rows.map(
          ({ key, name, target, unit, higherIsBetter, weight, isActive }) => ({
            key,
            name,
            target: Number(target),
            unit,
            higherIsBetter,
            weight: Number(weight),
            isActive,
          }),
        ),
      }).unwrap();
      setOpen(false);
    } catch (err) {
      setError(getApiError(err, "Unable to calculate KPI performance."));
    }
  }

  if (!open) {
    return (
      <PrimaryButton
        size="sm"
        variant="outline"
        label="Configure KPIs"
        onClick={() => setOpen(true)}
      />
    );
  }

  const weight = rows
    .filter((row) => row.isActive)
    .reduce((sum, row) => sum + Number(row.weight || 0), 0);

  return (
    <section className={adminCard}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="m-0 text-base">KPI configuration</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={overall}
            onChange={(event) => setOverall(event.target.checked)}
          />
          Overall Performance Score
        </label>
      </div>
      <p className={muted}>
        Overall score uses weighted KPIs and is separate from Lead Score. Active
        weights must total 100%.
      </p>
      <div className={`${tableWrap} mt-3`}>
        <table className={adminTable}>
          <thead>
            <tr>
              <th>KPI</th>
              <th>Target</th>
              <th>Weight %</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key}>
                <td>{row.name}</td>
                <td>
                  <input
                    className="h-9 w-24 rounded-lg border border-border px-2"
                    type="number"
                    min={0}
                    value={row.target}
                    onChange={(event) => {
                      const next = [...rows];
                      next[index] = {
                        ...row,
                        target: Number(event.target.value),
                      };
                      setRows(next);
                    }}
                  />
                </td>
                <td>
                  <input
                    className="h-9 w-24 rounded-lg border border-border px-2"
                    type="number"
                    min={0}
                    value={row.weight}
                    onChange={(event) => {
                      const next = [...rows];
                      next[index] = {
                        ...row,
                        weight: Number(event.target.value),
                      };
                      setRows(next);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={row.isActive}
                    onChange={(event) => {
                      const next = [...rows];
                      next[index] = { ...row, isActive: event.target.checked };
                      setRows(next);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm">Total active weight: {weight}%</p>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <PrimaryButton
          size="sm"
          label={isLoading ? "Saving…" : "Save KPIs"}
          onClick={() => void onSave()}
        />
        <PrimaryButton
          size="sm"
          variant="outline"
          label="Cancel"
          onClick={() => setOpen(false)}
        />
      </div>
    </section>
  );
}

export default function EmployeePerformancePage({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const auth = useOutletContext<AuthSession>();
  const canConfigure = hasPermission(auth, "settings:configure");
  const [params, setParams] = useSearchParams();
  const query = readQuery(params);
  const { data, isLoading, isError, error } = useGetPerformanceQuery(query);
  const [loadDrill, drill] = useLazyGetPerformanceDrillQuery();
  const [drillTitle, setDrillTitle] = useState("");

  function openEmployee(userId: string) {
    const next = new URLSearchParams(params);
    next.set("tab", "employee-performance");
    next.set("detail", userId);
    setParams(next);
  }

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.set("tab", "employee-performance");
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next);
  }

  function toggleRank(id: string) {
    const current = new Set(
      (query.rankBy || "conversion_rate").split(",").filter(Boolean),
    );
    if (current.has(id)) current.delete(id);
    else current.add(id);
    update("rankBy", [...current].join(",") || "conversion_rate");
  }

  async function openDrill(metric: string, title: string, userId?: string) {
    setDrillTitle(title);
    await loadDrill({ ...query, metric, userId });
  }

  const summary: PerformanceMetrics | undefined = data?.summary;

  return (
    <div className={adminPage}>
      {embedded ? null : (
        <>
          <PageMeta
            title="Employee Performance"
            description="Track lead handling, follow-up, qualification, and conversion by employee."
          />
          <PageHeader
            title="Employee Performance"
            subtitle="Lead handling, follow-up, qualification, counselling, and conversion for the selected period."
            breadcrumbs={[
              { title: "Dashboard", path: "/dashboard" },
              {
                title: "Reports & Analytics",
                path: "/reports?tab=employee-performance",
              },
              { title: "Employee Performance" },
            ]}
          />
        </>
      )}
      {canConfigure && data ? (
        <KpiEditor kpis={data.kpis} enabled={data.overallScoreEnabled} />
      ) : null}

      <section
        className={`${adminCard} grid gap-3 md:grid-cols-3 xl:grid-cols-6`}
      >
        <label className="grid gap-1 text-xs text-text-muted">
          Date range
          <select
            className={selectClass}
            value={query.preset}
            onChange={(event) => update("preset", event.target.value)}
          >
            {PRESETS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {query.preset === "custom" ? (
          <>
            <label className="grid gap-1 text-xs text-text-muted">
              From
              <input
                className={selectClass}
                type="date"
                value={query.from || ""}
                onChange={(event) => update("from", event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-xs text-text-muted">
              To
              <input
                className={selectClass}
                type="date"
                value={query.to || ""}
                onChange={(event) => update("to", event.target.value)}
              />
            </label>
          </>
        ) : null}
        <label className="grid gap-1 text-xs text-text-muted">
          Department
          <select
            className={selectClass}
            value={query.departmentId || "all"}
            onChange={(event) => update("departmentId", event.target.value)}
          >
            <option value="all">All</option>
            {data?.options.departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-text-muted">
          Employee
          <select
            className={selectClass}
            value={query.userId || "all"}
            onChange={(event) => update("userId", event.target.value)}
          >
            <option value="all">All</option>
            {data?.options.employees.map((item) => (
              <option key={item.userId} value={item.userId}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-text-muted">
          Country
          <select
            className={selectClass}
            value={query.country || "all"}
            onChange={(event) => update("country", event.target.value)}
          >
            <option value="all">All</option>
            {data?.options.countries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-text-muted">
          Lead source
          <select
            className={selectClass}
            value={query.source || "all"}
            onChange={(event) => update("source", event.target.value)}
          >
            <option value="all">All</option>
            {data?.options.sources.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-text-muted">
          Campaign
          <select
            className={selectClass}
            value={query.campaignId || "all"}
            onChange={(event) => update("campaignId", event.target.value)}
          >
            <option value="all">All</option>
            {data?.options.campaigns.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-text-muted">
          Status
          <select
            className={selectClass}
            value={query.status || "all"}
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="all">All</option>
            {data?.options.statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-text-muted">
          Priority
          <select
            className={selectClass}
            value={query.priority || "all"}
            onChange={(event) => update("priority", event.target.value)}
          >
            <option value="all">All</option>
            {data?.options.priorities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-text-muted">
          Score from
          <input
            className={selectClass}
            type="number"
            min={0}
            value={query.scoreMin || ""}
            onChange={(event) => update("scoreMin", event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs text-text-muted">
          Score to
          <input
            className={selectClass}
            type="number"
            min={0}
            value={query.scoreMax || ""}
            onChange={(event) => update("scoreMax", event.target.value)}
          />
        </label>
      </section>

      {isLoading ? <Spinner /> : null}
      {isError ? (
        <p className={adminCard}>
          {getApiError(
            error,
            "Unable to load performance data. Please try again.",
          )}
        </p>
      ) : null}
      {data?.message ? <p className={adminCard}>{data.message}</p> : null}

      {summary ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Assigned Leads"
              value={String(summary.assigned)}
              onClick={() => void openDrill("assigned", "Assigned Leads")}
            />
            <MetricCard
              label="Contacted Leads"
              value={String(summary.contacted)}
              onClick={() => void openDrill("contacted", "Contacted Leads")}
            />
            <MetricCard
              label="Qualified Leads"
              value={String(summary.qualified)}
              onClick={() => void openDrill("qualified", "Qualified Leads")}
            />
            <MetricCard
              label="Converted Leads"
              value={String(summary.converted)}
              onClick={() => void openDrill("converted", "Converted Leads")}
            />
            <MetricCard
              label="Follow-up On Time"
              value={percent(summary.followUpOnTimeRate)}
              onClick={() => void openDrill("follow_ups", "Follow-ups")}
            />
            <MetricCard
              label="Average Response"
              value={minutes(summary.avgResponseMinutes)}
            />
            <MetricCard
              label="Overdue Follow-ups"
              value={String(summary.followUpsOverdue)}
              onClick={() => void openDrill("overdue", "Overdue Follow-ups")}
            />
            <MetricCard
              label="Conversion Rate"
              value={percent(summary.conversionRate)}
            />
            {summary.collectionVisible ? (
              <MetricCard
                label="Collection"
                value={money(summary.collectionAmount)}
                onClick={() => void openDrill("collection", "Collection")}
              />
            ) : null}
            {data?.overallScoreEnabled ? (
              <MetricCard
                label="Overall Score"
                value={
                  summary.overallScore == null
                    ? "—"
                    : `${summary.overallScore}/100`
                }
              />
            ) : null}
          </section>

          <section className={adminCard}>
            <h2 className="mb-3 mt-0 text-base">Employee comparison</h2>
            <div className={tableWrap}>
              <table className={adminTable}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Assigned</th>
                    <th>Avg score</th>
                    <th>Contact rate</th>
                    <th>Follow-up</th>
                    <th>Qualified</th>
                    <th>Counselling</th>
                    <th>Converted</th>
                    <th>Conv. rate</th>
                    <th>Overdue</th>
                    <th>Response</th>
                    {data?.overallScoreEnabled ? <th>Score</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {data?.employees.map((row) => (
                    <tr
                      key={row.userId}
                      onClick={() => openEmployee(row.userId)}
                    >
                      <td>
                        <span className="font-semibold">{row.name}</span>
                        <span className="block text-xs text-text-muted">
                          {row.departmentName}
                        </span>
                      </td>
                      <td>{row.assigned}</td>
                      <td>{row.avgLeadScore}</td>
                      <td>{percent(row.contactRate)}</td>
                      <td>{percent(row.followUpOnTimeRate)}</td>
                      <td>{row.qualified}</td>
                      <td>{row.counsellingCompleted}</td>
                      <td>{row.converted}</td>
                      <td>{percent(row.conversionRate)}</td>
                      <td>{row.followUpsOverdue}</td>
                      <td>{minutes(row.avgResponseMinutes)}</td>
                      {data.overallScoreEnabled ? (
                        <td>{row.overallScore ?? "—"}</td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={adminCard}>
            <h2 className="mb-2 mt-0 text-base">Ranking</h2>
            <div className="mb-3 flex flex-wrap gap-3">
              {RANK_OPTIONS.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={(query.rankBy || "").split(",").includes(item.id)}
                    onChange={() => toggleRank(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {data?.ranking.map((board) => (
                <div key={board.key}>
                  <h3 className="mb-2 text-sm">{board.label}</h3>
                  <ol className="m-0 grid gap-1 pl-5">
                    {board.rows.slice(0, 8).map((row) => (
                      <li key={row.userId}>
                        <button
                          type="button"
                          className="text-left text-primary"
                          onClick={() => openEmployee(row.userId)}
                        >
                          #{row.rank} {row.name}
                        </button>
                        <span className="text-text-muted">
                          {" "}
                          —{" "}
                          {board.key === "response_time"
                            ? minutes(row.value)
                            : board.key === "collection"
                              ? money(row.value)
                              : board.key === "overall"
                                ? row.value
                                : percent(row.value)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>

          <section className={adminCard}>
            <h2 className="mb-3 mt-0 text-base">KPI vs target</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {data?.kpis
                .filter((item) => item.isActive)
                .map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
                  >
                    <div>
                      <strong className="block">{item.name}</strong>
                      <span className={muted}>
                        Actual {kpiValue(item.unit, item.actual)} · Target{" "}
                        {kpiValue(item.unit, item.target)}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${kpiTone[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
            </div>
          </section>
        </>
      ) : null}

      {drillTitle ? (
        <DrillModal
          title={drillTitle}
          data={drill.data}
          onClose={() => setDrillTitle("")}
        />
      ) : null}
    </div>
  );
}
