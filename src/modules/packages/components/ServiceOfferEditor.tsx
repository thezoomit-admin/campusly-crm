import { useMemo, useState, type ReactNode } from "react";
import { Popconfirm, Tag } from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Location01Icon,
  MailSend01Icon,
  Package01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { FormDatePicker, FormInput, FormInputNumber, FormSelect } from "@/components/common/Forms";
import { PrimaryButton } from "@/components/ui";
import { getApiError, getApiErrorFields } from "@/lib/api";
import {
  useCreateLeadServiceOfferMutation,
  useListPackageOptionsQuery,
  useReviseLeadServiceOfferMutation,
  useUpdateLeadServiceOfferMutation,
} from "../api/packagesApi";
import type {
  DiscountType,
  EditableOfferLineKind,
  PackageServiceLine,
  ServiceOfferContext,
  ServiceOfferRecord,
  ServiceOfferWriteBody,
} from "../types";
import { calculateOffer, formatMoney, type CalculatorDiscount } from "../utils/offerCalculator";
import { AddServiceModal, CustomLineModal, type CatalogLineDraft, type CustomLineDraft } from "./OfferLineModals";

type DraftLine = {
  key: string;
  kind: EditableOfferLineKind;
  serviceItemId: string | null;
  name: string;
  defaultPrice: number | null;
  price: number | undefined;
  quantity: number | undefined;
  discountType: DiscountType;
  discountValue: number | undefined;
  discountReason: string;
  remarks: string;
};

type DraftInstallment = {
  key: string;
  amount: number | undefined;
  purpose: string;
  dueDate: string | null;
};

type IncludedLine = { serviceItemId: string; name: string; price: number };

const KIND_LABEL: Record<EditableOfferLineKind, string> = {
  PACKAGE_OPTIONAL: "Optional",
  SERVICE: "Service",
  ADDITIONAL: "Additional",
  CUSTOM_SERVICE: "Custom",
  CUSTOM_CHARGE: "Charge",
};

let keySeed = 0;
function nextKey() {
  keySeed += 1;
  return `k${Date.now()}-${keySeed}`;
}

