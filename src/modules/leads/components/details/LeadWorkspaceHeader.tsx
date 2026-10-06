import { HugeiconsIcon } from "@hugeicons/react";
import {
  Call02Icon,
  CheckmarkCircle02Icon,
  Flag01Icon,
  Globe02Icon,
  Location01Icon,
  Mail01Icon,
  Mortarboard01Icon,
  Note01Icon,
  PencilEdit02Icon,
  RefreshIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { PrimaryButton } from "@/components/ui";
import type { LeadRecord } from "../../types";
import {
  leadInitials,
  optionLabel,
  priorityBadgeClass,
  stageBadgeClass,
} from "../../utils/leadDetails";
import type { MasterOption } from "../../hooks/useLeadMasterOptions";

export default function LeadWorkspaceHeader({
  lead,
  degreeOptions = [],
  countryOptions = [],
  canEdit,
  canClose,
  canReopen,
  canHandover,
  canManageDuplicate,
  canOverridePriority,
  canChangeStatus,
  canAssign,
  onEdit,
  onCloseLead,
  onReopenLead,
  onHandover,
  onReviewDuplicate,
  onOverridePriority,
  onAddNote,
  onChangeStatus,
  onAssign,
  onRefresh,
  refreshing = false,
}: {
  lead: LeadRecord;
  degreeOptions?: MasterOption[];
  countryOptions?: MasterOption[];
  canEdit: boolean;
  canClose?: boolean;
  canReopen?: boolean;
  canHandover?: boolean;
  canManageDuplicate?: boolean;
  canOverridePriority?: boolean;
  canChangeStatus?: boolean;
  canAssign?: boolean;
  onEdit: () => void;
  onCloseLead?: () => void;
  onReopenLead?: () => void;
  onHandover?: () => void;
  onReviewDuplicate?: () => void;
  onOverridePriority?: () => void;
  onAddNote?: () => void;
  onChangeStatus?: () => void;
  onAssign?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const studyLevel =
    optionLabel(degreeOptions, lead.preferredDegreeCode) ||
    lead.preferredCourse ||
    "—";
  const country =
    optionLabel(countryOptions, lead.preferredCountryCode) ||
    lead.country ||
    "—";
  const score = Math.max(0, Math.min(100, lead.leadScore ?? 0));
  const showDuplicateReview = Boolean(
    canManageDuplicate && lead.isDuplicate && onReviewDuplicate,
  );
  const showAddNote = Boolean(onAddNote);
  const showChangeStatus = Boolean(canChangeStatus && onChangeStatus);
  const showAssign = Boolean(canAssign && onAssign);
  const assignLabel = lead.owner?.id ? "Reassign" : "Assign";
  const showRefresh = Boolean(onRefresh);

  return (
    <section className="rounded-2xl border border-[#e7eef5] bg-surface px-4 py-4 shadow-[0_10px_28px_rgba(22,50,79,0.035)] md:px-5 dark:border-border">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        {showDuplicateReview ? (
          <PrimaryButton
            type="button"
            size="sm"
            variant="outline"
            onClick={onReviewDuplicate}
            label="Review Duplicate"
          />
        ) : null}
        {showChangeStatus ? (
          <PrimaryButton
            type="button"
            size="sm"
            variant="primary"
            icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />}
            onClick={onChangeStatus}
            label="Change Status"
          />
        ) : null}
        {showAssign ? (
          <PrimaryButton
            type="button"
            size="sm"
            variant="outline"
            icon={<HugeiconsIcon icon={UserIcon} size={15} />}
            onClick={onAssign}
            label={assignLabel}
          />
        ) : null}
        {showAddNote ? (
          <PrimaryButton
            type="button"
            size="sm"
            variant="outline"
            icon={<HugeiconsIcon icon={Note01Icon} size={15} />}
            onClick={onAddNote}
            label="Add Note"
          />
        ) : null}
        {canHandover ? (
          <PrimaryButton
            type="button"
            size="sm"
            variant="outline"
            onClick={onHandover}
            label="Hand Over"
          />
        ) : null}
        {canEdit ? (
          <PrimaryButton
            type="button"
            size="sm"
            variant="outline"
            icon={<HugeiconsIcon icon={PencilEdit02Icon} size={15} />}
            onClick={onEdit}
            label="Edit"
          />
        ) : null}
        {canReopen ? (
          <PrimaryButton
            type="button"
            size="sm"
            variant="outline"
            onClick={onReopenLead}
            label="Reopen Lead"
          />
        ) : null}
        {canClose ? (
          <PrimaryButton
            type="button"
            size="sm"
            variant="outline"
            onClick={onCloseLead}
            label="Close Lead"
          />
        ) : null}
        {showRefresh ? (
          <PrimaryButton
            type="button"
            size="sm"
            variant="outline"
            loading={refreshing}
            disabled={refreshing}
            icon={<HugeiconsIcon icon={RefreshIcon} size={15} />}
            onClick={onRefresh}
            label="Refresh"
          />
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-[1.05rem] font-bold tracking-wide text-on-primary ring-4 ring-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]">
            {leadInitials(lead.name)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 text-[1.35rem] font-semibold tracking-tight text-[#17324f] dark:text-text-strong">
                {lead.name}
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-semibold ${stageBadgeClass(lead.status)}`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {lead.status}
              </span>
            </div>
            <p className="mt-0.5 mb-2 text-[0.82rem] text-[#8b97a8]">
              Lead ID: {lead.code}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.82rem] text-[#5b6b7c]">
              {lead.phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Call02Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.7}
                  />
                  {lead.phone}
                </span>
              ) : null}
              {lead.email ? (
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.7}
                  />
                  {lead.email}
                </span>
              ) : null}
              {lead.currentLocation || lead.country ? (
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.7}
                  />
                  {lead.currentLocation || lead.country}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid min-w-0 flex-[1.4] grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
          <HeaderMeta
            icon={Globe02Icon}
            label="Lead Source"
            value={lead.source || "—"}
          />
          <HeaderMeta
            icon={Flag01Icon}
            label="Preferred Country"
            value={country}
          />
          <HeaderMeta
            icon={Mortarboard01Icon}
            label="Study Level"
            value={studyLevel}
          />
          <HeaderMeta
            icon={UserIcon}
            label="Assigned To"
            value={lead.owner?.name || "Unassigned"}
            hint={lead.owner?.name ? "Counsellor" : undefined}
          />
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-[#e7eef5] bg-input-bg px-3.5 py-2.5 dark:border-border dark:bg-hover-bg">
          <ScoreRing score={score} />
          <div>
            <p className="m-0 text-[0.72rem] text-[#8b97a8]">Lead Score</p>
            <p className="m-0 text-[0.95rem] font-bold text-[#17324f] dark:text-text-strong">
              {score}
              <span className="font-medium text-[#8b97a8]"> / 100</span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ${priorityBadgeClass(lead.priority)}`}
              >
                {lead.priority ? `${lead.priority} Priority` : "No Priority"}
                {lead.priorityManual ? " · Manual" : ""}
              </span>
              {canOverridePriority && onOverridePriority ? (
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 text-[0.68rem] font-medium text-primary hover:underline"
                  onClick={onOverridePriority}
                >
                  Override
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeaderMeta({
  icon,
  label,
  value,
  hint,
}: {
  icon: typeof Globe02Icon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 flex items-center gap-1.5 text-[0.72rem] text-[#8b97a8]">
        <HugeiconsIcon
          icon={icon}
          size={13}
          color="currentColor"
          strokeWidth={1.7}
        />
        {label}
      </p>
      <p className="m-0 truncate text-[0.88rem] font-semibold text-[#17324f] dark:text-text-strong">
        {value}
      </p>
      {hint ? <p className="m-0 text-[0.7rem] text-[#8b97a8]">{hint}</p> : null}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="52" height="52" viewBox="0 0 44 44" className="shrink-0">
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="#e6eef6"
        strokeWidth="4"
      />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
      />
      <text
        x="22"
        y="23"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--color-primary)"
        style={{ fontSize: "10px", fontWeight: 700 }}
      >
        {score}
      </text>
    </svg>
  );
}
