import { Button } from "antd";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/Navigation";
import { PageMeta } from "@/components/common/Meta";
import { useDebounce } from "@/hooks/useDebounce";
import { useListPaymentsQuery } from "../api/paymentsApi";
import { adminCard, adminPage } from "../../../styles/admin";
import PaymentFilters from "../components/PaymentFilters";
import PaymentFormModal from "../components/PaymentFormModal";
import PaymentsTable from "../components/PaymentsTable";
import type { PaymentRow } from "../types";

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching, isError } = useListPaymentsQuery({
    search: debouncedSearch,
  });

  const rows = useMemo(
    () => (data?.items || []) as PaymentRow[],
    [data?.items],
  );

  return (
    <div className={adminPage}>
      <PageMeta
        title="Payments"
        description="Monitor fees, invoices, and payment status across students and applications."
      />
      <PageHeader
        title="Payments"
        subtitle="Monitor fees, invoices, and payment status across students and applications."
        breadcrumbs={[
          { title: "Dashboard", path: "/dashboard" },
          { title: "Payments" },
        ]}
        extra={
          <Button type="primary" onClick={() => setFormOpen(true)}>
            Add payment
          </Button>
        }
      />

      <div className={`${adminCard} grid gap-3`}>
        <PaymentFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">
            Could not load records. Check API connection.
          </p>
        ) : null}

        <PaymentsTable
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || rows.length}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      <PaymentFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
