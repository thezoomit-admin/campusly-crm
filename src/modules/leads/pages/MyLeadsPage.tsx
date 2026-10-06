import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getApiError } from "@/lib/api";
import { PageHeader } from "@/components/common/Navigation";
import { PageMeta } from "@/components/common/Meta";
import { useDebounce } from "@/hooks/useDebounce";
import type { AuthSession } from "../../../types";
import { adminPage } from "../../../styles/admin";
import { useListMyLeadsQuery } from "../api/leadsApi";
import MyLeadsFilters, {
  EMPTY_MY_LEAD_FILTERS,
  type MyLeadFilterValues,
} from "../components/MyLeadsFilters";
import MyLeadsSummary from "../components/MyLeadsSummary";
import MyLeadsTable from "../components/MyLeadsTable";
import "../leadsList.css";

export default function MyLeadsPage() {
  useOutletContext<AuthSession>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MyLeadFilterValues>(
    EMPTY_MY_LEAD_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<"assigned" | "priority">("assigned");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching, isError, error, refetch } = useListMyLeadsQuery(
    {
      search: debouncedSearch.trim(),
      page,
      limit,
      status: filters.status,
      source: filters.source,
      priority: filters.priority,
      country: filters.country,
      followUpStatus: filters.followUpStatus,
      sort,
      order,
    },
    { pollingInterval: 20000, refetchOnFocus: true },
  );

  const rows = useMemo(() => data?.items || [], [data?.items]);
  const hasActiveFilters = Boolean(
    debouncedSearch.trim() ||
    filters.status ||
    filters.country ||
    filters.source ||
    filters.priority ||
    filters.followUpStatus,
  );
  const errorMessage = isError
    ? getApiError(
        error,
        debouncedSearch.trim()
          ? "Unable to complete the search. Please try again."
          : "Unable to load your leads. Please try again.",
      )
    : "";

  function resetPage() {
    setPage(1);
  }

  return (
    <div className={adminPage}>
      <PageMeta
        title="My Leads"
        description="View and manage the leads currently assigned to you."
      />
      <PageHeader
        title="My Leads"
        subtitle="Your assigned workload. Newest assignments appear first."
        breadcrumbs={[
          { title: "Dashboard", path: "/dashboard" },
          { title: "My Leads" },
        ]}
        showDivider={false}
      />

      <MyLeadsSummary summary={data?.summary} />

      <div className="overflow-hidden rounded-[20px] border border-border bg-surface shadow-soft">
        <MyLeadsFilters
          search={search}
          filters={filters}
          onSearchChange={(value) => {
            setSearch(value);
            resetPage();
          }}
          onFiltersChange={(value) => {
            setFilters(value);
            resetPage();
          }}
          onRefresh={() => void refetch()}
          refreshing={isFetching}
        />

        <div className="p-3 sm:p-4">
          {isError ? (
            <p className="m-0 mb-3 text-danger">{errorMessage}</p>
          ) : null}

          {!isFetching && !isError && rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <p className="m-0 text-base font-semibold text-text-strong">
                {hasActiveFilters
                  ? "No matching leads found"
                  : "No Assigned Leads"}
              </p>
              <p className="m-0 mt-1.5 text-sm text-text-muted">
                {hasActiveFilters
                  ? "Try changing your search or filters."
                  : "You currently have no assigned leads."}
              </p>
            </div>
          ) : (
            <MyLeadsTable
              data={rows}
              loading={isFetching}
              page={page}
              limit={limit}
              total={data?.total || rows.length}
              sort={sort}
              order={order}
              onPageChange={setPage}
              onLimitChange={(value) => {
                setLimit(value);
                setPage(1);
              }}
              onSortChange={(nextSort, nextOrder) => {
                setSort(nextSort);
                setOrder(nextOrder);
                setPage(1);
              }}
              onView={(row) => navigate(`/leads/${row.id}`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
