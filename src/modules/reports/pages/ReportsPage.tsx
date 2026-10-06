import { useMemo, useState } from "react";
import { Button, Dropdown, Modal, Select } from "antd";
import type { MenuProps } from "antd";
import dayjs from "dayjs";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { PageHeader } from "@/components/common/Navigation";
import { PageMeta } from "@/components/common/Meta";
import { hasPermission } from "@/lib/access";
import { adminPage, mdTab, mdTabActive } from "@/styles/admin";
import type { AuthSession } from "@/types";
import ReportFilterDrawer from "../components/ReportFilterDrawer";
import ReportTabPanel from "../components/ReportTabPanel";
import RecentReportsTable from "../components/RecentReportsTable";
import {
  RECENT_REPORTS,
  REPORT_TABS,
  SAVED_REPORTS,
} from "../data/mockAnalytics";
import type { RecentReport, ReportFiltersState, ReportTabId } from "../types";

const DEFAULT_FILTERS: ReportFiltersState = {
  datePreset: "this_month",
  customFrom: null,
  customTo: null,
  employeeScope: "employee",
  employeeId: "all",
  country: "all",
  leadSource: "all",
  service: "all",
  fileStatus: "all",
  paymentStatus: "all",
};

function isReportTabId(value: string | null): value is ReportTabId {
  return REPORT_TABS.some((tab) => tab.id === value);
}

function countActiveReportFilters(filters: ReportFiltersState) {
  let count = 0;
  if (filters.datePreset !== "this_month") count += 1;
  if (filters.employeeId !== "all") count += 1;
  if (filters.employeeScope !== "employee") count += 1;
  if (filters.country !== "all") count += 1;
  if (filters.leadSource !== "all") count += 1;
  if (filters.service !== "all") count += 1;
  if (filters.fileStatus !== "all") count += 1;
  if (filters.paymentStatus !== "all") count += 1;
  return count;
}

