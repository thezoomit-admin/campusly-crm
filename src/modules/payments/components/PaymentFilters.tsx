import { DatePicker, Input, Select } from "antd";
import type { Dayjs } from "dayjs";
import { FormInput } from "@/components/common/Forms";
import { useListPaymentMethodsQuery } from "../api/paymentsApi";

type PaymentFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  methodCode?: string;
  onMethodChange: (value?: string) => void;
  status?: string;
  onStatusChange: (value?: string) => void;
  dateRange?: [Dayjs | null, Dayjs | null] | null;
  onDateRangeChange: (value: [Dayjs | null, Dayjs | null] | null) => void;
  amountMin?: string;
  amountMax?: string;
  onAmountMinChange: (value?: string) => void;
  onAmountMaxChange: (value?: string) => void;
};

const STATUS_OPTIONS = [
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REVERSED", label: "Reversed" },
];

export default function PaymentFilters({
  search,
  onSearchChange,
  methodCode,
  onMethodChange,
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  amountMin,
  amountMax,
  onAmountMinChange,
  onAmountMaxChange,
}: PaymentFiltersProps) {
  const { data: methodsData } = useListPaymentMethodsQuery();
  const methods = methodsData?.items || [];

  return (
    <div className="flex items-center gap-3 flex-nowrap overflow-x-auto">
      <FormInput.Search
        allowClear
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        onSearch={onSearchChange}
        placeholder="Search Payment ID, Receipt, Lead ID, Student, Transaction…"
        className="min-w-[320px]"
      />

      <Select
        allowClear
        placeholder="Payment method"
        className="min-w-[160px]"
        value={methodCode}
        onChange={(value) => onMethodChange(value)}
        options={methods.map((item) => ({
          value: item.code,
          label: item.name,
        }))}
      />

      <Select
        allowClear
        placeholder="Status"
        className="min-w-[140px]"
        value={status}
        onChange={(value) => onStatusChange(value)}
        options={STATUS_OPTIONS}
      />

      <DatePicker.RangePicker
        value={dateRange || null}
        onChange={(value) => onDateRangeChange(value)}
        format="DD MMM YYYY"
      />

      <Input
        allowClear
        className="w-28"
        placeholder="Min amount"
        value={amountMin}
        onChange={(event) => onAmountMinChange(event.target.value || undefined)}
      />

      <Input
        allowClear
        className="w-28"
        placeholder="Max amount"
        value={amountMax}
        onChange={(event) => onAmountMaxChange(event.target.value || undefined)}
      />
    </div>
  );
}
