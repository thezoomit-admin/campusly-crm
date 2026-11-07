import { useCallback, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
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
import LeadListFollowUpModal from "../components/LeadListFollowUpModal";
import LeadListMeetingModal from "../components/LeadListMeetingModal";
import LeadListPriorityModal from "../components/LeadListPriorityModal";
import LeadListReassignModal from "../components/LeadListReassignModal";
import LeadListReopenModal from "../components/LeadListReopenModal";
import LeadsTable from "../components/LeadsTable";
import type { LeadRow } from "../types";
import "../leadsList.css";

export default function ClosedLeadsPage() {
  const auth = useOutletContext<AuthSession>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<LeadFilterValues>(EMPTY_LEAD_FILTERS);
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [reopenLeadId, setReopenLeadId] = useState<string | null>(null);
  const [noteLeadId, setNoteLeadId] = useState<string | null>(null);
  const [followUpLeadId, setFollowUpLeadId] = useState<string | null>(null);
  const [meetingLeadId, setMeetingLeadId] = useState<string | null>(null);
  const [reassignLeadId, setReassignLeadId] = useState<string | null>(null);
  const [priorityLeadId, setPriorityLeadId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const canExport = hasPermission(auth, "lead:export");
  const canEdit = hasPermission(auth, "lead:edit");
  const canReopen = hasPermission(auth, "lead:reopen");
  const canReassign = hasPermission(auth, "lead:reassign");
  const canOverridePriority = hasPermission(auth, "lead:override_priority");
  const canAddNote = hasPermission(auth, "activity:create");
  const canFollowUp = hasPermission(auth, "follow_up:create");
  const canMeeting =
    canFollowUp || hasPermission(auth, "activity:create");

  const { data, isFetching, isError } = useListLeadsQuery({
    search: debouncedSearch,
    page,
    limit,
    status: "closed",
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

  const closeReopenModal = useCallback(() => {
    setReopenLeadId(null);
  }, []);

  return (
    <div className={adminPage}>
      <PageMeta
        title="Lost/Close Leads"
        description="Review leads that were marked as lost or closed, and reopen them when needed."
      />
      <PageHeader
        title="Lost/Close Leads"
        subtitle="Leads marked as lost or closed. Reopen a lead to return it to the active pipeline."
        breadcrumbs={[
          { title: "Dashboard", path: "/dashboard" },
          { title: "Lost/Close Leads" },
        ]}
        showDivider={false}
        extra={
          canExport ? (
            <ExportActions
              title="Lost/Close Leads"
              path={`/leads/export${toQuery({
                search: debouncedSearch,
                status: "closed",
                source: filters.source,
                priority: filters.priority,
                country: filters.country,
                duplicatesOnly: duplicatesOnly ? "true" : undefined,
              })}`}
            />
          ) : null
        }
      />

      <div className="overflow-hidden rounded-[20px] border border-border bg-surface shadow-soft">
        <div className="leads-toolbar flex min-w-0 max-w-full flex-col gap-4 border-b border-border px-3 min-[961px]:flex-row min-[961px]:flex-nowrap min-[961px]:items-center min-[961px]:gap-x-3 min-[961px]:gap-y-0 min-[961px]:px-4">
          <LeadFilters
            search={search}
            filters={filters}
            duplicatesOnly={duplicatesOnly}
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
            canChangeStatus={false}
            canClose={false}
            canReopen={canReopen}
            canReassign={canReassign}
            canOverridePriority={canOverridePriority}
            showStatus
            showCloseMeta
            onPageChange={setPage}
            onLimitChange={(value) => {
              setLimit(value);
              resetPage();
            }}
            onView={(row) => navigate(`/leads/${row.id}`)}
            onEdit={(row) => navigate(`/leads/${row.id}/edit`)}
            onReopen={(row) => setReopenLeadId(row.id)}
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
            onOwnerClick={(row) => {
              if (row.ownerId) navigate(`/users/${row.ownerId}`);
            }}
          />
        </div>
      </div>

      <LeadListReopenModal
        leadId={reopenLeadId}
        open={Boolean(reopenLeadId)}
        auth={auth}
        onClose={closeReopenModal}
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
