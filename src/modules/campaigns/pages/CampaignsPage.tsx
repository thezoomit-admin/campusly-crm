import { useMemo, useState } from "react";
import { Button, Form, Modal, Tooltip } from "antd";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FormInput,
  FormInputNumber,
  FormSelect,
  FormTextArea,
} from "@/components/common/Forms";
import { PageHeader } from "@/components/common/Navigation";
import { PageMeta } from "@/components/common/Meta";
import { DataTable } from "@/components/common/Tables";
import { getApiError } from "@/lib/api";
import { hasPermission } from "@/lib/access";
import { useDebounce } from "@/hooks/useDebounce";
import { statusClass } from "@/lib/statusClass";
import type { AuthSession } from "@/types";
import { adminCard, adminFilters, adminFiltersCompact, adminPage } from "@/styles/admin";
import {
  INTEGRATION_SOURCES,
  useLeadMasterOptions,
} from "@/modules/leads/hooks/useLeadMasterOptions";
import {
  useCreateCampaignMutation,
  useListCampaignsQuery,
  useUpdateCampaignMutation,
} from "../api/campaignsApi";
import type {
  CampaignFormValues,
  CampaignRecord,
  CampaignStatus,
} from "../../communications/types";

const STATUS_OPTIONS: Array<{ value: CampaignStatus; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

function labelFor(
  options: Array<{ value: string; label: string }>,
  code?: string | null,
) {
  if (!code) return "—";
  return options.find((item) => item.value === code)?.label || code;
}

export default function CampaignsPage() {
  const auth = useOutletContext<AuthSession>();
  const canManage = hasPermission(auth, "campaign:manage");
  const master = useLeadMasterOptions();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CampaignRecord | null>(null);
  const [form] = Form.useForm<CampaignFormValues>();
  const selectedSourceCode = Form.useWatch("sourceCode", form);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching, isError } = useListCampaignsQuery({
    search: debouncedSearch,
    status,
    page,
    limit,
  });
  const [createCampaign, { isLoading: creating }] = useCreateCampaignMutation();
  const [updateCampaign, { isLoading: updating }] = useUpdateCampaignMutation();

  const rows = useMemo(() => data?.items || [], [data?.items]);

  const sourceOptions = useMemo(
    () =>
      master.sourceItems
        .filter((item) => {
          if (!item.code) return false;
          if (item.code === selectedSourceCode || item.code === editing?.sourceCode) {
            return true;
          }
          if (item.isSystem) return false;
          return !INTEGRATION_SOURCES.has(item.code);
        })
        .map((item) => ({ value: item.code as string, label: item.name })),
    [master.sourceItems, selectedSourceCode, editing?.sourceCode],
  );

  const selectedSourceId = useMemo(
    () => master.sourceItems.find((item) => item.code === selectedSourceCode)?.id,
    [master.sourceItems, selectedSourceCode],
  );

  const channelOptions = useMemo(() => {
    const options = master.channelItems
      .filter((item) => item.code && item.parentId === selectedSourceId)
      .map((item) => ({ value: item.code as string, label: item.name }));

    // Keep legacy / unmatched values visible while editing so the field isn't blank.
    const current = editing?.channel;
    if (
      current &&
      editing?.sourceCode === selectedSourceCode &&
      !options.some((item) => item.value === current)
    ) {
      const known = master.channel.find((item) => item.value === current);
      options.unshift({ value: current, label: known?.label || current });
    }
    return options;
  }, [
    master.channelItems,
    master.channel,
    selectedSourceId,
    selectedSourceCode,
    editing?.channel,
    editing?.sourceCode,
  ]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: "DRAFT" });
    setFormOpen(true);
  }

  function openEdit(row: CampaignRecord) {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      description: row.description || undefined,
      sourceCode: row.sourceCode || undefined,
      channel: row.channel || undefined,
      status: row.status,
      startDate: row.startDate || undefined,
      endDate: row.endDate || undefined,
      budget: row.budget,
      utmSource: row.utmSource || undefined,
      utmMedium: row.utmMedium || undefined,
      utmCampaign: row.utmCampaign || undefined,
    });
    setFormOpen(true);
  }

  async function onSubmit() {
    try {
      const values = await form.validateFields();
      if (editing) {
        await updateCampaign({ id: editing.id, body: values }).unwrap();
        toast.success("Campaign updated.");
      } else {
        await createCampaign(values).unwrap();
        toast.success("Campaign created.");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) return;
      toast.error(getApiError(error, "Unable to save campaign."));
    }
  }

  const columns = [
    { title: "Code", dataIndex: "code", key: "code" },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Source",
      dataIndex: "sourceCode",
      key: "sourceCode",
      render: (v: string | null) => labelFor(master.source, v),
    },
    {
      title: "Channel",
      dataIndex: "channel",
      key: "channel",
      render: (v: string | null) => labelFor(master.channel, v),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: string) => <span className={statusClass(v)}>{v}</span>,
    },
    { title: "Leads", dataIndex: "leadsCount", key: "leadsCount" },
    { title: "Events", dataIndex: "eventsCount", key: "eventsCount" },
    {
      title: "Budget",
      dataIndex: "budget",
      key: "budget",
      render: (v: number | null) => (v == null ? "—" : v.toLocaleString()),
    },
    ...(canManage
      ? [
          {
            title: "Actions",
            key: "actions",
            render: (_: unknown, row: CampaignRecord) => (
              <Tooltip title="Edit">
                <button
                  type="button"
                  aria-label={`Edit ${row.name}`}
                  className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[#d1d5db] text-[#6b7280] transition-colors hover:border-primary hover:text-primary"
                  onClick={() => openEdit(row)}
                >
                  <HugeiconsIcon
                    icon={PencilEdit02Icon}
                    size={15}
                    color="currentColor"
                    strokeWidth={1.7}
                  />
                </button>
              </Tooltip>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className={adminPage}>
      <PageMeta
        title="Campaigns"
        description="Maintain marketing campaigns and attribute leads for ROI analysis."
      />
      <PageHeader
        title="Lead Source & Campaigns"
        subtitle="Manage campaign master data used when attributing inbound leads."
        breadcrumbs={[
          { title: "Dashboard", path: "/dashboard" },
          { title: "Campaigns" },
        ]}
        extra={
          canManage ? (
            <Button type="primary" onClick={openCreate}>
              Add campaign
            </Button>
          ) : null
        }
      />

      <div className={`${adminCard} grid gap-3`}>
        <div className={`${adminFilters} ${adminFiltersCompact}`}>
          <FormInput.Search
            allowClear
            placeholder="Search campaigns…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <FormSelect
            allowClear
            placeholder="Status"
            value={status}
            onChange={(value) => {
              setStatus(value || undefined);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
          />
        </div>

        {isError ? (
          <p className="m-0 text-danger">Could not load campaigns.</p>
        ) : null}

        <DataTable
          loading={isFetching}
          data={rows}
          columns={columns}
          rowKey="id"
          isPaginate
          currentPage={page}
          setCurrentPage={setPage}
          limit={limit}
          setLimit={(value) => {
            setLimit(value);
            setPage(1);
          }}
          total={data?.total || 0}
          showSizeChanger={data && data.total > 10}
        />
      </div>

      <Modal
        title={editing ? "Edit campaign" : "New campaign"}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={onSubmit}
        confirmLoading={creating || updating}
        okText={editing ? "Save" : "Create"}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-2" requiredMark>
          <FormInput
            name="name"
            label="Campaign name"
            rules={[{ required: true, message: "Campaign name is required" }]}
            placeholder="Spring Intake Meta Ads"
          />
          {!editing ? (
            <FormInput
              name="code"
              label="Code (optional)"
              placeholder="Auto-generated if empty"
            />
          ) : null}
          <FormSelect
            name="status"
            label="Status"
            rules={[{ required: true, message: "Status is required" }]}
            options={STATUS_OPTIONS}
          />
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-3">
            <FormSelect
              name="sourceCode"
              label="Lead source"
              showSearch
              optionFilterProp="label"
              placeholder="Select source"
              rules={[{ required: true, message: "Lead source is required" }]}
              options={sourceOptions}
              onChange={() => form.setFieldValue("channel", undefined)}
            />
            <FormSelect
              name="channel"
              label="Channel"
              showSearch
              optionFilterProp="label"
              allowClear
              disabled={!selectedSourceCode}
              options={channelOptions}
              placeholder={
                selectedSourceCode ? "Select channel" : "Select a source first"
              }
              rules={[{ required: true, message: "Channel is required" }]}
            />
          </div>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-3">
            <FormInput
              name="startDate"
              label="Start date"
              type="date"
              rules={[{ required: true, message: "Start date is required" }]}
            />
            <FormInput name="endDate" label="End date" type="date" />
          </div>
          <FormInputNumber
            name="budget"
            label="Budget"
            min={0}
            placeholder="Optional"
          />
          <div className="grid gap-0 sm:grid-cols-3 sm:gap-3">
            <FormInput name="utmSource" label="UTM source" />
            <FormInput name="utmMedium" label="UTM medium" />
            <FormInput name="utmCampaign" label="UTM campaign" />
          </div>
          <FormTextArea name="description" label="Description" rows={3} />
        </Form>
      </Modal>
    </div>
  );
}
