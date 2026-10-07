import { useEffect, useMemo, useState } from "react";
import { Pagination } from "antd";

export const LEAD_LIST_PAGE_SIZE_OPTIONS = [10, 15] as const;
export const LEAD_LIST_DEFAULT_PAGE_SIZE = 10;

export function useLeadListPagination<T>(items: T[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(LEAD_LIST_DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [items.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  return {
    page: safePage,
    pageSize,
    setPage,
    setPageSize,
    pageItems,
    total: items.length,
  };
}

export function LeadListPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  if (total <= LEAD_LIST_DEFAULT_PAGE_SIZE) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef3f8] pt-3 dark:border-border-subtle">
      <span className="text-[0.78rem] text-[#8b97a8]">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{" "}
        {total}
      </span>
      <Pagination
        size="small"
        current={page}
        pageSize={pageSize}
        total={total}
        showSizeChanger={Boolean(onPageSizeChange)}
        pageSizeOptions={LEAD_LIST_PAGE_SIZE_OPTIONS.map(String)}
        onChange={(next, nextSize) => {
          onPageChange(next);
          if (onPageSizeChange && nextSize && nextSize !== pageSize) {
            onPageSizeChange(nextSize);
          }
        }}
        onShowSizeChange={(_current, size) => {
          onPageSizeChange?.(size);
        }}
      />
    </div>
  );
}
