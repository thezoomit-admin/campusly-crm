import { Button, Checkbox, Form, Modal, Popconfirm, Space, Tag, Tooltip } from "antd";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FormInput, FormInputNumber, FormSelect, FormSwitch, FormTextArea } from "@/components/common/Forms";
import { DataTable } from "@/components/common/Tables";
import { useDebounce } from "@/hooks/useDebounce";
import { hasPermission } from "@/lib/access";
import { getApiError, getApiErrorFields } from "@/lib/api";
import { useListServiceItemOptionsQuery } from "@/modules/service-items/api/serviceItemsApi";
import { useListMasterDataOptionsQuery } from "@/redux/features/masterData/masterDataApi";
import { adminCard } from "@/styles/admin";
import type { AuthSession } from "@/types";
import {
  useCreatePackageMutation,
  useGetPackageQuery,
  useLazyCheckPackageNameQuery,
  useListPackagesQuery,
  useUpdatePackageMutation,
  useUpdatePackageStatusMutation,
} from "../api/packagesApi";
import type { CatalogCreateAction } from "@/modules/service-items/pages/ServiceCatalogPage";
import type { PackageFormValues, PackageInclusion, PackageRecord } from "../types";

type FormMode = "create" | "view" | "edit";
type DraftService = { serviceItemId: string; inclusion: PackageInclusion };

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const money = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatMoney(value: string | number) {
  const amount = Number(value);
  return Number.isFinite(amount) ? money.format(amount) : "—";
}

function mergeOptions(active: Array<{ id: string; name: string }>, selected?: { id: string; name: string } | null) {
  const values = new Map(active.map((item) => [item.id, { value: item.id, label: item.name }]));
  if (selected && !values.has(selected.id)) values.set(selected.id, { value: selected.id, label: selected.name });
  return [...values.values()].sort((left, right) => left.label.localeCompare(right.label));
}

function catalogSignature(price: number | undefined, lines: DraftService[]) {
  const services = lines.map((line) => `${line.serviceItemId}:${line.inclusion}`).sort().join("|");
  return `${Number(price || 0).toFixed(2)}|${services}`;
}

