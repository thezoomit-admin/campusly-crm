import type { SorterResult } from "antd/es/table/interface";
import { DataTable } from "@/components/common/Tables";
import type { MyLeadRow } from "../types";
import { getMyLeadColumns } from "../utils/myLeadColumns";

type MyLeadsTableProps = {
  data: MyLeadRow[];
  loading?: boolean;
  page: number;
  limit: number;
  total: number;
  sort?: string;
  order?: "asc" | "desc";
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSortChange: (sort: "assigned" | "priority", order: "asc" | "desc") => void;
  onView: (row: MyLeadRow) => void;
};

export default function MyLeadsTable({
  data,
  loading,
  page,
  limit,
  total,
  sort,
  order,
  onPageChange,
  onLimitChange,
  onSortChange,
  onView,
}: MyLeadsTableProps) {
  return (
    <DataTable
      className="leads-table-shell"
      loading={loading}
      data={data}
      columns={getMyLeadColumns({ sort, order, onView })}
      rowKey="id"
      showRowNumber={false}
      isPaginate
      alwaysShowPagination
      currentPage={page}
      setCurrentPage={onPageChange}
      limit={limit}
      setLimit={onLimitChange}
      total={total}
      showSizeChanger
      onChange={(_pagination, _filters, sorter, extra) => {
        const action = (extra as { action?: string } | undefined)?.action;
        if (action && action !== "sort") return;
        const next = (
          Array.isArray(sorter) ? sorter[0] : sorter
        ) as SorterResult<MyLeadRow>;
        if (next?.columnKey === "priority" && next.order) {
          onSortChange("priority", next.order === "ascend" ? "asc" : "desc");
          return;
        }
        onSortChange("assigned", "desc");
      }}
      onRow={(record) => ({
        onClick: () => onView(record as unknown as MyLeadRow),
        style: { cursor: "pointer" },
      })}
      pagination={{
        showTotal: (count: number, range: [number, number]) =>
          `Showing ${range[0]}-${range[1]} of ${count} assigned leads`,
        pageSizeOptions: ["10", "25", "50"],
      }}
    />
  );
}
