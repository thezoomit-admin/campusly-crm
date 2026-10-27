import { useMemo, useState, type ReactNode } from "react";
import { Input, Modal, Popconfirm, Spin } from "antd";
import { toast } from "react-toastify";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Add01Icon,
  AirplaneTakeOff01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
  Coins01Icon,
  Delete02Icon,
  File01Icon,
  Globe02Icon,
  GraduationScrollIcon,
  Invoice01Icon,
  Package01Icon,
  PencilEdit02Icon,
  SentIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { PrimaryButton } from "@/components/ui";
import { DeleteModal } from "@/components/common/Modals";
import { getApiError } from "@/lib/api";
import AddPaymentModal from "@/modules/payments/components/AddPaymentModal";
import ReceiptViewModal from "@/modules/payments/components/ReceiptViewModal";
import {
  useChangeLeadServiceOfferStatusMutation,
  useDeleteLeadServiceOfferMutation,
  useGenerateLeadServiceOfferMutation,
  useGetServiceOfferContextQuery,
  useListLeadServiceOffersQuery,
  useRecordOfferInstallmentPaymentMutation,
  type OfferStatusAction,
} from "../api/packagesApi";
import type { OfferLineKind, ServiceOfferRecord, ServiceOfferStatus } from "../types";
import { formatMoney } from "../utils/offerCalculator";
import ServiceOfferEditor from "./ServiceOfferEditor";

