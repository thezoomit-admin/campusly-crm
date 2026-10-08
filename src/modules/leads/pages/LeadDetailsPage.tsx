import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Breadcrumb, Modal, Skeleton } from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CheckmarkCircle02Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { PrimaryButton } from "@/components/ui";
import { DeleteModal } from "@/components/common/Modals";
import { PageMeta } from "@/components/common/Meta";
import { getApiError, getApiErrorFields } from "@/lib/api";
import { hasPermission } from "../../../lib/access";
import type { AuthSession } from "../../../types";
import { useLeadMasterOptions } from "../hooks/useLeadMasterOptions";
import {
  useAssignLeadMutation,
  useDeleteLeadDocumentMutation,
  useGetLeadDocumentChecklistQuery,
  useHandoverLeadMutation,
  useCloseLeadMutation,
  useGetLeadQuery,
  useLazyFetchLeadDocumentBlobQuery,
  useCreateLeadNoteMutation,
  useListLeadAssignmentsQuery,
  useListLeadDocumentsQuery,
  useListLeadNotesQuery,
  useRejectLeadDocumentMutation,
  useReopenLeadMutation,
  useReviewDuplicateLeadMutation,
  useUpdateLeadPriorityMutation,
  useUpdateLeadQualificationMutation,
  useUpdateLeadStatusMutation,
  useUploadLeadDocumentMutation,
  useVerifyLeadDocumentMutation,
} from "../api/leadsApi";
import { useListMasterDataOptionsQuery } from "@/redux/features/masterData/masterDataApi";
import DuplicateReviewModal, {
  type DuplicateReviewAction,
} from "../components/DuplicateReviewModal";
import {
  useCreateActivityMutation,
  useListActivityFeedQuery,
} from "@/redux/features/activities/activitiesApi";
import { useListLeadCommunicationsQuery } from "@/modules/communications/api/communicationsApi";
import {
  useCancelFollowUpMutation,
  useCompleteFollowUpMutation,
  useCreateFollowUpMutation,
  useListLeadFollowUpsQuery,
  useRescheduleFollowUpMutation,
} from "@/modules/follow-ups/api/followUpsApi";
import FollowUpFormModal from "@/modules/follow-ups/components/FollowUpFormModal";
import {
  CancelFollowUpModal,
  CompleteFollowUpModal,
  RescheduleFollowUpModal,
} from "@/modules/follow-ups/components/FollowUpLifecycleModals";
import LeadFollowUpHistoryPanel from "@/modules/follow-ups/components/LeadFollowUpHistoryPanel";
import { LeadWhatsAppPanel } from "@/modules/whatsapp";
import { LeadEmailPanel } from "@/modules/email";
import type {
  CompleteFollowUpValues,
  FollowUpFormValues,
  FollowUpRecord,
  RescheduleFollowUpValues,
} from "@/modules/follow-ups/types";
import type { LeadDocumentItem } from "../types";
import {
  LEAD_PRIMARY_TABS,
  parseLeadMoreTab,
  parseLeadPrimaryTab,
  type LeadMoreTabKey,
  type LeadPrimaryTabKey,
} from "../utils/leadDetails";
import LeadWorkspaceHeader from "../components/details/LeadWorkspaceHeader";
import LeadJourneyBar from "../components/details/LeadJourneyBar";
import LeadDetailsSidebar from "../components/details/LeadDetailsSidebar";
import LeadOverviewPanels, {
  LeadAcademicPanel,
  LeadStudyVisaPanel,
} from "../components/details/LeadOverviewPanels";
import {
  LeadActivitiesPanel,
  LeadAssignmentHistoryPanel,
  LeadCommunicationsPanel,
  LeadDocumentsPanel,
  LeadMoreTabShell,
  LeadNotesPanel,
  LeadPaymentsPanel,
  LeadServicesPanel,
  LeadTimelinePanel,
} from "../components/details/LeadTabPanels";
import FileDocumentsPanel from "../components/details/FileDocumentsPanel";
import {
  AddActivityModal,
  AddLeadDocumentModal,
  ChangeOwnerModal,
  DuplicateDocumentModal,
  HandoverLeadModal,
  ChangeStatusModal,
  CloseLeadModal,
  OverridePriorityModal,
  QualifyLeadModal,
  ReopenLeadModal,
  VerifyLeadDocumentModal,
  ViewLeadDocumentModal,
  type UploadLeadDocumentForm,
} from "../components/details/LeadDetailsModals";
import type {
  ChangeStatusEmailPayload,
  ChangeStatusSubmitPayload,
} from "../components/details/ChangeStatusModal";
import {
  useSendEmailMessageMutation,
  useStartLeadEmailMutation,
} from "@/modules/email/api/emailApi";
import LogConversationWizard, {
  type LogConversationSubmitPayload,
} from "../components/details/LogConversationWizard";
import type { QualificationFormValues } from "../utils/leadQualification";
import { adminPage } from "../../../styles/admin";

