import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Popconfirm, Tag } from "antd";
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
  useListLeadPaymentsQuery,
  useRecordOfferInstallmentPaymentMutation,
  type LeadPaymentItem,
} from "@/modules/packages/api/packagesApi";
import { formatMoney } from "@/modules/packages/utils/offerCalculator";
import type {
  LeadAssignmentHistoryItem,
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LeadDocumentsPanel({
  documents,
  loading,
  canUpload,
  canDelete,
  onAdd,
  onView,
  onDelete,
}: {
  documents: LeadDocumentItem[];
  loading?: boolean;
  canUpload: boolean;
  canDelete: boolean;
  onAdd: () => void;
  onView: (document: LeadDocumentItem) => void;
  onDelete: (document: LeadDocumentItem) => void;
}) {
  return (
    <LeadSectionCard
      title="Documents"
      extra={
        canUpload ? (
          <PrimaryButton
            type="button"
            size="sm"
            label="Add document"
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
        ) : null
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
            No documents uploaded
          </p>
          <p className="m-0 max-w-md text-[0.84rem] text-[#8b97a8]">
            Passport, academic certificates, and language test reports will
            appear here once they are attached to this lead.
          </p>
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-[#e7eef5] bg-[#f8fafc] px-3.5 py-3 dark:border-border dark:bg-transparent"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))] text-primary">
                <HugeiconsIcon
                  icon={File01Icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={1.7}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[0.9rem] font-semibold text-[#17324f] dark:text-text-strong">
                  {doc.fileName}
                </p>
                <p className="m-0 mt-0.5 text-[0.75rem] text-[#8b97a8]">
                  {formatFileSize(doc.fileSize)}
                  {doc.uploadedBy?.name ? ` · ${doc.uploadedBy.name}` : ""}
                  {` · ${formatDisplayDateTime(doc.createdAt)}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
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
                {canDelete ? (
                  <PrimaryButton
                    type="button"
                    variant="danger"
                    size="sm"
                    className="!inline-flex !h-8 !w-8 !min-w-8 !items-center !justify-center !rounded-lg !p-0"
                    aria-label={`Delete ${doc.fileName}`}
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
      )}
    </LeadSectionCard>
  );
}

export function LeadCommunicationsPanel({
  items,
  loading,
}: {
  items: CommunicationEvent[];
  loading?: boolean;
}) {
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
        <ol className="m-0 grid min-w-0 list-none gap-0 p-0">
          {items.map((item, index) => {
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
                {index < items.length - 1 ? (
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
  return (
    <LeadSectionCard
      title="Activities"
      extra={
        canAdd ? (
          <PrimaryButton
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border-0 bg-transparent px-1.5 py-1 text-[0.82rem] font-medium text-primary hover:bg-hover-bg"
            onClick={onAdd}
            label="Add"
          />
        ) : null
      }
    >
      {activities.length === 0 ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">
          No activities recorded for this lead yet.
        </p>
      ) : (
        <ol className="m-0 grid min-w-0 list-none gap-0 p-0">
          {activities.map((item, index) => (
            <li
              key={item.id}
              className="relative flex min-w-0 gap-3 border-b border-[#eef3f8] py-3 last:border-b-0 dark:border-border-subtle"
            >
              <span className="mt-1 size-3.5 shrink-0 rounded-full border-[3px] border-[#e7f8ef] bg-primary" />
              {index < activities.length - 1 ? (
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
                  {item.user?.fullName ? `by ${item.user.fullName}` : "System"}
                </p>
              </div>
            </li>
          ))}
        </ol>
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
        <ol className="m-0 grid list-none gap-0 p-0">
          {notes.map((item, index) => (
            <li
              key={item.id}
              className="relative flex gap-3 border-b border-[#eef3f8] py-3 last:border-b-0 dark:border-border-subtle"
            >
              <span className="mt-1 size-3.5 shrink-0 rounded-full border-[3px] border-[#e7f8ef] bg-primary" />
              {index < notes.length - 1 ? (
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
      )}
    </LeadSectionCard>
  );
}

export function LeadServicesPanel({
  leadId,
  canOffer,
}: {
  leadId: string;
  canOffer: boolean;
}) {
  return <LeadPackageOfferPanel leadId={leadId} canOffer={canOffer} />;
}

function paymentDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export function LeadPaymentsPanel({ leadId }: { leadId: string }) {
  const dispatch = useAppDispatch();
  const { data, isFetching, isError } = useListLeadPaymentsQuery(leadId);
  const [recordPayment, { isLoading: paying }] =
    useRecordOfferInstallmentPaymentMutation();
  const [recordingId, setRecordingId] = useState<string | null>(null);

  const items = data?.items || [];
  const summary = data?.summary;
  const paidCount = items.filter((item) => item.status === "PAID").length;

  useEffect(() => {
    if (!data?.leadStatusChanged) return;
    dispatch(
      baseApi.util.invalidateTags([
        { type: "Leads", id: leadId },
        "Activities",
      ]),
    );
  }, [data?.leadStatusChanged, dispatch, leadId]);

  async function pay(item: LeadPaymentItem) {
    if (paying) return;
    setRecordingId(item.id);
    try {
      const result = await recordPayment({
        leadId,
        offerId: item.offerId,
        installmentId: item.id,
      }).unwrap();
      toast.success(result.message);
    } catch (error) {
      toast.error(
        getApiError(error, "Unable to record this payment. Please try again."),
      );
    } finally {
      setRecordingId(null);
    }
  }

  return (
    <LeadSectionCard title="Payment History">
      {isFetching && !data ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">Loading payments…</p>
      ) : null}
      {isError ? (
        <p className="m-0 text-sm text-danger">
          Unable to load payment history.
        </p>
      ) : null}

      {summary && (items.length > 0 || summary.activeOffer) ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[#f8fafc] px-4 py-3 dark:bg-transparent">
            <p className="m-0 text-xs text-text-muted">Offer total</p>
            <p className="m-0 mt-1 text-base font-semibold text-[#17324f] dark:text-text-strong">
              {formatMoney(summary.finalPayable)}
            </p>
          </div>
          <div className="rounded-xl bg-[#f8fafc] px-4 py-3 dark:bg-transparent">
            <p className="m-0 text-xs text-text-muted">Received</p>
            <p className="m-0 mt-1 text-base font-semibold text-[#17324f] dark:text-text-strong">
              {formatMoney(summary.paidAmount)}
            </p>
          </div>
          <div className="rounded-xl bg-[#f8fafc] px-4 py-3 dark:bg-transparent">
            <p className="m-0 text-xs text-text-muted">Outstanding</p>
            <p className="m-0 mt-1 text-base font-semibold text-[#17324f] dark:text-text-strong">
              {formatMoney(summary.dueAmount)}
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

      {!isFetching && !isError && items.length === 0 ? (
        <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-[#dbe4ee] bg-[#f8fafc] px-4 py-10 text-center dark:border-border dark:bg-transparent">
          <p className="m-0 text-[0.95rem] font-semibold text-[#17324f] dark:text-text-strong">
            No payments recorded
          </p>
          <p className="m-0 max-w-md text-[0.84rem] text-[#8b97a8]">
            Accept a service offer first. Payment installments then appear here
            so you can record collections.
          </p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="m-0 grid list-none gap-2 p-0">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e7eef5] bg-[#f8fafc] px-3.5 py-3 dark:border-border dark:bg-transparent"
            >
              <div className="min-w-0">
                <p className="m-0 text-[0.9rem] font-medium text-[#17324f] dark:text-text-strong">
                  {item.purpose}
                  <span className="font-normal text-text-muted">
                    {" "}
                    · Offer V{item.offerVersion}
                    {item.packageName ? ` · ${item.packageName}` : ""}
                  </span>
                </p>
                <p className="m-0 mt-0.5 text-[0.75rem] text-[#8b97a8]">
                  {item.status === "PAID"
                    ? `Received ${paymentDateTime(item.paidAt)}${item.paidBy ? ` by ${item.paidBy.fullName}` : ""}`
                    : item.dueDate
                      ? `Due ${item.dueDate}`
                      : "Awaiting payment"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[#17324f] dark:text-text-strong">
                  {formatMoney(item.amount)}
                </span>
                <Tag color={item.status === "PAID" ? "success" : "gold"}>
                  {item.status === "PAID" ? "Paid" : "Pending"}
                </Tag>
                {item.canRecord ? (
                  <Popconfirm
                    title="Record this payment as received?"
                    okText="Record Payment"
                    onConfirm={() => void pay(item)}
                  >
                    <PrimaryButton
                      type="button"
                      size="sm"
                      variant="outline"
                      label="Record Payment"
                      loading={paying && recordingId === item.id}
                    />
                  </Popconfirm>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {paidCount > 0 && items.some((item) => item.status === "PENDING") ? (
        <p className="mb-0 mt-3 text-xs text-text-muted">
          Partial collections stay listed until every installment is marked
          paid. Lead status moves to Converted after the first payment.
        </p>
      ) : null}
    </LeadSectionCard>
  );
}

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

      <LeadSectionCard title="Assignment History">
        {assignmentHistory.length === 0 ? (
          <p className="m-0 text-[0.84rem] text-[#8b97a8]">
            No assignment records yet.
          </p>
        ) : (
          <ol className="m-0 grid list-none gap-3 p-0">
            {assignmentHistory.map((item) => (
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
                  {item.assignedBy?.name ? ` · ${item.assignedBy.name}` : ""}
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
                    {item.reason}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </LeadSectionCard>
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
