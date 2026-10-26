import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, Video01Icon } from "@hugeicons/core-free-icons";
import {
  followUpCountdownParts,
  type FollowUpCountdownUrgency,
} from "../../utils/leadDetails";
import { parseMeetingNotes } from "./ScheduleMeetingModal";

export type UpcomingMeetingInfo = {
  id: string;
  dueAt: string | null;
  notes: string | null;
  nextAction: string | null;
  reminder?: string | null;
  status?: string | null;
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatStamp(value?: string | null) {
  if (!value) return "";
  const date = dayjs(value);
  if (!date.isValid()) return "";
  return date.format("MMM D, YYYY • h:mm A");
}

const COUNTDOWN_TONES: Record<
  FollowUpCountdownUrgency,
  {
    card: string;
    iconWrap: string;
    iconColor: string;
    unitLabel: string;
    calendarColor: string;
    status: string;
  }
> = {
  safe: {
    card: "border-[#d8f0e3] bg-[#f3fbf7] dark:border-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] dark:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
    iconWrap:
      "bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-primary",
    iconColor: "currentColor",
    unitLabel: "text-primary",
    calendarColor: "var(--color-primary)",
    status: "",
  },
  soon: {
    card: "border-[#fed7aa] bg-[#fff7ed] dark:border-[color-mix(in_srgb,#f97316_35%,transparent)] dark:bg-[color-mix(in_srgb,#f97316_12%,transparent)]",
    iconWrap: "bg-[color-mix(in_srgb,#f97316_16%,transparent)] text-[#ea580c]",
    iconColor: "currentColor",
    unitLabel: "text-[#ea580c]",
    calendarColor: "#ea580c",
    status: "text-[#c2410c]",
  },
  overdue: {
    card: "border-[#fecdd3] bg-[#fff1f2] dark:border-[color-mix(in_srgb,#e11d48_35%,transparent)] dark:bg-[color-mix(in_srgb,#e11d48_12%,transparent)]",
    iconWrap: "bg-[color-mix(in_srgb,#e11d48_14%,transparent)] text-[#e11d48]",
    iconColor: "currentColor",
    unitLabel: "text-[#e11d48]",
    calendarColor: "#e11d48",
    status: "text-[#e11d48]",
  },
};

export default function LeadUpcomingMeetingCard({
  meeting,
  compact = false,
  onClick,
}: {
  meeting: UpcomingMeetingInfo | null;
  compact?: boolean;
  onClick?: () => void;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!meeting?.dueAt) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [meeting?.dueAt]);

  const countdown = followUpCountdownParts(meeting?.dueAt);
  const tone = COUNTDOWN_TONES[countdown?.urgency ?? "safe"];
  const clickable = Boolean(meeting && onClick);

  if (!meeting) {
    return (
      <div
        className={`flex min-w-0 flex-col justify-center rounded-xl border px-2 py-2 sm:px-2.5 sm:py-1.5 ${tone.card}`}
      >
        <p className="m-0 flex items-center gap-1 text-[0.7rem] font-semibold text-[#1b3a57] sm:text-[0.75rem] dark:text-text-strong">
          <span
            className={`grid size-5 shrink-0 place-items-center rounded-full ${tone.iconWrap}`}
          >
            <HugeiconsIcon
              icon={Video01Icon}
              size={11}
              color={tone.iconColor}
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
    const compactClass = `flex min-w-0 flex-col justify-center rounded-xl border px-2 py-2 transition-colors duration-300 sm:px-2.5 sm:py-1.5 ${tone.card}`;
    const body = (
      <>
        <p className="m-0 flex items-center gap-1 text-[0.7rem] font-semibold text-[#1b3a57] sm:text-[0.75rem] dark:text-text-strong">
          <span
            className={`grid size-5 shrink-0 place-items-center rounded-full ${tone.iconWrap}`}
          >
            <HugeiconsIcon
              icon={Video01Icon}
              size={11}
              color={tone.iconColor}
              strokeWidth={1.8}
            />
          </span>
          <span className="min-w-0 truncate">Upcoming Meeting</span>
          {countdown?.urgency === "overdue" ? (
            <span
              className={`ml-auto shrink-0 text-[0.58rem] font-medium sm:text-[0.62rem] ${tone.status}`}
            >
              Overdue
            </span>
          ) : countdown?.urgency === "soon" ? (
            <span
              className={`ml-auto shrink-0 text-[0.58rem] font-medium sm:text-[0.62rem] ${tone.status}`}
            >
              Due soon
            </span>
          ) : null}
        </p>

        {countdown ? (
          <>
            <div className="mt-1.5 flex items-start justify-center gap-0.5 text-center sm:mt-1 sm:gap-1">
              <CountdownUnit
                value={pad2(countdown.days)}
                label="Days"
                labelClass={tone.unitLabel}
              />
              <CountdownSep />
              <CountdownUnit
                value={pad2(countdown.hours)}
                label="Hours"
                labelClass={tone.unitLabel}
              />
              <CountdownSep />
              <CountdownUnit
                value={pad2(countdown.mins)}
                label="Mins"
                labelClass={tone.unitLabel}
              />
              <CountdownSep />
              <CountdownUnit
                value={pad2(countdown.secs)}
                label="Secs"
                labelClass={tone.unitLabel}
              />
            </div>
            <p className="mt-1 mb-0 flex w-full items-center justify-center gap-1 text-[0.68rem] font-semibold text-[#3d5166] sm:text-[0.75rem] dark:text-text">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={12}
                color={tone.calendarColor}
                strokeWidth={1.7}
              />
              <span className="min-w-0 truncate">{when}</span>
            </p>
          </>
        ) : (
          <p className="mt-1.5 mb-0 text-center text-[0.7rem] text-[#8b97a8] sm:mt-1 sm:text-[0.75rem]">
            {title}
          </p>
        )}
      </>
    );

    if (clickable) {
      return (
        <button
          type="button"
          onClick={onClick}
          aria-label="View meeting details"
          className={`${compactClass} w-full cursor-pointer text-left font-[inherit] hover:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
        >
          {body}
        </button>
      );
    }

    return <div className={compactClass}>{body}</div>;
  }

  const wideClass =
    "w-full rounded-2xl border border-[#dbe8f4] bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_72%)] p-4 text-left font-[inherit] shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border dark:bg-surface";
  const wideBody = (
    <>
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
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="View meeting details"
        className={`${wideClass} cursor-pointer hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
      >
        {wideBody}
      </button>
    );
  }

  return <section className={wideClass}>{wideBody}</section>;
}

function CountdownSep() {
  return (
    <span
      className="pt-0.5 text-[0.8rem] font-bold leading-none text-[#1b3a57] sm:text-[0.9rem] dark:text-text-strong"
      aria-hidden
    >
      :
    </span>
  );
}

function CountdownUnit({
  value,
  label,
  labelClass = "text-primary",
}: {
  value: string;
  label: string;
  labelClass?: string;
}) {
  return (
    <div className="min-w-[24px] sm:min-w-[30px]">
      <p className="m-0 text-[0.88rem] font-bold tabular-nums leading-none tracking-tight text-[#1b3a57] sm:text-[1rem] dark:text-text-strong">
        {value}
      </p>
      <p
        className={`m-0 mt-px text-[0.52rem] font-medium sm:text-[0.58rem] ${labelClass}`}
      >
        {label}
      </p>
    </div>
  );
}
