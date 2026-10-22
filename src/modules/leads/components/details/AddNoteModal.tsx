import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal } from "antd";
import dayjs from "dayjs";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import { Calendar03Icon, Video01Icon } from "@hugeicons/core-free-icons";
import { PrimaryButton } from "@/components/ui";
import {
  FormDatePicker,
  FormInput,
  FormSelect,
  FormSwitch,
  FormTextArea,
  InputError,
} from "@/components/common/Forms";
import { AntModal } from "@/components/common/Modals";
import { useListMasterDataOptionsQuery } from "@/redux/features/masterData/masterDataApi";
import { FOLLOW_UP_TYPES } from "@/modules/follow-ups/types";
import type { LeadRecord } from "../../types";
import { MEETING_TYPE_OPTIONS } from "./ScheduleMeetingModal";

export type AddNoteSavedState = {
  note: boolean;
  followUp: boolean;
  meeting: boolean;
};

export class AddNotePartialError extends Error {
  saved: AddNoteSavedState;

  constructor(saved: AddNoteSavedState) {
    super("Note save completed only in part.");
    this.name = "AddNotePartialError";
    this.saved = saved;
  }
}

export type AddNoteFollowUpPayload = {
  type: string;
  dueAt: string;
  assigneeId: string;
  nextAction: string;
  reminder: string;
};

export type AddNoteMeetingPayload = {
  title: string;
  type: string;
  mode: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  link: string;
  agenda: string;
  reminder: string;
};

export type AddNoteSubmitPayload = {
  channelCode: string | null;
  channelLabel: string | null;
  activityType: string;
  notes: string;
  committed: AddNoteSavedState;
  followUp: AddNoteFollowUpPayload | null;
  meeting: AddNoteMeetingPayload | null;
};

type ChannelOption = {
  id: string;
  code: string;
  label: string;
  activityType: string;
};

const FALLBACK_CHANNELS: ChannelOption[] = [
  { id: "CALL", code: "CALL", label: "Call", activityType: "CALL" },
  {
    id: "WHATSAPP",
    code: "WHATSAPP",
    label: "WhatsApp",
    activityType: "WHATSAPP",
  },
  { id: "EMAIL", code: "EMAIL", label: "Email", activityType: "EMAIL" },
  { id: "SMS", code: "SMS", label: "SMS", activityType: "SMS" },
  {
    id: "IN_PERSON",
    code: "IN_PERSON",
    label: "In-person",
    activityType: "MEETING",
  },
  { id: "OTHER", code: "OTHER", label: "Other", activityType: "OTHER" },
];

const FOLLOW_UP_TYPE_OPTIONS = FOLLOW_UP_TYPES.filter(
  (value) => value !== "Meeting",
);
const NOTE_MEETING_MODES = [
  { value: "Offline", label: "Offline" },
  { value: "Online", label: "Online" },
];

function extraText(
  extras: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = extras?.[key];
  return typeof value === "string" ? value : "";
}

