import { useMemo, useState, type ReactNode, type SVGProps } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { Button, Input, Modal, Pagination, Select } from "antd";
import { PageHeader } from "@/components/common/Navigation";
import { PageMeta } from "@/components/common/Meta";
import { Spinner } from "@/components/common/Loading";
import { PrimaryButton, UserAvatar } from "@/components/ui";
import { hasPermission } from "@/lib/access";
import { getApiError } from "@/lib/api";
import {
  adminPage,
  adminTable,
  employeeAvatar,
  employeeAvatarSm,
  muted,
  tableWrap,
} from "@/styles/admin";
import type { AuthSession } from "@/types";
import {
  useGetPerformanceQuery,
  useLazyGetPerformanceDrillQuery,
  useUpdatePerformanceKpisMutation,
  type DrillResponse,
  type EmployeePerformanceRow,
  type KpiResult,
  type PerformanceMetrics,
  type PerformanceQuery,
} from "../api/performanceApi";
import {
  AdmissionFunnelChart,
  EmployeeComparisonChart,
  PerformanceTrendChart,
} from "../components/EmployeePerformanceCharts";
import PerformanceFilterDrawer from "../components/PerformanceFilterDrawer";
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

const card =
  "rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

function employeePhotoSrc(
  employeeId: string | null,
  photoUrl?: string | null,
) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http") || photoUrl.startsWith("/")) return photoUrl;
  if (employeeId) return `/api/employees/${employeeId}/photo`;
  return null;
}

function countActiveFilters(query: PerformanceQuery) {
  let count = 0;
  if (query.preset && query.preset !== "this_month") count += 1;
  if (query.departmentId) count += 1;
  if (query.userId) count += 1;
  if (query.country) count += 1;
  if (query.source) count += 1;
  if (query.campaignId) count += 1;
  if (query.status) count += 1;
  if (query.priority) count += 1;
  if (query.scoreMin) count += 1;
  if (query.scoreMax) count += 1;
  return count;
}

type KpiTone = "blue" | "green" | "purple" | "orange" | "rose" | "teal";

const toneIcon: Record<KpiTone, string> = {
  blue: "bg-[#e8f1ff] text-[#3b82f6] dark:bg-blue-500/20 dark:text-[#93c5fd]",
  green: "bg-[#e7f8ef] text-[#22c55e] dark:bg-green-500/20 dark:text-[#86efac]",
  purple: "bg-[#eee8ff] text-[#8b5cf6] dark:bg-violet-500/20 dark:text-[#c4b5fd]",
  orange: "bg-[#fff1e6] text-[#f59e0b] dark:bg-amber-500/20 dark:text-[#fcd34d]",
  rose: "bg-[#ffe8ee] text-[#f43f5e] dark:bg-rose-500/20 dark:text-[#fda4af]",
  teal: "bg-[#e6f7f5] text-[#0d9488] dark:bg-teal-500/20 dark:text-[#5eead4]",
};

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

function scorePillClass(score: number | null | undefined) {
  if (score == null) return "bg-hover-bg text-text-muted";
  if (score >= 80) return "bg-[#e7f8ef] text-[#15803d]";
  if (score >= 60) return "bg-[#fff1e6] text-[#c2410c]";
  return "bg-[#ffe8ee] text-[#be123c]";
}

function targetPillClass(rate: number) {
  if (rate >= 100) return "bg-[#e7f8ef] text-[#15803d]";
  if (rate >= 70) return "bg-[#fff1e6] text-[#c2410c]";
  return "bg-[#ffe8ee] text-[#be123c]";
}

