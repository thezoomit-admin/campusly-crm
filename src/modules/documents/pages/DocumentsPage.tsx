import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Input, Modal, Select } from "antd";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { PageHeader } from "@/components/common/Navigation";
import { PageMeta } from "@/components/common/Meta";
import { FormSelect } from "@/components/common/Forms";
import type { DataTableActionItem } from "@/components/common/Tables";
import { PrimaryButton } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { getApiError } from "@/lib/api";
import { hasPermission } from "@/lib/access";
import type { AuthSession } from "@/types";
import { adminCard, adminPage } from "../../../styles/admin";
import { useListDocumentsQuery } from "../api/documentsApi";
import {
  useLazyFetchFileDocumentBlobQuery,
  useListFileDocumentsQuery,
  useRejectFileDocumentMutation,
  useRequestFileDocumentMutation,
  useReviewFileDocumentMutation,
  useVerifyFileDocumentMutation,
} from "@/modules/files/api/filesApi";
import DocumentBulkBar from "../components/DocumentBulkBar";
import DocumentDrawer from "../components/DocumentDrawer";
import DocumentFilters from "../components/DocumentFilters";
import DocumentKpiStrip from "../components/DocumentKpiStrip";
import DocumentsTable from "../components/DocumentsTable";
import type { DocumentQueue, DocumentRow, DocumentSummary } from "../types";
import {
  DEFAULT_VISIBLE_COLUMNS,
  type DocumentColumnKey,
} from "../utils/documentColumns";
import { downloadDocumentsCsv } from "../utils/documentFormat";
import {
  isPendingReview,
  isRequestable,
  sortDocumentsByActionNeeded,
} from "../utils/documentDisplay";

const REQUEST_METHODS = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "IN_PERSON", label: "In Person" },
  { value: "OTHER", label: "Other" },
];

const REJECTION_REASONS = [
  { value: "BLURRY", label: "Blurry" },
  { value: "WRONG_DOCUMENT", label: "Wrong Document" },
  { value: "INCORRECT_INFORMATION", label: "Incorrect Information" },
  { value: "MISSING_PAGE", label: "Missing Page" },
  { value: "INVALID_COPY", label: "Invalid Copy" },
  { value: "OTHER", label: "Other" },
];

const FILE_STATUSES = [
  { value: "NOT_REQUESTED", label: "Missing / Not requested" },
  { value: "REQUESTED", label: "Requested" },
  { value: "RECEIVED", label: "Pending review" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
  { value: "REUPLOAD_REQUIRED", label: "Re-upload required" },
];

const LEAD_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXPIRED", label: "Expired" },
];

const CATEGORIES = [
  { value: "PERSONAL", label: "Personal" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "LANGUAGE", label: "Language" },
  { value: "FINANCIAL", label: "Financial" },
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "OTHER", label: "Other" },
];

const FILE_TYPES = [
  { value: "PASSPORT", label: "Passport" },
  { value: "NID", label: "NID" },
  { value: "PHOTOGRAPH", label: "Photograph" },
  { value: "ACADEMIC_CERTIFICATE", label: "Academic Certificate" },
  { value: "TRANSCRIPT", label: "Academic Transcript" },
  { value: "CV_PROFESSIONAL", label: "CV" },
  { value: "IELTS", label: "English Test Result" },
  { value: "EXPERIENCE_CERTIFICATE", label: "Experience Certificate" },
];

const fieldClass =
  "w-full rounded-lg border border-[#dbe4ee] bg-white px-3 py-2 text-sm dark:border-border dark:bg-transparent";

