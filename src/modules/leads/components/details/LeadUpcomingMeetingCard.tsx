import dayjs from "dayjs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Location01Icon,
  Video01Icon,
} from "@hugeicons/core-free-icons";
import { PrimaryButton } from "@/components/ui";
import { parseMeetingNotes } from "./ScheduleMeetingModal";

export type UpcomingMeetingInfo = {
  id: string;
  dueAt: string | null;
  notes: string | null;
  nextAction: string | null;
  reminder?: string | null;
  status?: string | null;
};

function formatStamp(value?: string | null) {
  if (!value) return "";
  const date = dayjs(value);
  if (!date.isValid()) return "";
  return date.format("MMM D, YYYY • h:mm A");
}

export default function LeadUpcomingMeetingCard({
  meeting,
  canEdit,
  compact = false,
  onReschedule,
  onCancel,
}: {
  meeting: UpcomingMeetingInfo | null;
  canEdit?: boolean;
  compact?: boolean;
  onReschedule?: () => void;
  onCancel?: () => void;
}) {
  if (!meeting) {
    return (
      <div className="flex min-w-0 flex-col justify-center rounded-xl border border-[#dbe8f4] bg-[#f7fbff] px-2 py-2 sm:px-2.5 sm:py-1.5 dark:border-border dark:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]">
        <p className="m-0 flex items-center gap-1 text-[0.7rem] font-semibold text-[#1b3a57] sm:text-[0.75rem] dark:text-text-strong">
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-primary">
            <HugeiconsIcon
              icon={Video01Icon}
              size={11}
              color="currentColor"
              strokeWidth={1.8}
            />
          </span>
          <span className="min-w-0 truncate">Upcoming Meeting</span>
        </p>
        <p className="mt-1.5 mb-0 text-center text-[0.7rem] text-[#8b97a8] sm:mt-1 sm:text-[0.75rem]">
          No meeting scheduled
        </p>
      </div>
    );
  }

  const parsed = parseMeetingNotes(meeting.notes);
  const title = parsed.title || meeting.nextAction || "Scheduled meeting";
  const when = formatStamp(meeting.dueAt);
  const meta = [parsed.type, parsed.mode].filter(Boolean).join(" · ");

  if (compact) {
    return (
      <div className="flex min-w-0 flex-col justify-center rounded-xl border border-[#dbe8f4] bg-[#f7fbff] px-2 py-2 transition-colors duration-300 sm:px-2.5 sm:py-1.5 dark:border-border dark:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]">
        <p className="m-0 flex items-center gap-1 text-[0.7rem] font-semibold text-[#1b3a57] sm:text-[0.75rem] dark:text-text-strong">
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-primary">
            <HugeiconsIcon
              icon={Video01Icon}
              size={11}
              color="currentColor"
              strokeWidth={1.8}
            />
          </span>
          <span className="min-w-0 truncate">Upcoming Meeting</span>
        </p>

        <p className="mt-1 mb-0 truncate text-center text-[0.72rem] font-semibold leading-tight text-[#1b3a57] sm:text-[0.8rem] dark:text-text-strong">
          {title}
          {meta ? (
            <span className="font-normal text-[#8b97a8]"> · {meta}</span>
          ) : null}
        </p>

        {when || parsed.location ? (
          <p className="mt-1 mb-0 flex w-full items-center justify-center gap-1 text-[0.72rem] font-medium text-[#3d5166] dark:text-text">
            {when ? (
              <>
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  size={12}
                  color="var(--color-primary)"
                  strokeWidth={1.7}
                />
                <span className="min-w-0 truncate">{when}</span>
              </>
            ) : null}
            {when && parsed.location ? (
              <span className="text-[#c5ced8]">·</span>
            ) : null}
            {parsed.location ? (
              <>
                <HugeiconsIcon
                  icon={
                    parsed.mode === "Online" ? Video01Icon : Location01Icon
                  }
                  size={12}
                  color="currentColor"
                  strokeWidth={1.7}
                />
                <span className="min-w-0 truncate">{parsed.location}</span>
              </>
            ) : null}
          </p>
        ) : null}

        {canEdit && onCancel && onReschedule ? (
          <div className="mt-1.5 flex items-center justify-center gap-1.5">
            <PrimaryButton
              type="button"
              size="sm"
              variant="outline"
              onClick={onCancel}
              label="Cancel"
            />
            <PrimaryButton
              type="button"
              size="sm"
              variant="primary"
              onClick={onReschedule}
              label="Reschedule"
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-[#dbe8f4] bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_72%)] p-4 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border dark:bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary">
            <HugeiconsIcon
              icon={Video01Icon}
              size={18}
              color="currentColor"
              strokeWidth={1.7}
            />
          </span>
          <div className="min-w-0">
            <p className="m-0 text-[0.78rem] font-semibold uppercase tracking-[0.04em] text-primary">
              Upcoming Meeting
            </p>
            <h3 className="mt-1 mb-0 text-[1.05rem] font-semibold text-[#17324f] dark:text-text-strong">
              {title}
            </h3>
            {meta ? (
              <p className="mt-1 mb-0 text-[0.84rem] text-[#8b97a8]">{meta}</p>
            ) : null}
          </div>
        </div>

        {canEdit && onCancel && onReschedule ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <PrimaryButton
              type="button"
              size="sm"
              variant="outline"
              onClick={onCancel}
              label="Cancel"
            />
            <PrimaryButton
              type="button"
              size="sm"
              variant="primary"
              onClick={onReschedule}
              label="Reschedule"
            />
          </div>
        ) : null}
      </div>

      {when ? (
        <p className="mt-3 mb-0 flex items-center gap-2 text-[0.88rem] text-[#3d5166] dark:text-text">
          <HugeiconsIcon
            icon={Calendar03Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.7}
          />
          <span className="min-w-0">{when}</span>
        </p>
      ) : null}
    </section>
  );
}