export default function ReportsPage() {
  const auth = useOutletContext<AuthSession>();
  const canExport = hasPermission(auth, "report:export");
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const initialTab: ReportTabId = isReportTabId(tabParam)
    ? tabParam
    : "overview";
  const [activeTab, setActiveTab] = useState<ReportTabId>(initialTab);
  const [filters, setFilters] = useState<ReportFiltersState>(() => ({
    ...DEFAULT_FILTERS,
    employeeId: searchParams.get("employeeId") || "all",
  }));
  const [filterOpen, setFilterOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState("monthly");
  const [scheduleFormat, setScheduleFormat] = useState<"PDF" | "Excel" | "CSV">(
    "PDF",
  );

  const activeFilterCount = useMemo(
    () => countActiveReportFilters(filters),
    [filters],
  );

  const changeTab = (tabId: ReportTabId) => {
    setActiveTab(tabId);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tabId);
    setSearchParams(next, { replace: true });
  };

  const patchFilters = (patch: Partial<ReportFiltersState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  const resetFilters = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      employeeId: searchParams.get("employeeId") || "all",
    });
  };

  const validateDateRange = () => {
    if (filters.datePreset !== "custom") return true;
    if (!filters.customFrom || !filters.customTo) {
      toast.error("Please select a valid date range.");
      return false;
    }
    if (dayjs(filters.customFrom).isAfter(dayjs(filters.customTo))) {
      toast.error("Please select a valid date range.");
      return false;
    }
    return true;
  };

  const handleExport = (format: RecentReport["format"]) => {
    if (!canExport) {
      toast.error("You are not authorized to view this report.");
      return;
    }
    if (!validateDateRange()) return;
    try {
      toast.success(
        `${format} export started for ${REPORT_TABS.find((tab) => tab.id === activeTab)?.label}.`,
      );
    } catch {
      toast.error("Unable to export the report. Please try again.");
    }
  };

  const exportMenu: MenuProps["items"] = [
    { key: "pdf", label: "Export as PDF", onClick: () => handleExport("PDF") },
    {
      key: "excel",
      label: "Export as Excel",
      onClick: () => handleExport("Excel"),
    },
    { key: "csv", label: "Export as CSV", onClick: () => handleExport("CSV") },
  ];

  const handleDrillDown = (metric: string) => {
    toast.info(`${metric}: opening detailed records…`);
  };

  const handleSchedule = () => {
    try {
      setScheduleOpen(false);
      toast.success(
        `Scheduled ${scheduleFrequency} ${scheduleFormat} delivery.`,
      );
    } catch {
      toast.error("Unable to schedule this report.");
    }
  };

  return (
    <div className={`${adminPage} @container`}>
      <PageMeta
        title="Reports & Analytics"
        description="Business and operational reports for lead performance, conversion, employees, follow-ups, files, payments, and documents."
      />
      <PageHeader
        title="Reports & Analytics"
        subtitle="Track lead performance, conversion, employee productivity, collections, and operational status from live CRM data."
        breadcrumbs={[
          { title: "Dashboard", path: "/dashboard" },
          { title: "Reports & Analytics" },
        ]}
        showDivider={false}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            {canExport ? (
              <Dropdown menu={{ items: exportMenu }} trigger={["click"]}>
                <Button type="primary">Export</Button>
              </Dropdown>
            ) : null}

            <ReportFilterDrawer
              open={filterOpen}
              filters={filters}
              savedReports={SAVED_REPORTS}
              activeCount={activeFilterCount}
              onOpen={() => setFilterOpen(true)}
              onClose={() => setFilterOpen(false)}
              onChange={patchFilters}
              onReset={resetFilters}
              onApplySaved={changeTab}
              onViewAllSaved={() => setSavedOpen(true)}
              onSchedule={() => setScheduleOpen(true)}
            />
          </div>
        }
      />

      <div className="mb-1 overflow-x-auto border-b border-border-subtle">
        <div className="flex min-w-max items-center gap-1">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`cursor-pointer ${mdTab} ${activeTab === tab.id ? mdTabActive : ""}`}
              onClick={() => changeTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 gap-3">
        <ReportTabPanel tabId={activeTab} onDrillDown={handleDrillDown} />
        {activeTab === "overview" ? (
          <RecentReportsTable
            rows={RECENT_REPORTS}
            onView={(report) => toast.info(`Opening ${report.name}`)}
            onExport={(report, format) => {
              if (!canExport) {
                toast.error("You are not authorized to view this report.");
                return;
              }
              toast.success(`${format} export started for ${report.name}.`);
            }}
          />
        ) : null}
      </div>

      <Modal
        title="Schedule Report"
        open={scheduleOpen}
        onCancel={() => setScheduleOpen(false)}
        onOk={handleSchedule}
        okText="Save Schedule"
      >
        <div className="grid gap-3 py-2">
          <p className="m-0 text-[0.85rem] text-text-muted">
            Schedule recurring delivery for{" "}
            <strong>
              {REPORT_TABS.find((tab) => tab.id === activeTab)?.label}
            </strong>
            .
          </p>
          <label className="grid gap-1.5 text-[0.82rem] font-medium">
            Frequency
            <Select
              value={scheduleFrequency}
              options={[
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "quarterly", label: "Quarterly" },
              ]}
              onChange={setScheduleFrequency}
            />
          </label>
          <label className="grid gap-1.5 text-[0.82rem] font-medium">
            Format
            <Select
              value={scheduleFormat}
              options={[
                { value: "PDF", label: "PDF" },
                { value: "Excel", label: "Excel" },
                { value: "CSV", label: "CSV" },
              ]}
              onChange={(value) => setScheduleFormat(value)}
            />
          </label>
        </div>
      </Modal>

      <Modal
        title="Saved Reports"
        open={savedOpen}
        onCancel={() => setSavedOpen(false)}
        footer={<Button onClick={() => setSavedOpen(false)}>Close</Button>}
      >
        <ul className="m-0 grid list-none gap-2 p-0">
          {SAVED_REPORTS.map((report) => (
            <li key={report.id}>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border px-3 py-2.5 text-left hover:border-primary"
                onClick={() => {
                  changeTab(report.tabId);
                  setSavedOpen(false);
                }}
              >
                <span className="font-medium">{report.name}</span>
                <span className="text-[0.75rem] font-semibold text-primary">
                  Open
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
