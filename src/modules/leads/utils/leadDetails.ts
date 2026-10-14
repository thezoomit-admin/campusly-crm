import type { LeadRecord } from "../types";
import type { MasterOption } from "../hooks/useLeadMasterOptions";

export type LeadPrimaryTabKey =
  | "overview"
  | "notes"
  | "attachments"
  | "file-documents"
  | "activities"
  | "assignments"
  | "followups"
  | "more";

export type LeadMoreTabKey =
  | "communications"
  | "whatsapp"
  | "email"
  | "services"
  | "payments";

/** @deprecated Prefer LeadPrimaryTabKey / LeadMoreTabKey — kept for gradual migration */
export type LeadTabKey = LeadPrimaryTabKey | LeadMoreTabKey | "study" | "timeline";

export const LEAD_PRIMARY_TABS: Array<{
  key: LeadPrimaryTabKey;
  label: string;
}> = [
  { key: "overview", label: "Overview" },
  { key: "activities", label: "Activities" },
  { key: "notes", label: "Notes" },
  { key: "attachments", label: "Attachments" },
  { key: "file-documents", label: "File Documents" },
  { key: "assignments", label: "Assignment History" },
  { key: "followups", label: "Follow-up History" },
  { key: "more", label: "More" },
];

export const LEAD_MORE_TABS: Array<{ key: LeadMoreTabKey; label: string }> = [
  { key: "communications", label: "Communication" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "services", label: "Service & Package" },
  { key: "payments", label: "Payments" },
];

const LEAD_PRIMARY_TAB_KEYS = new Set<string>(
  LEAD_PRIMARY_TABS.map((item) => item.key),
);
const LEAD_MORE_TAB_KEYS = new Set<string>(
  LEAD_MORE_TABS.map((item) => item.key),
);

const LEGACY_PRIMARY_TAB_MAP: Record<string, LeadPrimaryTabKey> = {
  academic: "overview",
  counselling: "overview",
  study: "overview",
  documents: "attachments",
  history: "assignments",
  timeline: "activities",
  "follow-ups": "followups",
  services: "more",
  payments: "more",
};

export function parseLeadPrimaryTab(
  value: string | null | undefined,
): LeadPrimaryTabKey {
  if (!value) return "overview";
  if (LEAD_PRIMARY_TAB_KEYS.has(value)) return value as LeadPrimaryTabKey;
  if (value in LEGACY_PRIMARY_TAB_MAP) return LEGACY_PRIMARY_TAB_MAP[value];
  return "overview";
}

export function parseLeadMoreTab(
  value: string | null | undefined,
  rawPrimaryTab?: string | null,
): LeadMoreTabKey {
  if (rawPrimaryTab === "services" || value === "services") return "services";
  if (rawPrimaryTab === "payments" || value === "payments") return "payments";
  if (value && LEAD_MORE_TAB_KEYS.has(value)) return value as LeadMoreTabKey;
  return "communications";
}

/** @deprecated Use LEAD_PRIMARY_TABS + LEAD_MORE_TABS */
export const LEAD_TABS = [
  ...LEAD_PRIMARY_TABS.filter((t) => t.key !== "more"),
  ...LEAD_MORE_TABS,
] as Array<{ key: LeadTabKey; label: string }>;

/** Sales pipeline only — admission continues in Applications / Students. */
export const LEAD_JOURNEY_STAGES = [
  { code: "NEW", label: "New" },
  { code: "CONTACTED", label: "Contacted" },
  { code: "QUALIFIED", label: "Qualified" },
  { code: "COUNSELLING", label: "Counselling" },
  { code: "OFFERED", label: "Offered" },
  { code: "CONVERTED", label: "Converted" },
] as const;

/** Legacy post-conversion lead statuses still treated as converted for CTAs. */
export const CONVERTED_LEAD_STATUS_CODES = new Set([
  "CONVERTED",
  "FILE_OPENING_PENDING",
  "FILE_OPENED",
]);