export default function DocumentsPage() {
  const auth = useOutletContext<AuthSession>();
  const navigate = useNavigate();

  const canUpload = hasPermission(auth, "document:upload");
  const canVerify = hasPermission(auth, "document:verify");
  const canDownload = hasPermission(auth, [
    "document:download",
    "document:view",
    "document:upload",
  ]);

  const [vault, setVault] = useState<"lead" | "file">("file");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [queue, setQueue] = useState<DocumentQueue>("all");
  const [categoryCode, setCategoryCode] = useState<string | undefined>();
  const [typeCode, setTypeCode] = useState<string | undefined>();
  const [expiryStatus, setExpiryStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [visibleColumns] = useState<DocumentColumnKey[]>(
    DEFAULT_VISIBLE_COLUMNS,
  );
  const [selectedRows, setSelectedRows] = useState<DocumentRow[]>([]);
  const [clearSelectionTrigger, setClearSelectionTrigger] = useState(0);

  const [drawerRow, setDrawerRow] = useState<DocumentRow | null>(null);
  const [requestTarget, setRequestTarget] = useState<DocumentRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DocumentRow | null>(null);
  const [bulkRequestOpen, setBulkRequestOpen] = useState(false);
  const [method, setMethod] = useState("WHATSAPP");
  const [dueDate, setDueDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [reasonCode, setReasonCode] = useState<string>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fileQueueParam =
    vault === "file" && queue !== "all" ? queue : undefined;
  const leadStatusFromQueue =
    vault === "lead"
      ? queue === "pending"
        ? "PENDING"
        : queue === "verified"
          ? "VERIFIED"
          : queue === "rejected"
            ? "REJECTED"
            : queue === "expired"
              ? "EXPIRED"
              : status
      : undefined;

  const leadQuery = useListDocumentsQuery(
    {
      search: debouncedSearch,
      status: leadStatusFromQueue || status,
      categoryCode,
      expired: queue === "expired" ? "true" : undefined,
      page,
      limit,
    },
    { skip: vault !== "lead" },
  );

  const fileQuery = useListFileDocumentsQuery(
    {
      search: debouncedSearch,
      status: fileQueueParam ? undefined : status,
      queue: fileQueueParam,
      categoryCode,
      typeCode,
      expiryStatus:
        queue === "expiring" || queue === "expired" ? undefined : expiryStatus,
      page,
      limit,
    },
    { skip: vault !== "file" },
  );

  const [requestDocument, { isLoading: requesting }] =
    useRequestFileDocumentMutation();
  const [reviewDocument] = useReviewFileDocumentMutation();
  const [verifyDocument, { isLoading: verifying }] =
    useVerifyFileDocumentMutation();
  const [rejectDocument, { isLoading: rejecting }] =
    useRejectFileDocumentMutation();
  const [fetchBlob] = useLazyFetchFileDocumentBlobQuery();

  const active = vault === "file" ? fileQuery : leadQuery;
  const rows = useMemo(() => {
    const items = (active.data?.items || []).map((row) => ({
      ...row,
      vault,
    })) as DocumentRow[];
    return sortDocumentsByActionNeeded(items);
  }, [active.data?.items, vault]);

  const summary: DocumentSummary | null | undefined =
    vault === "file" ? fileQuery.data?.summary : leadQuery.data?.summary;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function resetPaging() {
    setPage(1);
    clearSelection();
  }

  function clearSelection() {
    setSelectedRows([]);
    setClearSelectionTrigger((value) => value + 1);
  }

  function switchVault(next: "file" | "lead") {
    setVault(next);
    setStatus(undefined);
    setQueue("all");
    setTypeCode(undefined);
    setExpiryStatus(undefined);
    setDrawerRow(null);
    resetPaging();
  }

  function clearFilters() {
    setSearch("");
    setStatus(undefined);
    setQueue("all");
    setCategoryCode(undefined);
    setTypeCode(undefined);
    setExpiryStatus(undefined);
    resetPaging();
  }

  function openLead(row: DocumentRow) {
    if (!row.leadId) return;
    navigate(
      `/leads/${row.leadId}?tab=${vault === "file" ? "file-documents" : "documents"}`,
    );
  }

  async function loadPreview(row: DocumentRow) {
    if (!row.leadId || vault !== "file" || !row.hasFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPreviewType("");
      return;
    }
    setPreviewLoading(true);
    try {
      const result = await fetchBlob({
        leadId: row.leadId,
        documentId: row.id,
        download: false,
      }).unwrap();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewType(result.mimeType);
      setPreviewUrl(URL.createObjectURL(result.blob));
    } catch (error) {
      setPreviewUrl(null);
      toast.error(getApiError(error, "Unable to preview this document."));
    } finally {
      setPreviewLoading(false);
    }
  }

  async function downloadOne(row: DocumentRow) {
    if (!row.leadId || vault !== "file") return;
    try {
      const result = await fetchBlob({
        leadId: row.leadId,
        documentId: row.id,
        download: true,
      }).unwrap();
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${row.type || "document"}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getApiError(error, "Unable to download this document."));
    }
  }

  async function submitRequestFor(
    row: DocumentRow,
    payload: { method: string; dueDate?: string; remarks?: string },
  ) {
    if (!row.leadId) return;
    await requestDocument({
      leadId: row.leadId,
      documentId: row.id,
      method: payload.method,
      dueDate: payload.dueDate,
      remarks: payload.remarks,
    }).unwrap();
  }

  async function submitRequest() {
    if (!requestTarget) return;
    try {
      await submitRequestFor(requestTarget, {
        method,
        dueDate: dueDate || undefined,
        remarks: remarks || undefined,
      });
      toast.success("Document request sent.");
      setRequestTarget(null);
      setRemarks("");
      setDueDate("");
      void fileQuery.refetch();
    } catch (error) {
      toast.error(getApiError(error, "Unable to send the document request."));
    }
  }

  async function submitBulkRequest() {
    const targets = selectedRows.filter(
      (row) => row.leadId && isRequestable(row),
    );
    if (!targets.length) {
      toast.error("Select documents that still need a request.");
      return;
    }
    let ok = 0;
    for (const row of targets) {
      try {
        await submitRequestFor(row, {
          method,
          dueDate: dueDate || undefined,
          remarks: remarks || undefined,
        });
        ok += 1;
      } catch {
        // continue
      }
    }
    toast.success(`Requested ${ok} of ${targets.length} documents.`);
    setBulkRequestOpen(false);
    setRemarks("");
    setDueDate("");
    clearSelection();
    void fileQuery.refetch();
  }

  async function submitBulkVerify() {
    const targets = selectedRows.filter(
      (row) => row.leadId && isPendingReview(row),
    );
    if (!targets.length) {
      toast.error("Select documents that are pending review.");
      return;
    }
    let ok = 0;
    for (const row of targets) {
      try {
        if (row.statusCode === "RECEIVED") {
          await reviewDocument({
            leadId: row.leadId!,
            documentId: row.id,
          }).unwrap();
        }
        await verifyDocument({
          leadId: row.leadId!,
          documentId: row.id,
        }).unwrap();
        ok += 1;
      } catch {
        // continue
      }
    }
    toast.success(`Verified ${ok} of ${targets.length} documents.`);
    clearSelection();
    void fileQuery.refetch();
  }

  async function submitReject() {
    if (!rejectTarget?.leadId || !reasonCode) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    try {
      await rejectDocument({
        leadId: rejectTarget.leadId,
        documentId: rejectTarget.id,
        reasonCode,
        remarks: remarks || undefined,
      }).unwrap();
      toast.success("Document rejected. Re-upload is required.");
      setRejectTarget(null);
      setDrawerRow(null);
      setReasonCode(undefined);
      setRemarks("");
      void fileQuery.refetch();
    } catch (error) {
      toast.error(getApiError(error, "Unable to reject the document."));
    }
  }

  function exportCsv(
    sourceRows: DocumentRow[] = selectedRows.length ? selectedRows : rows,
  ) {
    if (!sourceRows.length) {
      toast.error("Nothing to export.");
      return;
    }
    downloadDocumentsCsv(
      sourceRows as unknown as Array<Record<string, unknown>>,
      `documents-${vault}-${dayjs().format("YYYY-MM-DD")}.csv`,
    );
    toast.success(
      `Exported ${sourceRows.length} row${sourceRows.length === 1 ? "" : "s"}.`,
    );
  }

  function rowActions(row: DocumentRow): DataTableActionItem[] {
    const actions: DataTableActionItem[] = [];

    if (vault === "file" && canVerify && isPendingReview(row)) {
      actions.push({
        key: "verify",
        label: "Verify",
        onClick: () => {
          if (!row.leadId) return;
          const run = async () => {
            if (row.statusCode === "RECEIVED") {
              await reviewDocument({
                leadId: row.leadId!,
                documentId: row.id,
              }).unwrap();
            }
            await verifyDocument({
              leadId: row.leadId!,
              documentId: row.id,
            }).unwrap();
            toast.success("Document verified.");
            void fileQuery.refetch();
          };
          void run().catch((error) =>
            toast.error(getApiError(error, "Unable to verify the document.")),
          );
        },
      });
      actions.push({
        key: "reject",
        label: "Reject",
        danger: true,
        onClick: () => {
          setRejectTarget(row);
          setReasonCode(undefined);
          setRemarks("");
        },
      });
    }

    if (vault === "file" && canUpload && isRequestable(row)) {
      actions.push({
        key: "request",
        label: "Request document",
        onClick: () => {
          setRequestTarget(row);
          setRemarks("");
          setDueDate("");
          setMethod("WHATSAPP");
        },
      });
    }

    if (vault === "file" && (row.hasFile || isPendingReview(row))) {
      actions.push({
        key: "preview",
        label: "Preview",
        onClick: () => setDrawerRow(row),
      });
    }

    if (vault === "file" && canDownload && row.hasFile) {
      actions.push({
        key: "download",
        label: "Download",
        onClick: () => {
          void downloadOne(row);
        },
      });
    }

    actions.push({
      key: "open",
      label: "Open in lead",
      onClick: () => openLead(row),
    });

    return actions;
  }

  const requestableCount = selectedRows.filter(isRequestable).length;
  const verifiableCount = selectedRows.filter(isPendingReview).length;
  const hasActiveFilters = Boolean(
    search ||
    status ||
    queue !== "all" ||
    categoryCode ||
    typeCode ||
    expiryStatus,
  );

  return (
    <div className={adminPage}>
      <PageMeta
        title="Documents"
        description="Ops console for file and lead documents — request, review, expiry, and export."
      />
      <div className="grid gap-2">
        <PageHeader
          title="Documents"
          subtitle={
            vault === "file"
              ? "Action-needed queue first. Click a row to preview, verify, or request without leaving this page."
              : "Lead document queue with verification and expiry tracking."
          }
          breadcrumbs={[
            { title: "Dashboard", path: "/dashboard" },
            { title: "Documents" },
          ]}
          showDivider={false}
          extra={
            <PrimaryButton
              type="button"
              size="sm"
              variant="outline"
              label="Export CSV"
              onClick={() => exportCsv()}
            />
          }
        />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex" role="tablist" aria-label="Document vault">
            {(
              [
                { key: "file" as const, label: "File documents" },
                { key: "lead" as const, label: "Lead documents" },
              ] as const
            ).map((item) => {
              const selected = vault === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`cursor-pointer border px-4 py-1.5 text-sm font-medium first:rounded-l-lg last:rounded-r-lg ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-text-muted"
                  }`}
                  onClick={() => switchVault(item.key)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <DocumentKpiStrip vault={vault} summary={summary} />

      <div className={`${adminCard} grid gap-3`}>
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
          <div className="min-w-[200px] flex-1">
            <DocumentFilters
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
                resetPaging();
              }}
              placeholder={
                vault === "file"
                  ? "Search document, file ID, student, uploader…"
                  : "Search lead, document, category, uploader…"
              }
            />
          </div>
          <div className="w-[150px] shrink-0">
            <FormSelect
              allowClear
              placeholder="Category"
              value={categoryCode}
              options={CATEGORIES}
              onChange={(value) => {
                setCategoryCode(typeof value === "string" ? value : undefined);
                resetPaging();
              }}
            />
          </div>
          {vault === "file" ? (
            <div className="w-[168px] shrink-0">
              <FormSelect
                allowClear
                placeholder="Document type"
                value={typeCode}
                options={FILE_TYPES}
                onChange={(value) => {
                  setTypeCode(typeof value === "string" ? value : undefined);
                  resetPaging();
                }}
              />
            </div>
          ) : null}
          <div className="w-[170px] shrink-0">
            <FormSelect
              allowClear
              placeholder="Status"
              value={status}
              options={vault === "file" ? FILE_STATUSES : LEAD_STATUSES}
              onChange={(value) => {
                setQueue("all");
                setStatus(typeof value === "string" ? value : undefined);
                resetPaging();
              }}
            />
          </div>
          {vault === "file" ? (
            <div className="w-[132px] shrink-0">
              <FormSelect
                allowClear
                placeholder="Expiry"
                value={expiryStatus}
                options={[
                  { value: "VALID", label: "Valid" },
                  { value: "EXPIRING", label: "Expiring" },
                  { value: "EXPIRED", label: "Expired" },
                  { value: "NONE", label: "No expiry" },
                ]}
                onChange={(value) => {
                  setQueue("all");
                  setExpiryStatus(
                    typeof value === "string" ? value : undefined,
                  );
                  resetPaging();
                }}
              />
            </div>
          ) : null}
          {hasActiveFilters ? (
            <PrimaryButton
              type="button"
              size="sm"
              variant="outline"
              label="Clear"
              onClick={clearFilters}
            />
          ) : null}
        </div>

        <DocumentBulkBar
          count={selectedRows.length}
          canRequest={vault === "file" && canUpload}
          canVerify={vault === "file" && canVerify}
          requestableCount={requestableCount}
          verifiableCount={verifiableCount}
          onClear={clearSelection}
          onRequest={() => {
            setBulkRequestOpen(true);
            setMethod("WHATSAPP");
            setDueDate("");
            setRemarks("");
          }}
          onVerify={() => {
            void submitBulkVerify();
          }}
          onExport={() => exportCsv(selectedRows)}
        />

        {active.isError ? (
          <p className="m-0 text-danger">
            Could not load records. Check API connection.
          </p>
        ) : null}

        <DocumentsTable
          data={rows}
          vault={vault}
          loading={active.isFetching}
          page={page}
          limit={limit}
          total={active.data?.total || rows.length}
          grouped={false}
          visibleColumns={visibleColumns}
          onPageChange={setPage}
          onLimitChange={(next) => {
            setLimit(next);
            setPage(1);
          }}
          selectRow={vault === "file" && (canUpload || canVerify)}
          clearSelectionTrigger={clearSelectionTrigger}
          onSelectRowsChange={setSelectedRows}
          actions={rowActions}
          onRowClick={(row) => setDrawerRow(row)}
          onOpenOwner={openLead}
        />
      </div>

      <DocumentDrawer
        row={drawerRow}
        open={Boolean(drawerRow)}
        onClose={() => setDrawerRow(null)}
        canUpload={canUpload}
        canVerify={canVerify}
        canDownload={canDownload}
        previewUrl={previewUrl}
        previewType={previewType}
        previewLoading={previewLoading}
        verifying={verifying}
        requesting={requesting}
        rejecting={rejecting}
        onOpenLead={openLead}
        onLoadPreview={(row) => {
          void loadPreview(row);
        }}
        onDownload={(row) => {
          void downloadOne(row);
        }}
        onRequest={async (row, payload) => {
          try {
            await submitRequestFor(row, payload);
            toast.success("Document request sent.");
            setDrawerRow(null);
            void fileQuery.refetch();
          } catch (error) {
            toast.error(
              getApiError(error, "Unable to send the document request."),
            );
          }
        }}
        onVerify={async (row) => {
          if (!row.leadId) return;
          try {
            if (row.statusCode === "RECEIVED") {
              await reviewDocument({
                leadId: row.leadId,
                documentId: row.id,
              }).unwrap();
            }
            await verifyDocument({
              leadId: row.leadId,
              documentId: row.id,
            }).unwrap();
            toast.success("Document verified.");
            setDrawerRow(null);
            void fileQuery.refetch();
          } catch (error) {
            toast.error(getApiError(error, "Unable to verify the document."));
          }
        }}
        onReject={(row, payload) => {
          setRejectTarget(row);
          setReasonCode(payload.reasonCode);
          setRemarks(payload.remarks || "");
          void (async () => {
            try {
              await rejectDocument({
                leadId: row.leadId!,
                documentId: row.id,
                reasonCode: payload.reasonCode,
                remarks: payload.remarks,
              }).unwrap();
              toast.success("Document rejected. Re-upload is required.");
              setRejectTarget(null);
              setDrawerRow(null);
              setReasonCode(undefined);
              setRemarks("");
              void fileQuery.refetch();
            } catch (error) {
              toast.error(getApiError(error, "Unable to reject the document."));
            }
          })();
        }}
      />

      <Modal
        title="Request Document"
        open={Boolean(requestTarget)}
        onCancel={() => setRequestTarget(null)}
        onOk={() => void submitRequest()}
        confirmLoading={requesting}
        okText="Send Request"
      >
        <div className="grid gap-3">
          <p className="m-0 text-sm text-text-muted">
            {requestTarget?.owner} · {requestTarget?.type}
          </p>
          <Select
            value={method}
            options={REQUEST_METHODS}
            onChange={setMethod}
          />
          <label className="grid gap-1 text-sm">
            Due date
            <input
              className={fieldClass}
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>
          <Input.TextArea
            placeholder="Please provide a clear scanned copy."
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </div>
      </Modal>

      <Modal
        title={`Request ${selectedRows.length} documents`}
        open={bulkRequestOpen}
        onCancel={() => setBulkRequestOpen(false)}
        onOk={() => void submitBulkRequest()}
        confirmLoading={requesting}
        okText="Send Requests"
      >
        <div className="grid gap-3">
          <Select
            value={method}
            options={REQUEST_METHODS}
            onChange={setMethod}
          />
          <label className="grid gap-1 text-sm">
            Due date
            <input
              className={fieldClass}
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>
          <Input.TextArea
            placeholder="Shared request note for selected documents."
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </div>
      </Modal>

      <Modal
        title="Reject Document"
        open={Boolean(rejectTarget) && !drawerRow}
        onCancel={() => setRejectTarget(null)}
        onOk={() => void submitReject()}
        confirmLoading={rejecting || verifying}
        okText="Reject"
      >
        <div className="grid gap-3">
          <p className="m-0 text-sm text-text-muted">
            {rejectTarget?.owner} · {rejectTarget?.type}
          </p>
          <Select
            placeholder="Rejection reason"
            value={reasonCode}
            options={REJECTION_REASONS}
            onChange={setReasonCode}
          />
          <Input.TextArea
            placeholder="Please upload a high-resolution copy."
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
