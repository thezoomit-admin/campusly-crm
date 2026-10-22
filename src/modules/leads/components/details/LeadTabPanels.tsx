import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Input, Modal, Spin, Tag, Tooltip } from "antd";
import { toast } from "react-toastify";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Calendar03Icon,
  Call02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  CloudUploadIcon,
  Delete02Icon,
  File01Icon,
  Mail01Icon,
  Note01Icon,
  UserIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { DataTable } from "@/components/common/Tables";
import { PrimaryButton } from "@/components/ui";
import { getApiError } from "@/lib/api";
import { statusClass } from "@/lib/statusClass";
import { useAppDispatch } from "@/redux";
import { baseApi } from "@/redux/api/baseApi";
import type { ActivityFeedItem } from "@/types";
import type { CommunicationEvent } from "@/modules/communications/types";
import { CHANNEL_LABELS, STATUS_LABELS } from "@/modules/communications/types";
import {
  FOLLOW_UP_OPEN_STATUSES,
  type FollowUpRecord,
} from "@/modules/follow-ups/types";
import {
  useCancelPaymentMutation,
  useGeneratePaymentReceiptMutation,
  useListLeadPaymentHistoryQuery,
  useReversePaymentMutation,
} from "@/modules/payments/api/paymentsApi";
import AddPaymentModal from "@/modules/payments/components/AddPaymentModal";
import ReceiptViewModal from "@/modules/payments/components/ReceiptViewModal";
import type { PaymentRecord } from "@/modules/payments/types";
import { formatMoney } from "@/modules/packages/utils/offerCalculator";
import type {
  LeadAssignmentHistoryItem,
  LeadDocumentItem,
  LeadHandoverNote,
  LeadNoteItem,
  LeadStatusHistoryItem,
} from "../../types";
import {
  activityIconKind,
  activityTitle,
  formatDisplayDateTime,
  LEAD_MORE_TABS,
  type LeadActivityIconKind,
  type LeadMoreTabKey,
} from "../../utils/leadDetails";
import LeadPackageOfferPanel from "@/modules/packages/components/LeadPackageOfferPanel";
import LeadSectionCard from "./LeadSectionCard";
import {
  LeadListPagination,
  useLeadListPagination,
} from "./LeadListPagination";

const OPEN_FOLLOW_UP = new Set<string>(FOLLOW_UP_OPEN_STATUSES);

const ACTIVITY_ICON_MAP: Record<
  LeadActivityIconKind,
  (typeof Note01Icon)
> = {
  note: Note01Icon,
  meeting: Calendar03Icon,
  "follow-up": Clock01Icon,
  call: Call02Icon,
  email: Mail01Icon,
  whatsapp: Call02Icon,
  sms: Mail01Icon,
  counselling: UserIcon,
  document: File01Icon,
  payment: File01Icon,
  status: CheckmarkCircle02Icon,
  assignment: UserIcon,
  check: CheckmarkCircle02Icon,
  cancel: Cancel01Icon,
  system: Clock01Icon,
};

type ActivityTimelineEntry =
  | {
      kind: "open-follow-up";
      id: string;
      sortAt: number;
      followUp: FollowUpRecord;
    }
  | {
      kind: "feed";
      id: string;
      sortAt: number;
      item: ActivityFeedItem;
    };

function ActivityTypeIcon({
  kind,
}: {
  kind: LeadActivityIconKind;
}) {
  const icon = ACTIVITY_ICON_MAP[kind] || Clock01Icon;
  return (
    <span
      className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eef7f2] text-primary dark:bg-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]"
      aria-hidden
    >
      <HugeiconsIcon icon={icon} size={15} color="currentColor" strokeWidth={1.8} />
    </span>
  );
}