function MetricIcon({ name }: { name: string }) {
  const common: SVGProps<SVGSVGElement> = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (name) {
    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="M22 4 12 14.01l-3-3" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case "trend":
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="M7 14l4-4 4 4 5-6" />
        </svg>
      );
    case "file":
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

function SummaryKpiCard({
  label,
  value,
  hint,
  tone,
  icon,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: KpiTone;
  icon: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div
        className={`mb-2.5 grid size-9 place-items-center rounded-[10px] ${toneIcon[tone]}`}
      >
        <MetricIcon name={icon} />
      </div>
      <p className="m-0 truncate text-[0.78rem] text-text-muted">{label}</p>
      <strong className="mt-1 block text-[1.35rem] tracking-[-0.03em] text-text">
        {value}
      </strong>
      {hint ? (
        <small className="mt-1.5 block text-[0.7rem] text-text-faint">{hint}</small>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${card} cursor-pointer px-3.5 py-3.5 text-left transition-shadow hover:shadow-[0_8px_24px_rgba(16,24,40,0.08)]`}
      >
        {content}
      </button>
    );
  }

  return <article className={`${card} px-3.5 py-3.5`}>{content}</article>;
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
    <Modal
      open
      title={title}
      onCancel={onClose}
      footer={
        <Button onClick={onClose}>Close</Button>
      }
      width={880}
      destroyOnHidden
    >
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
    </Modal>
  );
}

function KpiConfigModal({
  open,
  kpis,
  enabled,
  onClose,
}: {
  open: boolean;
  kpis: KpiResult[];
  enabled: boolean;
  onClose: () => void;
}) {
  const [overall, setOverall] = useState(enabled);
  const [rows, setRows] = useState(kpis);
  const [save, { isLoading }] = useUpdatePerformanceKpisMutation();
  const [error, setError] = useState("");

  const weight = rows
    .filter((row) => row.isActive)
    .reduce((sum, row) => sum + Number(row.weight || 0), 0);

  async function onSave() {
    setError("");
    try {
      await save({
        overallScoreEnabled: overall,
        kpis: rows.map(
          ({ key, name, target, unit, higherIsBetter, weight: w, isActive }) => ({
            key,
            name,
            target: Number(target),
            unit,
            higherIsBetter,
            weight: Number(w),
            isActive,
          }),
        ),
      }).unwrap();
      onClose();
    } catch (err) {
      setError(getApiError(err, "Unable to calculate KPI performance."));
    }
  }

  return (
    <Modal
      open={open}
      title="Configure KPIs"
      onCancel={onClose}
      width={720}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={isLoading} onClick={() => void onSave()}>
            Save KPIs
          </Button>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-text-muted">
          Set targets and weights for the overall performance score. Active
          weights must total 100%.
        </p>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={overall}
            onChange={(event) => setOverall(event.target.checked)}
          />
          Overall Performance Score
        </label>
      </div>
      <div className={tableWrap}>
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
              <tr key={row.key} className="!cursor-default">
                <td>
                  <strong className="font-medium">{row.name}</strong>
                  <span className="mt-0.5 block text-xs text-text-muted">
                    Unit: {row.unit}
                  </span>
                </td>
                <td>
                  <input
                    className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-sm"
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
                    className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-sm"
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
      <p
        className={`mt-3 text-sm ${weight === 100 ? "text-[#15803d]" : "text-[#c2410c]"}`}
      >
        Total active weight: {weight}%
        {weight !== 100 ? " (must equal 100%)" : ""}
      </p>
      {error ? <p className="mt-1 text-sm text-rose-600">{error}</p> : null}
    </Modal>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="m-0 text-base font-semibold text-text">{title}</h3>
      {action}
    </div>
  );
}

const PAGE_SIZE = 8;

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
  const [kpiOpen, setKpiOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("conversion_rate");
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(query);
  const activeFilterCount = countActiveFilters(query);

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

  function applyFilters() {
    const next = new URLSearchParams(params);
    next.set("tab", "employee-performance");
    const keys: Array<keyof PerformanceQuery> = [
      "preset",
      "from",
      "to",
      "departmentId",
      "userId",
      "country",
      "source",
      "campaignId",
      "status",
      "priority",
      "scoreMin",
      "scoreMax",
    ];
    keys.forEach((key) => {
      const value = draft[key];
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
    });
    setParams(next);
    setPage(1);
  }

  function resetFilters() {
    const next = new URLSearchParams();
    next.set("tab", "employee-performance");
    setParams(next);
    setDraft(readQuery(next));
    setPage(1);
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

  const filteredEmployees = useMemo(() => {
    let rows = data?.employees ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (row) =>
          row.name.toLowerCase().includes(q) ||
          row.departmentName.toLowerCase().includes(q) ||
          (row.employeeCode || "").toLowerCase().includes(q),
      );
    }
    if (teamFilter !== "all") {
      rows = rows.filter((row) => row.departmentId === teamFilter);
    }
    const sorted = [...rows];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "assigned":
          return b.assigned - a.assigned;
        case "score":
          return (b.overallScore ?? 0) - (a.overallScore ?? 0);
        case "follow_up":
          return b.followUpOnTimeRate - a.followUpOnTimeRate;
        case "response":
          return a.avgResponseMinutes - b.avgResponseMinutes;
        case "name":
          return a.name.localeCompare(b.name);
        case "conversion_rate":
        default:
          return b.conversionRate - a.conversionRate;
      }
    });
    return sorted;
  }, [data?.employees, search, teamFilter, sortBy]);

  const pageRows = filteredEmployees.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const presetLabel =
    PRESETS.find((item) => item.id === (query.preset || "this_month"))?.label ||
    "This Month";

  const kpiCards = summary
    ? [
        {
          label: "Total Assigned Leads",
          value: summary.assigned.toLocaleString(),
          hint: `${data?.employees.length ?? 0} employees in view`,
          tone: "blue" as const,
          icon: "users",
          onClick: () => void openDrill("assigned", "Assigned Leads"),
        },
        {
          label: "Contacted Leads",
          value: summary.contacted.toLocaleString(),
          hint: `${percent(summary.contactRate)} contact rate`,
          tone: "teal" as const,
          icon: "phone",
          onClick: () => void openDrill("contacted", "Contacted Leads"),
        },
        {
          label: "Follow-up Completion",
          value: percent(summary.followUpCompletionRate),
          hint: `${summary.followUpsOnTime} on-time`,
          tone: "green" as const,
          icon: "check",
          onClick: () => void openDrill("follow_ups", "Follow-ups"),
        },
        {
          label: "Average Response Time",
          value: minutes(summary.avgResponseMinutes),
          hint: `${summary.followUpsOverdue} overdue`,
          tone: "orange" as const,
          icon: "clock",
        },
        data?.overallScoreEnabled
          ? {
              label: "Overall Score",
              value:
                summary.overallScore == null
                  ? "—"
                  : `${summary.overallScore}/100`,
              hint: "Weighted KPI score",
              tone: "purple" as const,
              icon: "star",
            }
          : {
              label: "Applications Created",
              value: summary.offersCreated.toLocaleString(),
              hint: `${percent(summary.offerAcceptanceRate)} acceptance`,
              tone: "purple" as const,
              icon: "file",
            },
        {
          label: "Conversion Rate",
          value: percent(summary.conversionRate),
          hint: `${summary.converted} converted leads`,
          tone: "rose" as const,
          icon: "trend",
          onClick: () => void openDrill("converted", "Converted Leads"),
        },
      ]
    : [];

  return (
    <div className={`${adminPage} gap-3`}>
      {embedded ? null : (
        <>
          <PageMeta
            title="Employee Performance"
            description="Track lead handling, follow-up, qualification, and conversion by employee."
          />
          <PageHeader
            title="Employee Performance"
            subtitle="Track and analyze your team's productivity, engagement and conversion performance."
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

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {embedded ? (
            <>
              <h2 className="m-0 text-xl font-bold tracking-[-0.02em] text-text">
                Employee Performance
              </h2>
              <p className="mt-1 mb-0 text-sm text-text-muted">
                Track and analyze your team&apos;s productivity, engagement and
                conversion performance.
              </p>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-text-muted">
            <MetricIcon name="clock" />
            {presetLabel}
            {data?.from && data?.to
              ? ` · ${new Date(data.from).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(data.to).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
              : null}
          </span>
          {canConfigure && data ? (
            <PrimaryButton
              size="md"
              variant="primary"
              label="Configure KPIs"
              icon={<MetricIcon name="settings" />}
              onClick={() => {
                setKpiOpen(true);
              }}
            />
          ) : null}
          <PerformanceFilterDrawer
            open={filterOpen}
            draft={draft}
            options={data?.options}
            activeCount={activeFilterCount}
            onOpen={() => {
              setDraft(query);
              setFilterOpen(true);
            }}
            onClose={() => setFilterOpen(false)}
            onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
            onApply={applyFilters}
            onReset={resetFilters}
          />
        </div>
      </div>

      {isLoading ? <Spinner /> : null}
      {isError ? (
        <p className={card}>
          {getApiError(
            error,
            "Unable to load performance data. Please try again.",
          )}
        </p>
      ) : null}
      {data?.message ? <p className={card}>{data.message}</p> : null}

      {data && summary ? (
        <>
          <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {kpiCards.map((kpi) => (
              <SummaryKpiCard key={kpi.label} {...kpi} />
            ))}
          </section>

          <section className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)_minmax(0,0.9fr)]">
            <article className={card}>
              <SectionTitle
                title="Performance Trend"
                action={
                  <span className="rounded-full bg-hover-bg px-2.5 py-1 text-[0.72rem] text-text-muted">
                    Top employees
                  </span>
                }
              />
              <PerformanceTrendChart employees={data.employees} />
            </article>
            <article className={card}>
              <SectionTitle title="Employee Comparison" />
              <EmployeeComparisonChart
                employees={data.employees}
                onSelect={openEmployee}
              />
            </article>
            <article className={card}>
              <SectionTitle title="Admission Funnel" />
              <AdmissionFunnelChart summary={summary} />
            </article>
          </section>

          <section className={card}>
            <div className="mb-3 flex flex-nowrap items-center justify-between gap-3 overflow-x-auto">
              <h3 className="m-0 shrink-0 text-base font-semibold whitespace-nowrap">
                Employee Performance Details
              </h3>
              <div className="flex shrink-0 flex-nowrap items-center gap-2">
                <Input.Search
                  allowClear
                  placeholder="Search employee..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  className="w-55"
                />
                <Select
                  value={teamFilter}
                  onChange={(value) => {
                    setTeamFilter(value);
                    setPage(1);
                  }}
                  className="min-w-37.5"
                  options={[
                    { value: "all", label: "All Teams" },
                    ...(data.options.departments.map((item) => ({
                      value: item.id,
                      label: item.name,
                    })) || []),
                  ]}
                />
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  className="min-w-40"
                  options={[
                    { value: "conversion_rate", label: "Sort by Conversion" },
                    { value: "assigned", label: "Sort by Assigned" },
                    { value: "follow_up", label: "Sort by Follow-up" },
                    { value: "response", label: "Sort by Response" },
                    { value: "score", label: "Sort by Score" },
                    { value: "name", label: "Sort by Name" },
                  ]}
                />
              </div>
            </div>

            <div className={tableWrap}>
              <table className={adminTable}>
                <thead>
                  <tr className="text-[0.72rem] text-text-faint">
                    <th>#</th>
                    <th>Employee</th>
                    <th>Team</th>
                    <th>Assigned</th>
                    <th>Contacted</th>
                    <th>Follow-up Rate</th>
                    <th>Avg. Response</th>
                    <th>Applications</th>
                    <th>Conversion</th>
                    <th>Target</th>
                    {data.overallScoreEnabled ? <th>Score</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {!pageRows.length ? (
                    <tr>
                      <td
                        colSpan={data.overallScoreEnabled ? 11 : 10}
                        className="!cursor-default py-10 text-center text-text-muted"
                      >
                        No employees match the current filters.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row, index) => (
                      <EmployeeRow
                        key={row.userId}
                        row={row}
                        index={(page - 1) * PAGE_SIZE + index + 1}
                        showScore={data.overallScoreEnabled}
                        onOpen={() => openEmployee(row.userId)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-text-muted">
                Showing{" "}
                {filteredEmployees.length
                  ? `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filteredEmployees.length)}`
                  : "0"}{" "}
                of {filteredEmployees.length} employees
              </span>
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={filteredEmployees.length}
                onChange={setPage}
                showSizeChanger={false}
                size="small"
              />
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <article className={card}>
              <SectionTitle title="KPI vs Target" />
              <div className="grid gap-2">
                {data.kpis
                  .filter((item) => item.isActive)
                  .map((item) => {
                    const progress =
                      item.unit === "minutes"
                        ? item.target > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (Math.max(item.target - item.actual, 0) /
                                  item.target) *
                                  100,
                              ),
                            )
                          : 0
                        : item.target > 0
                          ? Math.min(
                              100,
                              Math.round((item.actual / item.target) * 100),
                            )
                          : 0;
                    return (
                      <div
                        key={item.key}
                        className="rounded-xl border border-border-subtle px-3 py-2.5"
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <div>
                            <strong className="block text-sm">{item.name}</strong>
                            <span className="text-xs text-text-muted">
                              {kpiValue(item.unit, item.actual)} /{" "}
                              {kpiValue(item.unit, item.target)}
                            </span>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-bold ${kpiTone[item.status]}`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-text)_6%,var(--color-surface))]">
                          <div
                            className="h-full rounded-full bg-primary transition-[width] duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </article>

            <article className={card}>
              <SectionTitle title="Ranking Boards" />
              <div className="mb-3 flex flex-wrap gap-3">
                {RANK_OPTIONS.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 text-sm text-text-muted"
                  >
                    <input
                      type="checkbox"
                      checked={(query.rankBy || "")
                        .split(",")
                        .includes(item.id)}
                      onChange={() => toggleRank(item.id)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {data.ranking.map((board) => (
                  <div
                    key={board.key}
                    className="rounded-xl border border-border-subtle p-3"
                  >
                    <h4 className="mb-2 mt-0 text-sm font-semibold">
                      {board.label}
                    </h4>
                    <ol className="m-0 grid list-none gap-1.5 p-0">
                      {board.rows.slice(0, 5).map((row) => (
                        <li key={row.userId}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-2 rounded-lg border-0 bg-transparent px-1.5 py-1.5 text-left hover:bg-hover-bg"
                            onClick={() => openEmployee(row.userId)}
                          >
                            <span className="truncate text-sm">
                              <span className="mr-1.5 font-semibold text-text-muted">
                                #{row.rank}
                              </span>
                              {row.name}
                            </span>
                            <span className="shrink-0 text-sm font-semibold text-text">
                              {board.key === "response_time"
                                ? minutes(row.value)
                                : board.key === "collection"
                                  ? money(row.value)
                                  : board.key === "overall"
                                    ? row.value
                                    : percent(row.value)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </article>
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

      {canConfigure && data && kpiOpen ? (
        <KpiConfigModal
          open={kpiOpen}
          kpis={data.kpis}
          enabled={data.overallScoreEnabled}
          onClose={() => setKpiOpen(false)}
        />
      ) : null}
    </div>
  );
}

function EmployeeRow({
  row,
  index,
  showScore,
  onOpen,
}: {
  row: EmployeePerformanceRow;
  index: number;
  showScore: boolean;
  onOpen: () => void;
}) {
  const targetRate =
    row.kpis.find((kpi) => kpi.key.includes("conversion"))?.target || 25;
  const achievement =
    targetRate > 0
      ? Math.round((row.conversionRate / targetRate) * 100)
      : row.conversionRate;

  return (
    <tr onClick={onOpen}>
      <td className="text-text-muted">{index}</td>
      <td>
        <div className="flex items-center gap-2.5">
          <UserAvatar
            name={row.name}
            photoUrl={employeePhotoSrc(row.employeeId, row.photoUrl)}
            className={`${employeeAvatar} ${employeeAvatarSm}`}
          />
          <div className="min-w-0">
            <strong className="block truncate text-sm">{row.name}</strong>
            <span className="block truncate text-xs text-text-muted">
              {row.employeeCode || "Counselor"}
            </span>
          </div>
        </div>
      </td>
      <td>{row.departmentName}</td>
      <td>{row.assigned}</td>
      <td>{row.contacted}</td>
      <td>{percent(row.followUpOnTimeRate)}</td>
      <td>{minutes(row.avgResponseMinutes)}</td>
      <td>{row.offersCreated}</td>
      <td>
        <strong>{percent(row.conversionRate)}</strong>
      </td>
      <td>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${targetPillClass(achievement)}`}
        >
          {achievement}%
        </span>
      </td>
      {showScore ? (
        <td>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${scorePillClass(row.overallScore)}`}
          >
            {row.overallScore == null ? "—" : `${row.overallScore}/100`}
          </span>
        </td>
      ) : null}
    </tr>
  );
}
