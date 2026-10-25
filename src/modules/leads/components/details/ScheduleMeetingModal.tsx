import { useEffect, useMemo, useState, type ReactNode } from "react";
import { TimePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon } from "@hugeicons/core-free-icons";
import { PrimaryButton } from "@/components/ui";
import {
  FormDatePicker,
  FormInput,
  FormSelect,
  FormTextArea,
  InputError,
} from "@/components/common/Forms";
import { AntModal } from "@/components/common/Modals";
import { FOLLOW_UP_REMINDERS } from "@/modules/follow-ups/types";
import { stageBadgeClass } from "../../utils/leadDetails";

export const MEETING_TYPE_OPTIONS = [
  { value: "Counselling", label: "Counselling" },
  { value: "University Discussion", label: "University Discussion" },
  { value: "Document Collection", label: "Document Collection" },
  { value: "Site Survey", label: "Site Survey" },
  { value: "Payment Discussion", label: "Payment Discussion" },
  { value: "Other", label: "Other" },
];

export const MEETING_MODE_OPTIONS = [
  { value: "Offline", label: "Offline" },
  { value: "Online", label: "Online" },
  { value: "Hybrid", label: "Hybrid" },
];

export type ScheduleMeetingPayload = {
  title: string;
  type: string;
  mode: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  agenda: string;
  reminder: string;
  rescheduleReason?: string;
};

export type ScheduleMeetingInitialValues = Partial<ScheduleMeetingPayload> & {
  dueAt?: string | null;
  notes?: string | null;
  nextAction?: string | null;
};

function asSelectString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function statusBadgeClass(status: string) {
  if (status.trim().toLowerCase() === "interested") {
    return "bg-[#d9f5e5] text-[#128a56] dark:bg-emerald-600/20 dark:text-[#86efac]";
  }
  return stageBadgeClass(status);
}

function RequiredMark() {
  return <span className="text-[#ef4444]"> *</span>;
}

function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className="text-[0.84rem] font-semibold text-[#17324f] dark:text-text-strong">
      {children}
      {required ? <RequiredMark /> : null}
    </span>
  );
}

function lineValue(notes: string, prefix: string) {
  const line = notes
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().startsWith(prefix.toLowerCase()));
  if (!line) return "";
  return line.slice(prefix.length).trim();
}

export function parseMeetingNotes(notes?: string | null) {
  const text = (notes || "").trim();
  if (!text) {
    return {
      title: "",
      type: "",
      mode: "Offline",
      location: "",
      endTime: "",
      agenda: "",
    };
  }
  const lines = text.split("\n").map((item) => item.trim()).filter(Boolean);
  const firstLine = lines[0] || "";
  const looksLikeMeta =
    firstLine.toLowerCase().startsWith("type:") ||
    firstLine.toLowerCase().startsWith("mode:") ||
    firstLine.toLowerCase().startsWith("location:") ||
    firstLine.toLowerCase().startsWith("agenda:");

  return {
    title: looksLikeMeta ? "" : firstLine,
    type: lineValue(text, "Type:"),
    mode: lineValue(text, "Mode:") || "Offline",
    location: lineValue(text, "Location:"),
    endTime: lineValue(text, "End:"),
    agenda: lineValue(text, "Agenda:"),
  };
}