export function isConvertedLeadStatus(
  statusCode?: string | null,
  statusName?: string | null,
  behaviorKey?: string | null,
) {
  const code = (statusCode || "").trim().toUpperCase();
  if (code && CONVERTED_LEAD_STATUS_CODES.has(code)) return true;
  const behavior = (behaviorKey || "").trim().toLowerCase();
  if (
    behavior === "converted" ||
    behavior === "file_opening_pending" ||
    behavior === "file_opened"
  ) {
    return true;
  }
  const name = (statusName || "").trim().toLowerCase();
  return (
    name === "converted" ||
    name === "file opening pending" ||
    name === "file opened"
  );
}

export function journeyStageIndex(
  statusCode?: string | null,
  statusName?: string | null,
) {
  const code = (statusCode || "").toUpperCase();
  // Legacy admission statuses still render as Converted on the sales journey.
  if (code === "FILE_OPENING_PENDING" || code === "FILE_OPENED") {
    return LEAD_JOURNEY_STAGES.findIndex((stage) => stage.code === "CONVERTED");
  }
  const byCode = LEAD_JOURNEY_STAGES.findIndex((stage) => stage.code === code);
  if (byCode >= 0) return byCode;
  const name = (statusName || "").trim().toLowerCase();
  if (name === "file opening pending" || name === "file opened") {
    return LEAD_JOURNEY_STAGES.findIndex((stage) => stage.code === "CONVERTED");
  }
  const byName = LEAD_JOURNEY_STAGES.findIndex(
    (stage) => stage.label.toLowerCase() === name,
  );
  return byName >= 0 ? byName : -1;
}

/** Remaining ms below this → "due soon" (orange). Above → safe (green). */
export const FOLLOW_UP_SOON_MS = 24 * 60 * 60 * 1000;

export type FollowUpCountdownUrgency = "safe" | "soon" | "overdue";

export function followUpCountdownParts(dueAt?: string | null) {
  if (!dueAt) return null;
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) return null;

  const remainingMs = due - Date.now();
  const overdue = remainingMs < 0;
  const urgency: FollowUpCountdownUrgency = overdue
    ? "overdue"
    : remainingMs <= FOLLOW_UP_SOON_MS
      ? "soon"
      : "safe";

  // Absolute span so overdue shows elapsed time instead of stuck zeros.
  const totalSecs = Math.floor(Math.abs(remainingMs) / 1000);
  const days = Math.floor(totalSecs / (60 * 60 * 24));
  const hours = Math.floor((totalSecs % (60 * 60 * 24)) / (60 * 60));
  const mins = Math.floor((totalSecs % (60 * 60)) / 60);
  const secs = totalSecs % 60;

  return { days, hours, mins, secs, overdue, urgency, remainingMs };
}

export function leadInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "L";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function hasText(value: unknown) {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
}

export function optionLabel(options: MasterOption[], code?: string | null) {
  if (!code) return "";
  return options.find((item) => item.value === code)?.label || code;
}