function num(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function toDiscount(type: DiscountType, value: number | undefined): CalculatorDiscount {
  return value && value > 0 ? { type, value } : null;
}

function linesFromOffer(offer: ServiceOfferRecord | null): DraftLine[] {
  return (offer?.items || [])
    .filter((item) => item.kind !== "PACKAGE_INCLUDED")
    .map((item) => ({
      key: item.id,
      kind: item.kind as EditableOfferLineKind,
      serviceItemId: item.serviceItemId,
      name: item.serviceName,
      defaultPrice: num(item.defaultPrice) ?? null,
      price: num(item.offeredPrice),
      quantity: item.quantity,
      discountType: item.discountType || "AMOUNT",
      discountValue: num(item.discountValue),
      discountReason: item.discountReason || "",
      remarks: item.remarks || "",
    }));
}

function Err({ message }: { message?: string }) {
  return message ? <p className="mb-0 mt-1 text-xs text-danger">{message}</p> : null;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="mb-1.5 mt-0 text-[12px] font-medium text-text-muted">{children}</p>;
}

function StepSection({
  step,
  title,
  description,
  action,
  children,
}: {
  step: number;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-on-primary">
            {step}
          </span>
          <div className="min-w-0 pt-0.5">
            <h3 className="m-0 text-[15px] font-semibold text-text">{title}</h3>
            <p className="mb-0 mt-0.5 text-[12.5px] leading-snug text-text-faint">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SummaryRow({
  label,
  value,
  negative,
  muted,
}: {
  label: string;
  value: number;
  negative?: boolean;
  muted?: boolean;
}) {
  if (muted && !(value > 0)) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-[13px] text-text-muted">
      <span>{label}</span>
      <span className="tabular-nums text-text">
        {negative && value > 0 ? "− " : ""}
        {formatMoney(value)}
      </span>
    </div>
  );
}

function OutlineAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <PrimaryButton
      type="button"
      size="sm"
      variant="outline"
      className="border-primary! text-primary! hover:bg-nav-active-bg!"
      icon={<HugeiconsIcon icon={Add01Icon} size={14} color="currentColor" strokeWidth={2} />}
      label={label}
      onClick={onClick}
    />
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-[#fafbfc] px-4 py-8 dark:bg-transparent">
      <p className="m-0 text-[13px] text-text-faint">{message}</p>
    </div>
  );
}

export default function ServiceOfferEditor({
  leadId,
  context,
  offer,
  revise = false,
  onClose,
}: {
  leadId: string;
  context: ServiceOfferContext;
  offer: ServiceOfferRecord | null;
  revise?: boolean;
  onClose: () => void;
}) {
  const { permissions } = context;
  const { data: packageData, isFetching: packagesLoading } = useListPackageOptionsQuery(
    context.lead.preferredCountryCode ? { preferredCountryCode: context.lead.preferredCountryCode } : undefined,
  );
  const [createOffer, { isLoading: creating }] = useCreateLeadServiceOfferMutation();
  const [updateOffer, { isLoading: updating }] = useUpdateLeadServiceOfferMutation();
  const [reviseOffer, { isLoading: revising }] = useReviseLeadServiceOfferMutation();
  const saving = creating || updating || revising;
  const [revisionReason, setRevisionReason] = useState("");
  const [showInstallments, setShowInstallments] = useState(Boolean(offer?.installments.length));
  const [showOverallDiscount, setShowOverallDiscount] = useState(Boolean(num(offer?.overallDiscountValue)));
  const [openDiscountKeys, setOpenDiscountKeys] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const line of linesFromOffer(offer)) {
      if (line.discountValue && line.discountValue > 0) initial[line.key] = true;
    }
    return initial;
  });

  const [packageId, setPackageId] = useState<string | undefined>(offer?.sourcePackageId ?? undefined);
  const [packagePrice, setPackagePrice] = useState<number | undefined>(num(offer?.packagePrice));
  const [lines, setLines] = useState<DraftLine[]>(() => linesFromOffer(offer));
  const [fileOpeningCharge, setFileOpeningCharge] = useState<number | undefined>(
    offer ? num(offer.fileOpeningCharge) : num(context.fileOpeningChargeDefault),
  );
  const [overallType, setOverallType] = useState<DiscountType>(offer?.overallDiscountType || "AMOUNT");
  const [overallValue, setOverallValue] = useState<number | undefined>(num(offer?.overallDiscountValue));
  const [overallReason, setOverallReason] = useState(offer?.overallDiscountReason || "");
  const [expectedDealValue, setExpectedDealValue] = useState<number | undefined>(
    offer && offer.expectedDealValue !== offer.finalPayable ? num(offer.expectedDealValue) : undefined,
  );
  const [initialPayment, setInitialPayment] = useState<number | undefined>(num(offer?.initialPayment));
  const [installments, setInstallments] = useState<DraftInstallment[]>(
    () =>
      offer?.installments.map((item) => ({
        key: item.id,
        amount: num(item.amount),
        purpose: item.purpose,
        dueDate: item.dueDate,
      })) || [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<null | "SERVICE" | "ADDITIONAL" | "CUSTOM_SERVICE" | "CUSTOM_CHARGE">(null);

  const packageOptions = packageData?.items || [];
  const selectedPackage = packageOptions.find((item) => item.value === packageId);
  const keepsSnapshot = Boolean(offer && packageId && offer.sourcePackageId === packageId);

  const included: IncludedLine[] = useMemo(() => {
    if (!packageId) return [];
    if (keepsSnapshot && offer) {
      return offer.items
        .filter((item) => item.kind === "PACKAGE_INCLUDED")
        .map((item) => ({ serviceItemId: item.serviceItemId || item.id, name: item.serviceName, price: Number(item.offeredPrice) }));
    }
    return (selectedPackage?.services || [])
      .filter((item) => item.inclusion === "INCLUDED")
      .map((item) => ({ serviceItemId: item.serviceItemId, name: item.serviceName, price: Number(item.unitPrice) }));
  }, [keepsSnapshot, offer, packageId, selectedPackage?.services]);

  const optionalCandidates: PackageServiceLine[] = useMemo(() => {
    if (!selectedPackage) return [];
    if (keepsSnapshot && offer && offer.versionNumber !== selectedPackage.versionNumber) return [];
    return selectedPackage.services.filter((item) => item.inclusion === "OPTIONAL");
  }, [keepsSnapshot, offer, selectedPackage]);

  const packageDefaultPrice = packageId
    ? keepsSnapshot
      ? num(offer?.packageDefaultPrice)
      : num(selectedPackage?.price)
    : undefined;
  const effectivePackagePrice = packageId ? (packagePrice ?? packageDefaultPrice ?? 0) : null;

  const totals = useMemo(
    () =>
      calculateOffer({
        packagePrice: effectivePackagePrice,
        fileOpeningCharge: fileOpeningCharge ?? 0,
        overallDiscount: permissions.canDiscount ? toDiscount(overallType, overallValue) : null,
        lines: lines.map((line) => ({
          countsTowardTotal: true,
          price: line.price ?? 0,
          quantity: line.quantity ?? 0,
          discount: permissions.canDiscount ? toDiscount(line.discountType, line.discountValue) : null,
        })),
      }),
    [effectivePackagePrice, fileOpeningCharge, lines, overallType, overallValue, permissions.canDiscount],
  );

  const installmentTotal = installments.reduce((sum, item) => sum + Math.round((item.amount ?? 0) * 100), 0) / 100;
  const installmentMismatch =
    installments.length > 0 && Math.round(installmentTotal * 100) !== Math.round(totals.finalPayable * 100);
  const overLimit =
    totals.lineDiscountTotal + totals.overallDiscountAmount > 0 &&
    totals.discountPercentOfGross > context.discountLimitPercent &&
    !permissions.canApproveDiscount;
  const usedIds = [...included.map((item) => item.serviceItemId), ...lines.map((line) => line.serviceItemId).filter(Boolean)] as string[];

  function clearErrors() {
    if (Object.keys(errors).length) setErrors({});
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    clearErrors();
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function removeLine(key: string) {
    clearErrors();
    setLines((current) => current.filter((line) => line.key !== key));
    setOpenDiscountKeys((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function changePackage(value: string | undefined) {
    clearErrors();
    setPackageId(value);
    setPackagePrice(undefined);
    setLines((current) => current.filter((line) => line.kind !== "PACKAGE_OPTIONAL"));
  }

  function toggleOptional(service: PackageServiceLine, checked: boolean) {
    clearErrors();
    if (!checked) {
      setLines((current) => current.filter((line) => !(line.kind === "PACKAGE_OPTIONAL" && line.serviceItemId === service.serviceItemId)));
      return;
    }
    if (usedIds.includes(service.serviceItemId)) {
      toast.error("This service is already on the offer.");
      return;
    }
    const price = Number(service.unitPrice);
    setLines((current) => [
      ...current,
      {
        key: nextKey(),
        kind: "PACKAGE_OPTIONAL",
        serviceItemId: service.serviceItemId,
        name: service.serviceName,
        defaultPrice: price,
        price,
        quantity: 1,
        discountType: "AMOUNT",
        discountValue: undefined,
        discountReason: "",
        remarks: "",
      },
    ]);
  }

  function addCatalogLine(kind: "SERVICE" | "ADDITIONAL", draft: CatalogLineDraft) {
    clearErrors();
    setLines((current) => [
      ...current,
      {
        key: nextKey(),
        kind,
        serviceItemId: draft.serviceItemId,
        name: draft.name,
        defaultPrice: draft.defaultPrice,
        price: draft.price,
        quantity: draft.quantity,
        discountType: "AMOUNT",
        discountValue: undefined,
        discountReason: "",
        remarks: draft.remarks,
      },
    ]);
    setModal(null);
  }

  function addCustomLine(kind: "CUSTOM_SERVICE" | "CUSTOM_CHARGE", draft: CustomLineDraft) {
    clearErrors();
    setLines((current) => [
      ...current,
      {
        key: nextKey(),
        kind,
        serviceItemId: null,
        name: draft.name,
        defaultPrice: null,
        price: draft.amount,
        quantity: 1,
        discountType: "AMOUNT",
        discountValue: undefined,
        discountReason: "",
        remarks: draft.remarks,
      },
    ]);
    setModal(null);
  }

  function splitFromInitial() {
    clearErrors();
    const total = totals.finalPayable;
    if (!(total > 0)) return;
    const first = initialPayment && initialPayment > 0 ? Math.min(initialPayment, total) : 0;
    const rest = Math.round((total - first) * 100) / 100;
    const rows: DraftInstallment[] = [];
    if (first > 0) rows.push({ key: nextKey(), amount: first, purpose: "Initial Payment", dueDate: null });
    if (rest > 0) rows.push({ key: nextKey(), amount: rest, purpose: "Remaining Service Charge", dueDate: null });
    setInstallments(rows);
    setShowInstallments(true);
  }

  function validate() {
    const next: Record<string, string> = {};
    if (included.length === 0 && !lines.some((line) => line.kind !== "CUSTOM_CHARGE")) {
      next.lines = "Please add at least one service before saving the offer.";
    }
    lines.forEach((line, index) => {
      if (!line.quantity || line.quantity < 1 || !Number.isInteger(line.quantity)) {
        next[`lines.${index}.quantity`] = "Quantity must be at least 1.";
      }
      if (line.price === undefined || line.price < 0) next[`lines.${index}.offeredPrice`] = "Please enter a valid price.";
      if (permissions.canDiscount && line.discountValue && line.discountValue > 0) {
        if (!line.discountReason.trim()) next[`lines.${index}.discountReason`] = "Please provide a reason for the applied discount.";
        if (line.discountType === "PERCENTAGE" && line.discountValue > 100) {
          next[`lines.${index}.discountValue`] = "A percentage discount cannot exceed 100%.";
        } else if (totals.lines[index]?.discountExceedsTotal) {
          next[`lines.${index}.discountValue`] = "Discount value cannot exceed the line total.";
        }
      }
    });
    if (fileOpeningCharge !== undefined && fileOpeningCharge < 0) next.fileOpeningCharge = "Please enter a valid amount.";
    if (permissions.canDiscount && overallValue && overallValue > 0) {
      if (!overallReason.trim()) next.overallDiscountReason = "Please provide a reason for the applied discount.";
      if (overallType === "PERCENTAGE" && overallValue > 100) {
        next.overallDiscountValue = "A percentage discount cannot exceed 100%.";
      } else if (totals.overallDiscountExceedsSubtotal) {
        next.overallDiscountValue = "Discount value cannot exceed the subtotal.";
      }
    }
    if (initialPayment !== undefined && initialPayment > totals.finalPayable) {
      next.initialPayment = "Initial payment cannot exceed the final payable amount.";
    }
    installments.forEach((item, index) => {
      if (!item.amount || item.amount <= 0) next[`installments.${index}.amount`] = "Please enter a valid amount.";
      if (!item.purpose.trim()) next[`installments.${index}.purpose`] = "Purpose is required.";
    });
    if (installmentMismatch) next.installments = "The installment total must equal the final payable amount.";
    return next;
  }

  function buildBody(generate: boolean): ServiceOfferWriteBody {
    return {
      packageId: packageId || null,
      packagePrice: packageId ? (packagePrice ?? null) : null,
      lines: lines.map((line) => {
        const custom = line.kind === "CUSTOM_SERVICE" || line.kind === "CUSTOM_CHARGE";
        const discounted = permissions.canDiscount && line.discountValue && line.discountValue > 0;
        return {
          kind: line.kind,
          serviceItemId: line.serviceItemId,
          ...(custom ? { name: line.name, amount: line.price } : { offeredPrice: line.price }),
          quantity: line.quantity ?? 1,
          discountType: discounted ? line.discountType : null,
          discountValue: discounted ? line.discountValue : null,
          discountReason: discounted ? line.discountReason.trim() : null,
          remarks: line.remarks.trim() || null,
        };
      }),
      fileOpeningCharge: fileOpeningCharge ?? 0,
      overallDiscountType: permissions.canDiscount && overallValue ? overallType : null,
      overallDiscountValue: permissions.canDiscount && overallValue ? overallValue : null,
      overallDiscountReason: permissions.canDiscount && overallValue ? overallReason.trim() : null,
      expectedDealValue: expectedDealValue ?? null,
      initialPayment: initialPayment ?? null,
      installments: installments.map((item) => ({
        amount: item.amount ?? 0,
        purpose: item.purpose.trim(),
        dueDate: item.dueDate,
      })),
      generate,
      ...(revise ? { revisionReason: revisionReason.trim() || null } : {}),
    };
  }

  async function submit(generate: boolean) {
    const next = validate();
    setErrors(next);
    const first = Object.values(next)[0];
    if (first) {
      toast.error(first);
      return;
    }
    try {
      const body = buildBody(generate);
      const result = !offer
        ? await createOffer({ leadId, body }).unwrap()
        : revise
          ? await reviseOffer({ leadId, offerId: offer.id, body }).unwrap()
          : await updateOffer({ leadId, offerId: offer.id, body }).unwrap();
      toast.success(result.message);
      onClose();
    } catch (error) {
      setErrors(getApiErrorFields(error));
      toast.error(getApiError(error, "Unable to save the service offer. Please try again."));
    }
  }

  function renderLine(line: DraftLine, variant: "service" | "custom") {
    const index = lines.indexOf(line);
    const calc = totals.lines[index];
    const custom = line.kind === "CUSTOM_SERVICE" || line.kind === "CUSTOM_CHARGE";
    const priceEditable = custom || permissions.canOverridePrice;
    const overridden =
      line.defaultPrice !== null && line.price !== undefined && Math.round(line.price * 100) !== Math.round(line.defaultPrice * 100);
    const lineErr = (field: string) => errors[`lines.${index}.${field}`];
    const discountOpen = Boolean(openDiscountKeys[line.key]) || Boolean(line.discountValue && line.discountValue > 0);
    const grid =
      variant === "custom"
        ? "md:grid-cols-[minmax(0,1.6fr)_128px_148px_112px_40px]"
        : "md:grid-cols-[minmax(0,1.8fr)_80px_128px_112px_40px]";

    return (
      <div key={line.key} className="border-b border-border-subtle px-3 py-3 last:border-b-0 hover:bg-[#fbfcfd] dark:hover:bg-transparent">
        <div className={`grid items-center gap-2.5 ${grid}`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="m-0 truncate text-[13.5px] font-medium text-text">{line.name}</p>
              <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-faint dark:bg-hover-bg">
                {KIND_LABEL[line.kind]}
              </span>
            </div>
            {line.remarks ? <p className="mb-0 mt-1 line-clamp-2 text-[12px] text-text-faint">{line.remarks}</p> : null}
            <Err message={errors[`lines.${index}`] || lineErr("name")} />
          </div>

          {variant === "service" ? (
            <div>
              <p className="mb-1 mt-0 text-[11px] text-text-faint md:hidden">Qty</p>
              <FormInputNumber
                size="middle"
                min={1}
                precision={0}
                className="w-full"
                value={line.quantity}
                onChange={(value) => updateLine(line.key, { quantity: asNumber(value) })}
              />
              <Err message={lineErr("quantity")} />
            </div>
          ) : null}

          <div>
            <p className="mb-1 mt-0 text-[11px] text-text-faint md:hidden">{variant === "custom" ? "Amount" : "Unit price"}</p>
            {priceEditable ? (
              <FormInputNumber
                size="middle"
                min={custom ? 0.01 : 0}
                precision={2}
                prefix="৳"
                className="w-full"
                value={line.price}
                onChange={(value) => updateLine(line.key, { price: asNumber(value) })}
              />
            ) : (
              <p className="m-0 py-1.5 text-[13px] font-medium tabular-nums">{formatMoney(line.price ?? 0)}</p>
            )}
            {overridden ? <p className="m-0 text-[11px] text-text-faint">Default {formatMoney(line.defaultPrice)}</p> : null}
            <Err message={lineErr("offeredPrice") || lineErr("amount")} />
          </div>

          {variant === "custom" ? (
            <div>
              <p className="mb-1 mt-0 text-[11px] text-text-faint md:hidden">Discount</p>
              {permissions.canDiscount ? (
                <div className="flex gap-1">
                  <div className="w-[58px] shrink-0">
                    <FormSelect
                      size="middle"
                      allowClear={false}
                      value={line.discountType}
                      options={[
                        { value: "AMOUNT", label: "৳" },
                        { value: "PERCENTAGE", label: "%" },
                      ]}
                      onChange={(value) => updateLine(line.key, { discountType: value === "PERCENTAGE" ? "PERCENTAGE" : "AMOUNT" })}
                    />
                  </div>
                  <FormInputNumber
                    size="middle"
                    min={0}
                    max={line.discountType === "PERCENTAGE" ? 100 : undefined}
                    precision={2}
                    placeholder="0"
                    className="min-w-0 flex-1"
                    value={line.discountValue}
                    onChange={(value) => updateLine(line.key, { discountValue: asNumber(value) })}
                  />
                </div>
              ) : (
                <p className="m-0 py-1.5 text-[13px] text-text-faint">—</p>
              )}
              <Err message={lineErr("discountValue")} />
            </div>
          ) : null}

          <div className="text-right">
            <p className="m-0 text-[13.5px] font-semibold tabular-nums text-text">{formatMoney(calc?.lineTotal ?? 0)}</p>
            {calc && calc.discountAmount > 0 ? (
              <p className="m-0 text-[11px] text-text-faint">− {formatMoney(calc.discountAmount)}</p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              aria-label="Remove"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-danger transition hover:bg-[#fff1f0]"
              onClick={() => removeLine(line.key)}
            >
              <HugeiconsIcon icon={Delete02Icon} size={15} color="currentColor" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {permissions.canDiscount && variant === "service" ? (
          <div className="mt-2">
            {!discountOpen ? (
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0 text-[12px] font-medium text-primary hover:underline"
                onClick={() => setOpenDiscountKeys((current) => ({ ...current, [line.key]: true }))}
              >
                + Add line discount
              </button>
            ) : (
              <div className="grid gap-2 rounded-lg bg-[#f8fafc] p-2.5 md:grid-cols-[110px_120px_minmax(0,1fr)] dark:bg-transparent">
                <FormSelect
                  size="middle"
                  allowClear={false}
                  value={line.discountType}
                  options={[
                    { value: "AMOUNT", label: "Amount (৳)" },
                    { value: "PERCENTAGE", label: "Percent (%)" },
                  ]}
                  onChange={(value) => updateLine(line.key, { discountType: value === "PERCENTAGE" ? "PERCENTAGE" : "AMOUNT" })}
                />
                <div>
                  <FormInputNumber
                    size="middle"
                    min={0}
                    max={line.discountType === "PERCENTAGE" ? 100 : undefined}
                    precision={2}
                    placeholder="Discount"
                    value={line.discountValue}
                    onChange={(value) => updateLine(line.key, { discountValue: asNumber(value) })}
                  />
                  <Err message={lineErr("discountValue") || lineErr("discountType")} />
                </div>
                <div>
                  <FormInput
                    placeholder="Reason (required if discount applied)"
                    maxLength={500}
                    value={line.discountReason}
                    onChange={(event) => updateLine(line.key, { discountReason: event.target.value })}
                  />
                  <Err message={lineErr("discountReason")} />
                </div>
              </div>
            )}
          </div>
        ) : null}

        {permissions.canDiscount && variant === "custom" && line.discountValue && line.discountValue > 0 ? (
          <div className="mt-2">
            <FormInput
              placeholder="Discount reason"
              maxLength={500}
              value={line.discountReason}
              onChange={(event) => updateLine(line.key, { discountReason: event.target.value })}
            />
            <Err message={lineErr("discountReason")} />
          </div>
        ) : null}
      </div>
    );
  }

  const serviceLines = lines.filter((line) => line.kind === "SERVICE" || line.kind === "PACKAGE_OPTIONAL");
  const additionalLines = lines.filter((line) => line.kind === "ADDITIONAL");
  const customLines = lines.filter((line) => line.kind === "CUSTOM_SERVICE" || line.kind === "CUSTOM_CHARGE");
  const leadInitials = context.lead.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  const title = !offer
    ? "Create Offer"
    : revise
      ? `Revise Offer V${offer.offerVersion}`
      : `Edit Offer V${offer.offerVersion}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
      {/* Compact lead bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-nav-active-bg text-[12px] font-bold text-primary-active">
            {leadInitials || <HugeiconsIcon icon={UserIcon} size={16} color="currentColor" strokeWidth={1.8} />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 truncate text-[16px] font-semibold text-text">{context.lead.name}</h2>
              <span className="rounded-md bg-nav-active-bg px-2 py-0.5 text-[11px] font-semibold text-primary-active">Lead</span>
              <Tag className="m-0!" color={!offer || revise ? "success" : "default"}>
                {title}
              </Tag>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text-faint">
              {context.lead.preferredCountryName ? (
                <span className="inline-flex items-center gap-1">
                  <HugeiconsIcon icon={Location01Icon} size={12} color="currentColor" strokeWidth={1.8} />
                  {context.lead.preferredCountryName}
                </span>
              ) : null}
              {context.lead.code ? <span>ID #{context.lead.code}</span> : null}
              {context.lead.createdAt ? <span>Created {dayjs(context.lead.createdAt).format("DD MMM YYYY")}</span> : null}
              <span>Assigned: {context.lead.assignedTo?.fullName || "Unassigned"}</span>
            </div>
          </div>
        </div>
      </div>

      {revise && offer ? (
        <div className="mx-5 mt-4 rounded-xl border border-[#d6e8fb] bg-[#f3f8ff] px-4 py-3 text-[13px] text-text-muted">
          <p className="m-0">
            Offer V{offer.offerVersion} ({formatMoney(offer.finalPayable)}) stays in history. Changes save as a new version
            {offer.status === "SENT" ? "; the sent version will be marked Rejected" : ""}.
          </p>
          <div className="mt-2">
            <FieldLabel>Revision reason (optional)</FieldLabel>
            <FormInput
              placeholder="e.g. Student asked to remove IELTS coaching"
              maxLength={500}
              value={revisionReason}
              onChange={(event) => setRevisionReason(event.target.value)}
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main column */}
        <div className="grid min-w-0 content-start gap-4">
          <StepSection
            step={1}
            title="Service Information"
            description="Choose a package and the services to include in this offer."
            action={<OutlineAddButton label="Add Service" onClick={() => setModal("SERVICE")} />}
          >
            <div className="mb-4 max-w-xl">
              <FieldLabel>Package (optional)</FieldLabel>
              <FormSelect
                showSearch
                allowClear
                optionFilterProp="label"
                placeholder="No package — build from services"
                loading={packagesLoading}
                value={packageId}
                options={[
                  ...packageOptions.map((item) => ({
                    value: item.value,
                    label: `${item.name}${item.country ? ` · ${item.country.name}` : ""} · ${formatMoney(item.price)}`,
                  })),
                  ...(offer?.sourcePackageId && !packageOptions.some((item) => item.value === offer.sourcePackageId)
                    ? [{ value: offer.sourcePackageId, label: `${offer.packageName} (saved v${offer.versionNumber})` }]
                    : []),
                ]}
                onChange={(value) => changePackage(typeof value === "string" ? value : undefined)}
              />
              <Err message={errors.packageId} />
            </div>

            {packageId ? (
              <div className="mb-4 rounded-xl border border-border bg-[#f8fafc] p-3.5 dark:bg-transparent">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="mt-0.5 text-primary">
                      <HugeiconsIcon icon={Package01Icon} size={16} color="currentColor" strokeWidth={1.7} />
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 text-[13px] font-semibold text-text">
                        {keepsSnapshot ? offer?.packageName : selectedPackage?.name}
                        <span className="ml-1 font-normal text-text-faint">
                          · v{keepsSnapshot ? offer?.versionNumber : selectedPackage?.versionNumber}
                        </span>
                      </p>
                      <p className="mb-0 mt-0.5 text-[12px] text-text-faint">Included services are covered by the package price.</p>
                    </div>
                  </div>
                  <div className="w-[150px]">
                    <p className="mb-1 mt-0 text-[11px] font-medium text-text-faint">Package price</p>
                    {permissions.canOverridePrice ? (
                      <FormInputNumber
                        size="middle"
                        min={0}
                        precision={2}
                        prefix="৳"
                        value={packagePrice ?? packageDefaultPrice}
                        onChange={(value) => {
                          clearErrors();
                          setPackagePrice(asNumber(value));
                        }}
                      />
                    ) : (
                      <p className="m-0 text-[13px] font-semibold tabular-nums">{formatMoney(packageDefaultPrice ?? 0)}</p>
                    )}
                    <Err message={errors.packagePrice} />
                  </div>
                </div>
                {included.length ? (
                  <ul className="mb-0 mt-3 grid list-none gap-1 border-t border-border-subtle p-0 pt-3">
                    {included.map((item) => (
                      <li key={item.serviceItemId} className="flex justify-between gap-3 text-[12.5px] text-text-muted">
                        <span className="truncate">{item.name}</span>
                        <span className="shrink-0 text-text-faint">Included</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {optionalCandidates.length ? (
                  <div className="mt-3 grid gap-1.5 border-t border-border-subtle pt-3">
                    <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-text-faint">Optional add-ons</p>
                    {optionalCandidates.map((service) => (
                      <label key={service.serviceItemId} className="flex cursor-pointer items-center justify-between gap-3 text-[13px]">
                        <span className="flex min-w-0 items-center gap-2 text-text">
                          <input
                            type="checkbox"
                            className="accent-[var(--color-primary)]"
                            checked={lines.some((line) => line.kind === "PACKAGE_OPTIONAL" && line.serviceItemId === service.serviceItemId)}
                            disabled={service.serviceStatus !== "ACTIVE"}
                            onChange={(event) => toggleOptional(service, event.target.checked)}
                          />
                          <span className="truncate">{service.serviceName}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-text-muted">+ {formatMoney(service.unitPrice)}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-border">
              <div className="hidden grid-cols-[minmax(0,1.8fr)_80px_128px_112px_40px] gap-2.5 border-b border-border bg-[#f8fafc] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-text-faint md:grid dark:bg-transparent">
                <span>Service</span>
                <span>Qty</span>
                <span>Unit price</span>
                <span className="text-right">Total</span>
                <span />
              </div>
              {serviceLines.length ? (
                serviceLines.map((line) => renderLine(line, "service"))
              ) : (
                <EmptyRow
                  message={
                    included.length
                      ? "Package services are included above. Add extra billable services if needed."
                      : "No services yet. Select a package or add a service."
                  }
                />
              )}
            </div>
            <Err message={errors.lines} />
          </StepSection>

          <StepSection
            step={2}
            title="Additional Services"
            description="Extras that are not part of the selected package."
            action={<OutlineAddButton label="Add Additional Service" onClick={() => setModal("ADDITIONAL")} />}
          >
            {additionalLines.length ? (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="hidden grid-cols-[minmax(0,1.8fr)_80px_128px_112px_40px] gap-2.5 border-b border-border bg-[#f8fafc] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-text-faint md:grid dark:bg-transparent">
                  <span>Service</span>
                  <span>Qty</span>
                  <span>Unit price</span>
                  <span className="text-right">Total</span>
                  <span />
                </div>
                {additionalLines.map((line) => renderLine(line, "service"))}
              </div>
            ) : (
              <EmptyRow message="No additional services added yet." />
            )}
          </StepSection>

          <StepSection
            step={3}
            title="Custom Services & Charges"
            description="One-off fees such as documentation or special charges."
            action={
              permissions.canCustomCharge ? (
                <div className="flex flex-wrap gap-2">
                  <OutlineAddButton label="Add Custom Service" onClick={() => setModal("CUSTOM_SERVICE")} />
                  <PrimaryButton type="button" size="sm" variant="text" label="Add Charge" onClick={() => setModal("CUSTOM_CHARGE")} />
                </div>
              ) : null
            }
          >
            {customLines.length ? (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="hidden grid-cols-[minmax(0,1.6fr)_128px_148px_112px_40px] gap-2.5 border-b border-border bg-[#f8fafc] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-text-faint md:grid dark:bg-transparent">
                  <span>Description</span>
                  <span>Amount</span>
                  <span>Discount</span>
                  <span className="text-right">Final</span>
                  <span />
                </div>
                {customLines.map((line) => renderLine(line, "custom"))}
              </div>
            ) : (
              <EmptyRow
                message={
                  permissions.canCustomCharge
                    ? "No custom items yet."
                    : "Custom charges need custom charge permission."
                }
              />
            )}
          </StepSection>
        </div>

        {/* Sticky summary */}
        <aside className="grid content-start gap-3 xl:sticky xl:top-4 xl:self-start">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
            <p className="mb-1 mt-0 text-[12px] font-medium text-text-faint">Final payable</p>
            <p className="m-0 text-[26px] font-bold leading-none tracking-tight text-primary tabular-nums">
              {formatMoney(totals.finalPayable)}
            </p>
            <div className="mt-4 grid gap-2 border-t border-border-subtle pt-3">
              {effectivePackagePrice !== null ? <SummaryRow label="Package" value={effectivePackagePrice} /> : null}
              <SummaryRow label="Gross amount" value={totals.grossTotal} />
              <SummaryRow label="Line discounts" value={totals.lineDiscountTotal} negative muted />
              <SummaryRow label="Subtotal" value={totals.subtotal} />
              <SummaryRow label="Overall discount" value={totals.overallDiscountAmount} negative muted />
              {(fileOpeningCharge ?? 0) > 0 ? <SummaryRow label="File opening" value={fileOpeningCharge ?? 0} /> : null}
              {initialPayment ? (
                <>
                  <SummaryRow label="Initial payment" value={initialPayment} />
                  <SummaryRow label="Remaining due" value={Math.max(0, totals.finalPayable - initialPayment)} />
                </>
              ) : null}
            </div>
            {overLimit ? (
              <p className="mb-0 mt-3 text-[11px] leading-snug text-danger">
                Discount ({totals.discountPercentOfGross.toFixed(2)}%) exceeds your {context.discountLimitPercent}% limit.
              </p>
            ) : null}
            <p className="mb-0 mt-3 text-[11px] text-text-faint">VAT/Tax not included</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <FieldLabel>File Opening Charge</FieldLabel>
            <FormInputNumber
              min={0}
              precision={2}
              prefix="৳"
              value={fileOpeningCharge}
              onChange={(value) => {
                clearErrors();
                setFileOpeningCharge(asNumber(value));
              }}
            />
            <p className="mb-0 mt-1.5 text-[11px] text-text-faint">
              {context.lead.preferredCountryName
                ? `Default · ${formatMoney(context.fileOpeningChargeDefault)}`
                : "Set 0 if not applicable"}
            </p>
            <Err message={errors.fileOpeningCharge} />
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="grid gap-3">
              <div>
                <FieldLabel>Expected Deal Value</FieldLabel>
                <FormInputNumber
                  min={0}
                  precision={2}
                  prefix="৳"
                  placeholder={formatMoney(totals.finalPayable)}
                  value={expectedDealValue}
                  onChange={(value) => setExpectedDealValue(asNumber(value))}
                />
                <Err message={errors.expectedDealValue} />
              </div>
              <div>
                <FieldLabel>Initial Payment</FieldLabel>
                <FormInputNumber
                  min={0}
                  precision={2}
                  prefix="৳"
                  placeholder="Optional"
                  value={initialPayment}
                  onChange={(value) => {
                    clearErrors();
                    setInitialPayment(asNumber(value));
                  }}
                />
                <Err message={errors.initialPayment} />
              </div>
            </div>
          </div>

          {permissions.canDiscount ? (
            <div className="rounded-2xl border border-border bg-surface p-4">
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left"
                onClick={() => setShowOverallDiscount((value) => !value)}
              >
                <span className="text-[13px] font-semibold text-text">Overall discount</span>
                <HugeiconsIcon
                  icon={showOverallDiscount ? ArrowUp01Icon : ArrowDown01Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.8}
                />
              </button>
              {showOverallDiscount ? (
                <div className="mt-3 grid gap-2">
                  <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
                    <FormSelect
                      allowClear={false}
                      value={overallType}
                      options={[
                        { value: "AMOUNT", label: "Amount" },
                        { value: "PERCENTAGE", label: "%" },
                      ]}
                      onChange={(value) => {
                        clearErrors();
                        setOverallType(value === "PERCENTAGE" ? "PERCENTAGE" : "AMOUNT");
                      }}
                    />
                    <FormInputNumber
                      min={0}
                      max={overallType === "PERCENTAGE" ? 100 : undefined}
                      precision={2}
                      placeholder="Value"
                      value={overallValue}
                      onChange={(value) => {
                        clearErrors();
                        setOverallValue(asNumber(value));
                      }}
                    />
                  </div>
                  <Err message={errors.overallDiscountValue || errors.overallDiscountType} />
                  {overallValue && overallValue > 0 ? (
                    <div>
                      <FormInput
                        placeholder="Discount reason"
                        maxLength={500}
                        value={overallReason}
                        onChange={(event) => {
                          clearErrors();
                          setOverallReason(event.target.value);
                        }}
                      />
                      <Err message={errors.overallDiscountReason} />
                    </div>
                  ) : null}
                  <p className="m-0 text-[11px] text-text-faint">
                    {permissions.canApproveDiscount
                      ? "You can approve discounts above the standard limit."
                      : `Limit ${context.discountLimitPercent}% of gross.`}
                  </p>
                </div>
              ) : (
                <p className="mb-0 mt-1.5 text-[12px] text-text-faint">
                  {overallValue && overallValue > 0
                    ? `${overallType === "PERCENTAGE" ? `${overallValue}%` : formatMoney(overallValue)} applied`
                    : "None applied"}
                </p>
              )}
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-surface p-4">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left"
              onClick={() => setShowInstallments((value) => !value)}
            >
              <span className="text-[13px] font-semibold text-text">Payment plan</span>
              <HugeiconsIcon
                icon={showInstallments ? ArrowUp01Icon : ArrowDown01Icon}
                size={16}
                color="currentColor"
                strokeWidth={1.8}
              />
            </button>
            {!showInstallments ? (
              <p className="mb-0 mt-1.5 text-[12px] text-text-faint">
                {installments.length
                  ? `${installments.length} installment${installments.length > 1 ? "s" : ""} · ${formatMoney(installmentTotal)}`
                  : "No installments — collect against final payable"}
              </p>
            ) : (
              <div className="mt-3 grid gap-2">
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton
                    type="button"
                    size="sm"
                    variant="outline"
                    label="Auto-split"
                    disabled={!(totals.finalPayable > 0)}
                    onClick={splitFromInitial}
                  />
                  <PrimaryButton
                    type="button"
                    size="sm"
                    variant="text"
                    label="+ Add"
                    onClick={() => {
                      clearErrors();
                      setInstallments((current) => [...current, { key: nextKey(), amount: undefined, purpose: "", dueDate: null }]);
                    }}
                  />
                </div>
                {installments.map((item, index) => (
                  <div key={item.key} className="grid gap-1.5 rounded-lg border border-border-subtle p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-text-faint">#{index + 1}</span>
                      <button
                        type="button"
                        className="inline-flex cursor-pointer text-danger"
                        aria-label="Remove installment"
                        onClick={() => {
                          clearErrors();
                          setInstallments((current) => current.filter((row) => row.key !== item.key));
                        }}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={14} color="currentColor" strokeWidth={1.8} />
                      </button>
                    </div>
                    <FormInputNumber
                      size="middle"
                      min={0.01}
                      precision={2}
                      prefix="৳"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(value) => {
                        clearErrors();
                        setInstallments((current) =>
                          current.map((row) => (row.key === item.key ? { ...row, amount: asNumber(value) } : row)),
                        );
                      }}
                    />
                    <Err message={errors[`installments.${index}.amount`]} />
                    <FormInput
                      placeholder="Purpose"
                      maxLength={160}
                      value={item.purpose}
                      onChange={(event) => {
                        clearErrors();
                        const purpose = event.target.value;
                        setInstallments((current) => current.map((row) => (row.key === item.key ? { ...row, purpose } : row)));
                      }}
                    />
                    <Err message={errors[`installments.${index}.purpose`]} />
                    <FormDatePicker
                      size="middle"
                      allowClear
                      placeholder="Due date"
                      value={item.dueDate ? dayjs(item.dueDate) : null}
                      onChange={(value) => {
                        const dueDate = value ? value.format("YYYY-MM-DD") : null;
                        setInstallments((current) => current.map((row) => (row.key === item.key ? { ...row, dueDate } : row)));
                      }}
                    />
                  </div>
                ))}
                {installments.length === 0 ? (
                  <p className="m-0 text-[12px] text-text-faint">No installments added.</p>
                ) : (
                  <p className={`m-0 text-[12px] ${installmentMismatch ? "text-danger" : "text-text-faint"}`}>
                    {formatMoney(installmentTotal)} of {formatMoney(totals.finalPayable)}
                  </p>
                )}
                <Err message={errors.installments} />
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-[#d8efcc] bg-nav-active-bg px-3 py-2.5">
            <span className="mt-0.5 shrink-0 text-primary">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} color="currentColor" strokeWidth={1.8} />
            </span>
            <p className="m-0 text-[12px] leading-snug text-primary-active">
              Offer totals update live from selected services, charges and discounts.
            </p>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface/95 px-5 py-3.5 backdrop-blur">
        <PrimaryButton type="button" variant="outline" label="Cancel" disabled={saving} onClick={onClose} />
        <div className="flex flex-wrap gap-2">
          {offer?.status === "GENERATED" && !revise ? (
            <PrimaryButton type="button" label="Save Changes" loading={saving} onClick={() => void submit(false)} />
          ) : (
            <>
              <PrimaryButton type="button" variant="outline" label="Save Draft" loading={saving} onClick={() => void submit(false)} />
              <Popconfirm
                title="Generate this offer?"
                description="The offer is finalized and becomes ready to send to the student."
                okText="Generate"
                onConfirm={() => void submit(true)}
              >
                <PrimaryButton
                  type="button"
                  icon={<HugeiconsIcon icon={MailSend01Icon} size={15} color="currentColor" strokeWidth={1.8} />}
                  label="Generate Offer"
                  loading={saving}
                />
              </Popconfirm>
            </>
          )}
        </div>
      </div>

      <AddServiceModal
        open={modal === "SERVICE" || modal === "ADDITIONAL"}
        title={modal === "ADDITIONAL" ? "Add additional service" : "Add service"}
        excludeIds={usedIds}
        canOverridePrice={permissions.canOverridePrice}
        onClose={() => setModal(null)}
        onAdd={(draft) => addCatalogLine(modal === "ADDITIONAL" ? "ADDITIONAL" : "SERVICE", draft)}
      />
      <CustomLineModal
        open={modal === "CUSTOM_SERVICE" || modal === "CUSTOM_CHARGE"}
        title={modal === "CUSTOM_CHARGE" ? "Add custom charge" : "Add custom service"}
        onClose={() => setModal(null)}
        onAdd={(draft) => addCustomLine(modal === "CUSTOM_CHARGE" ? "CUSTOM_CHARGE" : "CUSTOM_SERVICE", draft)}
      />
    </div>
  );
}