const STATUS_META: Record<
  ServiceOfferStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-[#f1f5f9] text-[#64748b]",
  },
  GENERATED: {
    label: "Generated",
    className: "bg-[#e8f1ff] text-[#2563eb]",
  },
  SENT: {
    label: "Sent",
    className: "bg-[#eef2ff] text-[#4f46e5]",
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-[#e8f8ef] text-[#15803d]",
  },
  PAYMENT_PENDING: {
    label: "Payment Pending",
    className: "bg-[#fff7e8] text-[#b45309]",
  },
  PARTIALLY_PAID: {
    label: "Partially Paid",
    className: "bg-[#fff4e5] text-[#c2410c]",
  },
  PAID: {
    label: "Paid",
    className: "bg-[#e8f8ef] text-[#15803d]",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-[#ffe8e8] text-[#dc2626]",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-[#fff1e8] text-[#ea580c]",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-[#ffe8e8] text-[#dc2626]",
  },
};

const ACTIVE_STATUSES: ServiceOfferStatus[] = [
  "ACCEPTED",
  "PAYMENT_PENDING",
  "PARTIALLY_PAID",
  "PAID",
];
const OPEN_STATUSES: ServiceOfferStatus[] = ["DRAFT", "GENERATED", "SENT"];
const CLOSED_STATUSES: ServiceOfferStatus[] = ["REJECTED", "EXPIRED", "CANCELLED"];

const KIND_META: Record<
  OfferLineKind,
  { label: string; className: string; icon: IconSvgElement; iconWrap: string }
> = {
  PACKAGE_INCLUDED: {
    label: "Included",
    className: "bg-[#e8f8ef] text-[#15803d]",
    icon: GraduationScrollIcon,
    iconWrap: "bg-[#e8f8ef] text-[#16a34a]",
  },
  PACKAGE_OPTIONAL: {
    label: "Optional",
    className: "bg-[#e8f1ff] text-[#2563eb]",
    icon: File01Icon,
    iconWrap: "bg-[#e8f1ff] text-[#2563eb]",
  },
  SERVICE: {
    label: "Service",
    className: "bg-[#e8f1ff] text-[#2563eb]",
    icon: AirplaneTakeOff01Icon,
    iconWrap: "bg-[#e8f1ff] text-[#2563eb]",
  },
  ADDITIONAL: {
    label: "Additional",
    className: "bg-[#fff4e5] text-[#c2410c]",
    icon: Globe02Icon,
    iconWrap: "bg-[#f3e8ff] text-[#7c3aed]",
  },
  CUSTOM_SERVICE: {
    label: "Custom",
    className: "bg-[#f3e8ff] text-[#7c3aed]",
    icon: File01Icon,
    iconWrap: "bg-[#f3e8ff] text-[#7c3aed]",
  },
  CUSTOM_CHARGE: {
    label: "Charge",
    className: "bg-[#ffe8e8] text-[#dc2626]",
    icon: File01Icon,
    iconWrap: "bg-[#fff4e5] text-[#ea580c]",
  },
};

const ACTION_COPY: Record<
  OfferStatusAction,
  { title: string; okText: string; description?: string }
> = {
  send: {
    title: "Mark this offer as sent?",
    okText: "Mark as sent",
    description: "Record that the offer has been shared with the student.",
  },
  accept: {
    title: "Mark this offer as accepted?",
    okText: "Mark as Accepted",
    description:
      "The accepted version, amount, and services are recorded and the offer can no longer be edited.",
  },
  reject: { title: "Mark this offer as rejected", okText: "Mark as Rejected" },
  cancel: { title: "Cancel this offer", okText: "Cancel Offer" },
};

function dateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function dateOnly(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-GB") : "—";
}

function offerTitle(offer: ServiceOfferRecord) {
  const name = offer.packageName || "Custom service offer";
  return `Offer V${offer.offerVersion} - ${name}`;
}

function statusLine(offer: ServiceOfferRecord) {
  switch (offer.status) {
    case "DRAFT":
      return `Created by ${offer.createdBy?.fullName || "—"} · ${dateTime(offer.createdAt)}`;
    case "GENERATED":
      return `Generated by ${offer.generatedBy?.fullName || "—"} · ${dateTime(offer.generatedAt)}`;
    case "SENT":
      return `Sent by ${offer.sentBy?.fullName || "—"} · ${dateTime(offer.sentAt)}${
        offer.validUntil ? ` · Valid until ${dateOnly(offer.validUntil)}` : ""
      }`;
    case "REJECTED":
      return `Rejected · ${dateTime(offer.rejectedAt)}${
        offer.rejectionReason ? ` — ${offer.rejectionReason}` : ""
      }`;
    case "EXPIRED":
      return `Expired · validity ended ${dateOnly(offer.validUntil)}`;
    case "CANCELLED":
      return `Cancelled by ${offer.cancelledBy?.fullName || "—"} · ${dateTime(offer.cancelledAt)}${
        offer.cancelReason ? ` — ${offer.cancelReason}` : ""
      }`;
    default:
      return `Accepted by ${offer.acceptedBy?.fullName || "—"} · ${dateTime(offer.acceptedAt)}`;
  }
}

function StatusBadge({ status }: { status: ServiceOfferStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function KindBadge({ kind }: { kind: OfferLineKind }) {
  const meta = KIND_META[kind];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function MoneyRow({
  label,
  value,
  strong,
  accent,
  negative,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
  negative?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 text-[13px] ${strong ? "pt-1" : ""}`}>
      <span className={strong ? "font-semibold text-[#17324f] dark:text-text" : "text-[#6b7c90] dark:text-text-muted"}>
        {label}
      </span>
      <span
        className={`tabular-nums ${
          accent
            ? "text-[18px] font-bold text-primary"
            : strong
              ? "font-semibold text-[#17324f] dark:text-text"
              : "font-medium text-[#17324f] dark:text-text"
        } ${negative ? "text-danger" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function TextAction({
  label,
  icon,
  onClick,
  danger,
  disabled,
  loading,
}: {
  label: string;
  icon: IconSvgElement;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <PrimaryButton
      type="button"
      size="sm"
      variant="text"
      disabled={disabled}
      loading={loading}
      className={`px-1.5! ${
        danger
          ? "text-danger! hover:bg-[#fff1f0]!"
          : "text-[#5b6b7c]! hover:bg-[#f3f6f9]! hover:text-[#17324f]!"
      }`}
      icon={<HugeiconsIcon icon={icon} size={14} color="currentColor" strokeWidth={1.8} />}
      label={label}
      onClick={onClick}
    />
  );
}

function OfferDetails({
  offer,
  canRecordPayment,
  paying,
  onPay,
}: {
  offer: ServiceOfferRecord;
  canRecordPayment: boolean;
  paying: boolean;
  onPay: (installmentId: string) => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(true);
  const payable = offer.status === "PAYMENT_PENDING" || offer.status === "PARTIALLY_PAID";
  const active = ACTIVE_STATUSES.includes(offer.status);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 overflow-hidden rounded-xl border border-[#e7eef5] bg-white dark:border-border dark:bg-surface">
          {offer.packageName ? (
            <div className="flex items-start gap-3 border-b border-[#eef3f8] px-4 py-3.5 dark:border-border-subtle">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f8ef] text-primary">
                <HugeiconsIcon icon={Package01Icon} size={18} color="currentColor" strokeWidth={1.7} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="m-0 text-[14px] font-semibold text-[#17324f] dark:text-text">
                      {offer.packageName}
                      {offer.versionNumber != null ? (
                        <span className="font-medium text-[#6b7c90]">
                          {" "}
                          • Version {offer.versionNumber}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="m-0 text-[14px] font-semibold tabular-nums text-[#17324f] dark:text-text">
                      {formatMoney(offer.packagePrice)}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-[#e8f8ef] px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">
                      Package
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#eef3f8] text-[11px] font-semibold uppercase tracking-wide text-[#8b97a8] dark:border-border-subtle">
                  <th className="w-10 px-4 py-2.5 font-semibold">#</th>
                  <th className="px-2 py-2.5 font-semibold">Service / Item</th>
                  <th className="w-[110px] px-2 py-2.5 font-semibold">Type</th>
                  <th className="w-[120px] px-4 py-2.5 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {offer.items.map((item, index) => {
                  const meta = KIND_META[item.kind];
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-[#f3f6f9] last:border-b-0 dark:border-border-subtle"
                    >
                      <td className="px-4 py-3 align-middle text-[13px] text-[#8b97a8]">
                        {index + 1}
                      </td>
                      <td className="px-2 py-3 align-middle">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${meta.iconWrap}`}
                          >
                            <HugeiconsIcon
                              icon={meta.icon}
                              size={15}
                              color="currentColor"
                              strokeWidth={1.7}
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="m-0 text-[13px] font-semibold text-[#17324f] dark:text-text">
                              {item.serviceName}
                            </p>
                            {item.remarks ? (
                              <p className="mb-0 mt-0.5 text-[12px] leading-snug text-[#8b97a8]">
                                {item.remarks}
                              </p>
                            ) : item.kind !== "PACKAGE_INCLUDED" && item.quantity > 1 ? (
                              <p className="mb-0 mt-0.5 text-[12px] text-[#8b97a8]">
                                {item.quantity} × {formatMoney(item.offeredPrice)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 align-middle">
                        <KindBadge kind={item.kind} />
                      </td>
                      <td className="px-4 py-3 align-middle text-right text-[13px] font-semibold tabular-nums text-[#17324f] dark:text-text">
                        {item.kind === "PACKAGE_INCLUDED"
                          ? formatMoney(item.offeredPrice || item.lineTotal)
                          : formatMoney(item.lineTotal)}
                      </td>
                    </tr>
                  );
                })}
                {Number(offer.fileOpeningCharge) > 0 ? (
                  <tr className="border-b border-[#f3f6f9] last:border-b-0 dark:border-border-subtle">
                    <td className="px-4 py-3 align-middle text-[13px] text-[#8b97a8]">
                      {offer.items.length + 1}
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#fff4e5] text-[#ea580c]">
                          <HugeiconsIcon
                            icon={File01Icon}
                            size={15}
                            color="currentColor"
                            strokeWidth={1.7}
                          />
                        </span>
                        <p className="m-0 text-[13px] font-semibold text-[#17324f] dark:text-text">
                          File opening charge
                        </p>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <span className="inline-flex items-center rounded-full bg-[#ffe8e8] px-2 py-0.5 text-[11px] font-semibold text-[#dc2626]">
                        Charge
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-right text-[13px] font-semibold tabular-nums text-[#17324f] dark:text-text">
                      {formatMoney(offer.fileOpeningCharge)}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-[#e7eef5] bg-white p-4 dark:border-border dark:bg-surface">
          <h4 className="mb-3 mt-0 text-[14px] font-semibold text-[#17324f] dark:text-text">
            Amount Summary
          </h4>
          <div className="grid gap-2.5">
            <MoneyRow label="Gross amount" value={formatMoney(offer.grossTotal)} />
            <MoneyRow
              label="Line item discount"
              value={`- ${formatMoney(offer.lineDiscountTotal)}`}
              negative={Number(offer.lineDiscountTotal) > 0}
            />
            <MoneyRow label="Subtotal" value={formatMoney(offer.subtotal)} />
            <MoneyRow
              label={
                offer.overallDiscountReason
                  ? `Overall discount · ${offer.overallDiscountReason}`
                  : "Overall discount"
              }
              value={`- ${formatMoney(offer.overallDiscountAmount)}`}
              negative={Number(offer.overallDiscountAmount) > 0}
            />
            <div className="mt-1 rounded-lg bg-[#eef8f2] px-3 py-3 dark:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]">
              <MoneyRow
                label="Final payable"
                value={formatMoney(offer.finalPayable)}
                strong
                accent
              />
            </div>
            {offer.initialPayment ? (
              <>
                <MoneyRow label="Initial payment" value={formatMoney(offer.initialPayment)} />
                <MoneyRow
                  label="Remaining due"
                  value={formatMoney(offer.remainingAfterInitial)}
                />
              </>
            ) : null}
            {active ? (
              <>
                <div className="border-t border-[#eef3f8] pt-2 dark:border-border-subtle" />
                <MoneyRow label="Received" value={formatMoney(offer.paidAmount)} />
                <MoneyRow label="Due" value={formatMoney(offer.dueAmount)} strong />
              </>
            ) : null}
          </div>
        </aside>
      </div>

      {offer.installments.length ? (
        <section className="rounded-xl border border-[#e7eef5] bg-white p-4 dark:border-border dark:bg-surface">
          <h4 className="mb-3 mt-0 text-[14px] font-semibold text-[#17324f] dark:text-text">
            Payment plan
          </h4>
          <div className="grid gap-2">
            {offer.installments.map((item) => {
              const paid = item.status === "PAID";
              const partial = item.status === "PARTIAL";
              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#eef3f8] px-3 py-2.5 dark:border-border-subtle"
                >
                  <div className="min-w-0">
                    <p className="m-0 text-[13px] font-medium text-[#17324f] dark:text-text">
                      <span className="mr-1.5 text-[#8b97a8]">#{item.sequence}</span>
                      {item.purpose}
                    </p>
                    <p className="mb-0 mt-0.5 text-[12px] text-[#8b97a8]">
                      {item.dueDate ? `Due ${item.dueDate}` : "No due date"}
                      {item.paidAt
                        ? ` · Received ${dateTime(item.paidAt)}${
                            item.paidBy ? ` by ${item.paidBy.fullName}` : ""
                          }`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-semibold tabular-nums text-[#17324f] dark:text-text">
                      {formatMoney(item.amount)}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        paid
                          ? "bg-[#e8f8ef] text-[#15803d]"
                          : partial
                            ? "bg-[#fff4e5] text-[#c2410c]"
                            : "bg-[#f1f5f9] text-[#64748b]"
                      }`}
                    >
                      {paid ? "Paid" : partial ? "Partial" : "Pending"}
                    </span>
                    {canRecordPayment && payable && !paid ? (
                      <Popconfirm
                        title="Record this payment as received?"
                        okText="Record Payment"
                        onConfirm={() => onPay(item.id)}
                      >
                        <PrimaryButton
                          type="button"
                          size="sm"
                          variant="outline"
                          label="Record"
                          loading={paying}
                        />
                      </Popconfirm>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {offer.statusHistory.length ? (
        <section className="rounded-xl border border-[#e7eef5] bg-white dark:border-border dark:bg-surface">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent px-4 py-3 text-left"
            onClick={() => setHistoryOpen((value) => !value)}
          >
            <span className="text-[14px] font-semibold text-[#17324f] dark:text-text">
              Status History
            </span>
            <HugeiconsIcon
              icon={historyOpen ? ArrowUp01Icon : ArrowDown01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.8}
            />
          </button>
          {historyOpen ? (
            <ol className="relative m-0 grid list-none gap-0 border-t border-[#eef3f8] px-4 py-4 pl-8 dark:border-border-subtle">
              {offer.statusHistory.map((entry, index) => {
                const isLast = index === offer.statusHistory.length - 1;
                return (
                  <li key={entry.id} className={`relative ${isLast ? "" : "pb-4"}`}>
                    {!isLast ? (
                      <span className="absolute top-3 left-[-17px] h-[calc(100%-4px)] w-px bg-[#d8e5d8]" />
                    ) : null}
                    <span className="absolute top-1.5 left-[-21px] size-2.5 rounded-full bg-primary ring-[3px] ring-[#e8f8ef]" />
                    <p className="m-0 text-[13px] font-semibold text-[#17324f] dark:text-text">
                      {entry.fromStatus ? (
                        <>
                          {STATUS_META[entry.fromStatus].label}
                          <span className="mx-1.5 text-[#8b97a8]">→</span>
                          {STATUS_META[entry.toStatus].label}
                        </>
                      ) : (
                        <>Created as {STATUS_META[entry.toStatus].label}</>
                      )}
                    </p>
                    <p className="mb-0 mt-0.5 text-[12px] text-[#8b97a8]">
                      {entry.changedBy?.fullName || "System"} · {dateTime(entry.createdAt)}
                      {entry.reason ? ` · ${entry.reason}` : ""}
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

type ReasonPrompt = { offer: ServiceOfferRecord; action: "reject" | "cancel" };

export default function LeadPackageOfferPanel({
  leadId,
  leadName,
  leadCode,
  canOffer,
}: {
  leadId: string;
  leadName: string;
  leadCode: string;
  canOffer: boolean;
}) {
  const { data, isFetching, isUninitialized, isError } =
    useListLeadServiceOffersQuery(leadId, { refetchOnMountOrArgChange: true });
  const offersLoading = !isError && (isUninitialized || (isFetching && !data));
  const { data: context, isFetching: contextLoading } = useGetServiceOfferContextQuery(
    leadId,
    { skip: !canOffer, refetchOnMountOrArgChange: true },
  );
  const [generateOffer, { isLoading: generating }] = useGenerateLeadServiceOfferMutation();
  const [deleteOffer, { isLoading: deleting }] = useDeleteLeadServiceOfferMutation();
  const [changeStatus, { isLoading: changing }] = useChangeLeadServiceOfferStatusMutation();
  const [recordPayment, { isLoading: paying }] = useRecordOfferInstallmentPaymentMutation();
  const [editor, setEditor] = useState<{
    offer: ServiceOfferRecord | null;
    revise: boolean;
  } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<ReasonPrompt | null>(null);
  const [reason, setReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ServiceOfferRecord | null>(null);
  const [payOffer, setPayOffer] = useState<ServiceOfferRecord | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const offers = data?.offers || [];
  const canRecordPayment = Boolean(context?.permissions.canRecordPayment);

  const stats = useMemo(() => {
    const open = offers.filter((offer) => !CLOSED_STATUSES.includes(offer.status));
    const sent = offers.filter(
      (offer) =>
        offer.status === "SENT" ||
        offer.status === "ACCEPTED" ||
        offer.status === "PAYMENT_PENDING" ||
        offer.status === "PARTIALLY_PAID" ||
        offer.status === "PAID",
    );
    const totalValue = open.reduce((sum, offer) => sum + Number(offer.finalPayable || 0), 0);
    return {
      total: offers.length,
      active: open.length,
      sent: sent.length,
      totalValue,
    };
  }, [offers]);

  async function run(task: () => Promise<{ message: string }>, fallback: string) {
    try {
      const result = await task();
      toast.success(result.message);
      return true;
    } catch (error) {
      toast.error(getApiError(error, fallback));
      return false;
    }
  }

  function generate(offer: ServiceOfferRecord) {
    void run(
      () => generateOffer({ leadId, offerId: offer.id }).unwrap(),
      "Unable to save the service offer. Please try again.",
    );
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    const ok = await run(
      () => deleteOffer({ leadId, offerId: deleteTarget.id }).unwrap(),
      "Unable to delete the draft offer. Please try again.",
    );
    if (ok) setDeleteTarget(null);
  }

  function transition(
    offer: ServiceOfferRecord,
    action: OfferStatusAction,
    withReason?: string,
  ) {
    return run(
      () =>
        changeStatus({
          leadId,
          offerId: offer.id,
          action,
          reason: withReason,
        }).unwrap(),
      "This offer status change is not allowed.",
    );
  }

  function pay(offer: ServiceOfferRecord, installmentId: string) {
    void run(
      () => recordPayment({ leadId, offerId: offer.id, installmentId }).unwrap(),
      "Unable to record the payment. Please try again.",
    );
  }

  function openPrompt(offer: ServiceOfferRecord, action: ReasonPrompt["action"]) {
    setReason("");
    setPrompt({ offer, action });
  }

  async function submitPrompt() {
    if (!prompt) return;
    const trimmed = reason.trim();
    if (prompt.action === "cancel" && !trimmed) {
      toast.error("Please provide a reason for cancelling this offer.");
      return;
    }
    const done = await transition(prompt.offer, prompt.action, trimmed || undefined);
    if (done) setPrompt(null);
  }

  if (editor && context) {
    return (
      <ServiceOfferEditor
        key={`${editor.offer?.id || "new"}-${editor.revise ? "revise" : "edit"}`}
        leadId={leadId}
        context={context}
        offer={editor.offer}
        revise={editor.revise}
        onClose={() => setEditor(null)}
      />
    );
  }

  function confirmAction(
    offer: ServiceOfferRecord,
    action: "send" | "accept",
    primary = false,
  ) {
    const copy = ACTION_COPY[action];
    return (
      <Popconfirm
        key={action}
        title={copy.title}
        description={copy.description}
        okText={copy.okText}
        onConfirm={() => void transition(offer, action)}
      >
        <PrimaryButton
          type="button"
          size="sm"
          variant={primary ? undefined : "outline"}
          label={copy.okText}
          loading={changing}
          icon={
            action === "send" ? (
              <HugeiconsIcon icon={SentIcon} size={14} color="currentColor" strokeWidth={1.8} />
            ) : undefined
          }
        />
      </Popconfirm>
    );
  }

  function actions(offer: ServiceOfferRecord) {
    if (!canOffer) return { primary: [] as ReactNode[], secondary: [] as ReactNode[] };
    const allows = (status: ServiceOfferStatus) =>
      offer.allowedTransitions.includes(status);
    const otherOpen = offers.find(
      (item) => item.id !== offer.id && OPEN_STATUSES.includes(item.status),
    );
    const primary: ReactNode[] = [];
    const secondary: ReactNode[] = [];

    if (offer.status === "DRAFT") {
      primary.push(
        <Popconfirm
          key="generate"
          title="Generate this offer?"
          description="The offer is finalized and becomes ready to send to the student."
          okText="Generate"
          onConfirm={() => generate(offer)}
        >
          <PrimaryButton type="button" size="sm" label="Generate Offer" loading={generating} />
        </Popconfirm>,
      );
    }
    if (allows("SENT")) primary.push(confirmAction(offer, "send", true));
    if (allows("ACCEPTED"))
      primary.push(confirmAction(offer, "accept", offer.status === "SENT"));

    if (offer.status === "DRAFT" || offer.status === "GENERATED") {
      secondary.push(
        <TextAction
          key="edit"
          label="Edit"
          icon={PencilEdit02Icon}
          disabled={!context}
          onClick={() => setEditor({ offer, revise: false })}
        />,
      );
    }
    if (allows("REJECTED")) {
      secondary.push(
        <TextAction
          key="reject"
          label="Mark as Rejected"
          icon={Delete02Icon}
          onClick={() => openPrompt(offer, "reject")}
        />,
      );
    }
    if (offer.revisable && !otherOpen) {
      secondary.push(
        <TextAction
          key="revise"
          label="Create New Version"
          icon={Add01Icon}
          disabled={!context}
          onClick={() => setEditor({ offer, revise: true })}
        />,
      );
    }
    if (offer.status === "DRAFT" && !offer.revisedFrom && !offer.generatedAt) {
      secondary.push(
        <TextAction
          key="delete"
          label="Delete"
          icon={Delete02Icon}
          danger
          loading={deleting && deleteTarget?.id === offer.id}
          onClick={() => setDeleteTarget(offer)}
        />,
      );
    } else if (allows("CANCELLED")) {
      secondary.push(
        <TextAction
          key="cancel"
          label="Cancel offer"
          icon={Delete02Icon}
          danger
          onClick={() => openPrompt(offer, "cancel")}
        />,
      );
    }
    return { primary, secondary };
  }

  return (
    <section className="min-w-0 max-w-full overflow-hidden">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 text-[18px] font-semibold tracking-tight text-[#17324f] dark:text-text-strong">
            Services & Packages
          </h3>
          <p className="mb-0 mt-1 text-[13px] text-[#8b97a8]">
            View and manage offers, packages and services for this lead.
          </p>
        </div>
        {canOffer ? (
          <PrimaryButton
            type="button"
            size="sm"
            label="Create Offer"
            loading={contextLoading}
            disabled={!context}
            icon={<HugeiconsIcon icon={Add01Icon} size={14} color="currentColor" strokeWidth={1.8} />}
            onClick={() => setEditor({ offer: null, revise: false })}
          />
        ) : null}
      </header>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Offers",
            value: String(stats.total),
            icon: Task01Icon,
            tone: "bg-[#e8f8ef] text-primary",
          },
          {
            label: "Active Offers",
            value: String(stats.active),
            icon: CheckmarkCircle02Icon,
            tone: "bg-[#e8f8ef] text-primary",
          },
          {
            label: "Sent",
            value: String(stats.sent),
            icon: SentIcon,
            tone: "bg-[#e8f1ff] text-[#2563eb]",
          },
          {
            label: "Total Value",
            value: formatMoney(stats.totalValue),
            icon: Coins01Icon,
            tone: "bg-[#e8f8ef] text-primary",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#e7eef5] bg-white px-4 py-3.5 dark:border-border dark:bg-surface"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${card.tone}`}
              >
                <HugeiconsIcon icon={card.icon} size={18} color="currentColor" strokeWidth={1.7} />
              </span>
              <div className="min-w-0">
                <p className="m-0 text-[12px] text-[#8b97a8]">{card.label}</p>
                <p className="m-0 mt-0.5 truncate text-[16px] font-semibold tabular-nums text-[#17324f] dark:text-text-strong">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {offersLoading ? (
        <div className="grid min-h-40 place-items-center py-8">
          <Spin />
        </div>
      ) : null}
      {isError ? <p className="m-0 text-sm text-danger">Unable to load service offers.</p> : null}
      {!offersLoading && !isError && offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d7e2ec] bg-[#f8fafc] px-4 py-10 text-center dark:border-border dark:bg-transparent">
          <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-[#e8f8ef] text-primary">
            <HugeiconsIcon icon={Invoice01Icon} size={18} color="currentColor" strokeWidth={1.7} />
          </span>
          <p className="m-0 text-[13px] text-[#6b7c90]">
            {canOffer
              ? "No service offer yet. Create one from a package or individual services."
              : "No service offer yet. Creating one needs offer permission."}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3">
        {offers.map((offer) => {
          const open = expanded === offer.id;
          const closed = CLOSED_STATUSES.includes(offer.status);
          const offerActions = actions(offer);
          return (
            <article
              key={offer.id}
              className={`overflow-hidden rounded-xl border bg-white transition-shadow dark:bg-surface ${
                closed
                  ? "border-[#e7eef5] opacity-90 dark:border-border"
                  : open
                    ? "border-primary/30 shadow-[0_8px_24px_rgba(22,50,79,0.06)]"
                    : "border-[#e7eef5] dark:border-border"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f8ef] text-primary">
                    <HugeiconsIcon
                      icon={Invoice01Icon}
                      size={18}
                      color="currentColor"
                      strokeWidth={1.7}
                    />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="m-0 text-[15px] font-semibold text-[#17324f] dark:text-text">
                        {offerTitle(offer)}
                      </h3>
                      <StatusBadge status={offer.status} />
                    </div>
                    <p className="mb-0 mt-1 text-[12px] text-[#8b97a8]">{statusLine(offer)}</p>
                    {offer.revisedFrom ? (
                      <p className="mb-0 mt-0.5 text-[12px] text-[#8b97a8]">
                        Revised from Offer V{offer.revisedFrom.offerVersion}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {open ? (
                    <>
                      {offerActions.secondary}
                      {canRecordPayment &&
                      (offer.status === "PAYMENT_PENDING" ||
                        offer.status === "PARTIALLY_PAID" ||
                        offer.status === "ACCEPTED") &&
                      Number(offer.dueAmount) > 0 ? (
                        <PrimaryButton
                          type="button"
                          size="sm"
                          label="Add Payment"
                          onClick={() => setPayOffer(offer)}
                        />
                      ) : null}
                      {offerActions.primary}
                    </>
                  ) : null}
                  <p className="m-0 text-[15px] font-bold tabular-nums text-[#17324f] dark:text-text">
                    {formatMoney(offer.finalPayable)}
                  </p>
                  <button
                    type="button"
                    aria-label={open ? "Hide offer details" : "Show offer details"}
                    aria-expanded={open}
                    className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[#d7e2ec] bg-white text-[#5b6b7c] transition-colors duration-300 hover:bg-[#f3f6f9] hover:text-[#17324f] dark:border-border dark:bg-surface"
                    onClick={() => setExpanded(open ? null : offer.id)}
                  >
                    <span
                      className={`inline-flex transition-transform duration-500 ease-in-out ${
                        open ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.8}
                      />
                    </span>
                  </button>
                </div>
              </div>

              <div
                className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0 overflow-hidden" inert={!open}>
                  <div
                    className={`border-t bg-[#f8fafc] px-4 transition-[padding,border-color,opacity] duration-500 ease-in-out dark:border-border-subtle dark:bg-transparent ${
                      open
                        ? "border-[#eef3f8] py-4 opacity-100"
                        : "border-transparent py-0 opacity-0"
                    }`}
                  >
                    <OfferDetails
                      offer={offer}
                      canRecordPayment={canRecordPayment}
                      paying={paying}
                      onPay={(installmentId) => pay(offer, installmentId)}
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        open={Boolean(prompt)}
        title={
          prompt
            ? `${ACTION_COPY[prompt.action].title} — Offer V${prompt.offer.offerVersion}`
            : ""
        }
        okText={prompt ? ACTION_COPY[prompt.action].okText : "OK"}
        okButtonProps={{ danger: prompt?.action === "cancel", loading: changing }}
        cancelText="Close"
        onOk={() => void submitPrompt()}
        onCancel={() => setPrompt(null)}
        destroyOnHidden
      >
        <p className="mb-2 text-sm text-text-muted">
          {prompt?.action === "cancel"
            ? "The offer and its history are kept, but it can no longer be accepted or paid."
            : "Record why the student declined this offer (optional)."}
        </p>
        <Input.TextArea
          rows={3}
          maxLength={500}
          placeholder={
            prompt?.action === "cancel"
              ? "Reason for cancellation (required)"
              : "Reason (optional)"
          }
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </Modal>

      <DeleteModal
        open={Boolean(deleteTarget)}
        loading={deleting}
        title="Delete draft offer?"
        itemName={
          deleteTarget ? `Offer V${deleteTarget.offerVersion}` : "this draft offer"
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      {payOffer ? (
        <AddPaymentModal
          open={Boolean(payOffer)}
          onClose={() => setPayOffer(null)}
          leadId={leadId}
          leadName={leadName}
          leadCode={leadCode}
          offerId={payOffer.id}
          offerLabel={`Offer V${payOffer.offerVersion}${
            payOffer.packageName ? ` · ${payOffer.packageName}` : ""
          }`}
          finalPayable={payOffer.finalPayable}
          previouslyPaid={payOffer.paidAmount}
          currentDue={payOffer.dueAmount}
          onSuccess={({ receiptId: nextReceipt }) => {
            if (nextReceipt) setReceiptId(nextReceipt);
          }}
        />
      ) : null}

      <ReceiptViewModal
        open={Boolean(receiptId)}
        receiptId={receiptId}
        onClose={() => setReceiptId(null)}
      />
    </section>
  );
}
