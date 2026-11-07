import { Progress, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ArrowDown01Icon,
  Call02Icon,
  Copy01Icon,
  Mail01Icon,
  UserIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "react-toastify";
import type { LeadRow } from "../types";
import LeadTableActions from "../components/LeadTableActions";
import { stageBadgeClass } from "./leadDetails";
import {
  emptyLeadValue,
  leadFollowUpDisplay,
  leadSourceIcon,
  truncateLeadName,
} from "./leadList";

type LeadColumnOptions = {
  canEdit?: boolean;
  canChangeStatus?: boolean;
  canClose?: boolean;
  canReopen?: boolean;
  canReassign?: boolean;
  canOverridePriority?: boolean;
  canConvert?: boolean;
  showStatus?: boolean;
  showCloseMeta?: boolean;
  onView: (row: LeadRow) => void;
  onEdit: (row: LeadRow) => void;
  onChangeStatus?: (row: LeadRow) => void;
  onCloseLead?: (row: LeadRow) => void;
  onReopen?: (row: LeadRow) => void;
  onAddNote?: (row: LeadRow) => void;
  onAddFollowUp?: (row: LeadRow) => void;
  onAddMeeting?: (row: LeadRow) => void;
  onReassign?: (row: LeadRow) => void;
  onChangePriority?: (row: LeadRow) => void;
  onConvert?: (row: LeadRow) => void;
  onOwnerClick?: (row: LeadRow) => void;
};

function phoneDigits(phone?: string | null) {
  if (!phone || phone === "—") return "";
  return phone.replace(/\D/g, "");
}

function hasEmail(email?: string | null) {
  return Boolean(email && email !== "—");
}

async function copyPhone(phone?: string | null) {
  if (!phone || phone === "—") {
    toast.info("No phone number to copy.");
    return;
  }
  try {
    await navigator.clipboard.writeText(phone);
    toast.success("Phone number copied.");
  } catch {
    toast.error("Unable to copy phone number.");
  }
}

function parseLeadScore(value?: string | number | null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value || value === "—") return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

function scoreBarColor(score: number) {
  if (score >= 75) return "#16a34a";
  if (score >= 45) return "#d97706";
  return "#e11d48";
}

function followUpPrimaryClass(tone: ReturnType<typeof leadFollowUpDisplay>["tone"]) {
  if (tone === "overdue") return "font-semibold text-[#9f1239]";
  if (tone === "soon") return "font-semibold text-[#d97706]";
  if (tone === "empty") return "text-[#a16207]";
  return "font-medium text-text";
}

export function getLeadColumns({
  canEdit,
  canChangeStatus,
  canClose,
  canReopen,
  canReassign,
  canOverridePriority,
  canConvert,
  showStatus = true,
  showCloseMeta = false,
  onView,
  onEdit,
  onChangeStatus,
  onCloseLead,
  onReopen,
  onAddNote,
  onAddFollowUp,
  onAddMeeting,
  onReassign,
  onChangePriority,
  onConvert,
  onOwnerClick,
}: LeadColumnOptions): ColumnsType<LeadRow> {
  const columns: ColumnsType<LeadRow> = [
    {
      title: "Lead",
      dataIndex: "name",
      key: "name",
      width: 260,
      ellipsis: true,
      render: (_value, row) => {
        const fullName = row.name?.trim() || "";
        const digits = phoneDigits(row.phone);
        const canCall = Boolean(digits);
        const showEmail = hasEmail(row.email);
        const showPhone = Boolean(row.phone && row.phone !== "—");
        return (
          <div className="min-w-0 max-w-65 overflow-hidden">
            <div className="flex min-w-0 items-center gap-1.5">
              <Tooltip title={fullName || undefined}>
                <p className="m-0 min-w-0 truncate text-[13px] font-semibold text-[#0f9d8e]">
                  {truncateLeadName(row.name)}
                </p>
              </Tooltip>
              <div
                className="flex shrink-0 items-center gap-0.5"
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <Tooltip title="Call">
                  <button
                    type="button"
                    aria-label={`Call ${fullName || "lead"}`}
                    disabled={!canCall}
                    onClick={() => {
                      if (canCall) window.open(`tel:${row.phone}`);
                    }}
                    className="grid size-6 cursor-pointer place-items-center rounded-md text-[#6b7280] transition-colors hover:bg-[#e6f7f3] hover:text-[#0f9d8e] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#6b7280]"
                  >
                    <HugeiconsIcon
                      icon={Call02Icon}
                      size={14}
                      color="currentColor"
                      strokeWidth={1.7}
                    />
                  </button>
                </Tooltip>
                <Tooltip title="WhatsApp">
                  <button
                    type="button"
                    aria-label={`WhatsApp ${fullName || "lead"}`}
                    disabled={!canCall}
                    onClick={() => {
                      if (canCall)
                        window.open(
                          `https://wa.me/${digits}`,
                          "_blank",
                          "noopener,noreferrer",
                        );
                    }}
                    className="grid size-6 cursor-pointer place-items-center rounded-md text-[#25D366] transition-colors hover:bg-[#ecfdf5] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <HugeiconsIcon
                      icon={WhatsappIcon}
                      size={14}
                      color="currentColor"
                      strokeWidth={1.7}
                    />
                  </button>
                </Tooltip>
                {showEmail ? (
                  <Tooltip title="Email">
                    <button
                      type="button"
                      aria-label={`Email ${fullName || "lead"}`}
                      onClick={() => window.open(`mailto:${row.email}`)}
                      className="grid size-6 cursor-pointer place-items-center rounded-md text-[#6b7280] transition-colors hover:bg-[#eef2ff] hover:text-[#4f46e5]"
                    >
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.7}
                      />
                    </button>
                  </Tooltip>
                ) : null}
              </div>
            </div>
            <div className="mt-0.5 min-w-0 leading-tight">
              <div className="flex min-w-0 items-center gap-1">
                <p className="m-0 min-w-0 truncate text-[11px] text-text-faint">
                  {emptyLeadValue(row.country)}
                  {row.country &&
                  row.country !== "—" &&
                  showPhone
                    ? " · "
                    : ""}
                  {showPhone
                    ? row.phone
                    : !row.country || row.country === "—"
                      ? emptyLeadValue(row.phone)
                      : ""}
                </p>
                {showPhone ? (
                  <Tooltip title="Copy phone number">
                    <button
                      type="button"
                      aria-label="Copy phone number"
                      className="grid size-5 shrink-0 cursor-pointer place-items-center rounded text-[#9ca3af] transition-colors hover:bg-[#f3f4f6] hover:text-[#0f9d8e]"
                      onClick={(event) => {
                        event.stopPropagation();
                        void copyPhone(row.phone);
                      }}
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      <HugeiconsIcon
                        icon={Copy01Icon}
                        size={12}
                        color="currentColor"
                        strokeWidth={1.7}
                      />
                    </button>
                  </Tooltip>
                ) : null}
              </div>
              {row.isDuplicate || row.hasPhoneDuplicate ? (
                <span className="mt-0.5 inline-flex rounded-md border border-[#c2410c]/40 bg-[#fff7ed] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#c2410c]">
                  Duplicate
                </span>
              ) : null}
            </div>
          </div>
        );
      },
    },
  ];

  if (showStatus) {
    columns.push({
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (value: string, row) => {
        const label = emptyLeadValue(value);
        const clickable = Boolean(canChangeStatus && onChangeStatus);
        const pill = (
          <span
            className={`inline-flex items-center gap-1 rounded-md border border-current/40 px-2.5 py-1 text-[11px] font-semibold ${stageBadgeClass(value || "")} ${
              clickable ? "cursor-pointer transition-opacity hover:opacity-80" : ""
            }`}
          >
            {label}
            {clickable ? (
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={12}
                color="currentColor"
                strokeWidth={2}
              />
            ) : null}
          </span>
        );
        if (!clickable) return pill;
        return (
          <button
            type="button"
            className="border-0 bg-transparent p-0"
            onClick={(event) => {
              event.stopPropagation();
              onChangeStatus?.(row);
            }}
            onMouseDown={(event) => event.stopPropagation()}
            aria-label={`Change status for ${row.name}`}
          >
            {pill}
          </button>
        );
      },
    });
  }

  columns.push(
    {
      title: "Score",
      dataIndex: "score",
      key: "score",
      width: 140,
      render: (value: string | undefined) => {
        const score = parseLeadScore(value);
        if (score == null) return <span className="text-text-faint">—</span>;
        const clamped = Math.max(0, Math.min(100, Math.round(score)));
        return (
          <div className="flex min-w-[110px] items-center gap-2">
            <span className="w-7 shrink-0 text-[13px] font-semibold tabular-nums text-text">
              {clamped}
            </span>
            <Progress
              percent={clamped}
              showInfo={false}
              size="small"
              strokeColor={scoreBarColor(clamped)}
              trailColor="#e5e7eb"
              className="m-0 min-w-0 flex-1 leading-none [&_.ant-progress-bg]:rounded-full [&_.ant-progress-inner]:rounded-full"
            />
          </div>
        );
      },
    },
    {
      title: "Next follow-up",
      dataIndex: "nextFollowUpAt",
      key: "nextFollowUpAt",
      width: 150,
      render: (value: string | null, row) => {
        const display = leadFollowUpDisplay(value);
        if (display.tone === "empty") {
          return (
            <div
              className="flex items-center gap-1 text-[13px]"
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <span className={followUpPrimaryClass("empty")}>Not set</span>
              {onAddFollowUp ? (
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-[#0f9d8e] hover:underline"
                  onClick={() => onAddFollowUp(row)}
                >
                  + Add
                </button>
              ) : null}
            </div>
          );
        }
        return (
          <div className="leading-tight">
            <p className={`m-0 text-[13px] ${followUpPrimaryClass(display.tone)}`}>
              {display.primary}
            </p>
            {display.secondary ? (
              <p className="m-0 text-[11px] text-[#6b7280]">{display.secondary}</p>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Last contact",
      dataIndex: "updated",
      key: "updated",
      width: 120,
      render: (value: string) => (
        <span className="whitespace-nowrap text-[13px] text-text">
          {emptyLeadValue(value)}
        </span>
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: 140,
      ellipsis: true,
      render: (value: string) => {
        const label = emptyLeadValue(value);
        if (label === "—") return label;
        return (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <HugeiconsIcon
              icon={leadSourceIcon(value)}
              size={14}
              color="currentColor"
              strokeWidth={1.7}
              className="shrink-0 text-[#6b7280]"
            />
            <span className="min-w-0 truncate">{label}</span>
          </span>
        );
      },
    },
  );

  columns.push({
    title: "Assigned to",
    dataIndex: "owner",
    key: "owner",
    width: 170,
    ellipsis: true,
    render: (value: string, row) => {
      const name = emptyLeadValue(value);
      const clickable = Boolean(row.ownerId && onOwnerClick && name !== "—");
      return (
        <div
          className="flex min-w-0 items-center gap-2"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-[#eef2f7] text-[#6b7280]">
            {row.ownerPhotoUrl ? (
              <img
                src={row.ownerPhotoUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <HugeiconsIcon
                icon={UserIcon}
                size={14}
                color="currentColor"
                strokeWidth={1.7}
              />
            )}
          </span>
          {clickable ? (
            <button
              type="button"
              className="m-0 min-w-0 truncate border-0 bg-transparent p-0 text-left text-[13px] font-medium text-[#0f9d8e] hover:underline"
              onClick={() => onOwnerClick?.(row)}
            >
              {name}
            </button>
          ) : (
            <span className="min-w-0 truncate text-[13px] text-text">{name}</span>
          )}
        </div>
      );
    },
  });

  if (showCloseMeta) {
    columns.push(
      {
        title: "Closed By",
        dataIndex: "closedBy",
        key: "closedBy",
        width: 140,
        ellipsis: true,
        render: (value: string | null | undefined) => emptyLeadValue(value),
      },
      {
        title: "Reason",
        dataIndex: "closeReason",
        key: "closeReason",
        width: 220,
        ellipsis: true,
        render: (value: string | null | undefined) => emptyLeadValue(value),
      },
    );
  }

  columns.push({
    title: "Action",
    key: "actions",
    width: 128,
    align: "right",
    fixed: "right",
    render: (_value, row) => (
      <LeadTableActions
        row={row}
        canEdit={canEdit}
        canClose={canClose}
        canReopen={canReopen}
        canReassign={canReassign}
        canOverridePriority={canOverridePriority}
        canConvert={canConvert}
        onView={onView}
        onEdit={onEdit}
        onCloseLead={onCloseLead}
        onReopen={onReopen}
        onAddNote={onAddNote}
        onAddFollowUp={onAddFollowUp}
        onAddMeeting={onAddMeeting}
        onReassign={onReassign}
        onChangePriority={onChangePriority}
        onConvert={onConvert}
      />
    ),
  });

  return columns;
}
