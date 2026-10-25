import { AntModal } from "@/components/common/Modals";
import { PrimaryButton } from "@/components/ui";
import type { ActivityFeedItem } from "@/types";
import { parseMeetingNotes } from "./ScheduleMeetingModal";
import { formatDisplayDateTime } from "../../utils/leadDetails";
import { statusClass } from "@/lib/statusClass";

export type ActivityDetails = {
  kind: "meeting" | "follow-up";
  title: string;
  status?: string | null;
  scheduledAt?: string | null;
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
};

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
  const isMeeting = label.includes("meeting");
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

  return {
    kind: isMeeting ? "meeting" : "follow-up",
    title,
    scheduledAt: formatDisplayDateTime(item.occurredAt) || null,
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
  const heading = isMeeting ? "Meeting details" : "Follow-up details";

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
          <p className="m-0 min-w-0 text-[1rem] font-semibold text-[#17324f] [overflow-wrap:anywhere] dark:text-text-strong">
            {detail.title}
          </p>
          <dl className="m-0 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3">
            <DetailField label="Scheduled" value={detail.scheduledAt} />
            <DetailField
              label="Assigned to"
              value={detail.assignedTo || "Unassigned"}
            />
            <DetailField label="Type" value={detail.type} />
            <DetailField label="Purpose" value={detail.purpose} />
            <DetailField label="Priority" value={detail.priority} />
            <DetailField label="Reminder" value={detail.reminder} />
            <DetailField label="Meeting type" value={detail.meetingType} />
            <DetailField label="Mode" value={detail.mode} />
            <DetailField label="End time" value={detail.endTime} />
            <DetailField label="Added" value={detail.addedAt} />
            <DetailField label="Outcome" value={detail.outcome} />
            <DetailField label="Completed" value={detail.completedAt} />
            <DetailField label="Completed by" value={detail.completedByName} />
            <DetailField label="Cancelled" value={detail.cancelledAt} />
            <DetailField label="Cancelled by" value={detail.cancelledByName} />
            <DetailField wide label="Meeting title" value={detail.meetingTitle} />
            <DetailField wide label="Location" value={detail.location} />
            <DetailField wide label="Agenda" value={detail.agenda} />
            <DetailField wide label="Next action" value={detail.nextAction} />
            <DetailField wide label="Notes" value={detail.notes} />
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
