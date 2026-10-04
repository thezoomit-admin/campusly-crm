import { Button, Form, Modal, Popconfirm, Space, Tag, Tooltip } from "antd";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FormInput,
  FormInputNumber,
  FormSelect,
  FormSwitch,
  FormTextArea,
} from "@/components/common/Forms";
import { PageMeta } from "@/components/common/Meta";
import { PageHeader } from "@/components/common/Navigation";
import { DataTable } from "@/components/common/Tables";
import { useDebounce } from "@/hooks/useDebounce";
import { hasPermission } from "@/lib/access";
import { getApiError, getApiErrorFields } from "@/lib/api";
import { useListMasterDataOptionsQuery } from "@/redux/features/masterData/masterDataApi";
import { adminCard, adminPage } from "@/styles/admin";
import type { AuthSession } from "@/types";
import {
  useCreateServiceItemMutation,
  useLazyCheckServiceItemNameQuery,
  useListServiceItemsQuery,
  useUpdateServiceItemMutation,
  useUpdateServiceItemStatusMutation,
} from "../api/serviceItemsApi";
import type { ServiceItemFormValues, ServiceItemRecord } from "../types";
import type { CatalogCreateAction } from "./ServiceCatalogPage";

type FormMode = "create" | "view" | "edit";

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

function mergeOptions(
  active: Array<{ id: string; name: string }>,
  selected: Array<{ id: string; name: string }>,
) {
  const values = new Map(
    [...active, ...selected].map((item) => [
      item.id,
      { value: item.id, label: item.name },
    ]),
  );
  return [...values.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export default function ServiceItemsPage({
  embedded = false,
  onCreateAction,
}: {
  embedded?: boolean;
  onCreateAction?: (action: CatalogCreateAction | null) => void;
}) {
  const auth = useOutletContext<AuthSession>();
  const canCreate = hasPermission(auth, "service:create");
  const canEdit = hasPermission(auth, "service:edit");
  const canChangeStatus = hasPermission(auth, "service:deactivate");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>();
  const [categoryId, setCategoryId] = useState<string>();
  const [countryId, setCountryId] = useState<string>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selected, setSelected] = useState<ServiceItemRecord | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form] = Form.useForm<ServiceItemFormValues>();
  const watchedStatus = Form.useWatch("status", form);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching, isError } = useListServiceItemsQuery({
    search: debouncedSearch,
    status,
    categoryId,
    countryId,
    page,
    limit,
  });
  const { data: categoryData, isFetching: categoriesLoading } =
    useListMasterDataOptionsQuery({ category: "SERVICE_CATEGORY" });
  const { data: countryData, isFetching: countriesLoading } =
    useListMasterDataOptionsQuery({ category: "COUNTRY" });
  const [createServiceItem, { isLoading: creating }] =
    useCreateServiceItemMutation();
  const [updateServiceItem, { isLoading: updating }] =
    useUpdateServiceItemMutation();
  const [updateStatus, { isLoading: changingStatus }] =
    useUpdateServiceItemStatusMutation();
  const [checkName] = useLazyCheckServiceItemNameQuery();

  const categoryOptions = useMemo(
    () =>
      mergeOptions(
        categoryData?.items || [],
        selected ? [selected.category] : [],
      ),
    [categoryData?.items, selected],
  );
  const countryOptions = useMemo(
    () => mergeOptions(countryData?.items || [], selected?.countries || []),
    [countryData?.items, selected],
  );

  function resetPage() {
    setPage(1);
  }

  const openCreate = useCallback(() => {
    setSelected(null);
    setFormMode("create");
    setFieldErrors({});
    form.resetFields();
    form.setFieldsValue({ status: "ACTIVE", countryIds: [] });
    setFormOpen(true);
  }, [form]);

  useEffect(() => {
    if (!onCreateAction) return;
    onCreateAction(canCreate ? { label: "Add service item", onClick: openCreate } : null);
    return () => onCreateAction(null);
  }, [canCreate, onCreateAction, openCreate]);

  function openItem(item: ServiceItemRecord, mode: "view" | "edit") {
    setSelected(item);
    setFormMode(mode);
    setFieldErrors({});
    form.setFieldsValue({
      name: item.name,
      categoryId: item.category.id,
      description: item.description || undefined,
      defaultPrice: Number(item.defaultPrice),
      countryIds: item.countries.map((country) => country.id),
      status: item.status,
    });
    setFormOpen(true);
  }

  async function save() {
    try {
      const values = await form.validateFields();
      if (selected) {
        await updateServiceItem({ id: selected.id, body: values }).unwrap();
        toast.success("Service item updated.");
      } else {
        await createServiceItem(values).unwrap();
        toast.success("Service item created.");
      }
      setFormOpen(false);
      setSelected(null);
      setFieldErrors({});
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) return;
      setFieldErrors(getApiErrorFields(error));
      toast.error(
        getApiError(
          error,
          "Unable to save the service item. Please try again.",
        ),
      );
    }
  }

  async function warnIfDuplicate(name: string) {
    const normalized = name.trim();
    if (normalized.length < 2) return;
    try {
      const result = await checkName({
        name: normalized,
        excludeId: selected?.id,
      }).unwrap();
      if (!result.available) {
        setFieldErrors((current) => ({
          ...current,
          name: "A service item with this name already exists.",
        }));
      }
    } catch {
      // Save remains the authoritative duplicate check.
    }
  }

  async function toggleStatus(item: ServiceItemRecord) {
    const next = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateStatus({ id: item.id, status: next }).unwrap();
      toast.success(
        `Service item ${next === "ACTIVE" ? "activated" : "deactivated"}.`,
      );
    } catch (error) {
      toast.error(
        getApiError(
          error,
          "Unable to save the service item. Please try again.",
        ),
      );
    }
  }

  const columns = [
    {
      title: "Service name",
      dataIndex: "name",
      key: "name",
      render: (value: string, row: ServiceItemRecord) => (
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent p-0 text-left font-semibold text-main hover:text-primary"
          onClick={() => openItem(row, "view")}
        >
          {value}
        </button>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (value: ServiceItemRecord["category"]) => value.name,
    },
    {
      title: "Country",
      dataIndex: "countries",
      key: "countries",
      render: (values: ServiceItemRecord["countries"]) =>
        values.length ? (
          <Space size={[4, 4]} wrap>
            {values.map((country) => (
              <Tag key={country.id}>{country.name}</Tag>
            ))}
          </Space>
        ) : (
          <span className="text-muted">All countries</span>
        ),
    },
    {
      title: "Default price",
      dataIndex: "defaultPrice",
      key: "defaultPrice",
      align: "right" as const,
      render: (value: string) => money.format(Number(value)),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: ServiceItemRecord["status"]) => (
        <Tag color={value === "ACTIVE" ? "green" : "default"}>
          {value === "ACTIVE" ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_: unknown, row: ServiceItemRecord) => (
        <Space onClick={(event) => event.stopPropagation()}>
          <Tooltip title="View">
            <Button
              aria-label={`View ${row.name}`}
              icon={<HugeiconsIcon icon={ViewIcon} size={16} />}
              onClick={() => openItem(row, "view")}
            />
          </Tooltip>
          {canEdit ? (
            <Tooltip title="Edit">
              <Button
                aria-label={`Edit ${row.name}`}
                icon={<HugeiconsIcon icon={PencilEdit02Icon} size={16} />}
                onClick={() => openItem(row, "edit")}
              />
            </Tooltip>
          ) : null}
          {canChangeStatus ? (
            <Popconfirm
              title={`${row.status === "ACTIVE" ? "Deactivate" : "Activate"} service item?`}
              description={
                row.status === "ACTIVE"
                  ? "It will be hidden from new offers and packages."
                  : "It will become available for new offers and packages."
              }
              okText={row.status === "ACTIVE" ? "Deactivate" : "Activate"}
              onConfirm={() => toggleStatus(row)}
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

  const readOnly = formMode === "view";

  return (
    <div className={embedded ? "grid min-w-0 gap-3" : adminPage}>
      {embedded ? null : (
        <>
          <PageMeta
            title="Service Items"
            description="Manage the services available for lead offers and packages."
          />
          <PageHeader
            title="Service Items"
            subtitle="Maintain service categories, country scope, and suggested BDT prices."
            breadcrumbs={[
              { title: "Dashboard", path: "/dashboard" },
              { title: "Service Items" },
            ]}
            extra={
              canCreate ? (
                <Button type="primary" onClick={openCreate}>
                  Add service item
                </Button>
              ) : null
            }
          />
        </>
      )}

      <div className={`${adminCard} grid gap-3`}>
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-[2]">
            <FormInput.Search
              allowClear
              placeholder="Search service items…"
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
              placeholder="Category"
              loading={categoriesLoading}
              value={categoryId}
              options={categoryOptions}
              onChange={(value) => {
                setCategoryId(value);
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

        {isError ? (
          <p className="m-0 text-danger">Unable to load service items.</p>
        ) : null}

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
        title={
          formMode === "create"
            ? "New service item"
            : formMode === "edit"
              ? "Edit service item"
              : "Service item details"
        }
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={readOnly ? () => setFormOpen(false) : save}
        confirmLoading={creating || updating}
        okText={readOnly ? "Close" : selected ? "Save" : "Create"}
        cancelButtonProps={{
          style: readOnly ? { display: "none" } : undefined,
        }}
        destroyOnClose
        width={620}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-3"
          disabled={readOnly}
        >
          <FormInput
            name="name"
            label="Service name"
            placeholder="Visa Assistance"
            maxLength={100}
            onBlur={(event) => void warnIfDuplicate(event.target.value)}
            fieldError={fieldErrors}
            setFieldError={setFieldErrors}
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Service name is required.",
              },
              { min: 2, max: 100, message: "Use 2–100 characters." },
            ]}
          />
          <FormSelect
            name="categoryId"
            label="Category"
            placeholder="Select category"
            showSearch
            optionFilterProp="label"
            loading={categoriesLoading}
            options={categoryOptions}
            fieldError={fieldErrors}
            setFieldError={setFieldErrors}
            rules={[{ required: true, message: "Category is required." }]}
          />
          <FormTextArea
            name="description"
            label="Description"
            placeholder="Optional service details"
            autoSize={{ minRows: 3, maxRows: 8 }}
            maxLength={1000}
            showCount
            fieldError={fieldErrors}
            setFieldError={setFieldErrors}
          />
          <FormInputNumber
            name="defaultPrice"
            label="Default price (BDT)"
            placeholder="20000"
            min={0.01}
            max={999999999999.99}
            precision={2}
            prefix="৳"
            fieldError={fieldErrors}
            setFieldError={setFieldErrors}
            rules={[
              { required: true, message: "Default price is required." },
              {
                validator: (_, value) =>
                  Number(value) > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error("Please enter a valid price.")),
              },
            ]}
          />
          <FormSelect
            name="countryIds"
            label="Country"
            placeholder="All countries"
            mode="multiple"
            showSearch
            optionFilterProp="label"
            loading={countriesLoading}
            options={countryOptions}
            fieldError={fieldErrors}
            setFieldError={setFieldErrors}
          />
          {readOnly || canChangeStatus ? (
            <Form.Item label="Active status">
              <FormSwitch
                checked={watchedStatus !== "INACTIVE"}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                onChange={(checked) =>
                  form.setFieldValue("status", checked ? "ACTIVE" : "INACTIVE")
                }
              />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </div>
  );
}
