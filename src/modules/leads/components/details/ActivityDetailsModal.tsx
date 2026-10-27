import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { AntModal } from "@/components/common/Modals";
import { PrimaryButton } from "@/components/ui";
import type { ActivityFeedItem } from "@/types";
import { parseMeetingNotes } from "./ScheduleMeetingModal";
import {
  followUpCountdownParts,
  formatDisplayDateTime,
  type FollowUpCountdownUrgency,
} from "../../utils/leadDetails";
import { statusClass } from "@/lib/statusClass";

export type ActivityDetails = {
  kind: "meeting" | "follow-up" | "status" | "activity";
  title: string;
  status?: string | null;
  scheduledAt?: string | null;
  dueAt?: string | null;
  addedAt?: string | null;
  assignedTo?: string | null;
  priority?: string | null;
  type?: string | null;
  purpose?: string | null;
  nextAction?: string | null;
  notes?: string | null;
  reminder?: string | null;
  outcome?: string | null;
  completedAt?: string | null;
  completedByName?: string | null;
  cancelledAt?: string | null;
  cancelledByName?: string | null;
  cancelReason?: string | null;
  meetingTitle?: string | null;
  meetingType?: string | null;
  mode?: string | null;
  location?: string | null;
  endTime?: string | null;
  agenda?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  channels?: string | null;
};

