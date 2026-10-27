import {
  adminEmpty,
  adminPage,
  fieldError,
  isUploading,
  modalBackdrop,
  modalClose,
  modalHeader,
  modalPanel,
  photoCameraBadge,
  photoUploadSpin,
} from "../../../styles/admin";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { Breadcrumb, Dropdown, Spin } from "antd";
import type { MenuProps } from "antd";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  AnalyticsUpIcon,
  Briefcase01Icon,
  Building03Icon,
  Calendar03Icon,
  Call02Icon,
  Camera01Icon,
  Cancel01Icon,
  Clock01Icon,
  Contact01Icon,
  CheckmarkCircle02Icon,
  Download01Icon,
  File01Icon,
  Location01Icon,
  Mail01Icon,
  Message01Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  Shield01Icon,
  UserIcon,
  UserGroupIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import {
  useLazyFetchEmployeeDocumentBlobQuery,
  useLazyGetEmployeePerformanceQuery,
  useLazyGetEmployeeQuery,
  useLazyListEmployeeAuditLogsQuery,
  useUploadEmployeePhotoMutation,
} from "@/redux/features/employees/employeesApi";
import { useAdminPasswordResetMutation } from "@/redux/features/users/usersApi";
import { getApiError } from "@/lib/api";
import { toast } from "react-toastify";
import { PrimaryButton } from "@/components/ui";
import { PageMeta } from "@/components/common/Meta";
import { hasPermission } from "../../../lib/access";
import type {
  AuthSession,
  EmployeeAuditLog,
  EmployeeCrmAccess,
  EmployeePerformanceSummary,
  EmployeeRecord,
} from "../../../types";

type ProfileTab = {
  id: string;
  label: string;
  icon: IconSvgElement;
};

const TABS: ProfileTab[] = [
  { id: "overview", label: "Overview", icon: UserIcon },
  { id: "contact", label: "Contact", icon: Contact01Icon },
  { id: "employment", label: "Employment", icon: Briefcase01Icon },
  { id: "documents", label: "Documents", icon: File01Icon },
  { id: "performance", label: "Performance", icon: AnalyticsUpIcon },
  { id: "history", label: "Activity History", icon: Clock01Icon },
];

const AUDIT_ACTION_LABELS: Record<string, string> = {
  EMPLOYEE_CREATED: "Joined the company",
  EMPLOYEE_UPDATED: "Profile updated",
  EMPLOYEE_STATUS_CHANGED: "Status changed",
  EMPLOYEE_PHOTO_UPDATED: "Profile photo updated",
  EMPLOYEE_DOCUMENT_UPLOADED: "Document uploaded",
  EMPLOYEE_DOCUMENT_DELETED: "Document deleted",
};

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

/** Same document slots as EmployeeCreatePage. */
const EXPECTED_DOCUMENTS = [
  { type: "NID", label: "NID / Identity Document" },
  { type: "PHOTOGRAPH", label: "Photograph" },
  { type: "CV", label: "CV / Resume" },
  { type: "EDUCATIONAL_CERTIFICATE", label: "Educational Certificate" },
  { type: "APPOINTMENT_LETTER", label: "Appointment Letter" },
  { type: "JOINING_DOCUMENT", label: "Joining Document" },
  { type: "OTHER", label: "Other" },
] as const;

const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

const MARITAL_LABELS: Record<string, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
  OTHER: "Other",
};

const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
  INVITED: "Invited",
};

function displayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function formatPrettyDate(value?: string | Date | null) {
  if (!value) {
    return "—";
  }
  const raw =
    typeof value === "string"
      ? value.slice(0, 10)
      : value.toISOString().slice(0, 10);
  const [year, month, day] = raw.split("-").map(Number);
  if (!year || !month || !day) {
    return "—";
  }
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return "—";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(value?: string | Date | null) {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function crmAccessLabel(access: EmployeeCrmAccess) {
  if (access === "ENABLED") {
    return "Enabled";
  }
  if (access === "INVITED") {
    return "Invited";
  }
  if (access === "DISABLED") {
    return "Disabled";
  }
  return "No access";
}

function employeeInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "E";
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function photoSrc(employee: EmployeeRecord) {
  if (!employee.photoUrl) {
    return "";
  }
  if (
    employee.photoUrl.startsWith("http") ||
    employee.photoUrl.startsWith("/")
  ) {
    return employee.photoUrl;
  }
  return `/api/employees/${employee.id}/photo`;
}

type DocumentPreviewState = {
  title: string;
  fileName: string;
  mimeType: string;
  url: string;
  loading: boolean;
};

type EmployeeDocumentItem = NonNullable<EmployeeRecord["documents"]>[number];

function isImageMime(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isPdfMime(mimeType: string, fileName = "") {
  return (
    mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")
  );
}

function formatAuditSummary(log: EmployeeAuditLog) {
  const meta = (log.metadata || {}) as Record<string, unknown>;
  if (log.action === "EMPLOYEE_STATUS_CHANGED") {
    const fromStatus =
      typeof meta.fromStatus === "string" ? meta.fromStatus : null;
    const toStatus = typeof meta.toStatus === "string" ? meta.toStatus : null;
    if (fromStatus && toStatus) {
      return `Status: ${fromStatus} → ${toStatus}`;
    }
  }
  if (typeof meta.type === "string" && typeof meta.fileName === "string") {
    return `${meta.type}: ${meta.fileName}`;
  }
  if (typeof meta.employeeCode === "string") {
    return meta.employeeCode;
  }
  return AUDIT_ACTION_LABELS[log.action] || log.action;
}

function computeProfileCompletion(employee: EmployeeRecord) {
  const checks = [
    Boolean(employee.fullName?.trim()),
    Boolean(employee.photoUrl),
    Boolean(employee.gender),
    Boolean(employee.dateOfBirth),
    Boolean(employee.nationality?.trim()),
    Boolean(employee.identityNumber?.trim()),
    Boolean(employee.maritalStatus),
    Boolean(employee.mobile?.trim()),
    Boolean(employee.personalEmail?.trim()),
    Boolean(employee.presentAddress?.trim()),
    Boolean(employee.permanentAddress?.trim()),
    Boolean(employee.emergencyName?.trim() && employee.emergencyMobile?.trim()),
    Boolean(employee.designation),
    Boolean(employee.department),
    Boolean(employee.team),
    Boolean(employee.joiningDate),
    Boolean(employee.reportingManager),
    (employee.documents?.length ?? 0) > 0,
  ];
  const filled = checks.filter(Boolean).length;
  const percent = Math.round((filled / checks.length) * 100);
  return Math.max(0, Math.min(100, percent));
}

function isActiveEmployment(employee: EmployeeRecord) {
  const code = employee.employmentStatus?.code?.toUpperCase() || "";
  const name = employee.employmentStatus?.name?.toUpperCase() || "";
  return (
    code === "ACTIVE" ||
    name === "ACTIVE" ||
    employee.user?.status === "ACTIVE"
  );
}

function Field({
  label,
  children,
  icon,
}: {
  label: string;
  children: ReactNode;
  icon?: IconSvgElement;
}) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 flex items-center gap-1.5 text-[0.72rem] font-medium tracking-[0.02em] text-text-muted uppercase">
        {icon ? (
          <HugeiconsIcon
            icon={icon}
            size={13}
            color="currentColor"
            strokeWidth={1.7}
          />
        ) : null}
        {label}
      </dt>
      <dd className="m-0 break-words text-[0.92rem] font-medium text-text [&_a]:text-primary! [&_a]:no-underline hover:[&_a]:underline">
        {children}
      </dd>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  action,
  children,
  className = "",
}: {
  title: string;
  icon: IconSvgElement;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-2xl border border-border bg-surface p-5 shadow-soft ${className}`}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary">
            <HugeiconsIcon
              icon={icon}
              size={16}
              color="currentColor"
              strokeWidth={1.7}
            />
          </span>
          <h3 className="m-0 text-[0.98rem] font-semibold text-text">
            {title}
          </h3>
        </div>
        {action}
      </header>
      {children}
    </article>
  );
}

function CompletionRing({ percent }: { percent: number }) {
  const size = 52;
  const stroke = 4.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-[52px] w-[52px] shrink-0">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="color-mix(in srgb, var(--color-border) 80%, transparent)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[0.72rem] font-bold text-primary">
        {percent}%
      </span>
    </div>
  );
}

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const auth = useOutletContext<AuthSession>();
  const navigate = useNavigate();
  const location = useLocation();
  const canEdit = hasPermission(auth, "employee:edit");
  const canManageEmployeeDocs = hasPermission(auth, "employee_document:manage");
  const canViewPerformance = hasPermission(auth, "employee_performance:view");
  const canViewAudit = hasPermission(auth, [
    "audit:view",
    "employee:view",
    "employee:edit",
  ]);
  const canResendInvite = hasPermission(auth, "user:configure");

  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [localPhotoPreview, setLocalPhotoPreview] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [auditLogs, setAuditLogs] = useState<EmployeeAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [performance, setPerformance] =
    useState<EmployeePerformanceSummary | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [documentPreview, setDocumentPreview] =
    useState<DocumentPreviewState | null>(null);
  const [documentBusyId, setDocumentBusyId] = useState<string | null>(null);
  const documentPreviewUrl = useRef("");
  const [getEmployee] = useLazyGetEmployeeQuery();
  const [listEmployeeAuditLogs] = useLazyListEmployeeAuditLogsQuery();
  const [getEmployeePerformance] = useLazyGetEmployeePerformanceQuery();
  const [uploadEmployeePhoto] = useUploadEmployeePhotoMutation();
  const [fetchEmployeeDocumentBlob] = useLazyFetchEmployeeDocumentBlobQuery();
  const [adminPasswordReset] = useAdminPasswordResetMutation();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) {
        setError("Employee not found.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getEmployee(id).unwrap();
        if (cancelled) {
          return;
        }
        setEmployee(data.employee);
        setError("");
      } catch (err) {
        if (cancelled) {
          return;
        }
        setEmployee(null);
        setError(getApiError(err, "Unable to load employee profile."));
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, getEmployee]);

  useEffect(() => {
    let cancelled = false;
    async function loadExtras() {
      if (!id) {
        return;
      }
      if (canViewAudit) {
        setAuditLoading(true);
        try {
          const data = await listEmployeeAuditLogs(id).unwrap();
          if (!cancelled) {
            setAuditLogs(data.logs);
          }
        } catch {
          if (!cancelled) {
            setAuditLogs([]);
          }
        }
        if (!cancelled) {
          setAuditLoading(false);
        }
      }
      if (canViewPerformance) {
        setPerformanceLoading(true);
        try {
          const data = await getEmployeePerformance(id).unwrap();
          if (!cancelled) {
            setPerformance(data.performance);
          }
        } catch {
          if (!cancelled) {
            setPerformance(null);
          }
        }
        if (!cancelled) {
          setPerformanceLoading(false);
        }
      }
    }
    void loadExtras();
    return () => {
      cancelled = true;
    };
  }, [
    id,
    canViewAudit,
    canViewPerformance,
    listEmployeeAuditLogs,
    getEmployeePerformance,
  ]);

  useEffect(() => {
    if (!location.hash || !employee?.id) {
      return;
    }
    const tabId = location.hash.replace("#", "");
    if (!TABS.some((item) => item.id === tabId)) {
      return;
    }
    setActiveTab(tabId);
  }, [location.hash, employee?.id]);

  const photo = localPhotoPreview || (employee ? photoSrc(employee) : "");
  const documents = employee?.documents ?? [];
  const completionPercent = useMemo(
    () => (employee ? computeProfileCompletion(employee) : 0),
    [employee],
  );
  const activeEmployee = employee ? isActiveEmployment(employee) : false;
  const roleLine = [
    employee?.designation?.name,
    employee?.department?.name,
    employee?.team?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  const visibleTabs = useMemo(
    () =>
      TABS.filter((tab) => {
        if (tab.id === "performance") {
          return canViewPerformance;
        }
        if (tab.id === "history") {
          return canViewAudit;
        }
        return true;
      }),
    [canViewPerformance, canViewAudit],
  );

  const recentActivity = useMemo(() => auditLogs.slice(0, 4), [auditLogs]);

  const documentTiles = useMemo(() => {
    return EXPECTED_DOCUMENTS.map((expected) => {
      const match = documents.find((doc) => doc.type === expected.type);
      return {
        ...expected,
        document: match || null,
      };
    });
  }, [documents]);

  useEffect(
    () => () => {
      if (localPhotoPreview) {
        URL.revokeObjectURL(localPhotoPreview);
      }
    },
    [localPhotoPreview],
  );

  useEffect(
    () => () => {
      if (documentPreviewUrl.current) {
        URL.revokeObjectURL(documentPreviewUrl.current);
      }
    },
    [],
  );

  function releaseDocumentPreviewUrl() {
    if (documentPreviewUrl.current) {
      URL.revokeObjectURL(documentPreviewUrl.current);
      documentPreviewUrl.current = "";
    }
  }

  function closeDocumentPreview() {
    releaseDocumentPreviewUrl();
    setDocumentPreview(null);
  }

  async function openDocumentPreview(
    label: string,
    doc: EmployeeDocumentItem,
  ) {
    if (!employee || documentBusyId) {
      return;
    }
    releaseDocumentPreviewUrl();
    setDocumentBusyId(doc.id);
    setDocumentPreview({
      title: label,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      url: "",
      loading: true,
    });
    try {
      const data = await fetchEmployeeDocumentBlob({
        employeeId: employee.id,
        documentId: doc.id,
      }).unwrap();
      const url = URL.createObjectURL(data.blob);
      documentPreviewUrl.current = url;
      setDocumentPreview({
        title: label,
        fileName: doc.fileName,
        mimeType: data.mimeType || doc.mimeType,
        url,
        loading: false,
      });
    } catch (err) {
      setDocumentPreview(null);
      toast.error(getApiError(err, "Unable to load the document."));
    } finally {
      setDocumentBusyId(null);
    }
  }

  async function downloadDocument(doc: EmployeeDocumentItem) {
    if (!employee || documentBusyId) {
      return;
    }
    setDocumentBusyId(doc.id);
    try {
      const data = await fetchEmployeeDocumentBlob({
        employeeId: employee.id,
        documentId: doc.id,
      }).unwrap();
      const url = URL.createObjectURL(data.blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = doc.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getApiError(err, "Unable to download the document."));
    } finally {
      setDocumentBusyId(null);
    }
  }

  async function onProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file || !employee || photoUploading) {
      return;
    }
    if (!PHOTO_TYPES.has(file.type) || file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Use a JPG, PNG, or WEBP image of 5 MB or less.");
      return;
    }

    const preview = URL.createObjectURL(file);
    setLocalPhotoPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return preview;
    });
    setPhotoError("");
    setPhotoUploading(true);
    try {
      const data = await uploadEmployeePhoto({
        id: employee.id,
        file,
      }).unwrap();
      setEmployee(data.employee);
      setLocalPhotoPreview((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return "";
      });
    } catch (err) {
      setPhotoError(getApiError(err, "Unable to upload the profile photo."));
      setLocalPhotoPreview((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return "";
      });
    }
    setPhotoUploading(false);
  }

  function selectTab(tabId: string) {
    setActiveTab(tabId);
    navigate(`#${tabId}`, { replace: true });
  }

  async function resendInvite() {
    if (!employee?.user?.id) {
      return;
    }
    setInviteSending(true);
    try {
      const data = await adminPasswordReset(employee.user.id).unwrap();
      toast.success(
        data.devResetPath
          ? `Invite resent. Dev link: ${data.devResetPath}`
          : data.message || `Invite resent to ${employee.officialEmail}.`,
      );
    } catch (err) {
      toast.error(getApiError(err, "Unable to resend invite."));
    } finally {
      setInviteSending(false);
    }
  }

  const moreMenuItems: MenuProps["items"] = employee
    ? [
        {
          key: "back",
          label: "Back to employees",
          onClick: () => navigate("/employees"),
        },
        canManageEmployeeDocs
          ? {
              key: "docs",
              label: "Manage documents",
              onClick: () =>
                navigate(`/employees/${employee.id}/edit#documents`),
            }
          : {
              key: "view-docs",
              label: "View documents",
              onClick: () => selectTab("documents"),
            },
        canViewPerformance
          ? {
              key: "performance",
              label: "View performance report",
              onClick: () =>
                navigate(
                  employee.user?.id
                    ? `/reports?tab=employee-performance&detail=${employee.user.id}`
                    : "/reports?tab=employee-performance",
                ),
            }
          : null,
        canResendInvite && employee.user?.status === "INVITED"
          ? {
              key: "invite",
              label: inviteSending ? "Sending invite…" : "Resend setup invite",
              disabled: inviteSending,
              onClick: () => void resendInvite(),
            }
          : null,
      ].filter(Boolean)
    : [];

  const editButton = canEdit && employee ? (
    <PrimaryButton
      size="sm"
      variant="outline"
      label="Edit"
      icon={
        <HugeiconsIcon
          icon={PencilEdit02Icon}
          size={14}
          color="currentColor"
          strokeWidth={1.6}
        />
      }
      onClick={() => navigate(`/employees/${employee.id}/edit`)}
    />
  ) : null;

  const fieldGridClass =
    "m-0 grid grid-cols-1 gap-x-8 gap-y-4 min-[640px]:grid-cols-2";

  function renderPersonalCard() {
    if (!employee) {
      return null;
    }
    return (
      <SectionCard
        title="Personal Information"
        icon={UserIcon}
        action={
          canEdit ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[0.78rem] font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
            >
              <HugeiconsIcon
                icon={PencilEdit02Icon}
                size={13}
                color="currentColor"
                strokeWidth={1.7}
              />
              Edit
            </button>
          ) : null
        }
      >
        <dl className={fieldGridClass}>
          <Field label="Employee name">{employee.fullName}</Field>
          <Field label="Employee ID">{employee.employeeCode}</Field>
          <Field label="Gender">
            {employee.gender
              ? GENDER_LABELS[employee.gender] || employee.gender
              : "—"}
          </Field>
          <Field label="Date of birth">
            {formatPrettyDate(employee.dateOfBirth)}
          </Field>
          <Field label="Nationality">{displayValue(employee.nationality)}</Field>
          <Field label="NID / Passport no.">
            {employee.canViewSensitive === false
              ? "Restricted"
              : displayValue(employee.identityNumber)}
          </Field>
          <Field label="Marital status">
            {employee.maritalStatus
              ? MARITAL_LABELS[employee.maritalStatus] || employee.maritalStatus
              : "—"}
          </Field>
        </dl>
      </SectionCard>
    );
  }

  function renderContactCard() {
    if (!employee) {
      return null;
    }
    return (
      <SectionCard
        title="Contact Information"
        icon={Contact01Icon}
        action={
          canEdit ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[0.78rem] font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
            >
              <HugeiconsIcon
                icon={PencilEdit02Icon}
                size={13}
                color="currentColor"
                strokeWidth={1.7}
              />
              Edit
            </button>
          ) : null
        }
      >
        <dl className={fieldGridClass}>
          <Field label="Personal mobile" icon={Call02Icon}>
            {employee.mobile ? (
              <a href={`tel:${employee.mobile}`}>{employee.mobile}</a>
            ) : (
              "—"
            )}
          </Field>
          <Field label="Personal email" icon={Mail01Icon}>
            {employee.personalEmail ? (
              <a href={`mailto:${employee.personalEmail}`}>
                {employee.personalEmail}
              </a>
            ) : (
              "—"
            )}
          </Field>
          <Field label="Official email" icon={Mail01Icon}>
            <a href={`mailto:${employee.officialEmail}`}>
              {employee.officialEmail}
            </a>
          </Field>
          <Field label="Present address" icon={Location01Icon}>
            {displayValue(employee.presentAddress)}
          </Field>
          <Field label="Permanent address" icon={Location01Icon}>
            {displayValue(employee.permanentAddress)}
          </Field>
        </dl>
      </SectionCard>
    );
  }

  function renderEmploymentCard() {
    if (!employee) {
      return null;
    }
    return (
      <SectionCard
        title="Employment Information"
        icon={Briefcase01Icon}
        action={
          canEdit ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[0.78rem] font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
            >
              <HugeiconsIcon
                icon={PencilEdit02Icon}
                size={13}
                color="currentColor"
                strokeWidth={1.7}
              />
              Edit
            </button>
          ) : null
        }
      >
        <dl className={fieldGridClass}>
          <Field label="Joining date">
            {formatPrettyDate(employee.joiningDate)}
          </Field>
          <Field label="Employment type">
            {displayValue(employee.employmentType?.name)}
          </Field>
          <Field label="Employment status">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  activeEmployee ? "bg-[#16a34a]" : "bg-text-muted"
                }`}
              />
              {displayValue(employee.employmentStatus?.name)}
            </span>
          </Field>
          <Field label="Designation">
            {displayValue(employee.designation?.name)}
          </Field>
        </dl>
      </SectionCard>
    );
  }

  function renderEmergencyCard() {
    if (!employee) {
      return null;
    }
    return (
      <SectionCard
        title="Emergency Contact"
        icon={Call02Icon}
        action={
          canEdit ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[0.78rem] font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
            >
              <HugeiconsIcon
                icon={PencilEdit02Icon}
                size={13}
                color="currentColor"
                strokeWidth={1.7}
              />
              Edit
            </button>
          ) : null
        }
      >
        {employee.canViewSensitive === false ? (
          <p className="m-0 text-text-muted">
            Sensitive emergency contact details are restricted for your role.
          </p>
        ) : (
          <dl className={fieldGridClass}>
            <Field label="Contact name">
              {displayValue(employee.emergencyName)}
            </Field>
            <Field label="Relationship">
              {displayValue(employee.emergencyRelationship)}
            </Field>
            <Field label="Mobile">
              {employee.emergencyMobile ? (
                <a href={`tel:${employee.emergencyMobile}`}>
                  {employee.emergencyMobile}
                </a>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Address">
              {displayValue(employee.emergencyAddress)}
            </Field>
          </dl>
        )}
      </SectionCard>
    );
  }

  function renderDocumentsCard() {
    if (!employee) {
      return null;
    }
    const uploadedCount = documentTiles.filter((tile) => tile.document).length;
    const totalCount = documentTiles.length;

    return (
      <SectionCard
        title="Documents"
        icon={File01Icon}
        action={
          canManageEmployeeDocs ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[0.78rem] font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
              onClick={() =>
                navigate(`/employees/${employee.id}/edit#documents`)
              }
            >
              Manage
            </button>
          ) : null
        }
      >
        {employee.canViewDocuments === false ? (
          <p className="m-0 text-text-muted">
            Employee documents are restricted for your role.
          </p>
        ) : (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
              <p className="m-0 text-[0.82rem] text-text-muted">
                Required employment documents for this employee.
              </p>
              <span className="text-[0.78rem] font-semibold text-text">
                {uploadedCount} of {totalCount} uploaded
              </span>
            </div>

            <ul className="m-0 grid list-none gap-0 divide-y divide-border/70 overflow-hidden rounded-xl border border-border bg-surface p-0">
              {documentTiles.map((tile) => {
                const doc = tile.document;
                const uploaded = Boolean(doc);
                return (
                  <li
                    key={tile.type}
                    className="flex flex-col gap-3 px-3.5 py-3.5 transition-colors hover:bg-[color-mix(in_srgb,var(--color-page-bg)_55%,var(--color-surface))] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                          uploaded
                            ? "bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))] text-primary"
                            : "bg-[color-mix(in_srgb,var(--color-text-muted)_10%,var(--color-surface))] text-text-muted"
                        }`}
                        aria-hidden
                      >
                        <HugeiconsIcon
                          icon={File01Icon}
                          size={18}
                          color="currentColor"
                          strokeWidth={1.6}
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-[0.9rem] font-semibold text-text">
                            {tile.label}
                          </strong>
                          {uploaded ? (
                            <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-[#15803d]">
                              <HugeiconsIcon
                                icon={CheckmarkCircle02Icon}
                                size={13}
                                color="currentColor"
                                strokeWidth={1.8}
                              />
                              On file
                            </span>
                          ) : (
                            <span className="text-[0.72rem] font-medium text-text-muted">
                              Missing
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 mb-0 truncate text-[0.78rem] text-text-muted">
                          {doc
                            ? `${doc.fileName} · ${formatFileSize(doc.fileSize)}`
                            : "No file has been uploaded yet"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:pl-12">
                      {doc ? (
                        <>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-transparent px-2.5 py-1.5 text-[0.78rem] font-semibold text-primary transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={documentBusyId === doc.id}
                            onClick={() =>
                              void openDocumentPreview(tile.label, doc)
                            }
                          >
                            <HugeiconsIcon
                              icon={ViewIcon}
                              size={14}
                              color="currentColor"
                              strokeWidth={1.7}
                            />
                            View
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-2.5 py-1.5 text-[0.78rem] font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={documentBusyId === doc.id}
                            onClick={() => void downloadDocument(doc)}
                          >
                            <HugeiconsIcon
                              icon={Download01Icon}
                              size={14}
                              color="currentColor"
                              strokeWidth={1.7}
                            />
                            Download
                          </button>
                        </>
                      ) : canManageEmployeeDocs ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-1.5 text-[0.78rem] font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
                          onClick={() =>
                            navigate(`/employees/${employee.id}/edit#documents`)
                          }
                        >
                          Upload
                        </button>
                      ) : (
                        <span className="text-[0.78rem] text-text-muted">—</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </SectionCard>
    );
  }

  function renderPerformanceCard() {
    if (!employee || !canViewPerformance) {
      return null;
    }
    return (
      <SectionCard title="Performance" icon={AnalyticsUpIcon}>
        {performanceLoading ? (
          <Spin size="small" />
        ) : !performance?.available ? (
          <p className="m-0 text-text-muted">
            {performance?.message ||
              "Performance metrics are not available for this employee."}
          </p>
        ) : (
          <>
            <dl className="m-0 grid grid-cols-2 gap-x-8 gap-y-4 min-[721px]:grid-cols-3">
              <Field label="Follow-ups due">
                {performance.summary?.due ?? 0}
              </Field>
              <Field label="Completed">
                {performance.summary?.completed ?? 0}
              </Field>
              <Field label="On time">
                {performance.summary?.onTime ?? 0}
              </Field>
              <Field label="Overdue">
                {performance.summary?.overdue ?? 0}
              </Field>
              <Field label="Completion rate">
                {`${performance.summary?.completionRate ?? 0}%`}
              </Field>
              <Field label="On-time rate">
                {`${performance.summary?.onTimeRate ?? 0}%`}
              </Field>
            </dl>
            <div className="mt-4">
              <PrimaryButton
                size="sm"
                variant="outline"
                label="View Performance"
                onClick={() =>
                  navigate(
                    employee.user?.id
                      ? `/reports?tab=employee-performance&detail=${employee.user.id}`
                      : "/reports?tab=employee-performance",
                  )
                }
              />
            </div>
          </>
        )}
      </SectionCard>
    );
  }

  function renderHistoryCard() {
    if (!employee || !canViewAudit) {
      return null;
    }
    return (
      <SectionCard title="Activity History" icon={Clock01Icon}>
        {auditLoading ? (
          <Spin size="small" />
        ) : auditLogs.length === 0 ? (
          <p className="m-0 text-text-muted">
            No profile changes have been recorded yet.
          </p>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0">
            {auditLogs.map((log) => (
              <li
                key={log.id}
                className="rounded-xl border border-border-subtle bg-[color-mix(in_srgb,var(--color-page-bg)_70%,var(--color-surface))] px-3.5 py-3"
              >
                <strong className="block text-[0.92rem]">
                  {AUDIT_ACTION_LABELS[log.action] || log.action}
                </strong>
                <span className="mt-1 block text-[0.82rem] text-text-muted">
                  {formatAuditSummary(log)}
                </span>
                <span className="mt-1 block text-[0.78rem] text-text-muted">
                  {formatDateTime(log.createdAt)}
                  {log.user ? ` · Changed by ${log.user.fullName}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    );
  }

  function renderCrmCard() {
    if (!employee) {
      return null;
    }
    return (
      <SectionCard
        title="CRM Access"
        icon={Shield01Icon}
        action={
          canEdit ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[0.78rem] font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
            >
              <HugeiconsIcon
                icon={PencilEdit02Icon}
                size={13}
                color="currentColor"
                strokeWidth={1.7}
              />
              Edit
            </button>
          ) : null
        }
      >
        <dl className={fieldGridClass}>
          <Field label="CRM access">{crmAccessLabel(employee.crmAccess)}</Field>
          <Field label="Username">{displayValue(employee.user?.username)}</Field>
          <Field label="Role">{displayValue(employee.role?.name)}</Field>
          <Field label="Account status">
            {employee.user?.status
              ? USER_STATUS_LABELS[employee.user.status] || employee.user.status
              : "—"}
          </Field>
        </dl>
        {canResendInvite && employee.user?.status === "INVITED" ? (
          <div className="mt-5">
            <PrimaryButton
              size="sm"
              variant="outline"
              loading={inviteSending}
              label="Resend setup invite"
              onClick={() => void resendInvite()}
            />
          </div>
        ) : null}
      </SectionCard>
    );
  }

  function renderOrganizationCard() {
    if (!employee) {
      return null;
    }
    return (
      <SectionCard
        title="Organization Structure"
        icon={Building03Icon}
        action={
          canEdit ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[0.78rem] font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
            >
              <HugeiconsIcon
                icon={PencilEdit02Icon}
                size={13}
                color="currentColor"
                strokeWidth={1.7}
              />
              Edit
            </button>
          ) : null
        }
      >
        <dl className={fieldGridClass}>
          <Field label="Department">
            {displayValue(employee.department?.name)}
          </Field>
          <Field label="Team">{displayValue(employee.team?.name)}</Field>
          <Field label="Reporting manager">
            {employee.reportingManager ? (
              <>
                <Link
                  className="text-primary! no-underline hover:underline"
                  to={`/employees/${employee.reportingManager.id}`}
                >
                  {employee.reportingManager.fullName}
                </Link>
                <span className="font-medium text-text-muted">
                  {" "}
                  ({employee.reportingManager.employeeCode})
                </span>
              </>
            ) : (
              "—"
            )}
          </Field>
        </dl>
      </SectionCard>
    );
  }

  if (!loading && (error || !employee)) {
    return (
      <div className={`${adminPage}`}>
        <PageMeta
          title="Employee Not Found"
          description="This employee profile could not be loaded. Return to the employee list to continue."
        />
        <Breadcrumb
          className="mb-4"
          items={[
            {
              title: (
                <Link
                  className="text-primary! no-underline hover:underline"
                  to="/employees"
                >
                  Organization
                </Link>
              ),
            },
            {
              title: (
                <Link
                  className="text-primary! no-underline hover:underline"
                  to="/employees"
                >
                  Employees
                </Link>
              ),
            },
            {
              title: (
                <span className="font-medium text-primary">Profile</span>
              ),
            },
          ]}
        />
        <div className={`${adminEmpty}`}>
          <strong>Employee profile unavailable</strong>
          <p>{error || "This employee could not be found."}</p>
          <PrimaryButton
            variant="outline"
            onClick={() => navigate("/employees")}
            label="Back to Employees"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 max-w-full gap-4 overflow-x-clip">
      <PageMeta
        title={
          employee?.fullName
            ? `${employee.fullName} — Employee`
            : "Employee Profile"
        }
        description={
          employee
            ? `View employment, contact, organization, and CRM access details for ${employee.fullName}.`
            : "View employee profile details in EduConsult CRM."
        }
      />

      <Breadcrumb
        className="mb-1"
        items={[
          {
            title: (
              <Link
                className="text-primary! no-underline hover:underline"
                to="/employees"
              >
                Organization
              </Link>
            ),
          },
          {
            title: (
              <Link
                className="text-primary! no-underline hover:underline"
                to="/employees"
              >
                Employees
              </Link>
            ),
          },
          {
            title: <span className="font-medium text-primary">Profile</span>,
          },
        ]}
      />

      <Spin spinning={loading}>
        {employee ? (
          <div className="grid gap-4">
            {/* Profile header */}
            <section className="rounded-2xl border border-border bg-surface px-5 py-5 shadow-soft sm:px-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
                  <div
                    className={`relative mx-auto shrink-0 sm:mx-0${photoUploading ? ` ${isUploading}` : ""}`}
                  >
                    {canEdit ? (
                      <>
                        <input
                          id="employee-profile-photo"
                          className="sr-only"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={photoUploading}
                          onChange={(event) => void onProfilePhotoChange(event)}
                        />
                        <label
                          htmlFor="employee-profile-photo"
                          className="relative m-0 block cursor-pointer"
                        >
                          <span className="relative block h-[88px] w-[88px] overflow-hidden rounded-full border-[3px] border-surface shadow-[0_8px_20px_rgba(18,32,51,0.08)]">
                            {photo ? (
                              <img
                                className="h-full w-full object-cover"
                                src={photo}
                                alt=""
                              />
                            ) : (
                              <span className="grid h-full w-full place-items-center bg-[color-mix(in_srgb,var(--color-primary)_16%,white)] text-[1.6rem] font-bold text-primary">
                                {employeeInitials(employee.fullName)}
                              </span>
                            )}
                            {photoUploading ? (
                              <span className={`${photoUploadSpin}`}>
                                <Spin size="small" />
                              </span>
                            ) : null}
                          </span>
                          <span
                            className={`${photoCameraBadge} !right-0 !bottom-0 !h-7 !w-7`}
                            aria-hidden
                          >
                            <HugeiconsIcon
                              icon={Camera01Icon}
                              size={14}
                              color="currentColor"
                              strokeWidth={1.8}
                            />
                          </span>
                          <span className="sr-only">
                            {photoUploading
                              ? "Uploading profile photo"
                              : "Change profile photo"}
                          </span>
                        </label>
                      </>
                    ) : (
                      <span className="relative block h-[88px] w-[88px] overflow-hidden rounded-full border-[3px] border-surface shadow-[0_8px_20px_rgba(18,32,51,0.08)]">
                        {photo ? (
                          <img
                            className="h-full w-full object-cover"
                            src={photo}
                            alt=""
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center bg-[color-mix(in_srgb,var(--color-primary)_16%,white)] text-[1.6rem] font-bold text-primary">
                            {employeeInitials(employee.fullName)}
                          </span>
                        )}
                      </span>
                    )}
                    {photoError ? (
                      <p className={`${fieldError} mt-2`}>{photoError}</p>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <div className="text-[0.75rem] font-semibold tracking-[0.04em] text-text-muted uppercase">
                      {employee.employeeCode}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <h1 className="m-0 text-[1.55rem] leading-tight font-bold tracking-[-0.02em] text-text">
                        {employee.fullName}
                      </h1>
                    </div>
                    <p className="mt-1 mb-0 text-[0.9rem] text-text-muted">
                      {roleLine || "No assignment recorded"}
                    </p>

                    <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-border/70 pt-3.5 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-4">
                      <div className="flex items-start gap-2 text-left">
                        <span className="mt-0.5 shrink-0 text-primary">
                          <HugeiconsIcon
                            icon={Calendar03Icon}
                            size={15}
                            color="currentColor"
                            strokeWidth={1.7}
                          />
                        </span>
                        <div>
                          <dt className="text-[0.7rem] text-text-muted uppercase">
                            Joining date
                          </dt>
                          <dd className="m-0 text-[0.86rem] font-semibold text-text">
                            {formatPrettyDate(employee.joiningDate)}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-left">
                        <span className="mt-0.5 shrink-0 text-primary">
                          <HugeiconsIcon
                            icon={Briefcase01Icon}
                            size={15}
                            color="currentColor"
                            strokeWidth={1.7}
                          />
                        </span>
                        <div>
                          <dt className="text-[0.7rem] text-text-muted uppercase">
                            Designation
                          </dt>
                          <dd className="m-0 text-[0.86rem] font-semibold text-text">
                            {displayValue(employee.designation?.name)}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-left">
                        <span className="mt-0.5 shrink-0 text-primary">
                          <HugeiconsIcon
                            icon={Mail01Icon}
                            size={15}
                            color="currentColor"
                            strokeWidth={1.7}
                          />
                        </span>
                        <div className="min-w-0">
                          <dt className="text-[0.7rem] text-text-muted uppercase">
                            Official email
                          </dt>
                          <dd className="m-0 truncate text-[0.86rem] font-semibold">
                            <a
                              className="text-primary! no-underline hover:underline"
                              href={`mailto:${employee.officialEmail}`}
                            >
                              {employee.officialEmail}
                            </a>
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-left">
                        <span className="mt-0.5 shrink-0 text-primary">
                          <HugeiconsIcon
                            icon={Call02Icon}
                            size={15}
                            color="currentColor"
                            strokeWidth={1.7}
                          />
                        </span>
                        <div>
                          <dt className="text-[0.7rem] text-text-muted uppercase">
                            Personal mobile
                          </dt>
                          <dd className="m-0 text-[0.86rem] font-semibold text-text">
                            {employee.mobile ? (
                              <a
                                className="text-text no-underline hover:text-primary"
                                href={`tel:${employee.mobile}`}
                              >
                                {employee.mobile}
                              </a>
                            ) : (
                              "—"
                            )}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start xl:flex-col xl:items-end">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                    {editButton}
                    <PrimaryButton
                      size="sm"
                      variant="outline"
                      label="Message"
                      icon={
                        <HugeiconsIcon
                          icon={Message01Icon}
                          size={14}
                          color="currentColor"
                          strokeWidth={1.6}
                        />
                      }
                      onClick={() => {
                        window.location.href = `mailto:${employee.officialEmail}`;
                      }}
                    />
                    <Dropdown menu={{ items: moreMenuItems }} trigger={["click"]}>
                      <button
                        type="button"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[0.78rem] font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
                      >
                        More
                        <HugeiconsIcon
                          icon={MoreHorizontalIcon}
                          size={16}
                          color="currentColor"
                          strokeWidth={1.7}
                        />
                      </button>
                    </Dropdown>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-border bg-[color-mix(in_srgb,var(--color-page-bg)_55%,var(--color-surface))] px-3.5 py-2.5">
                    <CompletionRing percent={completionPercent} />
                    <div>
                      <div className="text-[0.86rem] font-semibold text-text">
                        Profile Complete
                      </div>
                      <button
                        type="button"
                        className="mt-0.5 border-0 bg-transparent p-0 text-[0.78rem] font-medium text-primary hover:underline"
                        onClick={() => selectTab("overview")}
                      >
                        View details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Tabs */}
            <nav
              className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface px-2 py-1.5 shadow-soft"
              aria-label="Profile sections"
            >
              {visibleTabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={[
                      "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border-0 px-3.5 py-2.5 text-[0.86rem] font-[inherit] transition-colors",
                      active
                        ? "bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] font-semibold text-primary"
                        : "bg-transparent text-text-muted hover:bg-[color-mix(in_srgb,var(--color-page-bg)_80%,transparent)] hover:text-text",
                    ].join(" ")}
                    aria-current={active ? "true" : undefined}
                    onClick={() => selectTab(tab.id)}
                  >
                    <HugeiconsIcon
                      icon={tab.icon}
                      size={15}
                      color="currentColor"
                      strokeWidth={1.7}
                    />
                    <span>{tab.label}</span>
                    {active ? (
                      <span className="ml-0.5 h-1 w-1 rounded-full bg-primary" />
                    ) : null}
                  </button>
                );
              })}
            </nav>

            {/* Tab content */}
            {activeTab === "overview" ? (
              <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="grid gap-4">
                  {renderPersonalCard()}
                  {renderContactCard()}
                  {renderEmploymentCard()}
                  {renderOrganizationCard()}
                  {renderCrmCard()}
                  {renderEmergencyCard()}
                </div>

                <aside className="grid gap-4">
                  <SectionCard title="Profile Summary" icon={UserGroupIcon}>
                    <dl className="m-0 grid gap-3">
                      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5">
                        <dt className="text-[0.8rem] text-text-muted">
                          Designation
                        </dt>
                        <dd className="m-0 text-right text-[0.86rem] font-semibold text-text">
                          {displayValue(employee.designation?.name)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5">
                        <dt className="text-[0.8rem] text-text-muted">
                          Department
                        </dt>
                        <dd className="m-0 text-right text-[0.86rem] font-semibold text-text">
                          {displayValue(employee.department?.name)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5">
                        <dt className="text-[0.8rem] text-text-muted">Team</dt>
                        <dd className="m-0 text-right text-[0.86rem] font-semibold text-text">
                          {displayValue(employee.team?.name)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-[0.8rem] text-text-muted">
                          Reporting manager
                        </dt>
                        <dd className="m-0 text-right text-[0.86rem] font-semibold text-text">
                          {employee.reportingManager ? (
                            <Link
                              className="text-primary! no-underline hover:underline"
                              to={`/employees/${employee.reportingManager.id}`}
                            >
                              {employee.reportingManager.fullName}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </dd>
                      </div>
                    </dl>
                  </SectionCard>

                  {canViewAudit ? (
                    <SectionCard title="Recent Activity" icon={Clock01Icon}>
                      {auditLoading ? (
                        <Spin size="small" />
                      ) : recentActivity.length === 0 ? (
                        <p className="m-0 text-[0.84rem] text-text-muted">
                          No recent activity yet.
                        </p>
                      ) : (
                        <ul className="m-0 grid list-none gap-0 p-0">
                          {recentActivity.map((log, index) => (
                            <li
                              key={log.id}
                              className="relative flex gap-3 pb-4 last:pb-0"
                            >
                              <span className="relative mt-1.5 flex flex-col items-center">
                                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                                {index < recentActivity.length - 1 ? (
                                  <span className="mt-1 w-px flex-1 bg-border" />
                                ) : null}
                              </span>
                              <div className="min-w-0 pb-1">
                                <strong className="block text-[0.86rem] text-text">
                                  {AUDIT_ACTION_LABELS[log.action] ||
                                    log.action}
                                </strong>
                                <span className="text-[0.75rem] text-text-muted">
                                  {formatRelativeTime(log.createdAt)}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </SectionCard>
                  ) : null}
                </aside>
              </div>
            ) : null}

            {activeTab === "contact" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {renderContactCard()}
                {renderEmergencyCard()}
              </div>
            ) : null}

            {activeTab === "employment" ? (
              <div className="grid gap-4">
                {renderEmploymentCard()}
                {renderOrganizationCard()}
                {renderCrmCard()}
              </div>
            ) : null}

            {activeTab === "documents" ? renderDocumentsCard() : null}
            {activeTab === "performance" ? renderPerformanceCard() : null}
            {activeTab === "history" ? renderHistoryCard() : null}

            <p className="m-0 text-[0.8rem] text-text-muted">
              Record created {formatDateTime(employee.createdAt)} · Last updated{" "}
              {formatDateTime(employee.updatedAt)}
            </p>
          </div>
        ) : (
          <div className="min-h-[420px]" />
        )}
      </Spin>

      {documentPreview
        ? createPortal(
            <div className={`${modalBackdrop}`} onClick={closeDocumentPreview}>
              <div
                className={`${modalPanel} grid gap-3`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="employee-document-preview-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={`${modalHeader}`}>
                  <div>
                    <h3 id="employee-document-preview-title">
                      {documentPreview.title}
                    </h3>
                    <p className="m-0 text-[0.92rem] font-semibold text-text">
                      {documentPreview.fileName}
                    </p>
                  </div>
                  <PrimaryButton
                    type="button"
                    className={`${modalClose}`}
                    aria-label="Close"
                    onClick={closeDocumentPreview}
                    icon={
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        size={18}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                    }
                  />
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-[color-mix(in_srgb,var(--color-page-bg)_70%,var(--color-surface))] [&_img]:mx-auto [&_img]:max-h-[60vh] [&_img]:max-w-full [&_img]:object-contain [&_iframe]:h-[60vh] [&_iframe]:w-full [&_iframe]:border-0">
                  {documentPreview.loading ? (
                    <div className="grid min-h-[200px] place-items-center p-6">
                      <Spin />
                    </div>
                  ) : isImageMime(documentPreview.mimeType) ? (
                    <img
                      src={documentPreview.url}
                      alt={documentPreview.fileName}
                    />
                  ) : isPdfMime(
                      documentPreview.mimeType,
                      documentPreview.fileName,
                    ) ? (
                    <iframe
                      title={documentPreview.fileName}
                      src={documentPreview.url}
                    />
                  ) : (
                    <div className="p-6 text-center [&_p]:mb-3 [&_p]:mt-0 [&_p]:text-text-muted">
                      <p>Preview is not available for this file type.</p>
                      <a
                        href={documentPreview.url}
                        download={documentPreview.fileName}
                      >
                        Download {documentPreview.fileName}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