export function buildMeetingNotes(payload: ScheduleMeetingPayload) {
  return [
    payload.title,
    `Type: ${payload.type}`,
    `Mode: ${payload.mode}`,
    payload.location ? `Location: ${payload.location}` : "",
    payload.endTime ? `End: ${payload.endTime}` : "",
    payload.agenda ? `Agenda: ${payload.agenda}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function meetingStartIso(payload: ScheduleMeetingPayload) {
  if (payload.date && payload.startTime) {
    return dayjs(`${payload.date}T${payload.startTime}:00`).toISOString();
  }
  if (payload.date) {
    return dayjs(`${payload.date}T09:00:00`).toISOString();
  }
  return "";
}

export default function ScheduleMeetingModal({
  open,
  saving,
  mode = "schedule",
  leadName,
  leadCode,
  leadStatus,
  currentDueAt,
  initialValues,
  onClose,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  mode?: "schedule" | "reschedule";
  leadName?: string;
  leadCode?: string | null;
  leadStatus?: string | null;
  currentDueAt?: string | null;
  initialValues?: ScheduleMeetingInitialValues | null;
  onClose: () => void;
  onSubmit: (payload: ScheduleMeetingPayload) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState("");
  const [meetingMode, setMeetingMode] = useState("Offline");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingStart, setMeetingStart] = useState<Dayjs | null>(null);
  const [meetingEnd, setMeetingEnd] = useState<Dayjs | null>(null);
  const [location, setLocation] = useState("");
  const [agenda, setAgenda] = useState("");
  const [reminder, setReminder] = useState("30 Minutes Before");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isReschedule = mode === "reschedule";
  const locationLabel =
    meetingMode === "Online" ? "Meeting Link / Platform" : "Location";
  const locationPlaceholder =
    meetingMode === "Online"
      ? "e.g. Zoom link or Google Meet"
      : "Address or venue";

  const seed = useMemo(() => {
    if (!initialValues) return null;
    const parsed = parseMeetingNotes(initialValues.notes);
    const due = initialValues.dueAt ? dayjs(initialValues.dueAt) : null;
    const endFromNotes = initialValues.endTime || parsed.endTime;
    return {
      title: initialValues.title || parsed.title || initialValues.nextAction || "",
      type: initialValues.type || parsed.type || "",
      mode: initialValues.mode || parsed.mode || "Offline",
      date:
        initialValues.date ||
        (due?.isValid() ? due.format("YYYY-MM-DD") : ""),
      startTime:
        initialValues.startTime ||
        (due?.isValid() ? due.format("HH:mm") : ""),
      endTime: endFromNotes || "",
      location: initialValues.location || parsed.location || "",
      agenda:
        initialValues.agenda ||
        parsed.agenda ||
        initialValues.nextAction ||
        "",
      reminder: initialValues.reminder || "30 Minutes Before",
    };
  }, [initialValues]);

  useEffect(() => {
    if (!open) return;
    setTitle(seed?.title || "");
    setMeetingType(seed?.type || "");
    setMeetingMode(seed?.mode || "Offline");
    setMeetingDate(seed?.date || "");
    setMeetingStart(
      seed?.startTime ? dayjs(`2000-01-01T${seed.startTime}:00`) : null,
    );
    setMeetingEnd(
      seed?.endTime ? dayjs(`2000-01-01T${seed.endTime}:00`) : null,
    );
    setLocation(seed?.location || "");
    setAgenda(seed?.agenda || "");
    setReminder(seed?.reminder || "30 Minutes Before");
    setRescheduleReason("");
    setErrors({});
  }, [open, seed]);

  function validate() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Meeting title is required.";
    if (!meetingType) next.meetingType = "Meeting type is required.";
    if (!meetingMode) next.meetingMode = "Mode is required.";
    if (!meetingDate) next.meetingDate = "Meeting date is required.";
    if (!meetingStart) next.meetingStart = "Start time is required.";
    if (!location.trim()) {
      next.location =
        meetingMode === "Online"
          ? "Meeting link or platform is required."
          : "Location is required.";
    }
    if (meetingStart && meetingEnd && meetingEnd.isBefore(meetingStart)) {
      next.meetingEnd = "End time must be after start time.";
    }
    if (isReschedule && !rescheduleReason.trim()) {
      next.rescheduleReason = "Please provide a reason for rescheduling.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    await onSubmit({
      title: title.trim(),
      type: meetingType,
      mode: meetingMode,
      date: meetingDate,
      startTime: meetingStart ? meetingStart.format("HH:mm") : "",
      endTime: meetingEnd ? meetingEnd.format("HH:mm") : "",
      location: location.trim(),
      agenda: agenda.trim(),
      reminder,
      rescheduleReason: isReschedule ? rescheduleReason.trim() : undefined,
    });
  }

  return (
    <AntModal
      open={open}
      onClose={onClose}
      title={isReschedule ? "Reschedule Meeting" : "Schedule Meeting"}
      width={640}
    >
      <div className="grid gap-3">
        {leadName ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-[#eef8f3] px-3.5 py-2.5 text-[0.84rem] dark:bg-emerald-950/35">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#17324f] dark:text-text-strong">
              <HugeiconsIcon
                icon={UserIcon}
                size={16}
                color="#129a62"
                strokeWidth={1.8}
              />
              Lead: {leadName}
            </span>
            {leadCode ? (
              <>
                <span className="text-[#c5d5c9]">|</span>
                <span className="text-[#5b6b7c] dark:text-text">
                  Lead ID:{" "}
                  <span className="font-semibold text-[#17324f] dark:text-text-strong">
                    {leadCode}
                  </span>
                </span>
              </>
            ) : null}
            {leadStatus ? (
              <>
                <span className="text-[#c5d5c9]">|</span>
                <span className="inline-flex items-center gap-2 text-[#5b6b7c] dark:text-text">
                  Current Status:
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold ${statusBadgeClass(leadStatus)}`}
                  >
                    {leadStatus}
                  </span>
                </span>
              </>
            ) : null}
            {isReschedule && currentDueAt ? (
              <>
                <span className="text-[#c5d5c9]">|</span>
                <span className="text-[#5b6b7c] dark:text-text">
                  Current:{" "}
                  <span className="font-semibold text-[#17324f] dark:text-text-strong">
                    {dayjs(currentDueAt).format("DD MMM YYYY, hh:mm A")}
                  </span>
                </span>
              </>
            ) : null}
          </div>
        ) : null}

        <label className="grid gap-1">
          <FieldLabel required>Meeting Title</FieldLabel>
          <FormInput
            value={title}
            placeholder="e.g. Site survey discussion"
            onChange={(event) => {
              setTitle(event.target.value);
              setErrors((current) => ({ ...current, title: "" }));
            }}
          />
          {errors.title ? <InputError>{errors.title}</InputError> : null}
        </label>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <label className="grid gap-1">
            <FieldLabel required>Meeting Type</FieldLabel>
            <FormSelect
              showSearch
              optionFilterProp="label"
              placeholder="Select type"
              value={meetingType || undefined}
              options={MEETING_TYPE_OPTIONS}
              onChange={(value) => {
                setMeetingType(asSelectString(value));
                setErrors((current) => ({ ...current, meetingType: "" }));
              }}
            />
            {errors.meetingType ? (
              <InputError>{errors.meetingType}</InputError>
            ) : null}
          </label>

          <label className="grid gap-1">
            <FieldLabel required>Mode</FieldLabel>
            <FormSelect
              placeholder="Select mode"
              value={meetingMode || undefined}
              options={MEETING_MODE_OPTIONS}
              onChange={(value) => {
                setMeetingMode(asSelectString(value) || "Offline");
                setErrors((current) => ({ ...current, meetingMode: "" }));
              }}
            />
            {errors.meetingMode ? (
              <InputError>{errors.meetingMode}</InputError>
            ) : null}
          </label>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          <label className="grid gap-1">
            <FieldLabel required>Date</FieldLabel>
            <FormDatePicker
              className="w-full"
              format="DD MMM YYYY"
              placeholder="Select date"
              value={meetingDate ? dayjs(meetingDate) : null}
              disabledDate={(current) =>
                Boolean(current && current < dayjs().startOf("day"))
              }
              onChange={(value) => {
                setMeetingDate(value ? value.format("YYYY-MM-DD") : "");
                setErrors((current) => ({ ...current, meetingDate: "" }));
              }}
            />
            {errors.meetingDate ? (
              <InputError>{errors.meetingDate}</InputError>
            ) : null}
          </label>

          <label className="grid gap-1">
            <FieldLabel required>Start Time</FieldLabel>
            <TimePicker
              className="w-full"
              size="large"
              format="hh:mm A"
              needConfirm={false}
              placeholder="Select time"
              value={meetingStart}
              onChange={(value) => {
                setMeetingStart(value);
                setErrors((current) => ({ ...current, meetingStart: "" }));
              }}
            />
            {errors.meetingStart ? (
              <InputError>{errors.meetingStart}</InputError>
            ) : null}
          </label>

          <label className="grid gap-1">
            <span className="text-[0.84rem] font-semibold text-[#17324f] dark:text-text-strong">
              End Time{" "}
              <span className="font-normal text-[#8b97a8]">(optional)</span>
            </span>
            <TimePicker
              className="w-full"
              size="large"
              format="hh:mm A"
              needConfirm={false}
              placeholder="Select time"
              value={meetingEnd}
              onChange={(value) => {
                setMeetingEnd(value);
                setErrors((current) => ({ ...current, meetingEnd: "" }));
              }}
            />
            {errors.meetingEnd ? (
              <InputError>{errors.meetingEnd}</InputError>
            ) : null}
          </label>
        </div>

        <label className="grid gap-1">
          <FieldLabel required>{locationLabel}</FieldLabel>
          <FormInput
            value={location}
            placeholder={locationPlaceholder}
            onChange={(event) => {
              setLocation(event.target.value);
              setErrors((current) => ({ ...current, location: "" }));
            }}
          />
          {errors.location ? <InputError>{errors.location}</InputError> : null}
        </label>

        <label className="grid gap-1">
          <span className="text-[0.84rem] font-semibold text-[#17324f] dark:text-text-strong">
            Agenda
          </span>
          <FormTextArea
            autoSize={{ minRows: 2, maxRows: 5 }}
            value={agenda}
            placeholder="Topics to cover..."
            onChange={(event) => setAgenda(event.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <FieldLabel>Reminder</FieldLabel>
          <FormSelect
            value={reminder}
            options={FOLLOW_UP_REMINDERS.map((value) => ({
              value,
              label: value,
            }))}
            onChange={(value) =>
              setReminder(asSelectString(value) || "No Reminder")
            }
          />
        </label>

        {isReschedule ? (
          <label className="grid gap-1">
            <FieldLabel required>Reschedule Reason</FieldLabel>
            <FormTextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              value={rescheduleReason}
              placeholder="Why is this meeting being moved?"
              onChange={(event) => {
                setRescheduleReason(event.target.value);
                setErrors((current) => ({
                  ...current,
                  rescheduleReason: "",
                }));
              }}
            />
            {errors.rescheduleReason ? (
              <InputError>{errors.rescheduleReason}</InputError>
            ) : null}
          </label>
        ) : null}

        <div className="mt-1 flex justify-end gap-2">
          <PrimaryButton
            type="button"
            variant="outline"
            onClick={onClose}
            label="Cancel"
          />
          <PrimaryButton
            type="button"
            loading={saving}
            onClick={() => void handleSubmit()}
            label={isReschedule ? "Reschedule Meeting" : "Schedule Meeting"}
          />
        </div>
      </div>
    </AntModal>
  );
}
