import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dropdown, type MenuProps } from "antd";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Call02Icon,
  CheckmarkCircle02Icon,
  // FileUploadIcon,
  Flag01Icon,
  Globe02Icon,
  Location01Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  Mortarboard01Icon,
  Note01Icon,
  PencilEdit02Icon,
  // TaskDaily01Icon,
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

type HeaderAction = {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "primary" | "outline";
};

export default function LeadWorkspaceHeader({
  lead,
  degreeOptions = [],
  countryOptions = [],
  canEdit,
  canReopen,
  canHandover,
  canManageDuplicate,
  canOverridePriority,
  canAssign,
  onEdit,
  onReopenLead,
  onHandover,
  onReviewDuplicate,
  onOverridePriority,
  onAddNote,
  onChangeStatus,
  // onAddActivity,
  // onUploadFile,
  onAssign,
  canCreateApplication,
  onCreateApplication,
  studentId,
}: {
  lead: LeadRecord;
  degreeOptions?: MasterOption[];
  countryOptions?: MasterOption[];
  canEdit: boolean;
  canReopen?: boolean;
  canHandover?: boolean;
  canManageDuplicate?: boolean;
  canOverridePriority?: boolean;
  canAssign?: boolean;
  onEdit: () => void;
  onReopenLead?: () => void;
  onHandover?: () => void;
  onReviewDuplicate?: () => void;
  onOverridePriority?: () => void;
  onAddNote?: () => void;
  onChangeStatus?: () => void;
  onAddActivity?: () => void;
  onUploadFile?: () => void;
  onAssign?: () => void;
  canCreateApplication?: boolean;
  onCreateApplication?: () => void;
  studentId?: string | null;
}) {
  const navigate = useNavigate();
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
  const showChangeStatus = Boolean(onChangeStatus);
  // const showAddActivity = Boolean(onAddActivity);
  // const showUploadFile = Boolean(onUploadFile);
  const showAssign = Boolean(canAssign && onAssign);
  const assignLabel = lead.owner?.id ? "Reassign" : "Assign";

  const secondaryActions: HeaderAction[] = [];
  if (studentId) {
    secondaryActions.push({
      key: "student",
      label: "Open Student",
      icon: <HugeiconsIcon icon={UserIcon} size={15} />,
      onClick: () => navigate(`/students/${studentId}`),
    });
  }
  if (canCreateApplication && onCreateApplication) {
    secondaryActions.push({
      key: "application",
      label:
        (lead.applications?.length || 0) > 0
          ? "Add Application"
          : "Create Application",
      icon: <HugeiconsIcon icon={Mortarboard01Icon} size={15} />,
      onClick: onCreateApplication,
      variant: "primary",
    });
  }
  if (showDuplicateReview && onReviewDuplicate) {
    secondaryActions.push({
      key: "duplicate",
      label: "Review Duplicate",
      onClick: onReviewDuplicate,
    });
  }
  if (showAssign && onAssign) {
    secondaryActions.push({
      key: "assign",
      label: assignLabel,
      icon: <HugeiconsIcon icon={UserIcon} size={15} />,
      onClick: onAssign,
    });
  }
  if (showAddNote && onAddNote) {
    secondaryActions.push({
      key: "note",
      label: "Add Note",
      icon: <HugeiconsIcon icon={Note01Icon} size={15} />,
      onClick: onAddNote,
    });
  }
  if (canHandover && onHandover) {
    secondaryActions.push({
      key: "handover",
      label: "Hand Over",
      onClick: onHandover,
    });
  }
  if (canEdit) {
    secondaryActions.push({
      key: "edit",
      label: "Edit",
      icon: <HugeiconsIcon icon={PencilEdit02Icon} size={15} />,
      onClick: onEdit,
    });
  }
  if (canReopen && onReopenLead) {
    secondaryActions.push({
      key: "reopen",
      label: "Reopen Lead",
      onClick: onReopenLead,
    });
  }

  const moreMenuItems: MenuProps["items"] = secondaryActions.map((action) => ({
    key: action.key,
    label: action.label,
    icon: action.icon,
    onClick: action.onClick,
  }));

  function renderChangeStatusButton() {
    if (!showChangeStatus) return null;
    return (
      <PrimaryButton
        type="button"
        size="sm"
        variant="primary"
        className="shrink-0"
        icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />}
        onClick={onChangeStatus}
        label="Change Status"
      />
    );
  }

  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#e7eef5] bg-surface px-3 py-3 shadow-[0_10px_28px_rgba(22,50,79,0.035)] sm:overflow-visible sm:px-4 sm:py-4 md:px-5 dark:border-border">
      <div className="mb-3 flex w-full min-w-0 max-w-full items-center justify-end gap-2 pr-1 sm:hidden">
        {renderChangeStatusButton()}
        {secondaryActions.length > 0 ? (
          <Dropdown
            menu={{ items: moreMenuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <span className="inline-flex">
              <PrimaryButton
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                icon={<HugeiconsIcon icon={MoreHorizontalIcon} size={16} />}
                label="More"
              />
            </span>
          </Dropdown>
        ) : null}
      </div>

      <div className="-mx-1 mb-4 hidden items-center gap-2 px-1 sm:flex sm:flex-wrap sm:justify-end">
        {renderChangeStatusButton()}
        {secondaryActions.map((action) => (
          <PrimaryButton
            key={action.key}
            type="button"
            size="sm"
            variant={action.variant ?? "outline"}
            className="shrink-0"
            icon={action.icon}
            onClick={action.onClick}
            label={action.label}
          />
        ))}
      </div>

      <div className="flex w-full min-w-0 max-w-full flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center">
        {/* Identity + score share one row on mobile (matches reference) */}
        <div className="flex w-full min-w-0 max-w-full flex-1 basis-0 items-start gap-2 sm:gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-[0.95rem] font-bold tracking-wide text-on-primary ring-4 ring-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] sm:size-14 sm:text-[1.05rem]">
            {leadInitials(lead.name)}
          </span>

          <div className="min-w-0 flex-1 overflow-hidden">
            <h2
              className="m-0 min-w-0 text-[1.15rem] leading-snug font-semibold tracking-tight text-[#17324f] wrap-break-word sm:truncate sm:text-[1.35rem] dark:text-text-strong"
              title={lead.name}
            >
              {lead.name}
            </h2>
            <div className="mt-1 mb-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-semibold ${stageBadgeClass(lead.status)}`}
                title={lead.status}
              >
                <span className="size-1.5 shrink-0 rounded-full bg-current" />
                {lead.status}
              </span>
              <span className="hidden size-1 shrink-0 rounded-full bg-[#d5dee8] sm:inline-block dark:bg-border" />
              <p
                className="m-0 min-w-0 truncate text-[0.78rem] text-[#8b97a8] sm:text-[0.82rem]"
                title={lead.code}
              >
                Lead ID: {lead.code}
              </p>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-1 text-[0.78rem] text-[#5b6b7c] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1 sm:text-[0.82rem]">
              {lead.phone ? (
                <span className="flex w-full min-w-0 items-center gap-1.5 sm:w-auto sm:max-w-full">
                  <HugeiconsIcon
                    icon={Call02Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.7}
                    className="shrink-0"
                  />
                  <span className="min-w-0 truncate" title={lead.phone}>
                    {lead.phone}
                  </span>
                </span>
              ) : null}
              {lead.email ? (
                <span className="flex w-full min-w-0 items-center gap-1.5 sm:w-auto sm:max-w-full">
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.7}
                    className="shrink-0"
                  />
                  <span className="min-w-0 truncate" title={lead.email}>
                    {lead.email}
                  </span>
                </span>
              ) : null}
              {lead.currentLocation || lead.country ? (
                <span className="flex w-full min-w-0 items-center gap-1.5 sm:w-auto sm:max-w-full">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.7}
                    className="shrink-0"
                  />
                  <span
                    className="min-w-0 truncate"
                    title={lead.currentLocation || lead.country || undefined}
                  >
                    {lead.currentLocation || lead.country}
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Compact score block — visible beside identity on <lg */}
          <div className="mr-1 flex w-16 shrink-0 flex-col items-center gap-1 sm:mr-0 sm:w-auto lg:hidden">
            <ScoreRing score={score} size={44} />
            <span
              className={`inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-center text-[0.62rem] font-semibold leading-tight sm:max-w-[5.5rem] ${priorityBadgeClass(lead.priority)}`}
              title={
                lead.priority
                  ? `${lead.priority} Priority${lead.priorityManual ? " · Manual" : ""}`
                  : "No Priority"
              }
            >
              {lead.priority ? `${lead.priority}` : "—"}
            </span>
            {canOverridePriority && onOverridePriority ? (
              <button
                type="button"
                className="max-w-full cursor-pointer truncate border-0 bg-transparent p-0 text-[0.62rem] font-medium text-primary hover:underline"
                onClick={onOverridePriority}
              >
                Override
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid min-w-0 flex-[1.4] basis-0 grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-5 sm:gap-y-3 sm:grid-cols-4">
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
            href={lead.owner?.id ? `/users/${lead.owner.id}` : undefined}
            hint={lead.owner?.role?.name || undefined}
            wordsPerLine={3}
          />
        </div>

        {/* Full score card — desktop / large screens */}
        <div className="hidden shrink-0 items-center gap-3 rounded-xl border border-[#e7eef5] bg-input-bg px-3.5 py-2.5 lg:flex dark:border-border dark:bg-hover-bg">
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

function pairWords(value: string, perLine: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= perLine) return [words.join(" ")];
  const lines: string[] = [];
  for (let index = 0; index < words.length; index += perLine) {
    lines.push(words.slice(index, index + perLine).join(" "));
  }
  return lines;
}

function HeaderMeta({
  icon,
  label,
  value,
  href,
  hint,
  wordsPerLine,
}: {
  icon: typeof Globe02Icon;
  label: string;
  value: string;
  href?: string;
  hint?: string;
  wordsPerLine?: number;
}) {
  const lines =
    wordsPerLine && wordsPerLine > 0 ? pairWords(value, wordsPerLine) : null;
  const valueClassName = lines
    ? "m-0 block text-[0.88rem] font-semibold leading-snug break-words"
    : "m-0 block truncate text-[0.88rem] font-semibold";

  const valueNode = lines ? (
    lines.map((line, index) => (
      <span key={`${line}-${index}`} className="block break-words">
        {line}
      </span>
    ))
  ) : (
    value
  );

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
      {href ? (
        <Link
          to={href}
          title={value}
          className={`${valueClassName} text-primary hover:underline`}
        >
          {valueNode}
        </Link>
      ) : (
        <p
          className={`${valueClassName} text-[#17324f] dark:text-text-strong`}
          title={value}
        >
          {valueNode}
        </p>
      )}
      {hint ? (
        <p className="m-0 truncate text-[0.7rem] text-[#8b97a8]" title={hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const fontSize = size <= 44 ? "9px" : "10px";

  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="shrink-0">
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
        style={{ fontSize, fontWeight: 700 }}
      >
        {score}
      </text>
    </svg>
  );
}