export function readStatusLabels(item: ActivityFeedItem) {
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

export function statusChangeRemark(item: ActivityFeedItem) {
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

export function isStatusChangeActivity(
  item: Pick<ActivityFeedItem, "category" | "actionKey">,
  title = "",
) {
  const key = (item.actionKey || "").toUpperCase();
  const label = title.toLowerCase();
  return (
    item.category === "status" ||
    key.includes("STATUS") ||
    key === "LEAD_CLOSED" ||
    key === "LEAD_REOPENED" ||
    label.includes("status") ||
    label === "lead closed" ||
    label === "lead reopened"
  );
}

function channelsLabel(item: ActivityFeedItem) {
  const raw = item.metadata?.channels;
  if (Array.isArray(raw)) {
    return raw
      .map((value) => String(value).trim())
      .filter(Boolean)
      .join(", ");
  }
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  const remark = statusChangeRemark(item);
  const match = remark.match(/Channel:\s*(.+)$/im);
  return match?.[1]?.trim() || "";
}

export type FollowUpDetailSource = {
  type: string;
  dueAt?: string | null;
  due?: string | null;
  status?: string | null;
  notes?: string | null;
  priority?: string | null;
  purpose?: string | null;
  purposeOther?: string | null;
  nextAction?: string | null;
  reminder?: string | null;
  outcome?: string | null;
  ownerName?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
  completedByName?: string | null;
  cancelledAt?: string | null;
  cancelledByName?: string | null;
  cancelReason?: string | null;
};

function purposeLabel(item: FollowUpDetailSource) {
  if (item.purpose === "Other" && item.purposeOther?.trim()) {
    return item.purposeOther.trim();
  }
  return item.purpose;
}

export function activityDetailFromFollowUp(
  item: FollowUpDetailSource,
): ActivityDetails {
  const isMeeting = item.type === "Meeting";
  const meeting = isMeeting ? parseMeetingNotes(item.notes) : null;
  const structured =
    meeting &&
    Boolean(
      meeting.title ||
        meeting.type ||
        meeting.location ||
        meeting.agenda ||
        meeting.endTime,
    );

  return {
    kind: isMeeting ? "meeting" : "follow-up",
    title: isMeeting ? "Meeting" : item.type || "Follow-up",
    status: item.status,
    scheduledAt: formatDisplayDateTime(item.dueAt) || item.due || null,
    dueAt: item.dueAt || null,
    addedAt: formatDisplayDateTime(item.createdAt) || null,
    assignedTo: item.ownerName,
    priority: item.priority,
    type: isMeeting ? null : item.type,
    purpose: isMeeting ? null : purposeLabel(item),
    nextAction: item.nextAction,
    notes: structured ? null : item.notes,
    reminder: item.reminder === "No Reminder" ? null : item.reminder,
    outcome: item.outcome,
    completedAt: formatDisplayDateTime(item.completedAt) || null,
    completedByName: item.completedByName,
    cancelledAt: formatDisplayDateTime(item.cancelledAt) || null,
    cancelledByName: item.cancelledByName,
    cancelReason: item.cancelReason,
    meetingTitle: meeting?.title || null,
    meetingType: meeting?.type || null,
    mode: isMeeting ? meeting?.mode || null : null,
    location: meeting?.location || null,
    endTime: meeting?.endTime || null,
    agenda: meeting?.agenda || null,
  };
}

export function activityDetailFromFeed(
  item: ActivityFeedItem,
  title: string,
): ActivityDetails {
  const label = title.toLowerCase();
  const occurredAt = formatDisplayDateTime(item.occurredAt) || null;

  if (isStatusChangeActivity(item, title)) {
    const { previous, next } = readStatusLabels(item);
    return {
      kind: "status",
      title,
      previousStatus: previous || null,
      newStatus: next || null,
      assignedTo: item.user?.fullName || "System",
      addedAt: occurredAt,
      outcome: item.outcome,
      notes: statusChangeRemark(item) || item.details || null,
      channels: channelsLabel(item) || null,
    };
  }

  const isMeeting = label.includes("meeting");
  const isFollowUp =
    label.includes("follow-up") || label.includes("follow up");
  const meeting = isMeeting ? parseMeetingNotes(item.details) : null;
  const structured =
    meeting &&
    Boolean(
      meeting.title ||
        meeting.type ||
        meeting.location ||
        meeting.agenda ||
        meeting.endTime,
    );

  if (isMeeting || isFollowUp) {
    return {
      kind: isMeeting ? "meeting" : "follow-up",
      title,
      scheduledAt: occurredAt,
      assignedTo: item.user?.fullName || null,
      outcome: item.outcome,
      notes: structured ? null : item.details,
      meetingTitle: meeting?.title || null,
      meetingType: meeting?.type || null,
      mode: isMeeting ? meeting?.mode || null : null,
      location: meeting?.location || null,
      endTime: meeting?.endTime || null,
      agenda: meeting?.agenda || null,
    };
  }

  return {
    kind: "activity",
    title,
    addedAt: occurredAt,
    assignedTo: item.user?.fullName || "System",
    outcome: item.outcome,
    notes: item.details || null,
  };
}

const OPEN_FOLLOW_UP = new Set(["Pending", "Due Soon", "Overdue"]);

const SCHEDULE_BADGE: Record<FollowUpCountdownUrgency, string> = {
  safe: "bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary",
  soon: "bg-[color-mix(in_srgb,#f97316_14%,transparent)] text-[#ea580c]",
  overdue: "bg-[color-mix(in_srgb,#e11d48_12%,transparent)] text-[#e11d48]",
};

function scheduleBadgeClass(detail: ActivityDetails) {
  const open = !detail.status || OPEN_FOLLOW_UP.has(detail.status);
  if (!open || !detail.dueAt) return SCHEDULE_BADGE.safe;
  return SCHEDULE_BADGE[followUpCountdownParts(detail.dueAt)?.urgency ?? "safe"];
}

function DetailField({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string | null;
  wide?: boolean;
}) {
  const text = (value || "").trim();
  if (!text) return null;
  return (
    <div className={`grid min-w-0 gap-0.5 ${wide ? "col-span-full" : ""}`}>
      <dt className="text-[0.75rem] font-medium text-[#8b97a8]">{label}</dt>
      <dd className="m-0 min-w-0 whitespace-pre-wrap text-[0.9rem] text-[#17324f] [overflow-wrap:anywhere] dark:text-text-strong">
        {text}
      </dd>
    </div>
  );
}

export default function ActivityDetailsModal({
  open,
  detail,
  canAct = false,
  onClose,
  onComplete,
  onCancel,
  onReschedule,
}: {
  open: boolean;
  detail: ActivityDetails | null;
  canAct?: boolean;
  onClose: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
}) {
  const isMeeting = detail?.kind === "meeting";
  const isStatus = detail?.kind === "status";
  const isActivity = detail?.kind === "activity";
  const heading = isMeeting
    ? "Meeting details"
    : isStatus
      ? "Status change details"
      : isActivity
        ? "Activity details"
        : "Follow-up details";
  const actorLabel = isStatus ? "Changed by" : isActivity ? "Performed by" : "Assigned to";
  const actorFallback = isStatus || isActivity ? "System" : "Unassigned";

  return (
    <AntModal
      open={open}
      onClose={onClose}
      title={detail ? heading : "Activity details"}
      titleExtra={
        detail?.status ? (
          <span
            className={`${statusClass(detail.status).replace("rounded-full", "rounded-md")} px-2 py-0.5 text-[0.72rem] font-semibold`}
          >
            {detail.status}
          </span>
        ) : null
      }
      width={520}
    >
      {detail ? (
        <div className="grid min-w-0 gap-4 overflow-hidden">
          <div className="grid min-w-0 gap-2">
            <p className="m-0 min-w-0 text-[1rem] font-semibold text-[#17324f] [overflow-wrap:anywhere] dark:text-text-strong">
              {detail.title}
            </p>
            {isStatus && (detail.previousStatus || detail.newStatus) ? (
              <div className="flex max-w-full flex-wrap items-center gap-1.5">
                <span
                  className={`${statusClass(detail.previousStatus || "—").replace("rounded-full", "rounded-md")} px-2 py-0.5 text-[0.72rem] font-semibold`}
                >
                  {detail.previousStatus || "—"}
                </span>
                <span
                  className="text-[0.75rem] font-semibold text-[#8b97a8]"
                  aria-hidden
                >
                  →
                </span>
                <span
                  className={`${statusClass(detail.newStatus || "—").replace("rounded-full", "rounded-md")} px-2 py-0.5 text-[0.72rem] font-semibold`}
                >
                  {detail.newStatus || "—"}
                </span>
              </div>
            ) : null}
            {detail.scheduledAt ? (
              <span
                className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.82rem] font-bold ${scheduleBadgeClass(detail)}`}
              >
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={1.8}
                />
                {detail.scheduledAt}
              </span>
            ) : null}
          </div>
          <dl className="m-0 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3">
            <DetailField
              label={actorLabel}
              value={detail.assignedTo || actorFallback}
            />
            <DetailField label="Type" value={detail.type} />
            <DetailField label="Purpose" value={detail.purpose} />
            <DetailField label="Priority" value={detail.priority} />
            <DetailField label="Reminder" value={detail.reminder} />
            <DetailField label="Meeting type" value={detail.meetingType} />
            <DetailField label="Mode" value={detail.mode} />
            <DetailField label="End time" value={detail.endTime} />
            <DetailField
              label={isStatus || isActivity ? "When" : "Added"}
              value={detail.addedAt}
            />
            <DetailField label="Channel" value={detail.channels} />
            <DetailField label="Outcome" value={detail.outcome} />
            <DetailField label="Completed" value={detail.completedAt} />
            <DetailField label="Completed by" value={detail.completedByName} />
            <DetailField label="Cancelled" value={detail.cancelledAt} />
            <DetailField label="Cancelled by" value={detail.cancelledByName} />
            <DetailField wide label="Meeting title" value={detail.meetingTitle} />
            <DetailField wide label="Location" value={detail.location} />
            <DetailField wide label="Agenda" value={detail.agenda} />
            <DetailField wide label="Next action" value={detail.nextAction} />
            <DetailField
              wide
              label={isStatus ? "Remarks" : "Notes"}
              value={detail.notes}
            />
            <DetailField wide label="Cancel reason" value={detail.cancelReason} />
          </dl>
          {canAct ? (
            <div className="relative z-10 flex flex-wrap justify-end gap-2 border-t border-[#eef3f8] bg-surface pt-4 dark:border-border-subtle">
              <PrimaryButton
                type="button"
                size="sm"
                onClick={onComplete}
                label="Complete"
              />
              {onReschedule ? (
                <PrimaryButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onReschedule}
                  label="Reschedule"
                />
              ) : null}
              <PrimaryButton
                type="button"
                size="sm"
                variant="outline"
                onClick={onCancel}
                label="Cancel"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </AntModal>
  );
}