export function formatDisplayDate(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDisplayDateTime(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDob(value?: string | null) {
  if (!value) return "";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function formatFollowUpDue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const label = formatDisplayDate(date);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startDue = new Date(date);
  startDue.setHours(0, 0, 0, 0);
  const days = Math.round(
    (startDue.getTime() - startToday.getTime()) / 86400000,
  );
  if (days > 1) return `${label} (in ${days} days)`;
  if (days === 1) return `${label} (tomorrow)`;
  if (days === 0) return `${label} (today)`;
  if (days === -1) return `${label} (yesterday)`;
  return `${label} (${Math.abs(days)} days ago)`;
}

export function yesNoLabel(value: boolean | null | undefined) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
}

export function stageBadgeClass(status: string) {
  const key = status.toLowerCase();
  if (key === "new") {
    return "bg-[#f3e8ff] text-[#7c3aed] dark:bg-violet-600/20 dark:text-[#c4b5fd]";
  }
  if (key === "contacted") {
    return "bg-[#fef9c3] text-[#a16207] dark:bg-yellow-600/20 dark:text-[#fde047]";
  }
  if (key === "qualified") {
    return "bg-[#ffedd5] text-[#c2410c] dark:bg-orange-600/20 dark:text-[#fdba74]";
  }
  if (key === "counselling") {
    return "bg-[#fed7aa] text-[#9a3412] dark:bg-orange-700/20 dark:text-[#fdba74]";
  }
  if (key === "offered" || key === "offer sent") {
    return "bg-[#ccfbf1] text-[#0f766e] dark:bg-teal-600/20 dark:text-[#5eead4]";
  }
  if (key === "file opening pending") {
    return "bg-[#e0f2fe] text-[#0369a1] dark:bg-sky-600/20 dark:text-[#7dd3fc]";
  }
  if (key === "file opened") {
    return "bg-[#dcfce7] text-[#047857] dark:bg-emerald-600/20 dark:text-[#6ee7b7]";
  }
  if (["converted", "enrolled", "completed", "active"].includes(key)) {
    return "bg-[#dcfce7] text-[#15803d] dark:bg-green-600/20 dark:text-[#86efac]";
  }
  if (
    [
      "lost",
      "rejected",
      "cancelled",
      "unqualified",
      "invalid",
      "duplicate",
      "closed",
    ].includes(key)
  ) {
    return "bg-[#ffe8ee] text-[#e11d48] dark:bg-rose-600/20 dark:text-[#fda4af]";
  }
  return "bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]";
}

export function priorityBadgeClass(priority?: string | null) {
  const key = (priority || "").toLowerCase();
  if (key === "high" || key === "urgent") {
    return "bg-[#ffe4e6] text-[#e11d48] dark:bg-rose-600/20 dark:text-[#fda4af]";
  }
  if (key === "medium") {
    return "bg-[#ffedd5] text-[#c2410c] dark:bg-orange-600/20 dark:text-[#fdba74]";
  }
  if (key === "low") {
    return "bg-[#fef9c3] text-[#a16207] dark:bg-yellow-600/20 dark:text-[#fde047]";
  }
  return "bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]";
}

export type CompletionRow = {
  key: string;
  label: string;
  filled: number;
  total: number;
  done: boolean;
};

function countTexts(values: unknown[]): Omit<CompletionRow, "key" | "label"> {
  const filled = values.filter((value) => hasText(value)).length;
  return {
    filled,
    total: values.length,
    done: filled === values.length && values.length > 0,
  };
}

function countAnswered(
  values: Array<boolean | null | undefined>,
): Omit<CompletionRow, "key" | "label"> {
  const filled = values.filter(
    (value) => value !== null && value !== undefined,
  ).length;
  return {
    filled,
    total: values.length,
    done: filled === values.length && values.length > 0,
  };
}

export function completionRows(lead: LeadRecord): CompletionRow[] {
  const personal = countTexts([
    lead.name,
    lead.phone,
    lead.email,
    lead.dateOfBirth,
    lead.currentLocation,
    lead.whatsappSameAsPhone ? lead.phone : lead.whatsapp,
    lead.sourceCode,
  ]);
  const study = countTexts([
    lead.preferredCountryCode,
    lead.preferredDegreeCode,
    lead.preferredCourse,
    lead.preferredIntakeCode,
  ]);
  const academic = countTexts([
    lead.highestQualificationCode,
    lead.institutionName,
    lead.passingYear,
  ]);
  const financial = countTexts([
    lead.estimatedBudgetCode,
    lead.fundingSourceCode,
    lead.financialReadinessCode,
  ]);
  const visa = countAnswered([
    lead.previousVisaApplication,
    lead.previousVisaRefusal,
  ]);
  const language = countTexts([lead.englishTestCode, lead.testStatusCode]);
  const other = countTexts([lead.notes || lead.remarks]);

  return [
    { key: "personal", label: "Personal Information", ...personal },
    { key: "study", label: "Study Preference", ...study },
    { key: "academic", label: "Academic Information", ...academic },
    { key: "financial", label: "Financial Information", ...financial },
    { key: "visa", label: "Visa History", ...visa },
    { key: "language", label: "Language & Test", ...language },
    { key: "other", label: "Other Details", ...other },
  ];
}

export type LeadActivityIconKind =
  | "note"
  | "meeting"
  | "follow-up"
  | "call"
  | "email"
  | "whatsapp"
  | "sms"
  | "counselling"
  | "document"
  | "payment"
  | "status"
  | "assignment"
  | "check"
  | "cancel"
  | "system";

function mentionsMeeting(...parts: Array<string | null | undefined>) {
  return parts.join(" ").toLowerCase().includes("meeting");
}

export function activityTitle(
  action: string,
  details?: string | null,
  outcome?: string | null,
  actionKey?: string | null,
) {
  const key = (actionKey || "").toUpperCase();
  const outcomeText = (outcome || "").toLowerCase();
  const text = `${action} ${details || ""} ${outcome || ""}`.toLowerCase();

  if (key === "NOTE") return "Note added";
  if (key === "MEETING") return "Meeting added";
  if (key === "FOLLOW_UP" || key === "FOLLOW_UP_CREATED") {
    return mentionsMeeting(action, details, outcome)
      ? "Meeting added"
      : "Follow-up added";
  }
  if (key === "FOLLOW_UP_COMPLETED") {
    return mentionsMeeting(action, details, outcome)
      ? "Meeting completed"
      : "Follow-up completed";
  }
  if (key === "FOLLOW_UP_RESCHEDULED") {
    return mentionsMeeting(action, details, outcome)
      ? "Meeting rescheduled"
      : "Follow-up rescheduled";
  }
  if (key === "FOLLOW_UP_CANCELLED") {
    return mentionsMeeting(action, details, outcome)
      ? "Meeting cancelled"
      : "Follow-up cancelled";
  }
  if (key === "LEAD_REASSIGNED" || key.includes("REASSIGN")) {
    return "Reassigned";
  }
  if (key === "LEAD_ASSIGNED") {
    return text.includes("reassign") ? "Reassigned" : "Assigned";
  }
  if (key === "LEAD_CREATED") return "Lead created";
  if (key === "LEAD_UPDATED") return "Profile updated";
  if (key === "LEAD_STATUS_CHANGED") return "Status updated";
  if (key === "LEAD_QUALIFIED" || key === "LEAD_PRIORITY_OVERRIDE") {
    return key === "LEAD_PRIORITY_OVERRIDE"
      ? "Priority updated"
      : "Qualification updated";
  }
  if (key === "LEAD_CLOSED") return "Lead closed";
  if (key === "LEAD_REOPENED") return "Lead reopened";
  if (key === "LEAD_HANDED_OVER" || key.includes("HANDOVER"))
    return "Handed over";
  if (key === "CALL") return "Call logged";
  if (key === "WHATSAPP") return "WhatsApp logged";
  if (key === "EMAIL") return "Email logged";
  if (key === "SMS") return "SMS logged";
  if (key === "COUNSELLING") return "Counselling logged";
  if (key === "DOCUMENT_REQUEST") return "Document requested";
  if (key === "PAYMENT_DISCUSSION") return "Payment discussion";
  if (key === "SERVICE_DISCUSSION") return "Service discussion";
  if (key.includes("DOCUMENT")) return "Document updated";
  if (key.includes("PAYMENT")) return "Payment updated";

  if (outcomeText) {
    if (outcomeText.includes("email received")) return "Email received";
    if (outcomeText.includes("email sent")) return "Email sent";
    if (outcomeText.includes("email replied")) return "Email replied";
    if (outcomeText.includes("email bounced")) return "Email bounced";
    if (outcomeText.includes("email failed")) return "Email failed";
    if (
      outcomeText.includes("email assigned") ||
      outcomeText.includes("lead reassigned")
    ) {
      return "Reassigned";
    }
    if (outcomeText.includes("attachment received"))
      return "Attachment received";
    if (outcomeText.includes("attachment sent")) return "Attachment sent";
    if (outcomeText.includes("document from email"))
      return "Document from email";
  }

  if (text.includes("lead reassigned") || text.includes("email assigned"))
    return "Reassigned";
  if (text.includes("reassigned") || text.includes("assigned to"))
    return "Reassigned";
  if (text.includes("handed over") || text.includes("handover"))
    return "Handed over";
  if (text.includes("qualif")) return "Qualification updated";
  if (text.includes("status")) return "Status updated";
  if (text.includes("created") || action.toLowerCase() === "lead created")
    return "Lead created";
  if (text.includes("meeting") && text.includes("reschedul"))
    return "Meeting rescheduled";
  if (text.includes("meeting") && text.includes("cancel"))
    return "Meeting cancelled";
  if (text.includes("meeting") && text.includes("complet"))
    return "Meeting completed";
  if (
    text.includes("meeting") &&
    (text.includes("added") ||
      text.includes("scheduled") ||
      text.includes("created") ||
      action.toLowerCase() === "meeting")
  ) {
    return "Meeting added";
  }
  if (text.includes("follow-up") || text.includes("follow up")) {
    if (text.includes("reschedul")) return "Follow-up rescheduled";
    if (text.includes("cancel")) return "Follow-up cancelled";
    if (text.includes("complet")) return "Follow-up completed";
    return "Follow-up added";
  }
  if (text.includes("updated") || text.includes("profile"))
    return "Profile updated";
  if (text.includes("note")) return "Note added";
  if (text.includes("call")) return "Call logged";
  if (text.includes("whatsapp")) return "WhatsApp logged";
  if (text.includes("email received") || text.includes("received —"))
    return "Email received";
  if (text.includes("email bounced") || text.includes("email failed")) {
    return text.includes("bounced") ? "Email bounced" : "Email failed";
  }
  if (text.includes("email")) return "Email sent";
  return action;
}

export function activityIconKind(
  title: string,
  actionKey?: string | null,
  category?: string | null,
): LeadActivityIconKind {
  const key = (actionKey || "").toUpperCase();
  const label = title.toLowerCase();

  if (key === "NOTE" || label.includes("note")) return "note";
  if (key === "MEETING" || label.includes("meeting")) return "meeting";
  if (
    key.startsWith("FOLLOW_UP") ||
    key === "FOLLOW_UP" ||
    label.includes("follow-up")
  ) {
    if (label.includes("completed")) return "check";
    if (label.includes("cancelled")) return "cancel";
    return "follow-up";
  }
  if (key === "CALL" || label.includes("call")) return "call";
  if (key === "WHATSAPP" || label.includes("whatsapp")) return "whatsapp";
  if (key === "EMAIL" || label.includes("email")) return "email";
  if (key === "SMS" || label.includes("sms")) return "sms";
  if (key === "COUNSELLING" || label.includes("counselling"))
    return "counselling";
  if (
    key.includes("DOCUMENT") ||
    label.includes("document") ||
    label.includes("attachment")
  ) {
    return "document";
  }
  if (key.includes("PAYMENT") || label.includes("payment")) return "payment";
  if (
    key.includes("ASSIGN") ||
    label.includes("reassigned") ||
    label.includes("handed over")
  ) {
    return "assignment";
  }
  if (key.includes("STATUS") || label.includes("status")) return "status";
  if (label.includes("completed") || label.includes("closed")) return "check";
  if (label.includes("cancelled")) return "cancel";
  if (category === "call") return "call";
  if (category === "meeting") return "meeting";
  if (category === "email") return "email";
  if (category === "message") return "whatsapp";
  if (category === "document") return "document";
  if (category === "payment") return "payment";
  if (category === "assignment") return "assignment";
  if (category === "status") return "status";
  return "system";
}
