import { useCallback, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { PrimaryButton } from "@/components/ui";
import { PageHeader } from "@/components/common/Navigation";
import ExportActions from "@/components/common/Export/ExportActions";
import { PageMeta } from "@/components/common/Meta";
import { useDebounce } from "@/hooks/useDebounce";
import { hasPermission } from "../../../lib/access";
import { toQuery } from "@/lib/api";
import type { AuthSession } from "../../../types";
import { adminPage } from "../../../styles/admin";
import { useListLeadsQuery } from "../api/leadsApi";
import { useEnableAfterListQuery } from "../hooks/useEnableAfterListQuery";
import LeadFilters, {
  EMPTY_LEAD_FILTERS,
  type LeadFilterValues,
} from "../components/LeadFilters";
import LeadListAddNoteModal from "../components/LeadListAddNoteModal";
import LeadListChangeStatusModal from "../components/LeadListChangeStatusModal";
import LeadListCloseModal from "../components/LeadListCloseModal";
import LeadListFollowUpModal from "../components/LeadListFollowUpModal";
import LeadListMeetingModal from "../components/LeadListMeetingModal";
import LeadListPriorityModal from "../components/LeadListPriorityModal";
import LeadListReassignModal from "../components/LeadListReassignModal";
import LeadStatusTabs from "../components/LeadStatusTabs";
import LeadsTable from "../components/LeadsTable";
import type { LeadRow } from "../types";
import {
  DEFAULT_VISIBLE_LEAD_COLUMNS,
  type LeadColumnKey,
} from "../utils/leadColumns";
import type { LeadViewTab } from "../utils/leadList";
import "../leadsList.css";

export default function LeadsPage() {
  const auth = useOutletContext<AuthSession>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<LeadViewTab>("all");
  const [filters, setFilters] = useState<LeadFilterValues>(EMPTY_LEAD_FILTERS);
  const [visibleColumns, setVisibleColumns] = useState<LeadColumnKey[]>(
    DEFAULT_VISIBLE_LEAD_COLUMNS,
  );
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusLeadId, setStatusLeadId] = useState<string | null>(null);
  const [noteLeadId, setNoteLeadId] = useState<string | null>(null);
  const [followUpLeadId, setFollowUpLeadId] = useState<string | null>(null);
  const [meetingLeadId, setMeetingLeadId] = useState<string | null>(null);
  const [reassignLeadId, setReassignLeadId] = useState<string | null>(null);
  const [priorityLeadId, setPriorityLeadId] = useState<string | null>(null);
  const [closeLead, setCloseLead] = useState<{
    id: string;
    status: string;
  } | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const canCreate = hasPermission(auth, "lead:create");
  const canExport = hasPermission(auth, "lead:export");
  const canEdit = hasPermission(auth, "lead:edit");
  const canChangeStatus = hasPermission(auth, "lead:update_status");
  const canClose = hasPermission(auth, "lead:close");
  const canReassign = hasPermission(auth, "lead:reassign");
  const canOverridePriority = hasPermission(auth, "lead:override_priority");
  const canConvert = hasPermission(auth, "lead:convert");
  const canAddNote = hasPermission(auth, "activity:create");
  const canFollowUp = hasPermission(auth, "follow_up:create");
  const canMeeting =
    canFollowUp || hasPermission(auth, "activity:create");

  const { data, isFetching, isError } = useListLeadsQuery({
    search: debouncedSearch,
    page,
    limit,
    view,
    status: filters.status || undefined,
    source: filters.source,
    priority: filters.priority,
    country: filters.country,
    duplicatesOnly: duplicatesOnly || undefined,
  });
  const loadOptions = useEnableAfterListQuery();

  const rows = (data?.items || []) as LeadRow[];

  function resetPage() {
    setPage(1);
  }

  const closeStatusModal = useCallback(() => {
    setStatusLeadId(null);
  }, []);

  const closeCloseModal = useCallback(() => {
    setCloseLead(null);
  }, []);

  return (
    <div className={adminPage}>
      <PageMeta
        title="Leads"
        description="Capture, qualify, and nurture prospective students through your consultancy pipeline."
      />
      <PageHeader
        title="Leads"
        subtitle="Capture, qualify, and nurture prospective students through your consultancy pipeline."
        breadcrumbs={[
          { title: "Dashboard", path: "/dashboard" },
          { title: "Leads" },
        ]}
        showDivider={false}
        extra={
          <>
            {canExport ? (
              <ExportActions
                title="Leads"
                path={`/leads/export${toQuery({
                  search: debouncedSearch,
                  view: view !== "all" ? view : undefined,
                  status: filters.status || undefined,
                  source: filters.source,
                  priority: filters.priority,
                  country: filters.country,
                  duplicatesOnly: duplicatesOnly ? "true" : undefined,
                })}`}
              />
            ) : null}
            {canCreate ? (
              <PrimaryButton
                variant="primary"
                label="Add New Lead"
                icon={<HugeiconsIcon icon={Add01Icon} size={16} />}
                onClick={() => navigate("/leads/new")}
              />
            ) : null}
          </>
        }
      />

      <div className="overflow-hidden rounded-[20px] border border-border bg-surface shadow-soft">
        <div className="leads-toolbar flex min-w-0 max-w-full flex-col border-b border-border">
          <div className="px-3 min-[961px]:px-4">
            <LeadStatusTabs
              value={view}
              summary={data?.summary}
              onChange={(next) => {
                setView(next);
                resetPage();
              }}
            />
          </div>
          <LeadFilters
            search={search}
            filters={filters}
            duplicatesOnly={duplicatesOnly}
            showStatusFilter
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={setVisibleColumns}
            loadOptions={loadOptions}
            onSearchChange={(value) => {
              setSearch(value);
              resetPage();
            }}
            onFiltersChange={(value) => {
              setFilters(value);
              resetPage();
            }}
            onDuplicatesOnlyChange={(value) => {
              setDuplicatesOnly(value);
              resetPage();
            }}
          />
        </div>

        <div className="p-3 sm:p-4">
          {isError ? (
            <p className="m-0 mb-3 text-danger">
              Could not load records. Check API connection.
            </p>
          ) : null}

          <LeadsTable
            data={rows}
            loading={isFetching}
            page={page}
            limit={limit}
            total={data?.total || rows.length}
            canEdit={canEdit}
            canChangeStatus={canChangeStatus}
            canClose={canClose}
            canReassign={canReassign}
            canOverridePriority={canOverridePriority}
            canConvert={canConvert}
            showStatus
            visibleColumns={visibleColumns}
            onPageChange={setPage}
            onLimitChange={(value) => {
              setLimit(value);
              resetPage();
            }}
            onView={(row) => navigate(`/leads/${row.id}`)}
            onEdit={(row) => navigate(`/leads/${row.id}/edit`)}
            onChangeStatus={(row) => setStatusLeadId(row.id)}
            onCloseLead={(row) =>
              setCloseLead({ id: row.id, status: row.status })
            }
            onAddNote={canAddNote ? (row) => setNoteLeadId(row.id) : undefined}
            onAddFollowUp={
              canFollowUp ? (row) => setFollowUpLeadId(row.id) : undefined
            }
            onAddMeeting={
              canMeeting ? (row) => setMeetingLeadId(row.id) : undefined
            }
            onReassign={
              canReassign ? (row) => setReassignLeadId(row.id) : undefined
            }
            onChangePriority={
              canOverridePriority
                ? (row) => setPriorityLeadId(row.id)
                : undefined
            }
            onConvert={
              canChangeStatus ? (row) => setStatusLeadId(row.id) : undefined
            }
            onOwnerClick={(row) => {
              if (row.ownerId) navigate(`/users/${row.ownerId}`);
            }}
          />
        </div>
      </div>

      <LeadListChangeStatusModal
        leadId={statusLeadId}
        open={Boolean(statusLeadId)}
        auth={auth}
        onClose={closeStatusModal}
        loadOptions={loadOptions}
      />
      <LeadListCloseModal
        leadId={closeLead?.id || null}
        open={Boolean(closeLead)}
        auth={auth}
        currentStatus={closeLead?.status || ""}
        onClose={closeCloseModal}
      />
      <LeadListAddNoteModal
        leadId={noteLeadId}
        open={Boolean(noteLeadId)}
        auth={auth}
        onClose={() => setNoteLeadId(null)}
      />
      <LeadListFollowUpModal
        leadId={followUpLeadId}
        open={Boolean(followUpLeadId)}
        auth={auth}
        onClose={() => setFollowUpLeadId(null)}
      />
      <LeadListMeetingModal
        leadId={meetingLeadId}
        open={Boolean(meetingLeadId)}
        auth={auth}
        onClose={() => setMeetingLeadId(null)}
      />
      <LeadListReassignModal
        leadId={reassignLeadId}
        open={Boolean(reassignLeadId)}
        auth={auth}
        onClose={() => setReassignLeadId(null)}
      />
      <LeadListPriorityModal
        leadId={priorityLeadId}
        open={Boolean(priorityLeadId)}
        auth={auth}
        onClose={() => setPriorityLeadId(null)}
        loadOptions={loadOptions}
      />
    </div>
  );
}