export default function PackagesPage({
  onCreateAction,
}: {
  onCreateAction?: (action: CatalogCreateAction | null) => void;
} = {}) {
  const auth = useOutletContext<AuthSession>();
  const canManage = hasPermission(auth, "service:configure");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>("ACTIVE");
  const [countryId, setCountryId] = useState<string>();
  const [serviceItemId, setServiceItemId] = useState<string>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selected, setSelected] = useState<PackageRecord | null>(null);
  const [services, setServices] = useState<DraftService[]>([]);
  const [serviceQuery, setServiceQuery] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form] = Form.useForm<PackageFormValues>();
  const watchedStatus = Form.useWatch("status", form);
  const watchedPrice = Form.useWatch("price", form);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching, isError } = useListPackagesQuery({
    search: debouncedSearch,
    status,
    countryId,
    serviceItemId,
    page,
    limit,
  });
  const { data: detail } = useGetPackageQuery(selected?.id || "", { skip: !formOpen || !selected });
  const { data: countryData, isFetching: countriesLoading } = useListMasterDataOptionsQuery({ category: "COUNTRY" });
  const { data: serviceData, isFetching: servicesLoading } = useListServiceItemOptionsQuery();
  const [createPackage, { isLoading: creating }] = useCreatePackageMutation();
  const [updatePackage, { isLoading: updating }] = useUpdatePackageMutation();
  const [updateStatus, { isLoading: changingStatus }] = useUpdatePackageStatusMutation();
  const [checkName] = useLazyCheckPackageNameQuery();

  const record = detail?.package || selected;
  const readOnly = formMode === "view";
  const countryOptions = useMemo(
    () => mergeOptions(countryData?.items || [], record?.country),
    [countryData?.items, record?.country],
  );
  const serviceChoices = useMemo(() => {
    const active = serviceData?.items || [];
    const known = new Map(active.map((item) => [item.value, item]));
    for (const line of record?.services || []) {
      if (!known.has(line.serviceItemId)) {
        known.set(line.serviceItemId, {
          value: line.serviceItemId,
          label: line.serviceName,
          name: line.serviceName,
          description: null,
          defaultPrice: line.unitPrice,
          currency: "BDT",
          category: { id: "", name: "" },
          countries: [],
        });
      }
    }
    return [...known.values()].sort((left, right) => left.name.localeCompare(right.name));
  }, [record?.services, serviceData?.items]);
  const visibleServices = serviceChoices.filter((item) =>
    item.name.toLocaleLowerCase("en").includes(serviceQuery.trim().toLocaleLowerCase("en")),
  );
  const pricedServices = services.map((line) => {
    const choice = serviceChoices.find((item) => item.value === line.serviceItemId);
    const stored = record?.services.find((item) => item.serviceItemId === line.serviceItemId);
    return {
      ...line,
      name: choice?.name || stored?.serviceName || "Service",
      unitPrice: Number(choice?.defaultPrice ?? stored?.unitPrice ?? 0),
    };
  });
  const individualTotal = pricedServices
    .filter((line) => line.inclusion === "INCLUDED")
    .reduce((sum, line) => sum + line.unitPrice, 0);
  const packagePrice = Number(watchedPrice || 0);
  const saving = individualTotal - packagePrice;
  const originalSignature = record
    ? catalogSignature(
        Number(record.price),
        record.services.map((line) => ({ serviceItemId: line.serviceItemId, inclusion: line.inclusion })),
      )
    : "";
  const willVersion =
    formMode === "edit" && originalSignature !== catalogSignature(packagePrice, services);

  function resetPage() {
    setPage(1);
  }

  const openCreate = useCallback(() => {
    setSelected(null);
    setFormMode("create");
    setServices([]);
    setServiceQuery("");
    setFieldErrors({});
    form.resetFields();
    form.setFieldsValue({ status: "ACTIVE" });
    setFormOpen(true);
  }, [form]);

  useEffect(() => {
    if (!onCreateAction) return;
    onCreateAction(canManage ? { label: "Create Package", onClick: openCreate } : null);
    return () => onCreateAction(null);
  }, [canManage, onCreateAction, openCreate]);

  function openItem(item: PackageRecord, mode: "view" | "edit") {
    setSelected(item);
    setFormMode(mode);
    setServices(item.services.map((line) => ({ serviceItemId: line.serviceItemId, inclusion: line.inclusion })));
    setServiceQuery("");
    setFieldErrors({});
    form.setFieldsValue({
      name: item.name,
      countryId: item.country?.id,
      description: item.description || undefined,
      price: Number(item.price),
      status: item.status,
    });
    setFormOpen(true);
  }

  function toggleService(serviceItemId: string, checked: boolean) {
    setFieldErrors((current) => ({ ...current, services: "" }));
    setServices((current) => {
      if (!checked) return current.filter((line) => line.serviceItemId !== serviceItemId);
      if (current.some((line) => line.serviceItemId === serviceItemId)) return current;
      return [...current, { serviceItemId, inclusion: "INCLUDED" }];
    });
  }

  function setInclusion(serviceItemId: string, inclusion: PackageInclusion) {
    setServices((current) => current.map((line) => (line.serviceItemId === serviceItemId ? { ...line, inclusion } : line)));
  }

  async function warnIfDuplicate(name: string) {
    const normalized = name.trim();
    if (normalized.length < 2) return;
    try {
      const result = await checkName({ name: normalized, excludeId: selected?.id }).unwrap();
      if (!result.available) {
        setFieldErrors((current) => ({ ...current, name: "A package with this name already exists." }));
      }
    } catch {
      // Availability is a warning. Save still enforces the unique name.
    }
  }

  async function save() {
    try {
      const values = await form.validateFields();
      if (!services.some((line) => line.inclusion === "INCLUDED")) {
        setFieldErrors((current) => ({ ...current, services: "Please select at least one service." }));
        return;
      }
      const payload = {
        ...values,
        countryId: values.countryId || null,
        description: values.description || undefined,
        services: services.map((line) => ({ serviceItemId: line.serviceItemId, inclusion: line.inclusion })),
      };
      if (selected) {
        const result = await updatePackage({ id: selected.id, body: payload }).unwrap();
        toast.success(result.message);
      } else {
        await createPackage(payload).unwrap();
        toast.success("Package created.");
      }
      setFormOpen(false);
      setSelected(null);
      setFieldErrors({});
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) return;
      setFieldErrors(getApiErrorFields(error));
      toast.error(getApiError(error, "Unable to save the package. Please try again."));
    }
  }

  async function toggleStatus(item: PackageRecord) {
    try {
      const next = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const result = await updateStatus({ id: item.id, status: next }).unwrap();
      toast.success(result.message);
    } catch (error) {
      toast.error(getApiError(error, "Unable to save the package. Please try again."));
    }
  }

  const columns = [
    { title: "Package Name", dataIndex: "name", key: "name" },
    {
      title: "Country",
      key: "country",
      render: (_: unknown, row: PackageRecord) => row.country?.name || "Any country",
    },
    {
      title: "Price",
      key: "price",
      render: (_: unknown, row: PackageRecord) => formatMoney(row.price),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: PackageRecord["status"]) => (
        <Tag color={value === "ACTIVE" ? "green" : "default"}>{value === "ACTIVE" ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_: unknown, row: PackageRecord) => (
        <Space onClick={(event) => event.stopPropagation()}>
          <Tooltip title="View">
            <Button aria-label={`View ${row.name}`} icon={<HugeiconsIcon icon={ViewIcon} size={16} />} onClick={() => openItem(row, "view")} />
          </Tooltip>
          {canManage ? (
            <Tooltip title="Edit">
              <Button
                aria-label={`Edit ${row.name}`}
                icon={<HugeiconsIcon icon={PencilEdit02Icon} size={16} />}
                onClick={() => openItem(row, "edit")}
              />
            </Tooltip>
          ) : null}
          {canManage ? (
            <Popconfirm
              title={`${row.status === "ACTIVE" ? "Deactivate" : "Activate"} package?`}
              description={
                row.status === "ACTIVE"
                  ? "It will be hidden from new lead offers. Existing offers stay unchanged."
                  : "It will become available for new lead offers."
              }
              okText={row.status === "ACTIVE" ? "Deactivate" : "Activate"}
              onConfirm={() => void toggleStatus(row)}
            >
              <FormSwitch
                checked={row.status === "ACTIVE"}
                loading={changingStatus}
                aria-label={`${row.status === "ACTIVE" ? "Deactivate" : "Activate"} ${row.name}`}
              />
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="grid min-w-0 gap-3">
      <div className={`${adminCard} grid gap-3`}>
        <div className="flex min-w-0 items-center gap-2">
          {!onCreateAction && canManage ? (
            <Button type="primary" className="shrink-0" onClick={openCreate}>
              Create Package
            </Button>
          ) : null}
          <div className="min-w-0 flex-[2]">
            <FormInput.Search
              allowClear
              placeholder="Search package or country"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPage();
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <FormSelect
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Country"
              loading={countriesLoading}
              value={countryId}
              options={countryOptions}
              onChange={(value) => {
                setCountryId(value);
                resetPage();
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <FormSelect
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Included service"
              loading={servicesLoading}
              value={serviceItemId}
              options={(serviceData?.items || []).map((item) => ({ value: item.value, label: item.name }))}
              onChange={(value) => {
                setServiceItemId(value);
                resetPage();
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <FormSelect
              allowClear
              placeholder="Status"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(value) => {
                setStatus(value);
                resetPage();
              }}
            />
          </div>
        </div>
        {isError ? <p className="m-0 text-danger">Unable to load packages.</p> : null}
        <DataTable
          loading={isFetching}
          data={data?.items || []}
          columns={columns}
          rowKey="id"
          isPaginate
          currentPage={page}
          setCurrentPage={setPage}
          limit={limit}
          setLimit={(value) => {
            setLimit(value);
            resetPage();
          }}
          total={data?.total || 0}
          showSizeChanger={(data?.total || 0) > 10}
        />
      </div>

      <Modal
        title={formMode === "create" ? "Create Package" : formMode === "edit" ? "Edit Package" : "Package details"}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={readOnly ? () => setFormOpen(false) : () => void save()}
        confirmLoading={creating || updating}
        okText={readOnly ? "Close" : "Save Package"}
        cancelText="Cancel"
        cancelButtonProps={{ style: readOnly ? { display: "none" } : undefined }}
        destroyOnClose
        width={760}
      >
        <Form form={form} layout="vertical" className="mt-3" disabled={readOnly}>
          <FormInput
            name="name"
            label="Package Name"
            placeholder="Canada Admission Package"
            maxLength={100}
            onBlur={(event) => void warnIfDuplicate(event.target.value)}
            fieldError={fieldErrors}
            setFieldError={setFieldErrors}
            rules={[
              { required: true, whitespace: true, message: "Package name is required." },
              { min: 2, max: 100, message: "Use 2–100 characters." },
            ]}
          />
          <FormSelect
            name="countryId"
            label="Country"
            placeholder="Select country"
            allowClear
            showSearch
            optionFilterProp="label"
            loading={countriesLoading}
            options={countryOptions}
            fieldError={fieldErrors}
            setFieldError={setFieldErrors}
          />
          <FormTextArea
            name="description"
            label="Description"
            placeholder="What this package includes"
            autoSize={{ minRows: 3, maxRows: 8 }}
            maxLength={1000}
            showCount
            fieldError={fieldErrors}
            setFieldError={setFieldErrors}
          />
          <div className="mb-4">
            <div className="mb-2 text-sm font-medium">Services</div>
            <FormInput.Search
              allowClear
              placeholder="Search services"
              value={serviceQuery}
              onChange={(event) => setServiceQuery(event.target.value)}
              disabled={readOnly}
            />
            <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-border">
              {servicesLoading ? <p className="m-0 px-3 py-3 text-sm text-text-muted">Loading services…</p> : null}
              {!servicesLoading && visibleServices.length === 0 ? (
                <p className="m-0 px-3 py-3 text-sm text-text-muted">No active services match this search.</p>
              ) : null}
              {visibleServices.map((service) => {
                const line = services.find((item) => item.serviceItemId === service.value);
                return (
                  <div key={service.value} className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
                    <Checkbox
                      checked={Boolean(line)}
                      disabled={readOnly}
                      onChange={(event) => toggleService(service.value, event.target.checked)}
                    >
                      <span className="font-medium">{service.name}</span>
                    </Checkbox>
                    <span className="text-sm text-text-muted">{formatMoney(service.defaultPrice)}</span>
                    {line ? (
                      <div className="ml-auto flex gap-1">
                        {(["INCLUDED", "OPTIONAL"] as const).map((inclusion) => (
                          <Button
                            key={inclusion}
                            size="small"
                            type={line.inclusion === inclusion ? "primary" : "default"}
                            disabled={readOnly}
                            onClick={() => setInclusion(service.value, inclusion)}
                          >
                            {inclusion === "INCLUDED" ? "Included" : "Optional"}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {fieldErrors.services ? <p className="mb-0 mt-1 text-sm text-danger">{fieldErrors.services}</p> : null}
          </div>
          <FormInputNumber
            name="price"
            label="Package Price"
            placeholder="14000"
            min={0.01}
            max={999999999999.99}
            precision={2}
            prefix="৳"
            fieldError={fieldErrors}
            setFieldError={setFieldErrors}
            rules={[
              { required: true, message: "Please enter a valid price." },
              {
                validator: (_, value) =>
                  Number(value) > 0 ? Promise.resolve() : Promise.reject(new Error("Please enter a valid price.")),
              },
            ]}
          />
          {!readOnly ? (
            <Button className="mb-4" onClick={() => form.setFieldValue("price", Number(individualTotal.toFixed(2)))}>
              Use service total
            </Button>
          ) : null}
          <div className="mb-4 rounded-xl bg-[#f8fafc] px-4 py-3 text-sm dark:bg-transparent">
            {pricedServices
              .filter((line) => line.inclusion === "INCLUDED")
              .map((line) => (
                <div key={line.serviceItemId} className="flex justify-between gap-3 py-1">
                  <span>{line.name}</span>
                  <span>{formatMoney(line.unitPrice)}</span>
                </div>
              ))}
            <div className="mt-2 flex justify-between gap-3 border-t border-border pt-2 font-medium">
              <span>Individual Total</span>
              <span>{formatMoney(individualTotal)}</span>
            </div>
            <div className="flex justify-between gap-3 py-1">
              <span>Package Price</span>
              <span>{formatMoney(packagePrice)}</span>
            </div>
            <div className="flex justify-between gap-3 py-1 font-semibold">
              <span>Package Saving</span>
              <span>{formatMoney(saving)}</span>
            </div>
            {pricedServices.some((line) => line.inclusion === "OPTIONAL") ? (
              <p className="mb-0 mt-2 text-text-muted">
                Optional, not included in the price:{" "}
                {pricedServices
                  .filter((line) => line.inclusion === "OPTIONAL")
                  .map((line) => line.name)
                  .join(", ")}
              </p>
            ) : null}
          </div>
          {willVersion ? (
            <p className="text-sm text-text-muted">
              Saving service or price changes creates a new package version. Offers already created keep their original price.
            </p>
          ) : null}
          {readOnly || canManage ? (
            <Form.Item label="Status">
              <FormSwitch
                checked={watchedStatus !== "INACTIVE"}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                disabled={readOnly}
                onChange={(checked) => form.setFieldValue("status", checked ? "ACTIVE" : "INACTIVE")}
              />
            </Form.Item>
          ) : null}
        </Form>
        {detail?.package.versions && detail.package.versions.length > 0 ? (
          <div className="mt-2">
            <p className="mb-2 text-sm font-medium">Version history</p>
            <div className="grid gap-1">
              {detail.package.versions.map((version) => (
                <div key={version.id} className="flex justify-between gap-3 text-sm">
                  <span>
                    {detail.package.name} — Version {version.versionNumber}
                  </span>
                  <span>{formatMoney(version.price)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
