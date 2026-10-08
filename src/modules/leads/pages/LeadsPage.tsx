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
import LeadFilters, {
  EMPTY_LEAD_FILTERS,
  type LeadFilterValues,
} from "../components/LeadFilters";
import LeadListChangeStatusModal from "../components/LeadListChangeStatusModal";
import LeadListCloseModal from "../components/LeadListCloseModal";
import LeadListReopenModal from "../components/LeadListReopenModal";
import LeadStatusTabs from "../components/LeadStatusTabs";
import LeadsTable from "../components/LeadsTable";
import type { LeadRow } from "../types";
import type { LeadPipelineTab } from "../utils/leadList";
import "../leadsList.css";

export default function LeadsPage() {
  const auth = useOutletContext<AuthSession>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadPipelineTab>("all");
  const [filters, setFilters] = useState<LeadFilterValues>(EMPTY_LEAD_FILTERS);
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusLeadId, setStatusLeadId] = useState<string | null>(null);
  const [closeLeadId, setCloseLeadId] = useState<string | null>(null);
  const [reopenLeadId, setReopenLeadId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const canCreate = hasPermission(auth, "lead:create");
  const canExport = hasPermission(auth, "lead:export");
  const canEdit = hasPermission(auth, "lead:edit");
  const canChangeStatus = hasPermission(auth, "lead:update_status");
  const canClose = hasPermission(auth, "lead:close");
  const canReopen = hasPermission(auth, "lead:reopen");
  const isClosedTab = status === "closed";

  const { data, isFetching, isError } = useListLeadsQuery({
    search: debouncedSearch,
    page,
    limit,
    status,
    source: filters.source,
    priority: filters.priority,
    country: filters.country,
    duplicatesOnly: duplicatesOnly || undefined,
  });

  const rows = (data?.items || []) as LeadRow[];

  function resetPage() {
    setPage(1);
  }

  const closeStatusModal = useCallback(() => {
    setStatusLeadId(null);
  }, []);

  const closeCloseModal = useCallback(() => {
    setCloseLeadId(null);
  }, []);

  const closeReopenModal = useCallback(() => {
    setReopenLeadId(null);
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
                  status: status !== "all" ? status : undefined,
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
        <div className="leads-toolbar flex min-w-0 max-w-full flex-col gap-4 border-b border-border px-3 min-[961px]:flex-row min-[961px]:flex-nowrap min-[961px]:items-center min-[961px]:gap-x-3 min-[961px]:gap-y-0 min-[961px]:px-4">
          <LeadStatusTabs
            value={status}
            summary={data?.summary}
            onChange={(next) => {
              setStatus(next);
              resetPage();
            }}
          />
          <LeadFilters
            search={search}
            filters={filters}
            duplicatesOnly={duplicatesOnly}
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
            canChangeStatus={canChangeStatus && !isClosedTab}
            canClose={canClose && !isClosedTab}
            canReopen={canReopen && isClosedTab}
            showStatus={status === "all" || isClosedTab}
            onPageChange={setPage}
            onLimitChange={(value) => {
              setLimit(value);
              resetPage();
            }}
            onView={(row) => navigate(`/leads/${row.id}`)}
            onEdit={(row) => navigate(`/leads/${row.id}/edit`)}
            onChangeStatus={(row) => setStatusLeadId(row.id)}
            onCloseLead={(row) => setCloseLeadId(row.id)}
            onReopen={(row) => setReopenLeadId(row.id)}
          />
        </div>
      </div>

      <LeadListChangeStatusModal
        leadId={statusLeadId}
        open={Boolean(statusLeadId)}
        auth={auth}
        onClose={closeStatusModal}
      />
      <LeadListCloseModal
        leadId={closeLeadId}
        open={Boolean(closeLeadId)}
        auth={auth}
        onClose={closeCloseModal}
      />
      <LeadListReopenModal
        leadId={reopenLeadId}
        open={Boolean(reopenLeadId)}
        auth={auth}
        onClose={closeReopenModal}
      />
    </div>
  );
}
