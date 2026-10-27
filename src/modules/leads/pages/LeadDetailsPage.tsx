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
import { Calendar03Icon, Video01Icon } from "@hugeicons/core-free-icons";
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
  useRestoreLeadDocumentMutation,
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
import {
  useCancelFollowUpMutation,
  useCompleteFollowUpMutation,
  useCreateFollowUpMutation,
  useListLeadFollowUpsQuery,
} from "@/modules/follow-ups/api/followUpsApi";
import {
  useCancelMeetingMutation,
  useCompleteMeetingMutation,
  useCreateMeetingMutation,
} from "@/modules/meetings/api/meetingsApi";
import FollowUpFormModal from "@/modules/follow-ups/components/FollowUpFormModal";
import {
  CancelFollowUpModal,
  CompleteFollowUpModal,
} from "@/modules/follow-ups/components/FollowUpLifecycleModals";
import { LeadWhatsAppPanel } from "@/modules/whatsapp";
import { LeadEmailPanel } from "@/modules/email";
import type {
  CompleteFollowUpValues,
  FollowUpFormValues,
  FollowUpRecord,
} from "@/modules/follow-ups/types";
import type { LeadDocumentItem } from "../types";
import {
  isConvertedLeadStatus,
  readLastLeadDetailsTab,
  resolveActiveLeadTab,
  resolveLeadDetailsTabs,
  writeLastLeadDetailsTab,
  type LeadTabBadgeCounts,
  type LeadWorkspaceTabKey,
} from "../utils/leadDetails";
import LeadDetailsTabBar from "../components/details/LeadDetailsTabBar";
import LeadWorkspaceHeader from "../components/details/LeadWorkspaceHeader";
import LeadJourneyBar from "../components/details/LeadJourneyBar";
import LeadDetailsSidebar from "../components/details/LeadDetailsSidebar";
import CreateApplicationModal from "@/modules/applications/components/CreateApplicationModal";
import LeadOverviewPanels, {
  LeadAcademicPanel,
  LeadStudyVisaPanel,
} from "../components/details/LeadOverviewPanels";
import {
  LeadActivitiesPanel,
  LeadAssignmentHistoryPanel,
  LeadDocumentsPanel,
  LeadNotesPanel,
  LeadPaymentsPanel,
  LeadServicesPanel,
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
import AddNoteModal, {
  AddNotePartialError,
  type AddNoteMeetingPayload,
  type AddNoteSavedState,
  type AddNoteSubmitPayload,
} from "../components/details/AddNoteModal";
import ScheduleMeetingModal, {
  buildMeetingNotes,
  meetingStartIso,
  type ScheduleMeetingPayload,
} from "../components/details/ScheduleMeetingModal";
import type { QualificationFormValues } from "../utils/leadQualification";
import { adminPage } from "../../../styles/admin";

function addNoteSuccessMessage(payload: AddNoteSubmitPayload) {
  const followUp = Boolean(payload.followUp);
  const meeting = Boolean(payload.meeting);
  if (followUp && meeting) return "Note saved. Follow-up and meeting scheduled.";
  if (followUp) return "Note saved. Follow-up scheduled.";
  if (meeting) return "Note saved. Meeting scheduled.";
  return "Note saved.";
}

function partialNoteSaveMessage(
  saved: AddNoteSavedState,
  payload: AddNoteSubmitPayload,
  reason: string,
) {
  const done = [
    saved.note ? "Note" : "",
    saved.followUp ? "Follow-up" : "",
    saved.meeting ? "Meeting" : "",
  ].filter(Boolean);
  const failed = !saved.note
    ? "note"
    : payload.followUp && !saved.followUp
      ? "follow-up"
      : "meeting";
  const savedLabel = done.length > 0 ? `${done.join(", ")} saved.` : "";
  return `${savedLabel} The ${failed} could not be created. ${reason} Save again to finish without duplicating what already succeeded.`.trim();
}

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
  const [createMeeting] = useCreateMeetingMutation();
  const [completeMeeting] = useCompleteMeetingMutation();
  const [cancelMeeting] = useCancelMeetingMutation();
  const [createActivity, { isLoading: activitySaving }] =
    useCreateActivityMutation();
  const [assignLead, { isLoading: ownerSaving }] = useAssignLeadMutation();
  const [handoverLead, { isLoading: handoverSaving }] =
    useHandoverLeadMutation();
  const [completeFollowUp, { isLoading: completing }] =
    useCompleteFollowUpMutation();
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
  const rawSection = searchParams.get("section");

  const setTab = useCallback(
    (nextTab: LeadWorkspaceTabKey) => {
      writeLastLeadDetailsTab(nextTab);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("tab", nextTab);
          params.delete("section");
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
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
  const canConvert = hasPermission(auth, "lead:convert");
  const leadIsConverted = isConvertedLeadStatus(
    lead?.statusCode,
    lead?.status,
    lead?.statusChange?.current?.behaviorKey,
  );
  const canCreateApplication = Boolean(canConvert && leadIsConverted);
  const showFileDocumentsTab = Boolean(
    leadIsConverted ||
    lead?.hasCrmFile ||
    (lead?.applications?.length || 0) > 0 ||
    lead?.statusCode === "FILE_OPENED" ||
    lead?.statusChange?.current?.behaviorKey === "file_opened" ||
    lead?.status?.trim().toLowerCase() === "file opened",
  );
  const fileTabRequested =
    rawTab === "file-documents" || rawSection === "file-documents";
  const showFileDocuments =
    !lead && fileTabRequested ? true : showFileDocumentsTab;
  const {
    data: activityData,
    isFetching: activityLoading,
    refetch: refetchActivities,
  } = useListActivityFeedQuery(
    { relatedId: id },
    { skip: !id || !canViewActivity },
  );

  const badgeCounts = useMemo<LeadTabBadgeCounts>(
    () => ({
      documents: lead?.tabCounts?.documents ?? 0,
      notes: lead?.tabCounts?.notes ?? 0,
      activities: canViewActivity
        ? (activityData?.counts.all ?? lead?.tabCounts?.activities ?? 0)
        : 0,
    }),
    [activityData?.counts.all, canViewActivity, lead?.tabCounts],
  );

  const { primary: primaryTabs, more: moreTabs } = useMemo(
    () =>
      resolveLeadDetailsTabs(
        auth.role?.key,
        {
          canViewServices,
          canViewWhatsApp,
          canViewEmail,
          canViewPayments,
          showFileDocuments,
        },
        badgeCounts,
      ),
    [
      auth.role?.key,
      badgeCounts,
      canViewEmail,
      canViewPayments,
      canViewServices,
      canViewWhatsApp,
      showFileDocuments,
    ],
  );

  const visibleTabKeys = useMemo(
    () => [...primaryTabs, ...moreTabs].map((item) => item.key),
    [moreTabs, primaryTabs],
  );

  const tab = useMemo(
    () =>
      resolveActiveLeadTab({
        tabParam: rawTab,
        sectionParam: rawSection,
        visibleKeys: visibleTabKeys,
        storedKey: readLastLeadDetailsTab(),
      }),
    [rawSection, rawTab, visibleTabKeys],
  );

  useEffect(() => {
    // File Documents visibility depends on the lead. Wait for it before
    // applying a remembered tab, so a file tab is not cleared early.
    if (!lead && !rawTab && !rawSection) return;
    writeLastLeadDetailsTab(tab);
    if (rawTab === tab && !rawSection) return;
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set("tab", tab);
        params.delete("section");
        return params;
      },
      { replace: true },
    );
  }, [lead, rawSection, rawTab, setSearchParams, tab]);

  const { data: assignmentData, isFetching: assignmentsLoading } =
    useListLeadAssignmentsQuery(id, {
      skip: !id || tab !== "assignments",
      refetchOnMountOrArgChange: true,
    });
  const {
    data: followUpData,
    isFetching: followUpsLoading,
    refetch: refetchFollowUps,
  } = useListLeadFollowUpsQuery(id, {
    skip: !id || !canViewFollowUp,
  });
  const [uploadLeadDocument, { isLoading: documentUploading }] =
    useUploadLeadDocumentMutation();
  const [verifyLeadDocument, { isLoading: documentVerifying }] =
    useVerifyLeadDocumentMutation();
  const [rejectLeadDocument, { isLoading: documentRejecting }] =
    useRejectLeadDocumentMutation();
  const [deleteLeadDocument, { isLoading: documentDeleting }] =
    useDeleteLeadDocumentMutation();
  const [restoreLeadDocument, { isLoading: documentRestoring }] =
    useRestoreLeadDocumentMutation();
  const [fetchLeadDocumentBlob] = useLazyFetchLeadDocumentBlobQuery();
  const previewUrlRef = useRef("");
  const pendingUploadRef = useRef<UploadLeadDocumentForm | null>(null);

  const [createLeadNote] = useCreateLeadNoteMutation();
  const {
    data: notesData,
    isFetching: notesFetching,
    isUninitialized: notesUninitialized,
    isError: notesError,
  } = useListLeadNotesQuery(id, {
    skip: !id || tab !== "notes",
    refetchOnMountOrArgChange: true,
  });
  const notesLoading =
    tab === "notes" &&
    !notesError &&
    (notesUninitialized || (notesFetching && !notesData));
  const [followUpOpen, setFollowUpOpen] = useState(
    searchParams.get("followUp") === "1",
  );
  const [followUpInitial, setFollowUpInitial] =
    useState<Partial<FollowUpFormValues> | null>(null);
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
      { skip: !id || tab !== "documents", refetchOnMountOrArgChange: true },
    );

  // Refetch tab feeds on every visit so data stays fresh without a full reload.
  // Activities stay subscribed for the sidebar, so they need an explicit refetch.
  useEffect(() => {
    if (!id) return;
    if (tab === "activities" && canViewActivity) {
      void refetchActivities();
    }
    if (tab === "activities" && canViewFollowUp) {
      void refetchFollowUps();
    }
    if (tab === "overview") {
      void refetchLead();
    }
  }, [
    tab,
    id,
    canViewActivity,
    canViewFollowUp,
    refetchActivities,
    refetchFollowUps,
    refetchLead,
  ]);

  const { data: documentCategoryData } = useListMasterDataOptionsQuery(
    { category: "DOCUMENT_CATEGORY" },
    { skip: tab !== "documents" },
  );
  const { data: documentTypeData } = useListMasterDataOptionsQuery(
    { category: "DOCUMENT_TYPE" },
    { skip: tab !== "documents" },
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
  const assignmentHistory = assignmentData?.items || [];
  const noteHistory = notesData?.items || [];
  const documents = documentsData?.items || [];
  const followUps = followUpData?.items || [];
  const [qualifyOpen, setQualifyOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingMode, setMeetingMode] = useState<"schedule" | "reschedule">(
    "schedule",
  );
  const [meetingSaving, setMeetingSaving] = useState(false);
  const [meetingTarget, setMeetingTarget] = useState<{
    id: string;
    dueAt: string | null;
    notes: string | null;
    nextAction: string | null;
    reminder?: string | null;
    status?: string | null;
  } | null>(null);
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

  function confirmRestoreDocument(document: LeadDocumentItem) {
    if (!canDeleteDocument || !id || documentRestoring) return;
    const name = document.name || document.fileName || "this document";
    Modal.confirm({
      title: "Restore document?",
      content: `Restore ${name} to the active document list?`,
      okText: "Restore",
      cancelText: "Cancel",
      okButtonProps: {
        className:
          "!bg-primary !border-primary hover:!bg-primary-hover hover:!border-primary-hover",
      },
      cancelButtonProps: {
        className: "hover:!border-primary hover:!text-primary",
      },
      onOk: async () => {
        try {
          await restoreLeadDocument({ id, documentId: document.id }).unwrap();
          toast.success("Document restored.");
          setShowArchivedDocs(false);
        } catch (error) {
          toast.error(getApiError(error, "Unable to restore document."));
          throw error;
        }
      },
    });
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

      const followUpType = body.channels.includes("CALL")
        ? "Call"
        : body.channels.includes("WHATSAPP")
          ? "WhatsApp"
          : body.channels.includes("EMAIL")
            ? "Email"
            : body.channels.includes("SMS")
              ? "SMS"
              : "Call";
      // Preserve time-of-day from the current next follow-up (date picker is date-only).
      const previousDue = lead.nextFollowUp?.dueAt
        ? dayjs(lead.nextFollowUp.dueAt)
        : null;
      const nextDueAt = body.nextFollowUpAt
        ? previousDue?.isValid()
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
              .toISOString()
        : undefined;

      await updateStatus({
        id,
        body: {
          statusCode: body.statusCode,
          remarks,
          lostReasonCode: body.lostReasonCode,
          override: body.override,
          overrideReason: body.overrideReason,
          nextFollowUpAt: nextDueAt,
          followUpType,
          channels: body.channels,
        },
      }).unwrap();

      // Close immediately on status success. Lead data refreshes via
      // updateLeadStatus invalidatesTags — no extra refetchLead needed.
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
      return;
    }

    try {
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

        if (canFollowUp && startIso) {
          await createMeeting({
            leadId: id,
            dueAt: startIso,
            priority: "Medium",
            purpose: "Other",
            purposeOther: meeting.type || "Scheduled meeting",
            notes: meetingNotes,
            nextAction: meeting.agenda || meeting.title || "Scheduled meeting",
            reminder: "30 Minutes Before",
          }).unwrap();
        } else if (canAddActivity && startIso) {
          const scheduledLabel = dayjs(startIso).format("MMM D, YYYY, h:mm A");
          await createActivity({
            type: "MEETING",
            notes: [`Scheduled for ${scheduledLabel}`, meetingNotes]
              .filter(Boolean)
              .join("\n"),
            outcome: "Scheduled",
            nextAction: meeting.agenda || meeting.title || "Scheduled meeting",
            relatedType: "lead",
            relatedId: id,
            relatedName: lead.name,
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
    } catch (error) {
      toast.error(
        getApiError(
          error,
          "Status updated, but a follow-up action failed. Please try again from the lead workspace.",
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
      if (canViewEmail) setTab("email");
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
      // Backend supersedes prior open follow-ups in the same lane so the
      // Next Follow Up countdown picks up this new dueAt immediately.
      await createFollowUp({ ...values, leadId: id }).unwrap();
      // Close immediately — don't wait for activities/lead refetch.
      setFollowUpOpen(false);
      setFollowUpInitial(null);
      toast.success(
        followUpInitial
          ? "Follow-up rescheduled."
          : "Follow-up scheduled.",
      );
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("tab", "activities");
          params.delete("section");
          params.delete("followUp");
          return params;
        },
        { replace: true },
      );
      void refreshLeadWorkspace();
    } catch (error) {
      toast.error(getApiError(error, "Unable to create follow-up."));
      throw error;
    }
  }

  async function onCompleteFollowUp(values: CompleteFollowUpValues) {
    if (!selectedFollowUp) return;
    const isMeeting = selectedFollowUp.type === "Meeting";
    try {
      if (isMeeting) {
        await completeMeeting({
          id: selectedFollowUp.id,
          body: values,
        }).unwrap();
        setCompleteOpen(false);
        setSelectedFollowUp(null);
        toast.success(
          values.createNextFollowUp
            ? "Meeting completed and next scheduled."
            : "Meeting completed.",
        );
        void refreshLeadWorkspace();
        return;
      }
      await completeFollowUp({
        id: selectedFollowUp.id,
        body: values,
      }).unwrap();
      setCompleteOpen(false);
      setSelectedFollowUp(null);
      toast.success(
        values.createNextFollowUp
          ? "Follow-up completed and next scheduled."
          : "Follow-up completed.",
      );
      void refreshLeadWorkspace();
    } catch (error) {
      toast.error(
        getApiError(
          error,
          isMeeting ? "Unable to complete meeting." : "Unable to complete follow-up.",
        ),
      );
    }
  }

  const openMeetingFollowUp = useMemo(() => {
    const openStatuses = new Set(["Pending", "Due Soon", "Overdue"]);
    const fromList = followUpData?.items?.find(
      (item) => item.type === "Meeting" && openStatuses.has(item.status),
    );
    if (fromList) {
      return {
        id: fromList.id,
        dueAt: fromList.dueAt,
        notes: fromList.notes,
        nextAction: fromList.nextAction,
        reminder: fromList.reminder,
        status: fromList.status,
      };
    }
    if (lead?.nextFollowUp?.type === "Meeting") {
      return {
        id: lead.nextFollowUp.id,
        dueAt: lead.nextFollowUp.dueAt,
        notes: lead.nextFollowUp.notes,
        nextAction: lead.nextFollowUp.nextAction ?? null,
        reminder: lead.nextFollowUp.reminder ?? null,
        status: lead.nextFollowUp.status,
      };
    }
    return null;
  }, [lead?.nextFollowUp, followUpData?.items]);

  const canScheduleMeeting = canFollowUp || canAddActivity;
  const followUpIsReschedule = Boolean(lead?.nextFollowUp) && canEditFollowUp;
  const meetingIsReschedule = Boolean(openMeetingFollowUp) && canEditFollowUp;

  function openScheduleMeeting() {
    setMeetingMode("schedule");
    setMeetingTarget(null);
    setMeetingOpen(true);
  }

  function openRescheduleMeeting(
    target?: {
      id: string;
      dueAt: string | null;
      notes: string | null;
      nextAction: string | null;
      reminder?: string | null;
      status?: string | null;
    } | null,
  ) {
    const meeting = target || openMeetingFollowUp;
    if (!meeting || !canEditFollowUp) return;
    setMeetingMode("reschedule");
    setMeetingTarget(meeting);
    setMeetingOpen(true);
  }

  async function onScheduleMeeting(payload: ScheduleMeetingPayload) {
    if (!id || !lead) return;
    const startIso = meetingStartIso(payload);
    if (!startIso) {
      toast.error("Please choose a valid meeting date and time.");
      return;
    }
    const meetingNotes = buildMeetingNotes(payload);
    const isReschedule = meetingMode === "reschedule" && meetingTarget?.id;

    setMeetingSaving(true);
    try {
      if (canFollowUp) {
        // Add and reschedule both go through /meetings (not /follow-ups).
        // Reschedule supersedes the open meeting so updated notes/title are kept.
        await createMeeting({
          leadId: id,
          dueAt: startIso,
          priority: "Medium",
          purpose: "Other",
          purposeOther: payload.type || "Scheduled meeting",
          notes: meetingNotes,
          nextAction: payload.agenda || payload.title || "Scheduled meeting",
          reminder: payload.reminder || "No Reminder",
          sourceReason: isReschedule
            ? payload.rescheduleReason || "Meeting rescheduled"
            : undefined,
        }).unwrap();
      } else if (canAddActivity) {
        // Activity-only permission: log once with scheduled time in notes.
        const scheduledLabel = dayjs(startIso).format("MMM D, YYYY, h:mm A");
        await createActivity({
          type: "MEETING",
          notes: [`Scheduled for ${scheduledLabel}`, meetingNotes]
            .filter(Boolean)
            .join("\n"),
          outcome: isReschedule ? "Rescheduled" : "Scheduled",
          nextAction: payload.agenda || payload.title || "Scheduled meeting",
          relatedType: "lead",
          relatedId: id,
          relatedName: lead.name,
        }).unwrap();
      }

      // Close immediately on success — don't wait for activities/lead refetch.
      setMeetingOpen(false);
      setMeetingTarget(null);
      toast.success(
        isReschedule ? "Meeting rescheduled." : "Meeting scheduled.",
      );
      void refreshLeadWorkspace();
    } catch (error) {
      toast.error(
        getApiError(
          error,
          isReschedule
            ? "Unable to reschedule the meeting. Please try again."
            : "Unable to schedule the meeting. Please try again.",
        ),
      );
    } finally {
      setMeetingSaving(false);
    }
  }

  async function onCancelFollowUp(reason: string) {
    if (!selectedFollowUp) return;
    const isMeeting = selectedFollowUp.type === "Meeting";
    try {
      if (isMeeting) {
        await cancelMeeting({
          id: selectedFollowUp.id,
          body: { reason },
        }).unwrap();
        setCancelOpen(false);
        setSelectedFollowUp(null);
        toast.success("Meeting cancelled.");
        void refreshLeadWorkspace();
        return;
      }
      await cancelFollowUp({
        id: selectedFollowUp.id,
        body: { reason },
      }).unwrap();
      setCancelOpen(false);
      setSelectedFollowUp(null);
      toast.success("Follow-up cancelled.");
      void refreshLeadWorkspace();
    } catch (error) {
      toast.error(
        getApiError(
          error,
          isMeeting
            ? "Unable to cancel meeting."
            : "Unable to cancel follow-up.",
        ),
      );
    }
  }

  function followUpDraft(item: {
    type?: string | null;
    dueAt?: string | null;
    priority?: string | null;
    purpose?: string | null;
    purposeOther?: string | null;
    notes?: string | null;
    nextAction?: string | null;
    reminder?: string | null;
    ownerId?: string | null;
  }): Partial<FollowUpFormValues> {
    return {
      leadId: id || "",
      type: item.type || "Call",
      dueAt: item.dueAt || "",
      priority: item.priority || "Medium",
      purpose: item.purpose || "Initial Contact",
      purposeOther: item.purposeOther || undefined,
      notes: item.notes || undefined,
      nextAction: item.nextAction || "",
      reminder: item.reminder || "30 Minutes Before",
      ownerId: item.ownerId || lead?.owner?.id || undefined,
    };
  }

  function openScheduleFollowUp(initial?: Partial<FollowUpFormValues> | null) {
    setFollowUpInitial(initial || null);
    setFollowUpOpen(true);
  }

  function openFollowUpActions(
    item: FollowUpRecord,
    action: "complete" | "reschedule" | "cancel",
  ) {
    if (action === "reschedule" && item.type === "Meeting") {
      openRescheduleMeeting({
        id: item.id,
        dueAt: item.dueAt,
        notes: item.notes,
        nextAction: item.nextAction,
        reminder: item.reminder,
      });
      return;
    }
    if (action === "reschedule") {
      openScheduleFollowUp(followUpDraft(item));
      return;
    }
    setSelectedFollowUp(item);
    setCompleteOpen(action === "complete");
    setCancelOpen(action === "cancel");
  }

  function openRescheduleExistingFollowUp() {
    const next = lead?.nextFollowUp;
    if (!next || !canEditFollowUp || !lead) return;
    const fromList = followUps.find((item) => item.id === next.id);
    openScheduleFollowUp(
      followUpDraft(
        fromList || {
          type: next.type,
          dueAt: next.dueAt,
          priority: next.priority,
          purpose: next.purpose,
          notes: next.notes,
          nextAction: next.nextAction,
          reminder: next.reminder,
          ownerId: lead.owner?.id,
        },
      ),
    );
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
      studentRequirement: string;
      preferredCountryCode: string;
      preferredIntakeCode?: string;
      academicBackground?: string;
      conversationSummary: string;
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
      throw error;
    }
  }

  function openNotes() {
    if (!canAddActivity) {
      setTab("notes");
      return;
    }
    setLogConversationOpen(true);
  }

  async function onAddNote(payload: AddNoteSubmitPayload) {
    if (!id || !lead) return;
    setLogConversationSaving(true);
    const saved: AddNoteSavedState = { ...payload.committed };
    try {
      if (!saved.note) {
        const noteBody = [
          payload.channelLabel ? `Channel: ${payload.channelLabel}` : "",
          payload.notes,
        ]
          .filter(Boolean)
          .join("\n\n");
        // Prefer lead notes API: backend creates the note + activity in one
        // transaction. Fall back to activity-only when the user can log
        // activity but lacks lead:edit.
        if (canEdit) {
          await createLeadNote({ id, body: noteBody }).unwrap();
        } else {
          await createActivity({
            type: "NOTE",
            notes: noteBody,
            outcome: "Note added",
            relatedType: "lead",
            relatedId: id,
            relatedName: lead.name,
          }).unwrap();
        }
        saved.note = true;
      }

      if (payload.followUp && !saved.followUp) {
        if (!canFollowUp) {
          throw new Error("You do not have permission to schedule a follow-up.");
        }
        await createFollowUp({
          leadId: id,
          type: payload.followUp.type,
          dueAt: payload.followUp.dueAt,
          priority: "Medium",
          purpose: "Information Sharing",
          notes: payload.notes.slice(0, 1000),
          nextAction: payload.followUp.nextAction,
          reminder: payload.followUp.reminder,
          ownerId: payload.followUp.assigneeId,
          source: "Manual",
          sourceReason: "Created from lead note",
        }).unwrap();
        saved.followUp = true;
      }

      if (payload.meeting && !saved.meeting) {
        await saveNoteMeeting(payload.meeting, payload.notes);
        saved.meeting = true;
      }

      await refreshLeadWorkspace();
      toast.success(addNoteSuccessMessage(payload));
      setLogConversationOpen(false);
      setTab("notes");
    } catch (error) {
      if (error instanceof AddNotePartialError) throw error;
      const anythingSaved = saved.note || saved.followUp || saved.meeting;
      if (anythingSaved && (payload.followUp || payload.meeting)) {
        toast.error(
          partialNoteSaveMessage(saved, payload, getApiError(error, "Unable to finish saving.")),
        );
        throw new AddNotePartialError(saved);
      }
      toast.error(getApiError(error, "Unable to save note."));
      throw error;
    } finally {
      setLogConversationSaving(false);
    }
  }

  async function saveNoteMeeting(meeting: AddNoteMeetingPayload, noteText: string) {
    if (!id || !lead) return;
    const startIso = dayjs(`${meeting.date}T${meeting.startTime}:00`).toISOString();
    const meetingNotes = [
      meeting.title,
      `Type: ${meeting.type}`,
      `Mode: ${meeting.mode}`,
      meeting.location ? `Location: ${meeting.location}` : "",
      meeting.link ? `Link: ${meeting.link}` : "",
      meeting.endTime ? `End: ${meeting.endTime}` : "",
      meeting.agenda ? `Agenda: ${meeting.agenda}` : "",
      noteText ? `Note: ${noteText}` : "",
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 1000);
    const nextAction = meeting.agenda || meeting.title || "Scheduled meeting";

    if (canFollowUp) {
      await createMeeting({
        leadId: id,
        dueAt: startIso,
        priority: "Medium",
        purpose: "Other",
        purposeOther: meeting.type || "Scheduled meeting",
        notes: meetingNotes,
        nextAction,
        reminder: meeting.reminder || "No Reminder",
        source: "Manual",
        sourceReason: "Created from lead note",
      }).unwrap();
      return;
    }

    const scheduledLabel = dayjs(startIso).format("MMM D, YYYY, h:mm A");
    await createActivity({
      type: "MEETING",
      notes: [`Scheduled for ${scheduledLabel}`, meetingNotes].filter(Boolean).join("\n"),
      outcome: "Scheduled",
      nextAction,
      relatedType: "lead",
      relatedId: id,
      relatedName: lead.name,
    }).unwrap();
  }

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

  const showMobileStickyCtas =
    Boolean(lead) &&
    (canFollowUp ||
      canScheduleMeeting ||
      followUpIsReschedule ||
      meetingIsReschedule);

  return (
    <div
      className={`grid min-w-0 max-w-full gap-3 overflow-x-hidden sm:gap-4 [&>*]:min-w-0 ${
        showMobileStickyCtas ? "max-[960px]:pb-24" : ""
      }`}
    >
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
            canCreateApplication={canCreateApplication}
            onCreateApplication={() => setApplicationOpen(true)}
            studentId={lead.student?.id}
            onHandover={() => setHandoverOpen(true)}
            onEdit={() => navigate(`/leads/${id}/edit`)}
            onReopenLead={() => {
              setReopenErrors({});
              setReopenOpen(true);
            }}
            onReviewDuplicate={() => setDuplicateReviewOpen(true)}
            onOverridePriority={() => setPriorityOpen(true)}
            onAddNote={canAddActivity ? openNotes : undefined}
            onChangeStatus={
              canChangeStatus
                ? () => {
                    setStatusErrors({});
                    setStatusOpen(true);
                  }
                : undefined
            }
            onAddActivity={
              canAddActivity ? () => setActivityOpen(true) : undefined
            }
            onUploadFile={
              canUploadDocument ? () => setDocumentOpen(true) : undefined
            }
            onAssign={() => setOwnerOpen(true)}
          />

          <LeadJourneyBar
            lead={lead}
            meeting={openMeetingFollowUp}
            followUps={followUps}
            canEditFollowUp={canEditFollowUp}
            onCompleteFollowUp={(item) =>
              openFollowUpActions(item, "complete")
            }
            onRescheduleFollowUp={(item) =>
              openFollowUpActions(item, "reschedule")
            }
            onCancelFollowUp={(item) => openFollowUpActions(item, "cancel")}
          />

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <LeadDetailsTabBar
              primaryTabs={primaryTabs}
              moreTabs={moreTabs}
              activeKey={tab}
              onSelect={setTab}
            />
            <div className="hidden shrink-0 flex-wrap items-center gap-2 min-[961px]:flex">
              {canFollowUp || followUpIsReschedule ? (
                <PrimaryButton
                  type="button"
                  size="sm"
                  variant="primary"
                  icon={<HugeiconsIcon icon={Calendar03Icon} size={15} />}
                  onClick={() =>
                    followUpIsReschedule
                      ? openRescheduleExistingFollowUp()
                      : openScheduleFollowUp()
                  }
                  label={
                    followUpIsReschedule
                      ? "Reschedule Follow-up"
                      : "Add Follow-up"
                  }
                />
              ) : null}
              {canScheduleMeeting || meetingIsReschedule ? (
                <PrimaryButton
                  type="button"
                  size="sm"
                  variant="primary"
                  icon={<HugeiconsIcon icon={Video01Icon} size={15} />}
                  onClick={() =>
                    meetingIsReschedule
                      ? openRescheduleMeeting(openMeetingFollowUp)
                      : openScheduleMeeting()
                  }
                  label={
                    meetingIsReschedule ? "Reschedule Meeting" : "Add Meeting"
                  }
                />
              ) : null}
            </div>
          </div>

          <div className="grid min-w-0 max-w-full items-start gap-3 overflow-x-hidden sm:gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
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
              {tab === "notes" ? (
                <LeadNotesPanel
                  leadId={lead.id}
                  notes={noteHistory}
                  loading={notesLoading}
                  canAdd={canAddActivity}
                  onAdd={openNotes}
                />
              ) : null}
              {tab === "services" && canViewServices ? (
                <LeadServicesPanel
                  leadId={lead.id}
                  leadName={lead.name}
                  leadCode={lead.code}
                  canOffer={canOffer}
                />
              ) : null}
              {tab === "activities" ? (
                <LeadActivitiesPanel
                  activities={activities}
                  followUps={canViewFollowUp ? followUps : []}
                  loading={activityLoading && activities.length === 0}
                  followUpsLoading={followUpsLoading}
                  canEditFollowUp={canEditFollowUp}
                  onCompleteFollowUp={(item) =>
                    openFollowUpActions(item, "complete")
                  }
                  onRescheduleFollowUp={(item) =>
                    openFollowUpActions(item, "reschedule")
                  }
                  onCancelFollowUp={(item) =>
                    openFollowUpActions(item, "cancel")
                  }
                />
              ) : null}
              {tab === "documents" ? (
                <LeadDocumentsPanel
                  documents={documents}
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
                  onRestore={(document) => confirmRestoreDocument(document)}
                />
              ) : null}
              {tab === "file-documents" && showFileDocumentsTab ? (
                <FileDocumentsPanel
                  leadId={lead.id}
                  canUpload={canUploadDocument}
                  canVerify={canVerifyDocument}
                  canManage={canDeleteDocument}
                  canDownload={canDownloadDocument}
                />
              ) : null}
              {tab === "assignments" ? (
                <LeadAssignmentHistoryPanel
                  assignmentHistory={assignmentHistory}
                  loading={assignmentsLoading}
                />
              ) : null}
              {tab === "whatsapp" && canViewWhatsApp ? (
                <LeadWhatsAppPanel
                  leadId={lead.id}
                  hasWhatsAppNumber={Boolean(lead.whatsapp || lead.phone)}
                />
              ) : null}
              {tab === "email" && canViewEmail ? (
                <LeadEmailPanel
                  leadId={lead.id}
                  hasEmail={Boolean(lead.email)}
                />
              ) : null}
              {tab === "payments" && canViewPayments ? (
                <LeadPaymentsPanel
                  leadId={lead.id}
                  leadName={lead.name}
                  leadCode={lead.code}
                />
              ) : null}
            </div>

            <LeadDetailsSidebar
              lead={lead}
              activities={activities}
              options={options}
              canQualify={canQualify}
              canCreateApplication={canCreateApplication}
              onCreateApplication={() => setApplicationOpen(true)}
              onViewActivities={() => setTab("activities")}
              onUpdateQualification={() => setQualifyOpen(true)}
            />
          </div>

          {/* Mobile sticky CTAs — sits above app bottom nav */}
          {showMobileStickyCtas ? (
            <div
              className="fixed inset-x-0 z-40 hidden border-t border-[#e7eef5] bg-surface/95 px-3 py-2.5 shadow-[0_-8px_24px_rgba(22,50,79,0.08)] backdrop-blur-md max-[960px]:flex dark:border-border"
              style={{
                bottom:
                  "calc(3.75rem + 0.75rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              <div className="mx-auto flex w-full max-w-3xl gap-2 [&_.ant-btn]:min-h-11 [&_.ant-btn]:flex-1">
                {canFollowUp || followUpIsReschedule ? (
                  <PrimaryButton
                    type="button"
                    size="md"
                    variant="primary"
                    icon={<HugeiconsIcon icon={Calendar03Icon} size={16} />}
                    onClick={() =>
                      followUpIsReschedule
                        ? openRescheduleExistingFollowUp()
                        : openScheduleFollowUp()
                    }
                    label={
                      followUpIsReschedule
                        ? "Reschedule Follow-up"
                        : "Add Follow-up"
                    }
                  />
                ) : null}
                {canScheduleMeeting || meetingIsReschedule ? (
                  <PrimaryButton
                    type="button"
                    size="md"
                    variant="outline"
                    icon={<HugeiconsIcon icon={Video01Icon} size={16} />}
                    onClick={() =>
                      meetingIsReschedule
                        ? openRescheduleMeeting(openMeetingFollowUp)
                        : openScheduleMeeting()
                    }
                    label={meetingIsReschedule ? "Reschedule" : "Meeting"}
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {lead ? (
        <CreateApplicationModal
          open={applicationOpen && canCreateApplication}
          lead={lead}
          onClose={() => setApplicationOpen(false)}
          onCreated={(applicationId) => {
            void refreshLeadWorkspace();
            navigate(`/applications/${applicationId}`);
          }}
        />
      ) : null}

      <ScheduleMeetingModal
        open={meetingOpen && canScheduleMeeting}
        saving={meetingSaving}
        mode={meetingMode}
        leadName={lead?.name}
        leadCode={lead?.code}
        leadStatus={lead?.status}
        currentDueAt={meetingTarget?.dueAt}
        initialValues={
          meetingMode === "reschedule" && meetingTarget
            ? {
                dueAt: meetingTarget.dueAt,
                notes: meetingTarget.notes,
                nextAction: meetingTarget.nextAction,
                reminder: meetingTarget.reminder || undefined,
              }
            : null
        }
        onClose={() => {
          setMeetingOpen(false);
          setMeetingTarget(null);
        }}
        onSubmit={onScheduleMeeting}
      />
      <FollowUpFormModal
        open={followUpOpen && (canFollowUp || canEditFollowUp)}
        saving={followUpSaving}
        fixedLeadId={id}
        title={followUpInitial ? "Reschedule Follow-up" : "Schedule Follow-up"}
        initialValues={followUpInitial}
        lead={
          lead
            ? {
                name: lead.name,
                code: lead.code,
                status: lead.status,
                ownerId: lead.owner?.id,
                ownerName: lead.owner?.name,
              }
            : null
        }
        onClose={() => {
          setFollowUpOpen(false);
          setFollowUpInitial(null);
        }}
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
      <AddNoteModal
        open={logConversationOpen && canAddActivity}
        saving={logConversationSaving}
        lead={lead || null}
        canScheduleFollowUp={canFollowUp}
        canScheduleMeeting={canScheduleMeeting}
        onClose={() => setLogConversationOpen(false)}
        onSubmit={onAddNote}
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
          cancelling ||
          activitySaving ||
          documentUploading
        }
        emailSending={emailSending}
        leadName={lead?.name || "Lead"}
        leadEmail={lead?.email}
        currentStatus={lead?.statusChange?.current?.name || lead?.status}
        activities={activities}
        options={lead?.statusChange?.options || []}
        lostReasons={options.lostReason}
        errors={statusErrors}
        onClose={() => setStatusOpen(false)}
        onSubmit={onUpdateStatus}
        onSendEmail={onSendStatusEmail}
        onViewHistory={() => {
          setStatusOpen(false);
          setTab("activities");
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