function readStatusLabels(item: ActivityFeedItem) {
  const previous =
    typeof item.metadata?.previousStatus === "string"
      ? item.metadata.previousStatus.trim()
      : "";
  const next =
    typeof item.metadata?.newStatus === "string"
      ? item.metadata.newStatus.trim()
      : "";
  if (previous && next) return { previous, next };

  const details = item.details || "";
  const match =
    details.match(/status changed from\s+(.+?)\s+to\s+(.+?)(?:\.|$)/i) ||
    details.match(/reopened from\s+(.+?)\s+to\s+(.+?)(?:\.|$)/i) ||
    details.match(/closed as\s+(.+?)(?:\s|\(|\.|$)/i);
  if (match?.[1] && match?.[2]) {
    return { previous: match[1].trim(), next: match[2].trim() };
  }
  if (match?.[1] && !match[2]) {
    return { previous: previous || "—", next: match[1].trim() };
  }
  return { previous, next };
}

function statusChangeRemark(item: ActivityFeedItem) {
  const remarks =
    typeof item.metadata?.remarks === "string"
      ? item.metadata.remarks.trim()
      : typeof item.metadata?.reopenReason === "string"
        ? item.metadata.reopenReason.trim()
        : "";
  if (remarks) return remarks;
  const details = item.details || "";
  const afterDot = details.includes(". ")
    ? details.slice(details.indexOf(". ") + 2).trim()
    : "";
  if (
    afterDot &&
    !/^status changed/i.test(afterDot) &&
    !/^lead (closed|reopened)/i.test(afterDot)
  ) {
    return afterDot;
  }
  return "";
}

function activityBadgeClass(status: string) {
  return `${statusClass(status).replace("rounded-full", "rounded-md")} px-2 py-0.5 text-[0.72rem] font-semibold`;
}

function StatusChangeBadges({ item }: { item: ActivityFeedItem }) {
  const { previous, next } = readStatusLabels(item);
  if (!previous && !next) return null;
  return (
    <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5">
      <span className={activityBadgeClass(previous || "—")}>{previous || "—"}</span>
      <span className="text-[0.75rem] font-semibold text-[#8b97a8]" aria-hidden>
        →
      </span>
      <span className={activityBadgeClass(next || "—")}>{next || "—"}</span>
    </div>
  );
}

function StatusChangeRemark({ item }: { item: ActivityFeedItem }) {
  const { previous, next } = readStatusLabels(item);
  const remark = statusChangeRemark(item);
  if (!previous && !next && item.details) {
    return (
      <p className="mt-1 mb-0 max-w-2xl whitespace-pre-wrap break-words text-[0.82rem] text-[#5b6b7c]">
        {item.details}
      </p>
    );
  }
  if (!remark) return null;
  return (
    <p className="mt-1 mb-0 max-w-2xl whitespace-pre-wrap break-words text-[0.82rem] text-[#5b6b7c]">
      {remark}
    </p>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentActionButton({
  label,
  danger,
  icon,
  onClick,
}: {
  label: string;
  danger?: boolean;
  icon: typeof ViewIcon;
  onClick: () => void;
}) {
  return (
    <Tooltip title={label}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={`inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors ${
          danger
            ? "border-transparent bg-[#ff4d4f] text-white hover:bg-[#ff7875]"
            : "border-[#C7CACF] bg-surface text-[#4b5563] hover:border-primary hover:text-primary"
        }`}
      >
        <HugeiconsIcon icon={icon} size={15} color="currentColor" strokeWidth={1.8} />
      </button>
    </Tooltip>
  );
}

export function LeadDocumentsPanel({
  documents,
  loading,
  canUpload,
  canDelete,
  canVerify,
  showArchived,
  onToggleArchived,
  onAdd,
  onUploadMissing,
  onView,
  onVerify,
  onDelete,
}: {
  documents: LeadDocumentItem[];
  loading?: boolean;
  canUpload: boolean;
  canDelete: boolean;
  canVerify: boolean;
  showArchived?: boolean;
  onToggleArchived?: () => void;
  onAdd: () => void;
  onUploadMissing?: (typeCode: string) => void;
  onView: (document: LeadDocumentItem) => void;
  onVerify: (document: LeadDocumentItem) => void;
  onDelete: (document: LeadDocumentItem) => void;
}) {
  const { page, pageSize, setPage, setPageSize, pageItems, total } =
    useLeadListPagination(documents);

  const columns = useMemo(
    () => [
      {
        title: "Category",
        key: "category",
        width: 180,
        render: (_: unknown, doc: LeadDocumentItem) => (
          <div className="min-w-0">
            <p className="m-0 truncate font-semibold text-[#17324f] dark:text-text-strong">
              {doc.typeCode || doc.categoryCode || "Document"}
            </p>
            <p className="m-0 mt-0.5 truncate text-[0.75rem] text-[#8b97a8]">
              {doc.categoryCode}
              {doc.versionNumber ? ` · v${doc.versionNumber}` : ""}
              {doc.isSensitive ? " · Sensitive" : ""}
            </p>
          </div>
        ),
      },
      {
        title: "Document",
        key: "document",
        width: 220,
        ellipsis: true,
        onCell: () => ({
          style: { maxWidth: 220 },
        }),
        render: (_: unknown, doc: LeadDocumentItem) => {
          const title = doc.name || doc.fileName;
          const details = [
            doc.fileName,
            formatFileSize(doc.fileSize),
            doc.uploadedBy?.name,
            formatDisplayDateTime(doc.createdAt),
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <div className="min-w-0 overflow-hidden">
              <p
                className="m-0 truncate font-medium text-[#17324f] dark:text-text-strong"
                title={title}
              >
                {title}
              </p>
              <p
                className="m-0 mt-0.5 truncate text-[0.75rem] text-[#8b97a8]"
                title={details}
              >
                {details}
              </p>
            </div>
          );
        },
      },
      {
        title: "Status",
        key: "status",
        width: 120,
        render: (_: unknown, doc: LeadDocumentItem) => (
          <Tag className={`m-0 ${statusClass(doc.statusLabel || doc.status || "Pending")}`}>
            {doc.statusLabel || doc.status || "Pending"}
          </Tag>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 156,
        align: "right" as const,
        render: (_: unknown, doc: LeadDocumentItem) => (
          <div className="flex items-center justify-end gap-1.5">
            {doc.canPreview !== false ? (
              <DocumentActionButton
                label="View"
                icon={ViewIcon}
                onClick={() => onView(doc)}
              />
            ) : null}
            {canVerify && doc.status === "PENDING" && !showArchived ? (
              <DocumentActionButton
                label="Review"
                icon={CheckmarkCircle02Icon}
                onClick={() => onVerify(doc)}
              />
            ) : null}
            {canUpload &&
            (doc.status === "REJECTED" || doc.status === "EXPIRED") &&
            !showArchived ? (
              <DocumentActionButton
                label="Upload New Version"
                icon={CloudUploadIcon}
                onClick={() => onUploadMissing?.(doc.typeCode)}
              />
            ) : null}
            {canDelete && !showArchived ? (
              <DocumentActionButton
                label="Archive"
                danger
                icon={Delete02Icon}
                onClick={() => onDelete(doc)}
              />
            ) : null}
          </div>
        ),
      },
    ],
    [
      canDelete,
      canUpload,
      canVerify,
      onDelete,
      onUploadMissing,
      onVerify,
      onView,
      showArchived,
    ],
  );

  return (
    <div className="grid gap-4">
      <LeadSectionCard
        title="Documents"
        extra={
          <div className="flex flex-wrap items-center gap-2">
            {onToggleArchived ? (
              <PrimaryButton
                type="button"
                size="sm"
                variant="outline"
                label={showArchived ? "Hide Archived" : "View Archived Documents"}
                onClick={onToggleArchived}
              />
            ) : null}
            {canUpload ? (
              <PrimaryButton
                type="button"
                size="sm"
                label="Upload Document"
                icon={
                  <HugeiconsIcon
                    icon={Add01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.8}
                  />
                }
                onClick={onAdd}
              />
            ) : null}
          </div>
        }
      >
        {loading ? (
          <div className="grid min-h-[160px] place-items-center py-8">
            <Spin />
          </div>
        ) : documents.length === 0 ? (
          <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-[#dbe4ee] bg-[#f8fafc] px-4 py-10 text-center dark:border-border dark:bg-transparent">
            <span className="grid size-12 place-items-center rounded-full bg-[#eef3f8] text-[#8b97a8]">
              <HugeiconsIcon
                icon={File01Icon}
                size={22}
                color="currentColor"
                strokeWidth={1.6}
              />
            </span>
            <p className="m-0 text-[0.95rem] font-semibold text-[#17324f] dark:text-text-strong">
              {showArchived ? "No archived documents" : "No documents uploaded"}
            </p>
            <p className="m-0 max-w-md text-[0.84rem] text-[#8b97a8]">
              Passport, academic certificates, transcripts, IELTS results, and
              other supporting documents will appear here once uploaded.
            </p>
          </div>
        ) : (
          <>
            <DataTable
              data={pageItems}
              columns={columns}
              rowKey="id"
              showRowNumber={false}
              scrollX={false}
            />
            <LeadListPagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </LeadSectionCard>
    </div>
  );
}

export function LeadCommunicationsPanel({
  items,
  loading,
}: {
  items: CommunicationEvent[];
  loading?: boolean;
}) {
  const { page, pageSize, setPage, setPageSize, pageItems, total } =
    useLeadListPagination(items);

  return (
    <LeadSectionCard title="Communication History">
      {loading ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">
          Loading communications…
        </p>
      ) : items.length === 0 ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">
          No channel communications yet. Website, WhatsApp, Email, and Meta
          enquiries for this lead will appear here.
        </p>
      ) : (
        <>
          <ol className="m-0 grid min-w-0 list-none gap-0 p-0">
            {pageItems.map((item, index) => {
            const isEmail = item.channel === "EMAIL";
            const outgoing = item.direction === "outgoing";
            const emailLabel = isEmail
              ? outgoing
                ? item.formName?.includes("failed")
                  ? "Email · Failed"
                  : "Email · Sent"
                : "Email · Received"
              : null;
            return (
              <li
                key={item.id}
                className="relative flex min-w-0 gap-3 border-b border-[#eef3f8] py-3 last:border-b-0 dark:border-border-subtle"
              >
                <span
                  className={`mt-1 size-3.5 shrink-0 rounded-full border-[3px] ${
                    isEmail
                      ? "border-[#dbeafe] bg-[#3b82f6]"
                      : "border-[#e7f8ef] bg-primary"
                  }`}
                />
                {index < pageItems.length - 1 ? (
                  <span className="absolute top-7 bottom-[-6px] left-[6px] w-px bg-[#e6eef6] dark:bg-border-subtle" />
                ) : null}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <p className="m-0 min-w-0 break-all text-[0.9rem] font-semibold text-[#17324f] dark:text-text-strong">
                      {emailLabel ||
                        CHANNEL_LABELS[item.channel] ||
                        item.channel}
                      {!isEmail && item.formName ? ` · ${item.formName}` : ""}
                    </p>
                    <time className="shrink-0 text-[0.75rem] text-[#8b97a8]">
                      {formatDisplayDateTime(item.eventAt)}
                    </time>
                  </div>
                  {item.subject ? (
                    <p className="mt-1 mb-0 max-w-full break-words text-[0.82rem] font-medium text-[#5b6b7c] [overflow-wrap:anywhere]">
                      {item.subject}
                    </p>
                  ) : null}
                  {item.message ? (
                    <p className="mt-1 mb-0 max-w-full line-clamp-3 whitespace-pre-wrap break-all text-[0.82rem] text-[#5b6b7c]">
                      {item.message}
                    </p>
                  ) : null}
                  <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                    <span
                      className={statusClass(
                        STATUS_LABELS[item.processingStatus],
                      )}
                    >
                      {STATUS_LABELS[item.processingStatus]}
                    </span>
                    {item.campaignName || item.campaign?.name ? (
                      <span className="min-w-0 max-w-full break-words text-[0.75rem] text-[#8b97a8] [overflow-wrap:anywhere]">
                        Campaign: {item.campaign?.name || item.campaignName}
                      </span>
                    ) : null}
                    <span className="text-[0.75rem] text-[#8b97a8] capitalize">
                      {item.direction}
                    </span>
                    {isEmail && item.threadId ? (
                      <Link
                        to={`/email?c=${item.threadId}`}
                        className="text-[0.75rem] font-medium text-primary"
                      >
                        Open thread
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
          </ol>
          <LeadListPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </LeadSectionCard>
  );
}

export function LeadTimelinePanel({
  items,
  loading,
}: {
  items: ActivityFeedItem[];
  loading?: boolean;
}) {
  const { page, pageSize, setPage, setPageSize, pageItems, total } =
    useLeadListPagination(items);

  return (
    <LeadSectionCard title="Timeline">
      {loading ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">Loading timeline…</p>
      ) : items.length === 0 ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">
          No timeline events recorded for this lead yet.
        </p>
      ) : (
        <>
          <ol className="m-0 grid min-w-0 list-none gap-0 p-0">
            {pageItems.map((item, index) => (
              <li
                key={item.id}
                className="relative flex min-w-0 gap-3 border-b border-[#eef3f8] py-3 last:border-b-0 dark:border-border-subtle"
              >
                <span
                  className="mt-1 size-3.5 shrink-0 rounded-full border-[3px] border-[#e7f8ef] bg-primary"
                  aria-hidden
                />
                {index < pageItems.length - 1 ? (
                  <span className="absolute top-7 bottom-[-6px] left-[6px] w-px bg-[#e6eef6] dark:bg-border-subtle" />
                ) : null}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 max-w-2xl flex-1">
                      <p className="m-0 break-words text-[0.9rem] font-semibold text-[#17324f] dark:text-text-strong">
                        {activityTitle(
                          item.action,
                          item.details,
                          item.outcome,
                          item.actionKey,
                          item.metadata,
                        )}
                      </p>
                      {item.category === "status" ||
                      (item.actionKey || "").toUpperCase().includes("STATUS") ||
                      (item.actionKey || "").toUpperCase() === "LEAD_CLOSED" ||
                      (item.actionKey || "").toUpperCase() === "LEAD_REOPENED" ? (
                        <StatusChangeRemark item={item} />
                      ) : item.details ? (
                        <p className="mt-1 mb-0 whitespace-pre-wrap break-words text-[0.82rem] text-[#5b6b7c]">
                          {item.details}
                        </p>
                      ) : null}
                      <p className="mt-1 mb-0 text-[0.75rem] text-[#8b97a8]">
                        {item.category === "status" ||
                        (item.actionKey || "").toUpperCase().includes("STATUS") ||
                        (item.actionKey || "").toUpperCase() === "LEAD_CLOSED" ||
                        (item.actionKey || "").toUpperCase() === "LEAD_REOPENED"
                          ? item.user?.fullName
                            ? `Changed by ${item.user.fullName}`
                            : "Changed by System"
                          : item.user?.fullName
                            ? `Performed by ${item.user.fullName}`
                            : "Performed by System"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
                      <time className="text-[0.75rem] text-[#8b97a8]">
                        {formatDisplayDateTime(item.occurredAt)}
                      </time>
                      {item.category === "status" ||
                      (item.actionKey || "").toUpperCase().includes("STATUS") ||
                      (item.actionKey || "").toUpperCase() === "LEAD_CLOSED" ||
                      (item.actionKey || "").toUpperCase() === "LEAD_REOPENED" ? (
                        <StatusChangeBadges item={item} />
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <LeadListPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </LeadSectionCard>
  );
}

export function LeadActivitiesPanel({
  activities,
  followUps = [],
  loading,
  followUpsLoading,
  canEditFollowUp,
  onCompleteFollowUp,
  onRescheduleFollowUp,
  onCancelFollowUp,
}: {
  activities: ActivityFeedItem[];
  followUps?: FollowUpRecord[];
  loading?: boolean;
  followUpsLoading?: boolean;
  canEditFollowUp?: boolean;
  onCompleteFollowUp?: (item: FollowUpRecord) => void;
  onRescheduleFollowUp?: (item: FollowUpRecord) => void;
  onCancelFollowUp?: (item: FollowUpRecord) => void;
}) {
  const timeline = useMemo(() => {
    const openFollowUps = followUps.filter((item) =>
      OPEN_FOLLOW_UP.has(item.status),
    );
    const openIds = new Set(openFollowUps.map((item) => item.id));

    const openMeetingNotes = new Set(
      openFollowUps
        .filter((followUp) => followUp.type === "Meeting")
        .map((followUp) => (followUp.notes || "").trim())
        .filter(Boolean),
    );

    const openEntries: ActivityTimelineEntry[] = openFollowUps.map(
      (followUp) => {
        const isMeeting = followUp.type === "Meeting";
        const addTime = followUp.createdAt
          ? new Date(followUp.createdAt).getTime()
          : 0;
        const dueTime = followUp.dueAt
          ? new Date(followUp.dueAt).getTime()
          : 0;
        return {
          kind: "open-follow-up" as const,
          id: `follow-up:${followUp.id}`,
          // Meetings sit at add-time; scheduled time is shown in the card body.
          sortAt: isMeeting ? addTime || dueTime : dueTime || addTime,
          followUp,
        };
      },
    );

    const feedEntries: ActivityTimelineEntry[] = activities
      .filter((item) => {
        const metaFollowUpId = item.metadata?.followUpId;
        if (
          typeof metaFollowUpId === "string" &&
          openIds.has(metaFollowUpId) &&
          (item.actionKey === "FOLLOW_UP_CREATED" ||
            item.actionKey === "FOLLOW_UP_RESCHEDULED")
        ) {
          return false;
        }
        if (
          item.actionKey === "FOLLOW_UP" &&
          (item.outcome || "").toLowerCase() === "scheduled" &&
          openFollowUps.some((followUp) =>
            `${item.details || ""} ${item.action || ""}`
              .toLowerCase()
              .includes(followUp.type.toLowerCase()),
          )
        ) {
          return false;
        }
        // Hide duplicate "Meeting added" feed rows while the open meeting card is shown.
        const isMeetingFeed =
          (item.actionKey || "").toUpperCase() === "MEETING" ||
          `${item.action || ""} ${item.details || ""}`
            .toLowerCase()
            .includes("meeting");
        const outcome = (item.outcome || "").toLowerCase();
        if (
          isMeetingFeed &&
          (outcome === "scheduled" || outcome === "rescheduled") &&
          openMeetingNotes.size > 0
        ) {
          const details = (item.details || "").trim();
          if (!details || openMeetingNotes.has(details)) {
            return false;
          }
        }
        return true;
      })
      .map((item) => ({
        kind: "feed" as const,
        id: item.id,
        sortAt: item.occurredAt ? new Date(item.occurredAt).getTime() : 0,
        item,
      }));

    return [...openEntries, ...feedEntries].sort((a, b) => b.sortAt - a.sortAt);
  }, [activities, followUps]);

  const { page, pageSize, setPage, setPageSize, pageItems, total } =
    useLeadListPagination(timeline);

  const isLoading =
    Boolean(loading && activities.length === 0) ||
    Boolean(followUpsLoading && followUps.length === 0 && activities.length === 0);

  return (
    <LeadSectionCard title="Activities">
      {isLoading ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">Loading activities…</p>
      ) : timeline.length === 0 ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">
          No activities recorded for this lead yet.
        </p>
      ) : (
        <>
          <ol className="m-0 grid min-w-0 list-none gap-0 p-0">
            {pageItems.map((entry, index) => {
              if (entry.kind === "open-follow-up") {
                const item = entry.followUp;
                const isMeeting = item.type === "Meeting";
                const title = isMeeting ? "Meeting added" : "Follow-up added";
                const iconKind = isMeeting ? "meeting" : "follow-up";
                const addedAt =
                  formatDisplayDateTime(item.createdAt) ||
                  formatDisplayDateTime(item.dueAt) ||
                  item.due;
                const scheduledAt =
                  formatDisplayDateTime(item.dueAt) || item.due;
                return (
                  <li
                    key={entry.id}
                    className="relative flex min-w-0 gap-3 border-b border-[#eef3f8] py-3 last:border-b-0 dark:border-border-subtle"
                  >
                    <ActivityTypeIcon kind={iconKind} />
                    {index < pageItems.length - 1 ? (
                      <span className="absolute top-10 bottom-[-6px] left-[15px] w-px bg-[#e6eef6] dark:bg-border-subtle" />
                    ) : null}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 max-w-2xl flex-1">
                          <p className="m-0 break-words text-[0.95rem] font-semibold text-[#17324f] dark:text-text-strong">
                            {title}
                          </p>
                          <p className="mt-1 mb-0 text-[0.78rem] text-[#8b97a8]">
                            {item.type}
                            {item.purpose ? ` · ${item.purpose}` : ""}
                            {item.nextAction ? ` · ${item.nextAction}` : ""}
                          </p>
                          {isMeeting && scheduledAt ? (
                            <p className="mt-1 mb-0 text-[0.82rem] text-[#5b6b7c]">
                              Scheduled for {scheduledAt}
                            </p>
                          ) : null}
                          {item.notes ? (
                            <p className="mt-1 mb-0 whitespace-pre-wrap break-words text-[0.82rem] text-[#5b6b7c]">
                              {item.notes}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
                          <time className="text-[0.75rem] text-[#8b97a8]">
                            {isMeeting
                              ? addedAt
                              : formatDisplayDateTime(item.dueAt) || item.due}
                          </time>
                          <span className={activityBadgeClass(item.status)}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 mb-0 text-[0.75rem] text-[#8b97a8]">
                        {item.ownerName
                          ? `Assigned to ${item.ownerName}`
                          : "Unassigned"}
                        {item.priority ? ` · ${item.priority} priority` : ""}
                      </p>
                      {canEditFollowUp ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <PrimaryButton
                            type="button"
                            size="sm"
                            onClick={() => onCompleteFollowUp?.(item)}
                            label="Complete"
                          />
                          <PrimaryButton
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onRescheduleFollowUp?.(item)}
                            label="Reschedule"
                          />
                          <PrimaryButton
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onCancelFollowUp?.(item)}
                            label="Cancel"
                          />
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              }

              const item = entry.item;
              const title = activityTitle(
                item.action,
                item.details,
                item.outcome,
                item.actionKey,
                item.metadata,
              );
              const iconKind = activityIconKind(
                title,
                item.actionKey,
                item.category,
              );
              const isStatusChange =
                item.category === "status" ||
                (item.actionKey || "").toUpperCase().includes("STATUS") ||
                (item.actionKey || "").toUpperCase() === "LEAD_CLOSED" ||
                (item.actionKey || "").toUpperCase() === "LEAD_REOPENED" ||
                title.toLowerCase().includes("status");

              return (
                <li
                  key={entry.id}
                  className="relative flex min-w-0 gap-3 border-b border-[#eef3f8] py-3 last:border-b-0 dark:border-border-subtle"
                >
                  <ActivityTypeIcon kind={iconKind} />
                  {index < pageItems.length - 1 ? (
                    <span className="absolute top-10 bottom-[-6px] left-[15px] w-px bg-[#e6eef6] dark:bg-border-subtle" />
                  ) : null}
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0 max-w-2xl flex-1">
                        <p className="m-0 break-words text-[0.95rem] font-semibold text-[#17324f] dark:text-text-strong">
                          {title}
                        </p>
                        {item.outcome &&
                        !title.toLowerCase().includes(item.outcome.toLowerCase()) &&
                        !isStatusChange ? (
                          <p className="mt-1 mb-0 text-[0.82rem] text-[#5b6b7c]">
                            {item.outcome}
                          </p>
                        ) : null}
                        {isStatusChange ? (
                          <StatusChangeRemark item={item} />
                        ) : item.details ? (
                          <p className="mt-1 mb-0 whitespace-pre-wrap break-words text-[0.82rem] text-[#5b6b7c]">
                            {item.details}
                          </p>
                        ) : null}
                        <p className="mt-1 mb-0 text-[0.75rem] text-[#8b97a8]">
                          {isStatusChange
                            ? item.user?.fullName
                              ? `Changed by ${item.user.fullName}`
                              : "Changed by System"
                            : item.user?.fullName
                              ? `Performed by ${item.user.fullName}`
                              : "Performed by System"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
                        <time className="text-[0.75rem] text-[#8b97a8]">
                          {formatDisplayDateTime(item.occurredAt)}
                        </time>
                        {isStatusChange ? <StatusChangeBadges item={item} /> : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <LeadListPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </LeadSectionCard>
  );
}

export function LeadNotesPanel({
  notes,
  loading,
  canAdd,
  onAdd,
}: {
  notes: LeadNoteItem[];
  loading?: boolean;
  canAdd: boolean;
  onAdd: () => void;
}) {
  const { page, pageSize, setPage, setPageSize, pageItems, total } =
    useLeadListPagination(notes);

  return (
    <LeadSectionCard
      title="Note history"
      extra={
        canAdd ? (
          <PrimaryButton
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border-0 bg-transparent px-1.5 py-1 text-[0.82rem] font-medium text-primary hover:bg-hover-bg"
            onClick={onAdd}
            label="Add note"
          />
        ) : null
      }
    >
      {loading ? (
        <p className="m-0 text-[0.84rem] text-[#8b97a8]">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="m-0 text-[0.84rem] text-[#8b97a8]">
          No notes recorded for this lead yet.
        </p>
      ) : (
        <>
          <ol className="m-0 grid list-none gap-0 p-0">
            {pageItems.map((item, index) => (
              <li
                key={item.id}
                className="relative flex gap-3 border-b border-[#eef3f8] py-3 last:border-b-0 dark:border-border-subtle"
              >
                <span className="mt-1 size-3.5 shrink-0 rounded-full border-[3px] border-[#e7f8ef] bg-primary" />
                {index < pageItems.length - 1 ? (
                  <span className="absolute top-7 bottom-[-6px] left-[6px] w-px bg-[#e6eef6] dark:bg-border-subtle" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="m-0 min-w-0 whitespace-pre-wrap break-words text-[0.88rem] text-[#17324f] [overflow-wrap:anywhere] dark:text-text-strong">
                      {item.body}
                    </p>
                    <time className="shrink-0 text-[0.75rem] text-[#8b97a8]">
                      {formatDisplayDateTime(item.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 mb-0 text-[0.75rem] text-[#8b97a8]">
                    {item.createdBy?.name
                      ? `by ${item.createdBy.name}`
                      : "System"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <LeadListPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </LeadSectionCard>
  );
}

export function LeadServicesPanel({
  leadId,
  leadName,
  leadCode,
  canOffer,
}: {
  leadId: string;
  leadName: string;
  leadCode: string;
  canOffer: boolean;
}) {
  return (
    <LeadPackageOfferPanel
      leadId={leadId}
      leadName={leadName}
      leadCode={leadCode}
      canOffer={canOffer}
    />
  );
}

function paymentStatusColor(status: string) {
  if (status === "COMPLETED") return "success";
  if (status === "PENDING") return "gold";
  if (status === "FAILED") return "error";
  if (status === "CANCELLED" || status === "REVERSED") return "default";
  return "processing";
}

export function LeadPaymentsPanel({
  leadId,
  leadName,
  leadCode,
}: {
  leadId: string;
  leadName: string;
  leadCode: string;
}) {
  const dispatch = useAppDispatch();
  const { data, isFetching, isError } = useListLeadPaymentHistoryQuery(leadId);
  const [cancelPayment, { isLoading: cancelling }] = useCancelPaymentMutation();
  const [reversePayment, { isLoading: reversing }] = useReversePaymentMutation();
  const [generateReceipt, { isLoading: generating }] =
    useGeneratePaymentReceiptMutation();

  const [addOpen, setAddOpen] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [reasonPrompt, setReasonPrompt] = useState<{
    payment: PaymentRecord;
    action: "cancel" | "reverse";
  } | null>(null);
  const [reason, setReason] = useState("");
  const [followUpHint, setFollowUpHint] = useState(false);

  const payments = data?.payments || [];
  const summary = data?.summary;
  const permissions = data?.permissions;
  const { page, pageSize, setPage, setPageSize, pageItems, total } =
    useLeadListPagination(payments);

  useEffect(() => {
    if (!data?.leadStatusChanged) return;
    dispatch(
      baseApi.util.invalidateTags([
        { type: "Leads", id: leadId },
        "Activities",
      ]),
    );
  }, [data?.leadStatusChanged, dispatch, leadId]);

  async function confirmReason() {
    if (!reasonPrompt || !reason.trim()) {
      toast.error("Please provide a reason.");
      return;
    }
    try {
      const result =
        reasonPrompt.action === "cancel"
          ? await cancelPayment({
              paymentId: reasonPrompt.payment.id,
              reason: reason.trim(),
              leadId,
            }).unwrap()
          : await reversePayment({
              paymentId: reasonPrompt.payment.id,
              reason: reason.trim(),
              leadId,
            }).unwrap();
      toast.success(result.message);
      setReasonPrompt(null);
      setReason("");
    } catch (error) {
      toast.error(
        getApiError(
          error,
          reasonPrompt.action === "cancel"
            ? "Unable to cancel this payment."
            : "Unable to reverse this payment.",
        ),
      );
    }
  }

  async function onGenerateReceipt(payment: PaymentRecord) {
    try {
      const result = await generateReceipt({
        paymentId: payment.id,
        leadId,
      }).unwrap();
      toast.success(result.message);
      setReceiptId(result.receipt.id);
    } catch (error) {
      toast.error(getApiError(error, "Unable to generate receipt."));
    }
  }

  return (
    <LeadSectionCard
      title="Payment & Receipt"
      extra={
        permissions?.canRecordPayment && summary?.activeOffer ? (
          <PrimaryButton
            type="button"
            size="sm"
            label="Add Payment"
            icon={<HugeiconsIcon icon={Add01Icon} size={14} />}
            onClick={() => setAddOpen(true)}
          />
        ) : null
      }
    >
      {isFetching && !data ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">Loading payments…</p>
      ) : null}
      {isError ? (
        <p className="m-0 text-sm text-danger">
          Unable to load payment history.
        </p>
      ) : null}

      {summary && (payments.length > 0 || summary.activeOffer) ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-[#f8fafc] px-4 py-3 dark:bg-transparent">
            <p className="m-0 text-xs text-text-muted">Total Payable</p>
            <p className="m-0 mt-1 text-base font-semibold text-[#17324f] dark:text-text-strong">
              {formatMoney(summary.finalPayable)}
            </p>
          </div>
          <div className="rounded-xl bg-[#f8fafc] px-4 py-3 dark:bg-transparent">
            <p className="m-0 text-xs text-text-muted">Paid</p>
            <p className="m-0 mt-1 text-base font-semibold text-[#17324f] dark:text-text-strong">
              {formatMoney(summary.paidAmount)}
            </p>
          </div>
          <div className="rounded-xl bg-[#f8fafc] px-4 py-3 dark:bg-transparent">
            <p className="m-0 text-xs text-text-muted">Due</p>
            <p className="m-0 mt-1 text-base font-semibold text-[#17324f] dark:text-text-strong">
              {formatMoney(summary.dueAmount)}
            </p>
          </div>
          <div className="rounded-xl bg-[#f8fafc] px-4 py-3 dark:bg-transparent">
            <p className="m-0 text-xs text-text-muted">Status</p>
            <p className="m-0 mt-1 text-base font-semibold text-[#17324f] dark:text-text-strong">
              {summary.paymentStatus || "—"}
            </p>
          </div>
        </div>
      ) : null}

      {summary?.activeOffer ? (
        <p className="mb-3 mt-0 text-sm text-text-muted">
          Active offer V{summary.activeOffer.offerVersion}
          {summary.activeOffer.packageName
            ? ` · ${summary.activeOffer.packageName}`
            : ""}
          {" · "}
          {summary.activeOffer.status.replace(/_/g, " ")}
        </p>
      ) : null}

      {followUpHint ? (
        <p className="mb-3 mt-0 rounded-lg bg-[#fff7e6] px-3 py-2 text-sm text-[#8a6116]">
          Payment is still due. Create a Payment Follow-up from the Follow-ups
          tab to chase the remaining balance.
        </p>
      ) : null}

      {!isFetching && !isError && payments.length === 0 ? (
        <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-[#dbe4ee] bg-[#f8fafc] px-4 py-10 text-center dark:border-border dark:bg-transparent">
          <p className="m-0 text-[0.95rem] font-semibold text-[#17324f] dark:text-text-strong">
            No payments recorded
          </p>
          <p className="m-0 max-w-md text-[0.84rem] text-[#8b97a8]">
            Accept a service offer first, then use Add Payment to record partial
            or full collections and generate receipts.
          </p>
        </div>
      ) : null}

      {payments.length > 0 ? (
        <>
          <ul className="m-0 grid list-none gap-2 p-0">
            {pageItems.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e7eef5] bg-[#f8fafc] px-3.5 py-3 dark:border-border dark:bg-transparent"
              >
                <div className="min-w-0">
                  <p className="m-0 text-[0.9rem] font-medium text-[#17324f] dark:text-text-strong">
                    {payment.paymentNumber}
                    <span className="font-normal text-text-muted">
                      {" "}
                      · {payment.methodName}
                      {payment.receipt
                        ? ` · ${payment.receipt.receiptNumber}`
                        : ""}
                    </span>
                  </p>
                  <p className="m-0 mt-0.5 text-[0.75rem] text-[#8b97a8]">
                    {payment.paymentDate}
                    {payment.transactionRef
                      ? ` · Ref ${payment.transactionRef}`
                      : ""}
                    {` · Received by ${payment.receivedBy.fullName}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[#17324f] dark:text-text-strong">
                    {formatMoney(payment.amount)}
                  </span>
                  <Tag color={paymentStatusColor(payment.status)}>
                    {payment.status}
                  </Tag>
                  {payment.receipt && permissions?.canViewReceipt ? (
                    <PrimaryButton
                      type="button"
                      size="sm"
                      variant="outline"
                      label="View Receipt"
                      onClick={() => setReceiptId(payment.receipt!.id)}
                    />
                  ) : null}
                  {!payment.receipt &&
                  permissions?.canGenerateReceipt &&
                  (payment.status === "COMPLETED" ||
                    payment.status === "PENDING") ? (
                    <PrimaryButton
                      type="button"
                      size="sm"
                      variant="outline"
                      label="Generate Receipt"
                      loading={generating}
                      onClick={() => void onGenerateReceipt(payment)}
                    />
                  ) : null}
                  {permissions?.canCancelPayment &&
                  (payment.status === "COMPLETED" ||
                    payment.status === "PENDING") ? (
                    <PrimaryButton
                      type="button"
                      size="sm"
                      variant="outline"
                      label="Cancel"
                      onClick={() =>
                        setReasonPrompt({ payment, action: "cancel" })
                      }
                    />
                  ) : null}
                  {permissions?.canCancelPayment &&
                  payment.status === "COMPLETED" ? (
                    <PrimaryButton
                      type="button"
                      size="sm"
                      variant="outline"
                      label="Reverse"
                      onClick={() =>
                        setReasonPrompt({ payment, action: "reverse" })
                      }
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <LeadListPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      ) : null}

      {summary?.activeOffer ? (
        <AddPaymentModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          leadId={leadId}
          leadName={leadName}
          leadCode={leadCode}
          offerId={summary.activeOffer.id}
          offerLabel={`Offer V${summary.activeOffer.offerVersion}${summary.activeOffer.packageName ? ` · ${summary.activeOffer.packageName}` : ""}`}
          finalPayable={summary.finalPayable}
          previouslyPaid={summary.paidAmount}
          currentDue={summary.dueAmount}
          onSuccess={({ followUpOffered, receiptId: nextReceipt }) => {
            if (followUpOffered) setFollowUpHint(true);
            if (nextReceipt) setReceiptId(nextReceipt);
          }}
        />
      ) : null}

      <ReceiptViewModal
        open={Boolean(receiptId)}
        receiptId={receiptId}
        onClose={() => setReceiptId(null)}
      />

      <Modal
        open={Boolean(reasonPrompt)}
        title={
          reasonPrompt?.action === "cancel"
            ? "Cancel payment"
            : "Reverse payment"
        }
        onCancel={() => {
          setReasonPrompt(null);
          setReason("");
        }}
        onOk={() => void confirmReason()}
        okText={reasonPrompt?.action === "cancel" ? "Cancel payment" : "Reverse"}
        confirmLoading={cancelling || reversing}
        destroyOnHidden
      >
        <p className="mt-0 text-sm text-text-muted">
          {reasonPrompt?.payment.paymentNumber} ·{" "}
          {formatMoney(reasonPrompt?.payment.amount || 0)}
        </p>
        <Input.TextArea
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason (required)"
          maxLength={500}
        />
      </Modal>
    </LeadSectionCard>
  );
}

export function LeadAssignmentHistoryPanel({
  assignmentHistory,
  loading,
}: {
  assignmentHistory: LeadAssignmentHistoryItem[];
  loading?: boolean;
}) {
  const { page, pageSize, setPage, setPageSize, pageItems, total } =
    useLeadListPagination(assignmentHistory);

  return (
    <LeadSectionCard title="Assignment History">
      {loading ? (
        <p className="m-0 text-[0.84rem] text-[#8b97a8]">
          Loading assignment history…
        </p>
      ) : assignmentHistory.length === 0 ? (
        <p className="m-0 text-[0.84rem] text-[#8b97a8]">
          No assignment records yet.
        </p>
      ) : (
        <>
          <ol className="m-0 grid list-none gap-3 p-0">
            {pageItems.map((item) => (
              <li
                key={item.id}
                className="border-b border-[#eef3f8] pb-3 last:border-0 last:pb-0 dark:border-border-subtle"
              >
                <p className="m-0 text-[0.86rem] font-medium text-[#17324f] dark:text-text-strong">
                  {item.fromOwner?.name || "Unassigned"} →{" "}
                  {item.toOwner?.name || "Lead Pool"}
                </p>
                <p className="m-0 mt-0.5 text-[0.75rem] text-[#8b97a8]">
                  {formatDisplayDateTime(item.createdAt)}
                  {item.assignedBy?.name
                    ? ` · Assigned by ${item.assignedBy.name}`
                    : ""}
                </p>
                {item.kind === "HANDOVER" ? (
                  <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-primary">
                    Handover
                  </p>
                ) : null}
                {item.kind === "HANDOVER" && item.handoverNote ? (
                  <HandoverNoteLines note={item.handoverNote} />
                ) : item.reason ? (
                  <p className="m-0 mt-0.5 text-[0.78rem] text-[#5b6b7c]">
                    Remarks: {item.reason}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
          <LeadListPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </LeadSectionCard>
  );
}

/** @deprecated Status history now surfaces via Timeline; kept for compatibility */
export function LeadHistoryPanel({
  statusHistory,
  assignmentHistory,
}: {
  statusHistory: LeadStatusHistoryItem[];
  assignmentHistory: LeadAssignmentHistoryItem[];
}) {
  return (
    <div className="grid gap-4">
      <LeadSectionCard title="Status History">
        {statusHistory.length === 0 ? (
          <p className="m-0 text-[0.84rem] text-[#8b97a8]">
            No status changes recorded yet.
          </p>
        ) : (
          <ol className="m-0 grid list-none gap-3 p-0">
            {statusHistory.map((item) => (
              <li
                key={item.id}
                className="border-b border-[#eef3f8] pb-3 last:border-0 last:pb-0 dark:border-border-subtle"
              >
                <p className="m-0 text-[0.86rem] font-medium text-[#17324f] dark:text-text-strong">
                  {item.previousStatus || "—"} → {item.newStatus}
                </p>
                <p className="m-0 mt-0.5 text-[0.75rem] text-[#8b97a8]">
                  {formatDisplayDateTime(item.createdAt)}
                  {item.updatedBy?.name ? ` · ${item.updatedBy.name}` : ""}
                </p>
                {item.lostReason ? (
                  <p className="m-0 mt-0.5 text-[0.75rem] text-[#8b97a8]">
                    Lost reason: {item.lostReason}
                  </p>
                ) : null}
                {item.closeReason ? (
                  <p className="m-0 mt-0.5 text-[0.75rem] text-[#8b97a8]">
                    Close reason: {item.closeReason}
                  </p>
                ) : null}
                {item.remarks ? (
                  <p className="m-0 mt-0.5 text-[0.78rem] text-[#5b6b7c]">
                    {item.remarks}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </LeadSectionCard>

      <LeadAssignmentHistoryPanel assignmentHistory={assignmentHistory} />
    </div>
  );
}

function HandoverNoteLines({ note }: { note: LeadHandoverNote }) {
  const lines = [
    note.studentRequirement ? `Requirement: ${note.studentRequirement}` : "",
    note.preferredCountry ? `Country: ${note.preferredCountry}` : "",
    note.preferredIntake ? `Intake: ${note.preferredIntake}` : "",
    note.academicBackground ? `Academic: ${note.academicBackground}` : "",
    note.conversationSummary ? `Conversation: ${note.conversationSummary}` : "",
    note.importantConcern ? `Concern: ${note.importantConcern}` : "",
  ].filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <ul className="m-0 mt-1 grid list-none gap-0.5 p-0 text-[0.75rem] text-[#5b6b7c]">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

export function LeadMoreTabShell({
  active,
  onChange,
  visibleKeys,
  children,
}: {
  active: LeadMoreTabKey;
  onChange: (key: LeadMoreTabKey) => void;
  visibleKeys: LeadMoreTabKey[];
  children: ReactNode;
}) {
  const tabs = LEAD_MORE_TABS.filter((item) => visibleKeys.includes(item.key));

  return (
    <div className="grid min-w-0 max-w-full gap-4 overflow-hidden rounded-2xl border border-[#e7eef5] bg-surface shadow-[0_10px_28px_rgba(22,50,79,0.035)] md:grid-cols-[200px_minmax(0,1fr)] dark:border-border">
      <nav className="flex gap-1 overflow-x-auto border-b border-[#eef3f8] p-3 md:flex-col md:overflow-x-visible md:border-r md:border-b-0 dark:border-border-subtle">
        {tabs.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-current={isActive ? "page" : undefined}
              className={`shrink-0 cursor-pointer rounded-lg border-0 px-3 py-2.5 text-left text-[0.86rem] transition-colors ${
                isActive
                  ? "bg-section-tab-active-bg font-semibold text-section-tab-active-fg"
                  : "bg-transparent text-[#3d5166] hover:bg-section-tab-bg dark:text-text"
              }`}
              onClick={() => onChange(item.key)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="min-w-0 max-w-full overflow-hidden p-4">{children}</div>
    </div>
  );
}
