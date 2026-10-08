import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Input, Modal, Tag } from "antd";
import { toast } from "react-toastify";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  File01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { PrimaryButton } from "@/components/ui";
import { getApiError } from "@/lib/api";
import { statusClass } from "@/lib/statusClass";
import { useAppDispatch } from "@/redux";
import { baseApi } from "@/redux/api/baseApi";
import type { ActivityFeedItem } from "@/types";
import type { CommunicationEvent } from "@/modules/communications/types";
import { CHANNEL_LABELS, STATUS_LABELS } from "@/modules/communications/types";
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
  LeadDocumentChecklist,
  LeadDocumentItem,
  LeadHandoverNote,
  LeadNoteItem,
  LeadStatusHistoryItem,
} from "../../types";
import {
  activityTitle,
  formatDisplayDateTime,
  LEAD_MORE_TABS,
  type LeadMoreTabKey,
} from "../../utils/leadDetails";
import LeadPackageOfferPanel from "@/modules/packages/components/LeadPackageOfferPanel";
import LeadSectionCard from "./LeadSectionCard";
import {
  LeadListPagination,
  useLeadListPagination,
} from "./LeadListPagination";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LeadDocumentsPanel({
  documents,
  checklist,
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
  onCreateFollowUp,
}: {
  documents: LeadDocumentItem[];
  checklist?: LeadDocumentChecklist | null;
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
  onCreateFollowUp?: (typeCode: string, name: string) => void;
}) {
  const { page, pageSize, setPage, setPageSize, pageItems, total } =
    useLeadListPagination(documents);

  return (
    <div className="grid gap-4">
      {checklist ? (
        <LeadSectionCard title="Document Checklist">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 text-[0.84rem] text-[#8b97a8]">
              Completion: {checklist.completionPercent}% ({checklist.completedRequired}/
              {checklist.totalRequired})
            </p>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-[#e8eef5]">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${checklist.completionPercent}%` }}
              />
            </div>
          </div>
          <ul className="m-0 grid list-none gap-2 p-0">
            {checklist.items.map((item) => (
              <li
                key={item.typeCode}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e7eef5] px-3 py-2.5 dark:border-border"
              >
                <span className="text-[0.95rem]">{item.completed ? "☑" : "☐"}</span>
                <span className="min-w-0 flex-1 text-[0.9rem] font-medium text-[#17324f] dark:text-text-strong">
                  {item.name}
                </span>
                <Tag className="m-0">{item.checklistStatus}</Tag>
                {item.checklistStatus === "Missing" && canUpload ? (
                  <PrimaryButton
                    type="button"
                    size="sm"
                    variant="outline"
                    label="Upload"
                    onClick={() => onUploadMissing?.(item.typeCode)}
                  />
                ) : null}
                {item.checklistStatus === "Missing" && onCreateFollowUp ? (
                  <PrimaryButton
                    type="button"
                    size="sm"
                    variant="outline"
                    label="Create Follow-up"
                    onClick={() => onCreateFollowUp(item.typeCode, item.name)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </LeadSectionCard>
      ) : null}

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
          <p className="m-0 text-[0.88rem] text-[#8b97a8]">Loading documents…</p>
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
            <div className="mb-2 hidden grid-cols-[1.1fr_1.4fr_0.8fr_auto] gap-3 px-1 text-[0.75rem] font-semibold uppercase tracking-wide text-[#8b97a8] md:grid">
              <span>Category</span>
              <span>Document</span>
              <span>Status</span>
              <span />
            </div>
            <ul className="m-0 grid list-none gap-2 p-0">
              {pageItems.map((doc) => (
                <li
                  key={doc.id}
                  className="grid items-center gap-3 rounded-xl border border-[#e7eef5] bg-[#f8fafc] px-3.5 py-3 dark:border-border dark:bg-transparent md:grid-cols-[1.1fr_1.4fr_0.8fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[0.9rem] font-semibold text-[#17324f] dark:text-text-strong">
                      {doc.typeCode || doc.categoryCode || "Document"}
                    </p>
                    <p className="m-0 mt-0.5 text-[0.75rem] text-[#8b97a8]">
                      {doc.categoryCode}
                      {doc.versionNumber ? ` · v${doc.versionNumber}` : ""}
                      {doc.isSensitive ? " · Sensitive" : ""}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[0.9rem] font-medium text-[#17324f] dark:text-text-strong">
                      {doc.name || doc.fileName}
                    </p>
                    <p className="m-0 mt-0.5 truncate text-[0.75rem] text-[#8b97a8]">
                      {doc.fileName}
                      {` · ${formatFileSize(doc.fileSize)}`}
                      {doc.uploadedBy?.name
                        ? ` · ${doc.uploadedBy.name}`
                        : ""}
                      {` · ${formatDisplayDateTime(doc.createdAt)}`}
                    </p>
                  </div>
                  <div>
                    <Tag className={`m-0 ${statusClass(doc.statusLabel || doc.status || "Pending")}`}>
                      {doc.statusLabel || doc.status || "Pending"}
                    </Tag>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 justify-self-end">
                    {doc.canPreview !== false ? (
                      <PrimaryButton
                        type="button"
                        variant="outline"
                        size="sm"
                        className="!inline-flex !h-8 !w-8 !min-w-8 !items-center !justify-center !rounded-lg !border-border !bg-surface !p-0 !text-primary hover:!border-primary hover:!text-primary"
                        aria-label={`View ${doc.fileName}`}
                        onClick={() => onView(doc)}
                        icon={
                          <HugeiconsIcon
                            icon={ViewIcon}
                            size={15}
                            color="currentColor"
                            strokeWidth={1.8}
                          />
                        }
                      />
                    ) : null}
                    {canVerify && doc.status === "PENDING" && !showArchived ? (
                      <PrimaryButton
                        type="button"
                        size="sm"
                        variant="outline"
                        label="Review"
                        onClick={() => onVerify(doc)}
                      />
                    ) : null}
                    {canUpload &&
                    (doc.status === "REJECTED" || doc.status === "EXPIRED") &&
                    !showArchived ? (
                      <PrimaryButton
                        type="button"
                        size="sm"
                        variant="outline"
                        label="Upload New Version"
                        onClick={() => onUploadMissing?.(doc.typeCode)}
                      />
                    ) : null}
                    {canDelete && !showArchived ? (
                      <PrimaryButton
                        type="button"
                        variant="danger"
                        size="sm"
                        className="!inline-flex !h-8 !w-8 !min-w-8 !items-center !justify-center !rounded-lg !p-0"
                        aria-label={`Archive ${doc.fileName}`}
                        onClick={() => onDelete(doc)}
                        icon={
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            size={15}
                            color="currentColor"
                            strokeWidth={1.8}
                          />
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
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <p className="m-0 min-w-0 break-all text-[0.9rem] font-semibold text-[#17324f] dark:text-text-strong">
                      {activityTitle(item.action, item.details, item.outcome)}
                    </p>
                    <time className="shrink-0 text-[0.75rem] text-[#8b97a8]">
                      {formatDisplayDateTime(item.occurredAt)}
                    </time>
                  </div>
                  {item.details ? (
                    <p className="mt-1 mb-0 max-w-full whitespace-pre-wrap break-all text-[0.82rem] text-[#5b6b7c]">
                      {item.details}
                    </p>
                  ) : null}
                  <p className="mt-1 mb-0 text-[0.75rem] text-[#8b97a8]">
                    {item.user?.fullName
                      ? `Performed by ${item.user.fullName}`
                      : "Performed by System"}
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

export function LeadActivitiesPanel({
  activities,
  onAdd,
  canAdd,
}: {
  activities: ActivityFeedItem[];
  onAdd: () => void;
  canAdd: boolean;
}) {
  const items = activities.filter((item) => item.source === "activity");
  const { page, pageSize, setPage, setPageSize, pageItems, total } =
    useLeadListPagination(items);

  return (
    <LeadSectionCard
      title="Activities"
      extra={
        canAdd ? (
          <PrimaryButton
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border-0 bg-transparent px-1.5 py-1 text-[0.82rem] font-medium text-primary hover:bg-hover-bg"
            onClick={onAdd}
            label="Add activity"
          />
        ) : null
      }
    >
      {items.length === 0 ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">
          No activities recorded for this lead yet.
        </p>
      ) : (
        <>
          <ol className="m-0 grid min-w-0 list-none gap-0 p-0">
            {pageItems.map((item, index) => (
              <li
                key={item.id}
                className="relative flex min-w-0 gap-3 border-b border-[#eef3f8] py-3 last:border-b-0 dark:border-border-subtle"
              >
                <span className="mt-1 size-3.5 shrink-0 rounded-full border-[3px] border-[#e7f8ef] bg-primary" />
                {index < pageItems.length - 1 ? (
                  <span className="absolute top-7 bottom-[-6px] left-[6px] w-px bg-[#e6eef6] dark:bg-border-subtle" />
                ) : null}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="m-0 text-[0.72rem] font-medium uppercase tracking-wide text-[#8b97a8]">
                        {item.action || item.category}
                      </p>
                      <p className="m-0 min-w-0 break-all text-[0.9rem] font-semibold text-[#17324f] dark:text-text-strong">
                        {activityTitle(item.action, item.details, item.outcome)}
                      </p>
                    </div>
                    <time className="shrink-0 text-[0.75rem] text-[#8b97a8]">
                      {formatDisplayDateTime(item.occurredAt)}
                    </time>
                  </div>
                  {item.outcome ? (
                    <p className="mt-1 mb-0 text-[0.82rem] text-[#5b6b7c]">
                      Outcome: {item.outcome}
                    </p>
                  ) : null}
                  {item.details ? (
                    <p className="mt-1 mb-0 max-w-full whitespace-pre-wrap break-all text-[0.82rem] text-[#5b6b7c]">
                      {item.details}
                    </p>
                  ) : null}
                  <p className="mt-1 mb-0 text-[0.75rem] text-[#8b97a8]">
                    {item.user?.fullName
                      ? `Performed by ${item.user.fullName}`
                      : "Performed by System"}
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
