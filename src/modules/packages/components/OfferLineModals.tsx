import { useMemo, useState } from "react";
import { FormInput, FormInputNumber, FormSelect, FormTextArea } from "@/components/common/Forms";
import { AntModal } from "@/components/common/Modals";
import { PrimaryButton } from "@/components/ui";
import { useListServiceItemOptionsQuery } from "@/modules/service-items/api/serviceItemsApi";
import { formatMoney } from "../utils/offerCalculator";

export type CatalogLineDraft = {
  serviceItemId: string;
  name: string;
  defaultPrice: number;
  price: number;
  quantity: number;
  remarks: string;
};

export type CustomLineDraft = {
  name: string;
  amount: number;
  remarks: string;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mb-0 mt-1 text-sm text-danger">{message}</p> : null;
}

export function AddServiceModal({
  open,
  title,
  excludeIds,
  canOverridePrice,
  onClose,
  onAdd,
}: {
  open: boolean;
  title: string;
  excludeIds: string[];
  canOverridePrice: boolean;
  onClose: () => void;
  onAdd: (line: CatalogLineDraft) => void;
}) {
  const { data, isFetching } = useListServiceItemOptionsQuery(undefined, { skip: !open });
  const [serviceItemId, setServiceItemId] = useState<string>();
  const [price, setPrice] = useState<number>();
  const [quantity, setQuantity] = useState<number>(1);
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const items = useMemo(
    () => (data?.items || []).filter((item) => !excludeIds.includes(item.value)),
    [data?.items, excludeIds],
  );
  const selected = items.find((item) => item.value === serviceItemId);

  function reset() {
    setServiceItemId(undefined);
    setPrice(undefined);
    setQuantity(1);
    setRemarks("");
    setErrors({});
  }

  function close() {
    reset();
    onClose();
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!selected) next.service = "Please select a service.";
    if (!Number.isInteger(quantity) || quantity < 1) next.quantity = "Quantity must be at least 1.";
    if (price !== undefined && !(price >= 0)) next.price = "Please enter a valid price.";
    setErrors(next);
    if (Object.keys(next).length || !selected) return;
    const defaultPrice = Number(selected.defaultPrice);
    onAdd({
      serviceItemId: selected.value,
      name: selected.name,
      defaultPrice,
      price: canOverridePrice && price !== undefined ? price : defaultPrice,
      quantity,
      remarks: remarks.trim(),
    });
    reset();
  }

  return (
    <AntModal open={open} onClose={close} title={title} width={520}>
      <div className="grid gap-4">
        <div>
          <p className="mb-1 text-sm font-medium">Service</p>
          <FormSelect
            showSearch
            optionFilterProp="label"
            placeholder="Search active services"
            loading={isFetching}
            value={serviceItemId}
            options={items.map((item) => ({
              value: item.value,
              label: `${item.name} · ${formatMoney(item.defaultPrice)}`,
            }))}
            onChange={(value) => {
              const id = typeof value === "string" ? value : undefined;
              setServiceItemId(id);
              const option = items.find((item) => item.value === id);
              setPrice(option ? Number(option.defaultPrice) : undefined);
              setErrors((current) => ({ ...current, service: "" }));
            }}
            notFoundContent={isFetching ? "Loading…" : "No active services available."}
          />
          <FieldError message={errors.service} />
          {selected?.category ? <p className="mb-0 mt-1 text-xs text-text-muted">{selected.category.name}</p> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-medium">Unit price</p>
            {canOverridePrice ? (
              <FormInputNumber
                min={0}
                precision={2}
                prefix="৳"
                value={price}
                disabled={!selected}
                onChange={(value) => setPrice(typeof value === "number" ? value : undefined)}
              />
            ) : (
              <p className="m-0 py-2 text-sm">{selected ? formatMoney(selected.defaultPrice) : "—"}</p>
            )}
            {selected && canOverridePrice && price !== undefined && Number(selected.defaultPrice) !== price ? (
              <p className="mb-0 mt-1 text-xs text-text-muted">Default price {formatMoney(selected.defaultPrice)}</p>
            ) : null}
            <FieldError message={errors.price} />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Quantity</p>
            <FormInputNumber
              min={1}
              precision={0}
              value={quantity}
              onChange={(value) => setQuantity(typeof value === "number" ? value : 0)}
            />
            <FieldError message={errors.quantity} />
          </div>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">Remarks</p>
          <FormTextArea rows={2} maxLength={500} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" label="Cancel" onClick={close} />
          <PrimaryButton type="button" label="Add" onClick={submit} />
        </div>
      </div>
    </AntModal>
  );
}

export function CustomLineModal({
  open,
  title,
  onClose,
  onAdd,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onAdd: (line: CustomLineDraft) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number>();
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setName("");
    setAmount(undefined);
    setRemarks("");
    setErrors({});
  }

  function close() {
    reset();
    onClose();
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required.";
    if (amount === undefined || !(amount > 0)) next.amount = "Please enter a valid amount.";
    setErrors(next);
    if (Object.keys(next).length || amount === undefined) return;
    onAdd({ name: name.trim(), amount, remarks: remarks.trim() });
    reset();
  }

  return (
    <AntModal open={open} onClose={close} title={title} width={480}>
      <div className="grid gap-4">
        <p className="m-0 text-sm text-text-muted">
          This applies to this offer only. It is not added to the service catalog.
        </p>
        <div>
          <p className="mb-1 text-sm font-medium">Name</p>
          <FormInput size="large" maxLength={160} value={name} onChange={(event) => setName(event.target.value)} />
          <FieldError message={errors.name} />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">Amount</p>
          <FormInputNumber
            min={0.01}
            precision={2}
            prefix="৳"
            value={amount}
            onChange={(value) => setAmount(typeof value === "number" ? value : undefined)}
          />
          <FieldError message={errors.amount} />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">Description / reason</p>
          <FormTextArea rows={2} maxLength={500} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" label="Cancel" onClick={close} />
          <PrimaryButton type="button" label="Add" onClick={submit} />
        </div>
      </div>
    </AntModal>
  );
}