function asSelectString(value: unknown) {
  return typeof value === "string" ? value : "";
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

function ScheduleSection({
  id,
  title,
  description,
  icon,
  open,
  saved,
  onToggle,
  children,
}: {
  id?: string;
  title: string;
  description: string;
  icon: IconSvgElement;
  open: boolean;
  saved: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`overflow-hidden rounded-2xl border transition-colors duration-500 ease-in-out ${
        open
          ? "border-primary bg-[color-mix(in_srgb,var(--color-primary)_4%,transparent)]"
          : "border-[#e6eef6] bg-surface dark:border-border"
      }`}
    >
      <div className="flex items-center gap-3 px-3.5 py-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left"
          aria-expanded={open}
          disabled={saved}
          onClick={() => onToggle(!open)}
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#e6eef6] bg-surface text-[#5b6b7c] dark:border-border">
            <HugeiconsIcon
              icon={icon}
              size={18}
              color="currentColor"
              strokeWidth={1.7}
            />
          </span>
          <span className="min-w-0">
            <span className="block text-[0.92rem] font-semibold text-[#17324f] dark:text-text-strong">
              {title}
            </span>
            <span className="mt-0.5 block text-[0.78rem] text-[#7a8796]">
              {saved ? "Saved with this note" : description}
            </span>
          </span>
        </button>
        <FormSwitch checked={open} disabled={saved} onChange={onToggle} />
      </div>
      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden" inert={!open}>
          <div
            className={`grid gap-3 border-t px-3.5 transition-[padding,border-color,opacity] duration-500 ease-in-out dark:border-border ${
              open
                ? "border-[#e7eef5] py-3.5 opacity-100"
                : "border-transparent py-0 opacity-0"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AddNoteModal({
  open,
  saving,
  lead,
  canScheduleFollowUp,
  canScheduleMeeting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  lead: LeadRecord | null;
  canScheduleFollowUp: boolean;
  canScheduleMeeting: boolean;
  onClose: () => void;
  onSubmit: (payload: AddNoteSubmitPayload) => Promise<void>;
}) {
  const [channel, setChannel] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpType, setFollowUpType] = useState("");
  const [followUpDue, setFollowUpDue] = useState("");
  const [followUpAgenda, setFollowUpAgenda] = useState("");
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingType, setMeetingType] = useState("");
  const [meetingMode, setMeetingMode] = useState("Offline");
  const [meetingWhen, setMeetingWhen] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [agenda, setAgenda] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [committed, setCommitted] = useState<AddNoteSavedState>({
    note: false,
    followUp: false,
    meeting: false,
  });

  const { data: channelData, isFetching: channelsLoading } =
    useListMasterDataOptionsQuery(
      { category: "CONVERSATION_CHANNEL" },
      { skip: !open },
    );
  const channelOptions = useMemo(() => {
    const items = channelData?.items || [];
    if (items.length === 0) return FALLBACK_CHANNELS;
    return items
      .map((item) => {
        const code = (item.code || item.name)
          .trim()
          .toUpperCase()
          .replace(/\s+/g, "_");
        const activityType = (
          extraText(item.extras, "activityType") ||
          code ||
          "OTHER"
        ).toUpperCase();
        return {
          id: item.id,
          code,
          label: item.name,
          activityType,
        } satisfies ChannelOption;
      })
      .filter((item) => item.code !== "NONE" && item.code !== "NOTE");
  }, [channelData?.items]);

  const selectedChannel =
    channelOptions.find((item) => item.code === channel) || null;
  const ownerId = lead?.owner?.id || "";
  const ownerName = lead?.owner?.name || "";

  const openFollowUp = lead?.nextFollowUp || null;
  const openFollowUpIsMeeting =
    (openFollowUp?.type || "").toLowerCase() === "meeting";
  const followUpIsPast =
    Boolean(followUpDue) &&
    dayjs(followUpDue).startOf("day").isBefore(dayjs().startOf("day"));
  const needsLocation = meetingMode === "Offline";
  const needsLink = meetingMode === "Online";
  const scheduling =
    (followUpOpen && !committed.followUp) ||
    (meetingOpen && !committed.meeting);
  const saveLabel =
    committed.note && scheduling
      ? "Finish scheduling"
      : scheduling
        ? "Save note and schedule"
        : "Save note";

  useEffect(() => {
    if (!open) return;
    setChannel(null);
    setNote("");
    setFollowUpOpen(false);
    setFollowUpType("");
    setFollowUpDue("");
    setFollowUpAgenda("");
    setMeetingOpen(false);
    setMeetingTitle("");
    setMeetingType("");
    setMeetingMode("Offline");
    setMeetingWhen("");
    setMeetingLocation("");
    setMeetingLink("");
    setAgenda("");
    setErrors({});
    setCommitted({ note: false, followUp: false, meeting: false });
  }, [open, lead?.id]);

  function clearError(key: string) {
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  function revealSection(id: string) {
    requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function openFollowUpSection(next: boolean) {
    setFollowUpOpen(next);
    if (!next) {
      setErrors((current) => ({
        ...current,
        followUpType: "",
        followUpDue: "",
        followUpAgenda: "",
      }));
      return;
    }
    revealSection("add-note-follow-up");
  }

  function openMeetingSection(next: boolean) {
    setMeetingOpen(next);
    if (!next) {
      setErrors((current) => ({
        ...current,
        meetingTitle: "",
        meetingType: "",
        meetingMode: "",
        meetingWhen: "",
        meetingLocation: "",
        meetingLink: "",
      }));
      return;
    }
    revealSection("add-note-meeting");
  }

  function selectChannel(code: string) {
    if (committed.note) return;
    setChannel(channel === code ? null : code);
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!committed.note && !note.trim()) {
      next.notes = "Write the note before saving.";
    }
    if (followUpOpen && !committed.followUp) {
      if (!followUpType) next.followUpType = "Follow-up type is required.";
      if (!followUpDue) next.followUpDue = "Follow-up date is required.";
      if (!followUpAgenda.trim()) next.followUpAgenda = "Agenda is required.";
    }
    if (meetingOpen && !committed.meeting) {
      if (!meetingType) next.meetingType = "Meeting type is required.";
      if (!meetingTitle.trim())
        next.meetingTitle = "Meeting title is required.";
      if (!meetingMode) next.meetingMode = "Meeting mode is required.";
      if (!meetingWhen) next.meetingWhen = "Meeting time is required.";
      else if (dayjs(meetingWhen).isBefore(dayjs())) {
        next.meetingWhen = "Meeting time must be now or later.";
      }
      if (needsLocation && !meetingLocation.trim()) {
        next.meetingLocation = "Location is required.";
      }
      if (needsLink && !meetingLink.trim()) {
        next.meetingLink = "Meeting link is required.";
      }
    }
    setErrors(next);
    const first = Object.keys(next).find((key) => next[key]);
    if (first) {
      requestAnimationFrame(() => {
        document.getElementById(`add-note-${first}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
    return !first;
  }

  function buildPayload(): AddNoteSubmitPayload {
    return {
      channelCode: channel,
      channelLabel: selectedChannel?.label || null,
      activityType: selectedChannel?.activityType || "NOTE",
      notes: note.trim(),
      committed,
      followUp:
        followUpOpen && !committed.followUp
          ? {
              type: followUpType,
              dueAt: followUpDue,
              assigneeId: ownerId,
              nextAction: followUpAgenda.trim(),
              reminder: "30 Minutes Before",
            }
          : null,
      meeting:
        meetingOpen && !committed.meeting
          ? {
              title: meetingTitle.trim(),
              type: meetingType,
              mode: meetingMode,
              date: meetingWhen ? dayjs(meetingWhen).format("YYYY-MM-DD") : "",
              startTime: meetingWhen ? dayjs(meetingWhen).format("HH:mm") : "",
              endTime: "",
              location: needsLocation ? meetingLocation.trim() : "",
              link: needsLink ? meetingLink.trim() : "",
              agenda: agenda.trim(),
              reminder: "30 Minutes Before",
            }
          : null,
    };
  }

  async function handleSave() {
    if (saving || !validate()) return;
    try {
      await onSubmit(buildPayload());
    } catch (error) {
      if (error instanceof AddNotePartialError) {
        setCommitted(error.saved);
        if (error.saved.followUp) setFollowUpOpen(true);
        if (error.saved.meeting) setMeetingOpen(true);
      }
    }
  }

  function requestClose() {
    if (saving) return;
    const dirty =
      !committed.note &&
      (note.trim().length > 0 ||
        Boolean(channel) ||
        followUpOpen ||
        meetingOpen);
    const unfinished =
      (followUpOpen && !committed.followUp) ||
      (meetingOpen && !committed.meeting);
    if (!dirty && !unfinished) {
      onClose();
      return;
    }
    Modal.confirm({
      title: committed.note ? "Close without finishing?" : "Discard this note?",
      content: committed.note
        ? "The note is already saved. Anything still open will not be scheduled."
        : "The note and any schedule details you entered will be lost.",
      okText: committed.note ? "Close" : "Discard",
      cancelText: "Keep editing",
      onOk: onClose,
    });
  }

  const leadName = lead?.name || "Lead";

  return (
    <AntModal
      open={open}
      onClose={requestClose}
      title="Add Note"
      width={680}
      styles={{ body: { paddingTop: 8 } }}
    >
      <div
        className="grid gap-4"
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            void handleSave();
          }
        }}
      >
        <p className="m-0 rounded-lg bg-[#f7fafc] px-3 py-2 text-sm text-[#3d5166] dark:bg-hover-bg dark:text-text">
          Lead: <span className="font-semibold">{leadName}</span>
          {lead?.code ? (
            <span className="text-[#8b97a8]"> · {lead.code}</span>
          ) : null}
        </p>

        {committed.note || committed.followUp || committed.meeting ? (
          <p className="m-0 rounded-lg border border-[#dcefe3] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] px-3 py-2 text-[0.82rem] text-[#17324f] dark:text-text-strong">
            Part of this note is already saved. Saving again only creates what
            is still missing.
          </p>
        ) : null}

        <div
          className={`grid gap-4 pr-1 ${
            followUpOpen || meetingOpen
              ? "max-h-[min(78vh,860px)] overflow-y-auto"
              : ""
          }`}
        >
          <section className="grid gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <FieldLabel>Communication Channel</FieldLabel>
              <span className="text-[0.75rem] text-[#8b97a8]">Optional</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {channelsLoading && channelOptions.length === 0 ? (
                <span className="text-[0.84rem] text-[#8b97a8]">
                  Loading channels…
                </span>
              ) : (
                channelOptions.map((option) => {
                  const selected = channel === option.code;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={committed.note}
                      onClick={() => selectChannel(option.code)}
                      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[0.82rem] font-medium transition disabled:cursor-default ${
                        selected
                          ? "border-primary bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary"
                          : "border-[#e6eef6] bg-surface text-[#3d5166] hover:border-primary/40 dark:border-border dark:text-text"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <label id="add-note-notes" className="grid gap-1.5">
            <FieldLabel required>Note</FieldLabel>
            <FormTextArea
              rows={4}
              className="!h-[104px] !min-h-[104px]"
              maxLength={500}
              showCount
              disabled={committed.note}
              value={note}
              placeholder="What happened with this lead?"
              onChange={(event) => {
                setNote(event.target.value);
                clearError("notes");
              }}
            />
            {errors.notes ? <InputError>{errors.notes}</InputError> : null}
          </label>

          {canScheduleFollowUp ? (
            <ScheduleSection
              id="add-note-follow-up"
              title="Schedule Follow-up"
              description="Plan the next contact with this lead."
              icon={Calendar03Icon}
              open={followUpOpen}
              saved={committed.followUp}
              onToggle={openFollowUpSection}
            >
              {openFollowUp && !openFollowUpIsMeeting && !committed.followUp ? (
                <p className="m-0 text-[0.78rem] text-[#c2410c] dark:text-[#fb923c]">
                  This lead already has an open follow-up. Saving a new one will
                  close it.
                </p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <label id="add-note-followUpType" className="grid gap-1">
                  <FieldLabel required>Follow-up type</FieldLabel>
                  <FormSelect
                    showSearch
                    optionFilterProp="label"
                    placeholder="Select type"
                    disabled={committed.followUp}
                    value={followUpType || undefined}
                    options={FOLLOW_UP_TYPE_OPTIONS.map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={(value) => {
                      setFollowUpType(asSelectString(value));
                      clearError("followUpType");
                    }}
                  />
                  {errors.followUpType ? (
                    <InputError>{errors.followUpType}</InputError>
                  ) : null}
                </label>
                <label id="add-note-followUpDue" className="grid gap-1">
                  <FieldLabel required>Follow-up date</FieldLabel>
                  <FormDatePicker
                    className="w-full"
                    format="DD MMM YYYY"
                    placeholder="Select date"
                    disabled={committed.followUp}
                    value={followUpDue ? dayjs(followUpDue) : null}
                    onChange={(value) => {
                      setFollowUpDue(
                        value
                          ? value
                              .hour(9)
                              .minute(0)
                              .second(0)
                              .millisecond(0)
                              .toISOString()
                          : "",
                      );
                      clearError("followUpDue");
                    }}
                  />
                  {followUpIsPast && !errors.followUpDue ? (
                    <span className="text-[0.75rem] text-[#c2410c] dark:text-[#fb923c]">
                      This date is in the past.
                    </span>
                  ) : null}
                  {errors.followUpDue ? (
                    <InputError>{errors.followUpDue}</InputError>
                  ) : null}
                </label>
              </div>
              <label id="add-note-followUpAgenda" className="grid gap-1">
                <FieldLabel required>Agenda</FieldLabel>
                <FormTextArea
                  rows={2}
                  maxLength={500}
                  disabled={committed.followUp}
                  value={followUpAgenda}
                  placeholder="What should happen on this follow-up?"
                  onChange={(event) => {
                    setFollowUpAgenda(event.target.value);
                    clearError("followUpAgenda");
                  }}
                />
                {errors.followUpAgenda ? (
                  <InputError>{errors.followUpAgenda}</InputError>
                ) : null}
              </label>
              <label className="grid gap-1">
                <FieldLabel>Assign to</FieldLabel>
                <FormInput
                  value={ownerName || "Lead owner"}
                  disabled
                  readOnly
                />
              </label>
            </ScheduleSection>
          ) : null}

          {canScheduleMeeting ? (
            <ScheduleSection
              id="add-note-meeting"
              title="Schedule Meeting"
              description="Arrange a counselling session or meeting."
              icon={Video01Icon}
              open={meetingOpen}
              saved={committed.meeting}
              onToggle={openMeetingSection}
            >
              {openFollowUp && openFollowUpIsMeeting && !committed.meeting ? (
                <p className="m-0 text-[0.78rem] text-[#c2410c] dark:text-[#fb923c]">
                  This lead already has an open meeting. Saving a new one will
                  close it.
                </p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <label id="add-note-meetingType" className="grid gap-1">
                  <FieldLabel required>Meeting type</FieldLabel>
                  <FormSelect
                    showSearch
                    optionFilterProp="label"
                    placeholder="Select type"
                    disabled={committed.meeting}
                    value={meetingType || undefined}
                    options={MEETING_TYPE_OPTIONS}
                    onChange={(value) => {
                      setMeetingType(asSelectString(value));
                      clearError("meetingType");
                    }}
                  />
                  {errors.meetingType ? (
                    <InputError>{errors.meetingType}</InputError>
                  ) : null}
                </label>
                <label id="add-note-meetingTitle" className="grid gap-1">
                  <FieldLabel required>Meeting title</FieldLabel>
                  <FormInput
                    value={meetingTitle}
                    disabled={committed.meeting}
                    placeholder="e.g. University shortlist discussion"
                    onChange={(event) => {
                      setMeetingTitle(event.target.value);
                      clearError("meetingTitle");
                    }}
                  />
                  {errors.meetingTitle ? (
                    <InputError>{errors.meetingTitle}</InputError>
                  ) : null}
                </label>
              </div>
              <label id="add-note-meetingMode" className="grid gap-1">
                <FieldLabel required>Meeting mode</FieldLabel>
                <FormSelect
                  placeholder="Select mode"
                  disabled={committed.meeting}
                  value={meetingMode || undefined}
                  options={NOTE_MEETING_MODES}
                  onChange={(value) => {
                    const mode = asSelectString(value) || "Offline";
                    setMeetingMode(mode);
                    if (mode === "Online") setMeetingLocation("");
                    if (mode === "Offline") setMeetingLink("");
                    clearError("meetingMode");
                    clearError("meetingLocation");
                    clearError("meetingLink");
                  }}
                />
                {errors.meetingMode ? (
                  <InputError>{errors.meetingMode}</InputError>
                ) : null}
              </label>
              {needsLink ? (
                <label id="add-note-meetingLink" className="grid gap-1">
                  <FieldLabel required>Meeting link</FieldLabel>
                  <FormInput
                    value={meetingLink}
                    disabled={committed.meeting}
                    placeholder="Zoom, Google Meet, or another link"
                    onChange={(event) => {
                      setMeetingLink(event.target.value);
                      clearError("meetingLink");
                    }}
                  />
                  {errors.meetingLink ? (
                    <InputError>{errors.meetingLink}</InputError>
                  ) : null}
                </label>
              ) : null}
              {needsLocation ? (
                <label id="add-note-meetingLocation" className="grid gap-1">
                  <FieldLabel required>Location</FieldLabel>
                  <FormInput
                    value={meetingLocation}
                    disabled={committed.meeting}
                    placeholder="Address or venue"
                    onChange={(event) => {
                      setMeetingLocation(event.target.value);
                      clearError("meetingLocation");
                    }}
                  />
                  {errors.meetingLocation ? (
                    <InputError>{errors.meetingLocation}</InputError>
                  ) : null}
                </label>
              ) : null}
              <label id="add-note-meetingWhen" className="grid gap-1">
                <FieldLabel required>Time</FieldLabel>
                <FormDatePicker
                  showTime
                  className="w-full"
                  format="DD MMM YYYY hh:mm A"
                  placeholder="Select date and time"
                  disabled={committed.meeting}
                  value={meetingWhen ? dayjs(meetingWhen) : null}
                  disabledDate={(current) =>
                    Boolean(current && current < dayjs().startOf("day"))
                  }
                  onChange={(value) => {
                    setMeetingWhen(value ? value.toISOString() : "");
                    clearError("meetingWhen");
                  }}
                />
                {errors.meetingWhen ? (
                  <InputError>{errors.meetingWhen}</InputError>
                ) : null}
              </label>
              <label className="grid gap-1">
                <FieldLabel>Agenda</FieldLabel>
                <FormTextArea
                  rows={2}
                  disabled={committed.meeting}
                  value={agenda}
                  placeholder="Topics to cover"
                  onChange={(event) => setAgenda(event.target.value)}
                />
              </label>
            </ScheduleSection>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#eef3f8] pt-3 dark:border-border-subtle">
          <PrimaryButton
            type="button"
            variant="outline"
            onClick={requestClose}
            label="Cancel"
          />
          <PrimaryButton
            type="button"
            loading={saving}
            disabled={saving}
            onClick={() => void handleSave()}
            label={saveLabel}
          />
        </div>
      </div>
    </AntModal>
  );
}
