import type { ColumnsType } from "antd/es/table";
import type { DocumentRow } from "../types";
import { documentStatusClass } from "./documentStatus";
import {
  formatAgeDays,
  formatDocumentDate,
  formatDocumentDateTime,
} from "./documentFormat";
import { displayStatusLabel, isMissingDocument } from "./documentDisplay";

export type DocumentColumnKey =
  | "owner"
  | "type"
  | "category"
  | "status"
  | "expiry"
  | "uploadedBy"
  | "verifiedBy"
  | "updated";

export const DEFAULT_VISIBLE_COLUMNS: DocumentColumnKey[] = [
  "owner",
  "type",
  "category",
  "status",
  "expiry",
  "uploadedBy",
  "verifiedBy",
  "updated",
];

export const ALL_DOCUMENT_COLUMNS: Array<{
  key: DocumentColumnKey;
  label: string;
}> = [
  { key: "owner", label: "File / Lead" },
  { key: "type", label: "Document" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
  { key: "expiry", label: "Expiry" },
  { key: "uploadedBy", label: "Uploaded by" },
  { key: "verifiedBy", label: "Verified by" },
  { key: "updated", label: "Updated / Age" },
];

function expiryLabel(row: DocumentRow) {
  if (row.expiryStatus === "EXPIRED") return "Expired";
  if (row.expiryStatus === "EXPIRING") return "Expiring";
  if (row.expiryStatus === "VALID")
    return row.expiryDate ? formatDocumentDate(row.expiryDate) : "Valid";
  if (row.expiryDate) return formatDocumentDate(row.expiryDate);
  return "—";
}

function RequirementBadge({ row }: { row: DocumentRow }) {
  if (!row.requirement) return null;
  const required = row.requirement === "REQUIRED";
  const missing = isMissingDocument(row);
  return (
    <span
      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        required
          ? missing
            ? "bg-[#ffe8ee] text-[#e11d48]"
            : "bg-[#fff1e6] text-[#d97706]"
          : "bg-[#f3f4f6] text-[#6b7280] dark:bg-[#24303a] dark:text-[#94a3b8]"
      }`}
    >
      {required ? "Required" : "Optional"}
    </span>
  );
}

export function buildDocumentColumns(options: {
  vault: "file" | "lead";
  visible: DocumentColumnKey[];
  grouped?: boolean;
  onOpenOwner?: (row: DocumentRow) => void;
}): ColumnsType<DocumentRow> {
  const { vault, visible, grouped, onOpenOwner } = options;
  const show = (key: DocumentColumnKey) => visible.includes(key);
  const columns: ColumnsType<DocumentRow> = [];

  if (show("owner") && !grouped) {
    columns.push({
      title: vault === "file" ? "File / Lead" : "Lead",
      dataIndex: "owner",
      key: "owner",
      width: 200,
      ellipsis: true,
      render: (value: string, row) => (
        <button
          type="button"
          className="m-0 max-w-full truncate border-0 bg-transparent p-0 text-left text-primary hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            onOpenOwner?.(row);
          }}
        >
          {value || "—"}
        </button>
      ),
    });
  }

  if (show("type")) {
    columns.push({
      title: "Document",
      dataIndex: "type",
      key: "type",
      width: 200,
      render: (value: string, row) => (
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-text-strong">{value || "—"}</span>
            <RequirementBadge row={row} />
          </div>
          {row.code ? (
            <span className="text-[11px] text-text-muted">{row.code}</span>
          ) : null}
        </div>
      ),
    });
  }

  if (show("category")) {
    columns.push({
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 110,
      render: (value: string) => value || "—",
    });
  }

  if (show("status")) {
    columns.push({
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (_: unknown, row) => {
        const label = displayStatusLabel(row);
        return <span className={documentStatusClass(label)}>{label}</span>;
      },
    });
  }

  if (show("expiry")) {
    columns.push({
      title: "Expiry",
      dataIndex: "expiryStatus",
      key: "expiry",
      width: 110,
      render: (_: unknown, row) => {
        const label = expiryLabel(row);
        if (label === "—") return "—";
        if (row.expiryStatus === "EXPIRED" || row.expiryStatus === "EXPIRING") {
          return (
            <span className={documentStatusClass(String(row.expiryStatus))}>
              {label}
            </span>
          );
        }
        return <span className="text-sm text-text-muted">{label}</span>;
      },
    });
  }

  if (show("uploadedBy")) {
    columns.push({
      title: "Uploaded by",
      dataIndex: "uploadedBy",
      key: "uploadedBy",
      width: 120,
      ellipsis: true,
      render: (value: string) => (value && value !== "—" ? value : "—"),
    });
  }

  if (show("verifiedBy")) {
    columns.push({
      title: "Verified by",
      dataIndex: "verifiedBy",
      key: "verifiedBy",
      width: 120,
      ellipsis: true,
      render: (value: string) => (value && value !== "—" ? value : "—"),
    });
  }

  if (show("updated")) {
    columns.push({
      title: "Updated",
      dataIndex: "updated",
      key: "updated",
      width: 140,
      render: (value: string, row) => (
        <div className="leading-tight">
          <span
            className="block whitespace-nowrap text-text-muted"
            title={value}
          >
            {formatDocumentDateTime(value)}
          </span>
          <span className="text-[11px] text-text-faint">
            {formatAgeDays(row.ageDays)}
          </span>
        </div>
      ),
    });
  }

  return columns;
}

export const documentColumns = buildDocumentColumns({
  vault: "file",
  visible: DEFAULT_VISIBLE_COLUMNS,
});
