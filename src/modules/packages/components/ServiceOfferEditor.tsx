import { useMemo, useState, type ReactNode } from "react";
import { Popconfirm, Tag } from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { FormDatePicker, FormInput, FormInputNumber, FormSelect } from "@/components/common/Forms";
import { PrimaryButton } from "@/components/ui";
import { getApiError, getApiErrorFields } from "@/lib/api";
import LeadSectionCard from "@/modules/leads/components/details/LeadSectionCard";
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
  PACKAGE_OPTIONAL: "Optional package service",
  SERVICE: "Service",
  ADDITIONAL: "Additional service",
  CUSTOM_SERVICE: "Custom service",
  CUSTOM_CHARGE: "Custom charge",
};

const DISCOUNT_TYPE_OPTIONS = [
  { value: "AMOUNT", label: "Amount (৳)" },
  { value: "PERCENTAGE", label: "Percentage (%)" },
];

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

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-1 text-sm font-medium text-[#17324f] dark:text-text-strong">{children}</p>;
}

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <p className="m-0 text-sm font-semibold text-[#17324f] dark:text-text-strong">{title}</p>
      {action}
    </div>
  );
}

function TotalRow({ label, value, strong, negative }: { label: string; value: number; strong?: boolean; negative?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 text-sm ${strong ? "border-t border-[#e7eef5] pt-2 text-base font-semibold dark:border-border" : ""}`}>
      <span>{label}</span>
      <span>
        {negative && value > 0 ? "− " : ""}
        {formatMoney(value)}
      </span>
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
  /** Save the changes as the next Offer Version instead of editing `offer` in place. */
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

  function renderLine(line: DraftLine) {
    const index = lines.indexOf(line);
    const calc = totals.lines[index];
    const custom = line.kind === "CUSTOM_SERVICE" || line.kind === "CUSTOM_CHARGE";
    const priceEditable = custom || permissions.canOverridePrice;
    const overridden = line.defaultPrice !== null && line.price !== undefined && Math.round(line.price * 100) !== Math.round(line.defaultPrice * 100);
    const lineErr = (field: string) => errors[`lines.${index}.${field}`];
    return (
      <div key={line.key} className="rounded-xl border border-[#e7eef5] p-3 dark:border-border">
        <div className="grid items-start gap-3 md:grid-cols-[minmax(0,2fr)_90px_150px_130px_auto]">
          <div>
            <p className="m-0 text-sm font-medium">{line.name}</p>
            <p className="m-0 text-xs text-text-muted">{KIND_LABEL[line.kind]}</p>
            {line.remarks ? <p className="mb-0 mt-1 text-xs text-text-muted">{line.remarks}</p> : null}
            <Err message={errors[`lines.${index}`] || lineErr("name")} />
          </div>
          <div>
            <p className="m-0 text-xs text-text-muted md:hidden">Qty</p>
            <FormInputNumber
              size="middle"
              min={1}
              precision={0}
              value={line.quantity}
              onChange={(value) => updateLine(line.key, { quantity: asNumber(value) })}
            />
            <Err message={lineErr("quantity")} />
          </div>
          <div>
            <p className="m-0 text-xs text-text-muted md:hidden">Price</p>
            {priceEditable ? (
              <FormInputNumber
                size="middle"
                min={custom ? 0.01 : 0}
                precision={2}
                prefix="৳"
                value={line.price}
                onChange={(value) => updateLine(line.key, { price: asNumber(value) })}
              />
            ) : (
              <p className="m-0 py-1 text-sm">{formatMoney(line.price ?? 0)}</p>
            )}
            {overridden ? <p className="m-0 text-xs text-text-muted">Default {formatMoney(line.defaultPrice)}</p> : null}
            <Err message={lineErr("offeredPrice") || lineErr("amount")} />
          </div>
          <div className="text-right">
            <p className="m-0 text-sm font-semibold">{formatMoney(calc?.lineTotal ?? 0)}</p>
            {calc && calc.discountAmount > 0 ? (
              <p className="m-0 text-xs text-text-muted">
                {formatMoney(calc.gross)} − {formatMoney(calc.discountAmount)}
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <PrimaryButton type="button" size="sm" variant="text" label="Remove" onClick={() => removeLine(line.key)} />
          </div>
        </div>
        {permissions.canDiscount ? (
          <div className="mt-3 grid gap-3 md:grid-cols-[150px_150px_minmax(0,1fr)]">
            <FormSelect
              size="middle"
              allowClear={false}
              value={line.discountType}
              options={DISCOUNT_TYPE_OPTIONS}
              onChange={(value) => updateLine(line.key, { discountType: value === "PERCENTAGE" ? "PERCENTAGE" : "AMOUNT" })}
            />
            <div>
              <FormInputNumber
                size="middle"
                min={0}
                max={line.discountType === "PERCENTAGE" ? 100 : undefined}
                precision={2}
                placeholder="Line discount"
                value={line.discountValue}
                onChange={(value) => updateLine(line.key, { discountValue: asNumber(value) })}
              />
              <Err message={lineErr("discountValue") || lineErr("discountType")} />
            </div>
            {line.discountValue && line.discountValue > 0 ? (
              <div>
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
        ) : null}
      </div>
    );
  }

  const serviceLines = lines.filter((line) => line.kind === "SERVICE" || line.kind === "PACKAGE_OPTIONAL");
  const additionalLines = lines.filter((line) => line.kind === "ADDITIONAL");
  const customLines = lines.filter((line) => line.kind === "CUSTOM_SERVICE" || line.kind === "CUSTOM_CHARGE");

  return (
    <LeadSectionCard
      title={
        !offer
          ? "Create service offer"
          : revise
            ? `New version of Offer V${offer.offerVersion}`
            : `Edit Offer V${offer.offerVersion}`
      }
      extra={
        <Tag color={!offer || revise ? "blue" : "default"}>
          {!offer ? "New" : revise ? "Revision" : offer.status === "GENERATED" ? "Generated" : "Draft"}
        </Tag>
      }
    >
      <div className="grid gap-6">
        {revise && offer ? (
          <div className="grid gap-2 rounded-xl bg-[#f8fafc] px-4 py-3 text-sm dark:bg-transparent">
            <p className="m-0 text-text-muted">
              Offer V{offer.offerVersion} ({formatMoney(offer.finalPayable)}) stays unchanged in the history. Your changes are saved
              as a new version.
              {offer.status === "SENT" ? " The sent version will be marked as Rejected." : ""}
            </p>
            <div>
              <Label>Reason for revision (optional)</Label>
              <FormInput
                placeholder="e.g. Student asked to remove IELTS coaching"
                maxLength={500}
                value={revisionReason}
                onChange={(event) => setRevisionReason(event.target.value)}
              />
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Lead</Label>
            <p className="m-0 py-2 text-sm">
              {context.lead.name}
              {context.lead.preferredCountryName ? (
                <span className="text-text-muted"> · {context.lead.preferredCountryName}</span>
              ) : null}
            </p>
          </div>
          <div>
            <Label>Package (optional)</Label>
            <FormSelect
              showSearch
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
                  ? [{ value: offer.sourcePackageId, label: `${offer.packageName} (saved version ${offer.versionNumber})` }]
                  : []),
              ]}
              onChange={(value) => changePackage(typeof value === "string" ? value : undefined)}
            />
            <Err message={errors.packageId} />
          </div>
        </div>

        {packageId ? (
          <div className="grid gap-3 rounded-xl bg-[#f8fafc] p-4 dark:bg-transparent">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="m-0 text-sm font-semibold">
                  {keepsSnapshot ? offer?.packageName : selectedPackage?.name}
                  <span className="font-normal text-text-muted">
                    {" "}
                    · Version {keepsSnapshot ? offer?.versionNumber : selectedPackage?.versionNumber}
                  </span>
                </p>
                <p className="m-0 text-xs text-text-muted">
                  Included services are covered by the package price. Prices are saved on this offer.
                </p>
              </div>
              <div className="w-[180px]">
                <p className="m-0 text-xs text-text-muted">Package price</p>
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
                  <p className="m-0 text-sm font-semibold">{formatMoney(packageDefaultPrice ?? 0)}</p>
                )}
                {packagePrice !== undefined && packageDefaultPrice !== undefined && packagePrice !== packageDefaultPrice ? (
                  <p className="m-0 text-xs text-text-muted">Default {formatMoney(packageDefaultPrice)}</p>
                ) : null}
                <Err message={errors.packagePrice} />
              </div>
            </div>
            {included.map((item) => (
              <div key={item.serviceItemId} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.name} <span className="text-text-muted">· Included</span>
                </span>
                <span className="text-text-muted">{formatMoney(item.price)}</span>
              </div>
            ))}
            {optionalCandidates.length ? (
              <div className="grid gap-2 border-t border-[#e7eef5] pt-3 dark:border-border">
                <p className="m-0 text-xs font-medium text-text-muted">Optional services — add if relevant for this lead</p>
                {optionalCandidates.map((service) => (
                  <label key={service.serviceItemId} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={lines.some((line) => line.kind === "PACKAGE_OPTIONAL" && line.serviceItemId === service.serviceItemId)}
                        disabled={service.serviceStatus !== "ACTIVE"}
                        onChange={(event) => toggleOptional(service, event.target.checked)}
                      />
                      {service.serviceName}
                      {service.serviceStatus !== "ACTIVE" ? <span className="text-xs text-text-muted">(inactive)</span> : null}
                    </span>
                    <span>+ {formatMoney(service.unitPrice)}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div>
          <SectionHeader
            title="Services"
            action={
              <PrimaryButton type="button" size="sm" variant="outline" label="+ Add Service" onClick={() => setModal("SERVICE")} />
            }
          />
          <div className="grid gap-2">
            {serviceLines.map(renderLine)}
            {serviceLines.length === 0 && included.length === 0 ? (
              <p className="m-0 text-sm text-text-muted">No services yet. Choose a package or add a service.</p>
            ) : null}
          </div>
          <Err message={errors.lines} />
        </div>

        <div>
          <SectionHeader
            title="Additional Services"
            action={
              <PrimaryButton
                type="button"
                size="sm"
                variant="outline"
                label="+ Add Additional Service"
                onClick={() => setModal("ADDITIONAL")}
              />
            }
          />
          <div className="grid gap-2">
            {additionalLines.map(renderLine)}
            {additionalLines.length === 0 ? <p className="m-0 text-sm text-text-muted">No additional services.</p> : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>File Opening Charge</Label>
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
            <p className="mb-0 mt-1 text-xs text-text-muted">
              {context.lead.preferredCountryName
                ? `Default for ${context.lead.preferredCountryName}: ${formatMoney(context.fileOpeningChargeDefault)}`
                : "No country default. Set 0 if not applicable."}
            </p>
            <Err message={errors.fileOpeningCharge} />
          </div>
        </div>

        <div>
          <SectionHeader
            title="Custom Services & Charges"
            action={
              permissions.canCustomCharge ? (
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton type="button" size="sm" variant="outline" label="+ Add Custom Service" onClick={() => setModal("CUSTOM_SERVICE")} />
                  <PrimaryButton type="button" size="sm" variant="outline" label="+ Add Custom Charge" onClick={() => setModal("CUSTOM_CHARGE")} />
                </div>
              ) : null
            }
          />
          <div className="grid gap-2">
            {customLines.map(renderLine)}
            {customLines.length === 0 ? (
              <p className="m-0 text-sm text-text-muted">
                {permissions.canCustomCharge ? "No custom items." : "Custom services and charges need custom charge permission."}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="grid content-start gap-3">
            <p className="m-0 text-sm font-semibold text-[#17324f] dark:text-text-strong">Overall discount</p>
            {permissions.canDiscount ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormSelect
                    allowClear={false}
                    value={overallType}
                    options={DISCOUNT_TYPE_OPTIONS}
                    onChange={(value) => {
                      clearErrors();
                      setOverallType(value === "PERCENTAGE" ? "PERCENTAGE" : "AMOUNT");
                    }}
                  />
                  <div>
                    <FormInputNumber
                      min={0}
                      max={overallType === "PERCENTAGE" ? 100 : undefined}
                      precision={2}
                      placeholder="Discount value"
                      value={overallValue}
                      onChange={(value) => {
                        clearErrors();
                        setOverallValue(asNumber(value));
                      }}
                    />
                    <Err message={errors.overallDiscountValue || errors.overallDiscountType} />
                  </div>
                </div>
                {overallValue && overallValue > 0 ? (
                  <div>
                    <FormInput
                      size="large"
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
                <p className="m-0 text-xs text-text-muted">
                  {permissions.canApproveDiscount
                    ? "You can approve discounts above the standard limit."
                    : `Total discount limit: ${context.discountLimitPercent}% of the gross amount.`}
                </p>
              </>
            ) : (
              <p className="m-0 text-sm text-text-muted">Applying discounts needs discount permission.</p>
            )}
          </div>

          <div className="grid content-start gap-2 rounded-xl border border-[#e7eef5] p-4 dark:border-border">
            {effectivePackagePrice !== null ? <TotalRow label="Package price" value={effectivePackagePrice} /> : null}
            <TotalRow label="Gross amount" value={totals.grossTotal} />
            <TotalRow label="Line item discount" value={totals.lineDiscountTotal} negative />
            <TotalRow label="Subtotal" value={totals.subtotal} />
            <TotalRow label="Overall discount" value={totals.overallDiscountAmount} negative />
            <TotalRow label="Final payable" value={totals.finalPayable} strong />
            {initialPayment ? (
              <>
                <TotalRow label="Initial payment" value={initialPayment} />
                <TotalRow label="Remaining due" value={Math.max(0, totals.finalPayable - initialPayment)} />
              </>
            ) : null}
            {overLimit ? (
              <p className="m-0 text-xs text-danger">
                Total discount ({totals.discountPercentOfGross.toFixed(2)}%) is above your {context.discountLimitPercent}% limit.
                A Manager must apply it.
              </p>
            ) : null}
            <p className="m-0 text-xs text-text-muted">VAT/Tax is not included.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Expected deal value</Label>
            <FormInputNumber
              min={0}
              precision={2}
              prefix="৳"
              placeholder={`Defaults to ${formatMoney(totals.finalPayable)}`}
              value={expectedDealValue}
              onChange={(value) => setExpectedDealValue(asNumber(value))}
            />
            <Err message={errors.expectedDealValue} />
          </div>
          <div>
            <Label>Initial payment</Label>
            <FormInputNumber
              min={0}
              precision={2}
              prefix="৳"
              value={initialPayment}
              onChange={(value) => {
                clearErrors();
                setInitialPayment(asNumber(value));
              }}
            />
            <Err message={errors.initialPayment} />
          </div>
        </div>

        <div>
          <SectionHeader
            title="Payment plan"
            action={
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
                  variant="outline"
                  label="+ Add Installment"
                  onClick={() => {
                    clearErrors();
                    setInstallments((current) => [...current, { key: nextKey(), amount: undefined, purpose: "", dueDate: null }]);
                  }}
                />
              </div>
            }
          />
          <div className="grid gap-2">
            {installments.map((item, index) => (
              <div key={item.key} className="grid items-start gap-3 md:grid-cols-[40px_160px_minmax(0,1fr)_170px_auto]">
                <p className="m-0 py-2 text-sm text-text-muted">#{index + 1}</p>
                <div>
                  <FormInputNumber
                    size="middle"
                    min={0.01}
                    precision={2}
                    prefix="৳"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(value) => {
                      clearErrors();
                      setInstallments((current) => current.map((row) => (row.key === item.key ? { ...row, amount: asNumber(value) } : row)));
                    }}
                  />
                  <Err message={errors[`installments.${index}.amount`]} />
                </div>
                <div>
                  <FormInput
                    placeholder="Purpose, e.g. File Opening"
                    maxLength={160}
                    value={item.purpose}
                    onChange={(event) => {
                      clearErrors();
                      const purpose = event.target.value;
                      setInstallments((current) => current.map((row) => (row.key === item.key ? { ...row, purpose } : row)));
                    }}
                  />
                  <Err message={errors[`installments.${index}.purpose`]} />
                </div>
                <div>
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
                  <Err message={errors[`installments.${index}.dueDate`]} />
                </div>
                <PrimaryButton
                  type="button"
                  size="sm"
                  variant="text"
                  label="Remove"
                  onClick={() => {
                    clearErrors();
                    setInstallments((current) => current.filter((row) => row.key !== item.key));
                  }}
                />
              </div>
            ))}
            {installments.length === 0 ? (
              <p className="m-0 text-sm text-text-muted">No installments. Payments can still be collected against the final payable.</p>
            ) : (
              <p className={`m-0 text-sm ${installmentMismatch ? "text-danger" : "text-text-muted"}`}>
                Installment total {formatMoney(installmentTotal)} of {formatMoney(totals.finalPayable)}
              </p>
            )}
            <Err message={errors.installments} />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[#e7eef5] pt-4 dark:border-border">
          <PrimaryButton type="button" variant="outline" label="Cancel" disabled={saving} onClick={onClose} />
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
                <PrimaryButton type="button" label="Generate Offer" loading={saving} />
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
    </LeadSectionCard>
  );
}