export default function LeadDetailsPage() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = useOutletContext<AuthSession>();
  const navigate = useNavigate();
  const options = useLeadMasterOptions();
  const {
    data,
    isFetching,
    isError,
    error,
    refetch: refetchLead,
  } = useGetLeadQuery(id, { skip: !id });
  const [updateQualification, { isLoading: qualifying }] =
    useUpdateLeadQualificationMutation();
  const [updatePriority, { isLoading: prioritySaving }] =
    useUpdateLeadPriorityMutation();
  const [updateStatus, { isLoading: statusSaving }] =
    useUpdateLeadStatusMutation();
  const [closeLead, { isLoading: closeSaving }] = useCloseLeadMutation();
  const [reopenLead, { isLoading: reopenSaving }] = useReopenLeadMutation();
  const [reviewDuplicateLead, { isLoading: duplicateReviewSaving }] =
    useReviewDuplicateLeadMutation();
  const [createFollowUp, { isLoading: followUpSaving }] =
    useCreateFollowUpMutation();
  const [createActivity, { isLoading: activitySaving }] =
    useCreateActivityMutation();
  const [assignLead, { isLoading: ownerSaving }] = useAssignLeadMutation();
  const [handoverLead, { isLoading: handoverSaving }] =
    useHandoverLeadMutation();
  const [completeFollowUp, { isLoading: completing }] =
    useCompleteFollowUpMutation();
  const [rescheduleFollowUp, { isLoading: rescheduling }] =
    useRescheduleFollowUpMutation();
  const [cancelFollowUp, { isLoading: cancelling }] =
    useCancelFollowUpMutation();
  const [startLeadEmail] = useStartLeadEmailMutation();
  const [sendEmailMessage, { isLoading: emailSending }] =
    useSendEmailMessageMutation();
  async function refreshLeadWorkspace() {
    if (!id) return;
    await refetchLead();
  }

  const rawTab = searchParams.get("tab");
  const tab = parseLeadPrimaryTab(rawTab);
  const moreTab = parseLeadMoreTab(searchParams.get("section"), rawTab);

  const syncWorkspaceTabs = useCallback(
    (nextTab: LeadPrimaryTabKey, nextMore: LeadMoreTabKey) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (nextTab === "overview") params.delete("tab");
          else params.set("tab", nextTab);
          if (nextTab === "more") {
            if (nextMore === "communications") params.delete("section");
            else params.set("section", nextMore);
          } else {
            params.delete("section");
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setTab = useCallback(
    (nextTab: LeadPrimaryTabKey) => {
      syncWorkspaceTabs(nextTab, moreTab);
    },
    [moreTab, syncWorkspaceTabs],
  );

  const setMoreTab = useCallback(
    (nextMore: LeadMoreTabKey) => {
      syncWorkspaceTabs("more", nextMore);
    },
    [syncWorkspaceTabs],
  );

  const lead = data?.lead;
  const canEdit = hasPermission(auth, "lead:edit");
  const canQualify = hasPermission(auth, "lead:qualify");
  const canOverridePriority = hasPermission(auth, "lead:override_priority");
  const canUpdateStatus = hasPermission(auth, "lead:update_status");
  const canClosePermission = hasPermission(auth, "lead:close");
  const canReopenPermission = hasPermission(auth, "lead:reopen");
  const canChangeStatus = Boolean(
    canUpdateStatus && lead?.statusChange?.canUpdate,
  );
  const canClose = Boolean(canClosePermission && lead?.statusChange?.canClose);
  const canReopen = Boolean(
    canReopenPermission && lead?.statusChange?.canReopen,
  );
  const canFollowUp = hasPermission(auth, "follow_up:create");
  const canEditFollowUp = hasPermission(auth, "follow_up:edit");
  const canViewFollowUp = hasPermission(auth, "follow_up:view");
  const canViewActivity = hasPermission(auth, "activity:view");
  const canAddActivity = hasPermission(auth, "activity:create");
  const canViewCommunications =
    hasPermission(auth, "communication:view") ||
    hasPermission(auth, "lead:view");
  const canViewWhatsApp = hasPermission(auth, "communication:view");
  const canViewEmail = hasPermission(auth, "communication:view");
  const canAssign = hasPermission(auth, "lead:assign");
  const canReassign = hasPermission(auth, "lead:reassign");
  const canChangeOwner = Boolean(lead?.owner?.id ? canReassign : canAssign);
  const canViewServices = hasPermission(auth, "service:view");
  const canOffer = hasPermission(auth, "service:offer");
  const canViewPayments = hasPermission(auth, "payment:view");
  const canUploadDocument = hasPermission(auth, "document:upload");
  const canDeleteDocument = hasPermission(auth, "document:delete");
  const canVerifyDocument = hasPermission(auth, "document:verify");
  const canDownloadDocument = hasPermission(auth, "document:download");
  const qualified =
    (lead?.statusCode || "").toUpperCase() === "QUALIFIED" ||
    (lead?.status || "").trim().toLowerCase() === "qualified";
  const canHandover = Boolean(
    hasPermission(auth, "lead:handover") &&
    qualified &&
    !lead?.statusChange?.locked,
  );
  const canManageDuplicate = hasPermission(auth, "lead:manage_duplicate");
  const canDeleteLead =
    hasPermission(auth, "lead:delete") ||
    Boolean(lead?.isDuplicate && canManageDuplicate);

  const { data: activityData, isFetching: activityLoading } =
    useListActivityFeedQuery(
      { relatedId: id },
      { skip: !id || !canViewActivity },
    );
  const { data: communicationsData, isFetching: communicationsLoading } =
    useListLeadCommunicationsQuery(id, {
      skip:
        !id ||
        !canViewCommunications ||
        !(tab === "more" && moreTab === "communications"),
    });
  const { data: assignmentData, isFetching: assignmentsLoading } =
    useListLeadAssignmentsQuery(id, {
      skip: !id || tab !== "assignments",
    });
  const { data: followUpData, isFetching: followUpsLoading } =
    useListLeadFollowUpsQuery(id, {
      skip: !id || !canViewFollowUp || tab !== "followups",
    });
  const [uploadLeadDocument, { isLoading: documentUploading }] =
    useUploadLeadDocumentMutation();
  const [verifyLeadDocument, { isLoading: documentVerifying }] =
    useVerifyLeadDocumentMutation();
  const [rejectLeadDocument, { isLoading: documentRejecting }] =
    useRejectLeadDocumentMutation();
  const [deleteLeadDocument, { isLoading: documentDeleting }] =
    useDeleteLeadDocumentMutation();
  const [fetchLeadDocumentBlob] = useLazyFetchLeadDocumentBlobQuery();
  const previewUrlRef = useRef("");
  const pendingUploadRef = useRef<UploadLeadDocumentForm | null>(null);

  const [createLeadNote] = useCreateLeadNoteMutation();
  const { data: notesData, isFetching: notesLoading } = useListLeadNotesQuery(
    id,
    {
      skip: !id || tab !== "notes",
    },
  );
  const [followUpOpen, setFollowUpOpen] = useState(
    searchParams.get("followUp") === "1",
  );
  const [activityOpen, setActivityOpen] = useState(false);
  const [logConversationOpen, setLogConversationOpen] = useState(false);
  const [logConversationSaving, setLogConversationSaving] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [defaultDocTypeCode, setDefaultDocTypeCode] = useState<
    string | undefined
  >();
  const [showArchivedDocs, setShowArchivedDocs] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [verifyTarget, setVerifyTarget] = useState<LeadDocumentItem | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<LeadDocumentItem | null>(
    null,
  );
  const [preview, setPreview] = useState<{
    fileName: string;
    mimeType: string;
    url: string;
    loading: boolean;
  } | null>(null);

  const { data: documentsData, isFetching: documentsLoading } =
    useListLeadDocumentsQuery(
      { id: id || "", archived: showArchivedDocs },
      { skip: !id || tab !== "attachments" },
    );
  const { data: checklistData } = useGetLeadDocumentChecklistQuery(id || "", {
    skip: !id || tab !== "attachments" || showArchivedDocs,
  });
  const { data: documentCategoryData } = useListMasterDataOptionsQuery(
    { category: "DOCUMENT_CATEGORY" },
    { skip: tab !== "attachments" },
  );
  const { data: documentTypeData } = useListMasterDataOptionsQuery(
    { category: "DOCUMENT_TYPE" },
    { skip: tab !== "attachments" },
  );
  const documentCategories = useMemo(() => {
    const items = documentCategoryData?.items || [];
    if (items.length) {
      return items
        .filter((item) => item.code)
        .map((item) => ({
          value: item.code as string,
          label: item.name,
          id: item.id,
        }));
    }
    return [
      { value: "PERSONAL", label: "Personal Documents" },
      { value: "ACADEMIC", label: "Academic Documents" },
      { value: "LANGUAGE", label: "Language Documents" },
      { value: "FINANCIAL", label: "Financial Documents" },
      { value: "APPLICATION", label: "Application Documents" },
      { value: "OTHER", label: "Other" },
    ];
  }, [documentCategoryData]);
  const documentTypes = useMemo(() => {
    const items = documentTypeData?.items || [];
    if (items.length) {
      return items
        .filter((item) => item.code)
        .map((item) => ({
          value: item.code as string,
          label: item.name,
          parentId: item.parentId,
          parentCode: null as string | null,
        }));
    }
    return [
      { value: "PASSPORT", label: "Passport", parentCode: "PERSONAL" },
      { value: "NID", label: "NID", parentCode: "PERSONAL" },
      { value: "IELTS", label: "IELTS", parentCode: "LANGUAGE" },
      {
        value: "TRANSCRIPT",
        label: "Academic Transcript",
        parentCode: "ACADEMIC",
      },
      {
        value: "BANK_STATEMENT",
        label: "Bank Statement",
        parentCode: "FINANCIAL",
      },
      { value: "OTHER", label: "Other Document", parentCode: "OTHER" },
    ];
  }, [documentTypeData]);
  const activities = activityData?.items || [];
  const communications = communicationsData?.items || [];
  const assignmentHistory = assignmentData?.items || [];
  const noteHistory = notesData?.items || [];
  const documents = documentsData?.items || [];
  const followUps = followUpData?.items || [];
  const [qualifyOpen, setQualifyOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({});
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeErrors, setCloseErrors] = useState<Record<string, string>>({});
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenErrors, setReopenErrors] = useState<Record<string, string>>({});
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [duplicateReviewOpen, setDuplicateReviewOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] =
    useState<FollowUpRecord | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [qual, setQual] = useState<QualificationFormValues>({
    academicFitCode: "",
    financialReadinessCode: "",
    englishReadinessCode: "",
    countryIntakeFitCode: "",
    studyIntentQualCode: "",
    applicationReadinessCode: "",
    decisionTimelineCode: "",
    qualificationResultCode: "",
    unqualifiedReasonCode: "",
    unqualifiedRemarks: "",
  });

  useEffect(() => {
    if (!lead) return;
    setQual({
      academicFitCode: lead.academicFitCode || "",
      financialReadinessCode: lead.financialReadinessCode || "",
      englishReadinessCode: lead.englishReadinessCode || "",
      countryIntakeFitCode: lead.countryIntakeFitCode || "",
      studyIntentQualCode:
        lead.studyIntentQualCode || lead.studyIntentCode || "",
      applicationReadinessCode: lead.applicationReadinessCode || "",
      decisionTimelineCode: lead.decisionTimelineCode || "",
      qualificationResultCode: lead.qualificationResultCode || "",
      unqualifiedReasonCode: lead.unqualifiedReasonCode || "",
      unqualifiedRemarks: lead.unqualifiedRemarks || "",
    });
  }, [lead]);

  useEffect(() => {
    if (searchParams.get("followUp") === "1") setFollowUpOpen(true);
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }
    };
  }, []);

  const pageTitle = useMemo(
    () => (lead ? `${lead.code} — ${lead.name}` : "Lead Details"),
    [lead],
  );

  function releasePreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  }

  function closeDocumentPreview() {
    releasePreviewUrl();
    setPreview(null);
  }

  async function submitDocumentUpload(body: UploadLeadDocumentForm) {
    if (!canUploadDocument || !id) return;
    try {
      await uploadLeadDocument({
        id,
        file: body.file,
        categoryCode: body.categoryCode,
        typeCode: body.typeCode,
        name: body.name,
        fileName: body.file.name,
        documentDate: body.documentDate,
        expiryDate: body.expiryDate,
        remarks: body.remarks,
        duplicateAction: body.duplicateAction,
      }).unwrap();
      toast.success("Document uploaded.");
      setDocumentOpen(false);
      setDefaultDocTypeCode(undefined);
      setDuplicateOpen(false);
      pendingUploadRef.current = null;
    } catch (error) {
      const apiError = error as {
        status?: number;
        data?: { code?: string; message?: string; actions?: string[] };
      };
      if (
        apiError?.status === 409 ||
        apiError?.data?.code === "DUPLICATE_DOCUMENT"
      ) {
        pendingUploadRef.current = body;
        setDuplicateName(body.name || "This");
        setDuplicateOpen(true);
        return;
      }
      toast.error(
        getApiError(error, "Unable to upload the document. Please try again."),
      );
    }
  }

  async function handleUploadDocument(body: UploadLeadDocumentForm) {
    await submitDocumentUpload(body);
  }

  async function openDocumentPreview(document: LeadDocumentItem) {
    if (!id) return;
    if (document.canPreview === false) {
      toast.error("You are not authorized to access this document.");
      return;
    }
    releasePreviewUrl();
    setPreview({
      fileName: document.fileName,
      mimeType: document.mimeType,
      url: "",
      loading: true,
    });
    try {
      const data = await fetchLeadDocumentBlob({
        id,
        documentId: document.id,
      }).unwrap();
      const url = URL.createObjectURL(data.blob);
      previewUrlRef.current = url;
      setPreview({
        fileName: document.fileName,
        mimeType: data.mimeType || document.mimeType,
        url,
        loading: false,
      });
    } catch (error) {
      setPreview(null);
      toast.error(getApiError(error, "Unable to load the document."));
    }
  }

  async function confirmDeleteDocument() {
    if (!canDeleteDocument || !id || !deleteTarget) return;
    try {
      await deleteLeadDocument({ id, documentId: deleteTarget.id }).unwrap();
      toast.success("Document archived.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getApiError(error, "Unable to archive document."));
    }
  }

  async function onOverridePriority(priorityCode: string, reason: string) {
    if (!canOverridePriority || !id) return;
    try {
      await updatePriority({
        id,
        body: { priorityCode, priorityOverrideReason: reason },
      }).unwrap();
      toast.success("Lead priority updated.");
      setPriorityOpen(false);
    } catch (error) {
      toast.error(getApiError(error, "Unable to update priority."));
    }
  }

  async function onQualify() {
    if (!canQualify || !id) return;
    try {
      await updateQualification({ id, body: qual }).unwrap();
      toast.success("Qualification saved.");
      setQualifyOpen(false);

      const markedQualified = qual.qualificationResultCode === "QUALIFIED";
      const alreadyQualified =
        (lead?.statusCode || "").toUpperCase() === "QUALIFIED" ||
        (lead?.status || "").trim().toLowerCase() === "qualified";
      if (markedQualified && canChangeStatus && !alreadyQualified) {
        Modal.confirm({
          title: "Update pipeline status?",
          content:
            "Qualification result is Qualified. Do you want to move this lead to Qualified status in the pipeline now?",
          okText: "Change status",
          cancelText: "Not now",
          okButtonProps: {
            className:
              "!bg-primary !border-primary hover:!bg-primary-hover hover:!border-primary-hover",
          },
          cancelButtonProps: {
            className: "hover:!border-primary hover:!text-primary",
          },
          onOk: () => setStatusOpen(true),
        });
      }
    } catch (error) {
      toast.error(getApiError(error, "Unable to save qualification."));
    }
  }

  const onQualChange = useCallback(
    (key: keyof QualificationFormValues, value: string) => {
      setQual((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  async function onUpdateStatus(body: ChangeStatusSubmitPayload) {
    if (!canUpdateStatus || !id || !lead) return;
    setStatusErrors({});
    try {
      const channelNote =
        body.channels.length > 0 ? `Channel: ${body.channels.join(", ")}` : "";
      const remarks = [body.remarks.trim(), channelNote]
        .filter(Boolean)
        .join("\n");

      await updateStatus({
        id,
        body: {
          statusCode: body.statusCode,
          remarks,
          lostReasonCode: body.lostReasonCode,
          override: body.override,
          overrideReason: body.overrideReason,
        },
      }).unwrap();

      if (body.nextFollowUpAt) {
        const followUpType = body.channels.includes("CALL")
          ? "Call"
          : body.channels.includes("WHATSAPP")
            ? "WhatsApp"
            : body.channels.includes("EMAIL")
              ? "Email"
              : body.channels.includes("SMS")
                ? "SMS"
                : "Call";
        const reason =
          body.remarks.trim() || "Next follow-up updated with status change";
        // Preserve time-of-day from the current next follow-up (date picker is date-only).
        const previousDue = lead.nextFollowUp?.dueAt
          ? dayjs(lead.nextFollowUp.dueAt)
          : null;
        const nextDueAt = previousDue?.isValid()
          ? dayjs(body.nextFollowUpAt)
              .hour(previousDue.hour())
              .minute(previousDue.minute())
              .second(0)
              .millisecond(0)
              .toISOString()
          : dayjs(body.nextFollowUpAt)
              .hour(10)
              .minute(0)
              .second(0)
              .millisecond(0)
              .toISOString();

        if (lead.nextFollowUp && canEditFollowUp) {
          // Reschedule so the old open follow-up is closed; otherwise getLead still
          // returns the earliest open dueAt and the countdown/UI never updates.
          const currentNextId = lead.nextFollowUp.id;
          await rescheduleFollowUp({
            id: currentNextId,
            body: { dueAt: nextDueAt, reason },
          }).unwrap();

          const otherOpen = followUps.filter(
            (item) =>
              item.id !== currentNextId &&
              ["Pending", "Due Soon", "Overdue"].includes(item.status),
          );
          for (const item of otherOpen) {
            await cancelFollowUp({
              id: item.id,
              body: { reason: "Superseded by status change follow-up" },
            }).unwrap();
          }
        } else if (canFollowUp) {
          await createFollowUp({
            leadId: id,
            type: followUpType,
            dueAt: nextDueAt,
            priority: "Medium",
            purpose: "Other",
            purposeOther: "Status change follow-up",
            notes: body.remarks,
            nextAction:
              body.remarks.slice(0, 200) || "Follow up after status change",
            reminder: "No Reminder",
          }).unwrap();
        }
      }

      if (body.scheduleMeeting && body.meeting) {
        const meeting = body.meeting;
        const startIso =
          meeting.date && meeting.startTime
            ? dayjs(`${meeting.date}T${meeting.startTime}:00`).toISOString()
            : meeting.date
              ? dayjs(`${meeting.date}T09:00:00`).toISOString()
              : body.nextFollowUpAt;
        const meetingNotes = [
          meeting.title,
          `Type: ${meeting.type}`,
          `Mode: ${meeting.mode}`,
          meeting.location ? `Location: ${meeting.location}` : "",
          meeting.endTime ? `End: ${meeting.endTime}` : "",
          meeting.agenda ? `Agenda: ${meeting.agenda}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        if (canAddActivity) {
          await createActivity({
            type: "MEETING",
            notes: meetingNotes,
            outcome: "Scheduled",
            nextAction: meeting.agenda || meeting.title || "Scheduled meeting",
            relatedType: "lead",
            relatedId: id,
            relatedName: lead.name,
          }).unwrap();
        }

        if (canFollowUp && startIso) {
          await createFollowUp({
            leadId: id,
            type: "Meeting",
            dueAt: startIso,
            priority: "Medium",
            purpose: "Other",
            purposeOther: meeting.type || "Scheduled meeting",
            notes: meetingNotes,
            nextAction: meeting.agenda || meeting.title || "Scheduled meeting",
            reminder: "No Reminder",
          }).unwrap();
        }
      }

      if (canUploadDocument && body.attachment) {
        const attachmentName =
          body.attachment.name.replace(/\.[^.]+$/, "") || body.attachment.name;
        await uploadLeadDocument({
          id,
          file: body.attachment,
          categoryCode: "OTHER",
          typeCode: "OTHER",
          name: attachmentName.slice(0, 150),
          fileName: body.attachment.name,
        }).unwrap();
      }

      await refreshLeadWorkspace();
      toast.success("Lead status updated.");
      setStatusOpen(false);
    } catch (error) {
      const fields = getApiErrorFields(error);
      if (Object.keys(fields).length > 0) setStatusErrors(fields);
      toast.error(
        getApiError(
          error,
          "Unable to update the lead status. Please try again.",
        ),
      );
    }
  }

  async function onSendStatusEmail(body: ChangeStatusEmailPayload) {
    if (!id || !lead?.email) {
      toast.error("This lead has no email address.");
      return;
    }
    try {
      const started = await startLeadEmail(id).unwrap();
      await sendEmailMessage({
        id: started.thread.id,
        to: lead.email,
        subject: body.subject,
        text: body.body,
      }).unwrap();
      toast.success("Email sent.");
      setStatusOpen(false);
      if (canViewEmail) openMoreTab("email");
    } catch (error) {
      toast.error(
        getApiError(error, "Unable to send email. Please try again."),
      );
    }
  }

  async function onCloseLead(body: {
    statusCode: string;
    reasonCode: string;
    remarks: string;
  }) {
    if (!canClose || !id) return;
    setCloseErrors({});
    try {
      await closeLead({ id, body }).unwrap();
      toast.success("Lead closed successfully.");
      setCloseOpen(false);
    } catch (error) {
      const fields = getApiErrorFields(error);
      if (Object.keys(fields).length > 0) setCloseErrors(fields);
      toast.error(
        getApiError(error, "Unable to complete this action. Please try again."),
      );
    }
  }

  async function onReviewDuplicate(action: DuplicateReviewAction) {
    if (!canManageDuplicate || !id) return;
    if (action === "delete") {
      const confirmed = window.confirm(
        "Delete this lead permanently? This cannot be undone.",
      );
      if (!confirmed) return;
    }
    if (action === "archive") {
      const confirmed = window.confirm(
        "Archive this lead and remove it from the active list?",
      );
      if (!confirmed) return;
    }
    try {
      const result = await reviewDuplicateLead({ id, action }).unwrap();
      toast.success(result.message || "Duplicate review saved.");
      setDuplicateReviewOpen(false);
      if (action === "archive" || action === "delete") {
        navigate("/leads", { replace: true });
      }
    } catch (error) {
      toast.error(
        getApiError(
          error,
          "Unable to complete duplicate review. Please try again.",
        ),
      );
    }
  }

  async function onReopenLead(body: {
    reopenReason: string;
    followUpDate: string;
    ownerId: string;
  }) {
    if (!canReopen || !id) return;
    setReopenErrors({});
    try {
      await reopenLead({ id, body }).unwrap();
      toast.success("Lead reopened successfully.");
      setReopenOpen(false);
    } catch (error) {
      const fields = getApiErrorFields(error);
      if (Object.keys(fields).length > 0) setReopenErrors(fields);
      toast.error(
        getApiError(error, "Unable to complete this action. Please try again."),
      );
    }
  }

  async function onFollowUp(values: FollowUpFormValues) {
    try {
      await createFollowUp({ ...values, leadId: id }).unwrap();
      await refreshLeadWorkspace();
      toast.success("Follow-up scheduled.");
      setFollowUpOpen(false);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("tab", "followups");
          params.delete("section");
          params.delete("followUp");
          return params;
        },
        { replace: true },
      );
    } catch (error) {
      toast.error(getApiError(error, "Unable to create follow-up."));
      throw error;
    }
  }

  async function onCompleteFollowUp(values: CompleteFollowUpValues) {
    if (!selectedFollowUp) return;
    try {
      await completeFollowUp({
        id: selectedFollowUp.id,
        body: values,
      }).unwrap();
      await refreshLeadWorkspace();
      toast.success(
        values.createNextFollowUp
          ? "Follow-up completed and next scheduled."
          : "Follow-up completed.",
      );
      setCompleteOpen(false);
      setSelectedFollowUp(null);
    } catch (error) {
      toast.error(getApiError(error, "Unable to complete follow-up."));
    }
  }

  async function onRescheduleFollowUp(values: RescheduleFollowUpValues) {
    if (!selectedFollowUp) return;
    try {
      await rescheduleFollowUp({
        id: selectedFollowUp.id,
        body: values,
      }).unwrap();
      await refreshLeadWorkspace();
      toast.success("Follow-up rescheduled.");
      setRescheduleOpen(false);
      setSelectedFollowUp(null);
    } catch (error) {
      toast.error(getApiError(error, "Unable to reschedule follow-up."));
    }
  }

  async function onCancelFollowUp(reason: string) {
    if (!selectedFollowUp) return;
    try {
      await cancelFollowUp({
        id: selectedFollowUp.id,
        body: { reason },
      }).unwrap();
      await refreshLeadWorkspace();
      toast.success("Follow-up cancelled.");
      setCancelOpen(false);
      setSelectedFollowUp(null);
    } catch (error) {
      toast.error(getApiError(error, "Unable to cancel follow-up."));
    }
  }

  function openFollowUpActions(
    item: FollowUpRecord,
    action: "complete" | "reschedule" | "cancel",
  ) {
    setSelectedFollowUp(item);
    setCompleteOpen(action === "complete");
    setRescheduleOpen(action === "reschedule");
    setCancelOpen(action === "cancel");
  }

  async function onAddActivity(body: {
    type: string;
    notes: string;
    outcome: string;
    durationMin?: number | null;
    nextAction: string;
    createNextFollowUp: boolean;
    nextDueAt?: string;
    nextFollowUpType?: string;
    nextFollowUpPriority?: string;
  }) {
    try {
      if (body.createNextFollowUp && !body.nextDueAt) {
        toast.error("Follow-up date is required.");
        return;
      }
      if (body.createNextFollowUp && !body.nextAction.trim()) {
        toast.error("Please enter the next action.");
        return;
      }
      if (
        body.type === "CALL" &&
        body.outcome === "Other" &&
        !body.notes.trim()
      ) {
        toast.error("Please provide a reason.");
        return;
      }
      const result = await createActivity({
        type: body.type,
        notes: body.notes,
        outcome: body.outcome,
        durationMin: body.durationMin,
        nextAction: body.nextAction || undefined,
        nextDate: body.createNextFollowUp ? body.nextDueAt || null : null,
        createNextFollowUp: body.createNextFollowUp,
        nextFollowUpType: body.nextFollowUpType,
        nextFollowUpPriority: body.nextFollowUpPriority,
        relatedType: "lead",
        relatedId: id,
        relatedName: lead?.name,
      }).unwrap();
      if (result.nextFollowUp) {
        await refreshLeadWorkspace();
      }
      toast.success(
        result.nextFollowUp
          ? "Activity saved and next follow-up scheduled."
          : "Activity added.",
      );
      setActivityOpen(false);
    } catch (error) {
      toast.error(getApiError(error, "Unable to add activity."));
    }
  }

  async function onAssignOwner(ownerId: string, reason: string) {
    if (!id || !canChangeOwner) return;
    try {
      const result = await assignLead({
        id,
        body: { ownerId, reason: reason || undefined },
      }).unwrap();
      toast.success(result.message || "Lead assigned successfully.");
      setOwnerOpen(false);
    } catch (error) {
      toast.error(
        getApiError(
          error,
          "Unable to assign the selected lead. Please try again.",
        ),
      );
    }
  }

  async function saveHandover(body: {
    counsellorId: string;
    note: {
      studentRequirement?: string;
      preferredCountryCode?: string;
      preferredIntakeCode?: string;
      academicBackground?: string;
      conversationSummary?: string;
      importantConcern?: string;
    };
  }) {
    if (!id || !canHandover) return;
    try {
      const result = await handoverLead({ id, body }).unwrap();
      toast.success(result.message || "Lead handed over successfully.");
      setHandoverOpen(false);
      const stillVisible =
        auth.dataScopes.lead !== "OWN" || result.ownerId === auth.user.id;
      if (!stillVisible) navigate("/leads/mine");
    } catch (error) {
      toast.error(
        getApiError(
          error,
          "Unable to assign the lead to the selected Counsellor. Please try again.",
        ),
      );
    }
  }

  function openMoreTab(key: LeadMoreTabKey) {
    syncWorkspaceTabs("more", key);
  }

  function openNotes() {
    if (!canAddActivity) {
      setTab("notes");
      return;
    }
    setLogConversationOpen(true);
  }

  async function onLogConversation(payload: LogConversationSubmitPayload) {
    if (!id || !lead) return;
    setLogConversationSaving(true);
    try {
      const createNext =
        payload.addon === "meeting" || payload.addon === "followup";
      if (payload.followUpId && canEditFollowUp) {
        await completeFollowUp({
          id: payload.followUpId,
          body: {
            outcome: payload.followUpOutcome,
            notes: payload.notes,
            nextAction: createNext
              ? payload.nextAction || "Follow up"
              : payload.nextAction ||
                payload.notes.slice(0, 200) ||
                "Logged conversation",
            createNextFollowUp: createNext,
            nextDueAt: createNext ? payload.nextDueAt : undefined,
            nextType: createNext ? payload.nextFollowUpType : undefined,
            nextPriority: "Medium",
          },
        }).unwrap();
      }

      await createActivity({
        type: payload.activityType,
        notes: payload.notes,
        outcome: payload.outcome,
        nextAction:
          createNext && !(payload.followUpId && canEditFollowUp)
            ? payload.nextAction
            : undefined,
        nextDate:
          createNext && !(payload.followUpId && canEditFollowUp)
            ? payload.nextDueAt || null
            : null,
        createNextFollowUp:
          createNext && !(payload.followUpId && canEditFollowUp),
        nextFollowUpType:
          createNext && !(payload.followUpId && canEditFollowUp)
            ? payload.nextFollowUpType
            : undefined,
        nextFollowUpPriority:
          createNext && !(payload.followUpId && canEditFollowUp)
            ? "Medium"
            : undefined,
        relatedType: "lead",
        relatedId: id,
        relatedName: lead.name,
      }).unwrap();

      // Keep Note history in sync; activity is already logged above.
      if (canEdit && payload.notes.trim()) {
        await createLeadNote({
          id,
          body: payload.notes.trim(),
          skipActivity: true,
        }).unwrap();
      }

      await refreshLeadWorkspace();
      toast.success(
        createNext ? "Note saved and next item scheduled." : "Note saved.",
      );
      setLogConversationOpen(false);
      setTab("notes");
    } catch (error) {
      toast.error(getApiError(error, "Unable to save note."));
    } finally {
      setLogConversationSaving(false);
    }
  }

  const moreVisibleKeys = useMemo(() => {
    const keys: LeadMoreTabKey[] = [];
    if (canViewCommunications) keys.push("communications");
    if (canViewWhatsApp) keys.push("whatsapp");
    if (canViewEmail) keys.push("email");
    if (canViewServices) keys.push("services");
    if (canViewPayments) keys.push("payments");
    return keys;
  }, [
    canViewCommunications,
    canViewWhatsApp,
    canViewEmail,
    canViewServices,
    canViewPayments,
  ]);

  useEffect(() => {
    if (tab === "followups" && !canViewFollowUp) {
      syncWorkspaceTabs("overview", moreTab);
      return;
    }
    if (tab === "more" && moreVisibleKeys.length === 0) {
      syncWorkspaceTabs("overview", "communications");
      return;
    }
    if (tab === "more" && !moreVisibleKeys.includes(moreTab)) {
      syncWorkspaceTabs("more", moreVisibleKeys[0] || "communications");
    }
  }, [tab, moreTab, canViewFollowUp, moreVisibleKeys, syncWorkspaceTabs]);

  if (isError) {
    return (
      <div className={adminPage}>
        <PageMeta
          title="Lead Details"
          description="Lead workspace and qualification."
        />
        <Breadcrumb
          className="mb-3"
          items={[
            { title: <Link to="/leads">Leads</Link> },
            {
              title: (
                <span className="font-medium text-primary">Lead Details</span>
              ),
            },
          ]}
        />
        <p className="text-danger">
          {getApiError(
            error,
            "You do not have permission to access this lead's workspace.",
          )}
        </p>
        <PrimaryButton
          type="button"
          variant="outline"
          onClick={() => navigate("/leads")}
          label="Back to leads"
        />
      </div>
    );
  }

  return (
    <div className="grid min-w-0 max-w-full gap-4 overflow-x-hidden">
      <PageMeta
        title={pageTitle}
        description="Lead workspace, profile completion, and activity."
      />
      <Breadcrumb
        className="mb-0"
        items={[
          { title: <Link to="/leads">Leads</Link> },
          {
            title: (
              <span className="font-medium text-primary">Lead Details</span>
            ),
          },
        ]}
      />

      {isFetching && !lead ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton active paragraph={{ rows: 8 }} />
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      ) : null}

      {lead ? (
        <>
          <LeadWorkspaceHeader
            lead={lead}
            degreeOptions={options.degree}
            countryOptions={options.country}
            canEdit={canEdit}
            canReopen={canReopen}
            canHandover={canHandover}
            canManageDuplicate={canManageDuplicate}
            canOverridePriority={canOverridePriority}
            canAssign={canChangeOwner}
            onHandover={() => setHandoverOpen(true)}
            onEdit={() => navigate(`/leads/${id}/edit`)}
            onReopenLead={() => {
              setReopenErrors({});
              setReopenOpen(true);
            }}
            onReviewDuplicate={() => setDuplicateReviewOpen(true)}
            onOverridePriority={() => setPriorityOpen(true)}
            onAddNote={canAddActivity ? openNotes : undefined}
            onAddActivity={
              canAddActivity ? () => setActivityOpen(true) : undefined
            }
            onUploadFile={
              canUploadDocument ? () => setDocumentOpen(true) : undefined
            }
            onAssign={() => setOwnerOpen(true)}
          />

          <LeadJourneyBar lead={lead} />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
              {LEAD_PRIMARY_TABS.filter(
                (item) =>
                  (item.key !== "followups" || canViewFollowUp) &&
                  (item.key !== "more" || moreVisibleKeys.length > 0) &&
                  (item.key !== "file-documents" ||
                    lead.statusCode === "FILE_OPENED" ||
                    lead.statusChange?.current?.behaviorKey === "file_opened" ||
                    lead.status.trim().toLowerCase() === "file opened"),
              ).map((item) => {
                const active = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border-0 px-4 py-2 text-[0.9rem] transition-colors ${
                      active
                        ? "bg-section-tab-active-bg font-semibold text-section-tab-active-fg"
                        : "bg-section-tab-bg text-section-tab-fg hover:bg-section-tab-hover-bg"
                    }`}
                    onClick={() => setTab(item.key)}
                  >
                    {item.label}
                    {item.key === "more" ? (
                      <HugeiconsIcon
                        icon={MoreHorizontalIcon}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.8}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {canChangeStatus ? (
                <PrimaryButton
                  type="button"
                  size="sm"
                  variant="primary"
                  icon={
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  }
                  onClick={() => {
                    setStatusErrors({});
                    setStatusOpen(true);
                  }}
                  label="Change Status"
                />
              ) : null}
              {canFollowUp ? (
                <PrimaryButton
                  type="button"
                  size="sm"
                  variant="primary"
                  icon={<HugeiconsIcon icon={Calendar03Icon} size={15} />}
                  onClick={() => setFollowUpOpen(true)}
                  label="Add Follow-up"
                />
              ) : null}
            </div>
          </div>

          <div className="grid min-w-0 max-w-full items-start gap-4 overflow-x-hidden xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 max-w-full overflow-hidden">
              {tab === "overview" ? (
                <div className="grid gap-4">
                  <LeadOverviewPanels
                    lead={lead}
                    options={options}
                    canChangeSource={hasPermission(auth, "lead:change_source")}
                    canChangeCampaign={
                      hasPermission(auth, "lead:change_source") ||
                      hasPermission(auth, "campaign:manage")
                    }
                  />
                  <LeadAcademicPanel lead={lead} options={options} />
                  <LeadStudyVisaPanel lead={lead} options={options} />
                </div>
              ) : null}
              {tab === "timeline" ? (
                <LeadTimelinePanel
                  items={activities}
                  loading={activityLoading && activities.length === 0}
                />
              ) : null}
              {tab === "notes" ? (
                <LeadNotesPanel
                  notes={noteHistory}
                  loading={notesLoading}
                  canAdd={canAddActivity}
                  onAdd={openNotes}
                />
              ) : null}
              {tab === "attachments" ? (
                <LeadDocumentsPanel
                  documents={documents}
                  checklist={showArchivedDocs ? null : checklistData}
                  loading={documentsLoading}
                  canUpload={canUploadDocument}
                  canDelete={canDeleteDocument}
                  canVerify={canVerifyDocument}
                  showArchived={showArchivedDocs}
                  onToggleArchived={() =>
                    setShowArchivedDocs((value) => !value)
                  }
                  onAdd={() => {
                    setDefaultDocTypeCode(undefined);
                    setDocumentOpen(true);
                  }}
                  onUploadMissing={(typeCode) => {
                    setDefaultDocTypeCode(typeCode);
                    setDocumentOpen(true);
                  }}
                  onView={(document) => {
                    void openDocumentPreview(document);
                  }}
                  onVerify={(document) => setVerifyTarget(document)}
                  onDelete={(document) => setDeleteTarget(document)}
                  onCreateFollowUp={
                    canFollowUp
                      ? (_typeCode, name) => {
                          setFollowUpOpen(true);
                          toast.info(`Create a follow-up for missing: ${name}`);
                        }
                      : undefined
                  }
                />
              ) : null}
              {tab === "file-documents" ? (
                <FileDocumentsPanel
                  leadId={lead.id}
                  canUpload={canUploadDocument}
                  canVerify={canVerifyDocument}
                  canManage={canDeleteDocument}
                  canDownload={canDownloadDocument}
                />
              ) : null}
              {tab === "activities" ? (
                <LeadActivitiesPanel
                  activities={activities}
                  canAdd={canAddActivity}
                  onAdd={() => setActivityOpen(true)}
                />
              ) : null}
              {tab === "assignments" ? (
                <LeadAssignmentHistoryPanel
                  assignmentHistory={assignmentHistory}
                  loading={assignmentsLoading}
                />
              ) : null}
              {tab === "followups" && canViewFollowUp ? (
                <LeadFollowUpHistoryPanel
                  items={followUps}
                  loading={followUpsLoading}
                  canCreate={canFollowUp}
                  canEdit={canEditFollowUp}
                  onCreate={() => setFollowUpOpen(true)}
                  onComplete={(item) => openFollowUpActions(item, "complete")}
                  onReschedule={(item) =>
                    openFollowUpActions(item, "reschedule")
                  }
                  onCancel={(item) => openFollowUpActions(item, "cancel")}
                />
              ) : null}
              {tab === "more" && moreVisibleKeys.length > 0 ? (
                <LeadMoreTabShell
                  active={moreTab}
                  onChange={setMoreTab}
                  visibleKeys={moreVisibleKeys}
                >
                  {moreTab === "communications" && canViewCommunications ? (
                    <LeadCommunicationsPanel
                      items={communications}
                      loading={communicationsLoading}
                    />
                  ) : null}
                  {moreTab === "whatsapp" && canViewWhatsApp ? (
                    <LeadWhatsAppPanel
                      leadId={lead.id}
                      hasWhatsAppNumber={Boolean(lead.whatsapp || lead.phone)}
                    />
                  ) : null}
                  {moreTab === "email" && canViewEmail ? (
                    <LeadEmailPanel
                      leadId={lead.id}
                      hasEmail={Boolean(lead.email)}
                    />
                  ) : null}
                  {moreTab === "services" && canViewServices ? (
                    <LeadServicesPanel
                      leadId={lead.id}
                      leadName={lead.name}
                      leadCode={lead.code}
                      canOffer={canOffer}
                    />
                  ) : null}
                  {moreTab === "payments" && canViewPayments ? (
                    <LeadPaymentsPanel
                      leadId={lead.id}
                      leadName={lead.name}
                      leadCode={lead.code}
                    />
                  ) : null}
                </LeadMoreTabShell>
              ) : null}
            </div>

            <LeadDetailsSidebar
              lead={lead}
              activities={activities}
              options={options}
              canQualify={canQualify}
              onViewActivities={() => setTab("timeline")}
              onUpdateQualification={() => setQualifyOpen(true)}
            />
          </div>
        </>
      ) : null}

      <FollowUpFormModal
        open={followUpOpen && canFollowUp}
        saving={followUpSaving}
        fixedLeadId={id}
        fixedLeadLabel={lead ? `${lead.code} — ${lead.name}` : undefined}
        onClose={() => setFollowUpOpen(false)}
        onSubmit={onFollowUp}
      />
      <CompleteFollowUpModal
        open={completeOpen && canEditFollowUp}
        saving={completing}
        followUp={selectedFollowUp}
        onClose={() => {
          setCompleteOpen(false);
          setSelectedFollowUp(null);
        }}
        onSubmit={onCompleteFollowUp}
      />
      <RescheduleFollowUpModal
        open={rescheduleOpen && canEditFollowUp}
        saving={rescheduling}
        followUp={selectedFollowUp}
        onClose={() => {
          setRescheduleOpen(false);
          setSelectedFollowUp(null);
        }}
        onSubmit={onRescheduleFollowUp}
      />
      <CancelFollowUpModal
        open={cancelOpen && canEditFollowUp}
        saving={cancelling}
        followUp={selectedFollowUp}
        onClose={() => {
          setCancelOpen(false);
          setSelectedFollowUp(null);
        }}
        onSubmit={onCancelFollowUp}
      />
      <AddActivityModal
        open={activityOpen && canAddActivity}
        saving={activitySaving}
        onClose={() => setActivityOpen(false)}
        onSubmit={onAddActivity}
      />
      <LogConversationWizard
        open={logConversationOpen && canAddActivity}
        saving={logConversationSaving}
        lead={lead || null}
        onClose={() => setLogConversationOpen(false)}
        onSubmit={onLogConversation}
      />
      <AddLeadDocumentModal
        open={documentOpen && canUploadDocument}
        saving={documentUploading}
        categories={documentCategories}
        types={documentTypes}
        defaultTypeCode={defaultDocTypeCode}
        onClose={() => {
          setDocumentOpen(false);
          setDefaultDocTypeCode(undefined);
        }}
        onSubmit={handleUploadDocument}
      />
      <DuplicateDocumentModal
        open={duplicateOpen}
        documentName={duplicateName}
        saving={documentUploading}
        onClose={() => {
          setDuplicateOpen(false);
          pendingUploadRef.current = null;
        }}
        onReplace={() => {
          const pending = pendingUploadRef.current;
          if (!pending) return;
          void submitDocumentUpload({ ...pending, duplicateAction: "replace" });
        }}
        onNewVersion={() => {
          const pending = pendingUploadRef.current;
          if (!pending) return;
          void submitDocumentUpload({
            ...pending,
            duplicateAction: "new_version",
          });
        }}
      />
      <VerifyLeadDocumentModal
        open={Boolean(verifyTarget) && canVerifyDocument}
        document={verifyTarget}
        saving={documentVerifying || documentRejecting}
        onClose={() => setVerifyTarget(null)}
        onVerify={async (remarks) => {
          if (!id || !verifyTarget) return;
          try {
            await verifyLeadDocument({
              id,
              documentId: verifyTarget.id,
              remarks,
            }).unwrap();
            toast.success("Document verified.");
            setVerifyTarget(null);
          } catch (error) {
            toast.error(getApiError(error, "Unable to verify the document."));
          }
        }}
        onReject={async (reason) => {
          if (!id || !verifyTarget) return;
          try {
            await rejectLeadDocument({
              id,
              documentId: verifyTarget.id,
              reason,
            }).unwrap();
            toast.success("Document rejected.");
            setVerifyTarget(null);
          } catch (error) {
            toast.error(getApiError(error, "Unable to reject the document."));
          }
        }}
      />
      <ViewLeadDocumentModal
        open={Boolean(preview)}
        fileName={preview?.fileName || ""}
        mimeType={preview?.mimeType || ""}
        url={preview?.url || ""}
        loading={preview?.loading}
        onClose={closeDocumentPreview}
      />
      <DeleteModal
        open={Boolean(deleteTarget)}
        loading={documentDeleting}
        title="Archive document?"
        itemName={
          deleteTarget?.name || deleteTarget?.fileName || "this document"
        }
        message={
          deleteTarget ? (
            <>
              Archive{" "}
              <strong>{deleteTarget.name || deleteTarget.fileName}</strong>? It
              will be hidden from the active document list.
            </>
          ) : undefined
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDeleteDocument()}
      />
      <QualifyLeadModal
        open={qualifyOpen && canQualify}
        saving={qualifying}
        values={qual}
        options={options}
        onClose={() => setQualifyOpen(false)}
        onChange={onQualChange}
        onSubmit={onQualify}
      />
      <OverridePriorityModal
        open={priorityOpen && canOverridePriority}
        saving={prioritySaving}
        currentPriority={lead?.priority}
        currentPriorityCode={lead?.priorityCode}
        priorityOptions={options.priority}
        onClose={() => setPriorityOpen(false)}
        onSubmit={onOverridePriority}
      />
      <ChangeStatusModal
        open={statusOpen && canChangeStatus}
        saving={
          statusSaving ||
          followUpSaving ||
          rescheduling ||
          cancelling ||
          activitySaving ||
          documentUploading
        }
        emailSending={emailSending}
        leadName={lead?.name || "Lead"}
        leadEmail={lead?.email}
        activities={activities}
        options={lead?.statusChange?.options || []}
        lostReasons={options.lostReason}
        errors={statusErrors}
        onClose={() => setStatusOpen(false)}
        onSubmit={onUpdateStatus}
        onSendEmail={onSendStatusEmail}
        onViewHistory={() => {
          setStatusOpen(false);
          setTab("timeline");
        }}
      />
      <CloseLeadModal
        open={closeOpen && canClose}
        saving={closeSaving}
        currentStatus={lead?.status || ""}
        options={lead?.statusChange?.closeOptions || []}
        lostReasons={options.lostReason}
        closeReasons={options.closeReason}
        errors={closeErrors}
        onClose={() => setCloseOpen(false)}
        onSubmit={onCloseLead}
      />
      <ReopenLeadModal
        open={reopenOpen && canReopen}
        saving={reopenSaving}
        leadName={lead?.name}
        currentOwnerId={lead?.owner?.id || null}
        assignedTeamId={lead?.assignedTeam?.id || null}
        errors={reopenErrors}
        onClose={() => setReopenOpen(false)}
        onSubmit={onReopenLead}
      />
      <HandoverLeadModal
        open={handoverOpen && canHandover}
        lead={lead || null}
        countryOptions={options.country}
        intakeOptions={options.intake}
        resultOptions={options.result}
        saving={handoverSaving}
        onClose={() => setHandoverOpen(false)}
        onSubmit={saveHandover}
      />
      <ChangeOwnerModal
        open={ownerOpen && canChangeOwner}
        lead={lead || null}
        saving={ownerSaving}
        onClose={() => setOwnerOpen(false)}
        onSubmit={onAssignOwner}
      />
      <DuplicateReviewModal
        open={
          duplicateReviewOpen &&
          canManageDuplicate &&
          Boolean(lead?.isDuplicate)
        }
        lead={lead || null}
        loading={duplicateReviewSaving}
        canDelete={canDeleteLead}
        onClose={() => setDuplicateReviewOpen(false)}
        onAction={(action) => void onReviewDuplicate(action)}
      />
    </div>
  );
}
