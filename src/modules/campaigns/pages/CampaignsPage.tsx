import { useMemo, useState } from 'react'
import { Button, Form, Input, InputNumber, Modal, Select } from 'antd'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'react-toastify'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { DataTable } from '@/components/common/Tables'
import { getApiError } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import { useDebounce } from '@/hooks/useDebounce'
import { statusClass } from '@/lib/statusClass'
import type { AuthSession } from '@/types'
import { adminCard, adminPage } from '@/styles/admin'
import { useListMasterDataOptionsQuery } from '@/redux/features/masterData/masterDataApi'
import {
  useAttributionSummaryQuery,
  useCreateCampaignMutation,
  useListCampaignsQuery,
  useUpdateCampaignMutation,
} from '../api/campaignsApi'
import type { CampaignFormValues, CampaignRecord, CampaignStatus } from '../../communications/types'

const STATUS_OPTIONS: Array<{ value: CampaignStatus; label: string }> = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
]


export default function CampaignsPage() {
  const auth = useOutletContext<AuthSession>()
  const canManage = hasPermission(auth, 'campaign:manage')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CampaignRecord | null>(null)
  const [form] = Form.useForm<CampaignFormValues>()
  const debouncedSearch = useDebounce(search, 300)

  const { data, isFetching, isError } = useListCampaignsQuery({
    search: debouncedSearch,
    status,
    page,
    limit,
  })
  const [createCampaign, { isLoading: creating }] = useCreateCampaignMutation()
  const [updateCampaign, { isLoading: updating }] = useUpdateCampaignMutation()
  const { data: performance } = useAttributionSummaryQuery()
  const { data: sourceData } = useListMasterDataOptionsQuery({ category: 'LEAD_SOURCE' })
  const { data: channelData } = useListMasterDataOptionsQuery({ category: 'LEAD_CHANNEL' })
  const watchedSource = Form.useWatch('sourceCode', form)
  const sourceOptions = (sourceData?.items || [])
    .filter((item) => item.code)
    .map((item) => ({ value: item.code as string, label: item.name }))
  const sourceId = sourceData?.items.find((item) => item.code === watchedSource)?.id
  const channelOptions = (channelData?.items || [])
    .filter((item) => item.code && item.parentId === sourceId)
    .map((item) => ({ value: item.code as string, label: item.name }))
  const sourceLabel = (code: string | null) => sourceOptions.find((item) => item.value === code)?.label || code || '—'
  const channelLabel = (code: string | null) =>
    channelData?.items.find((item) => item.code === code)?.name || code || '—'

  const rows = useMemo(() => data?.items || [], [data?.items])

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 'ACTIVE' })
    setFormOpen(true)
  }

  function openEdit(row: CampaignRecord) {
    setEditing(row)
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
    })
    setFormOpen(true)
  }

  async function onSubmit() {
    try {
      const values = await form.validateFields()
      if (editing) {
        await updateCampaign({ id: editing.id, body: values }).unwrap()
        toast.success('Campaign updated.')
      } else {
        await createCampaign(values).unwrap()
        toast.success('Campaign created.')
      }
      setFormOpen(false)
      setEditing(null)
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return
      toast.error(getApiError(error, 'Unable to save campaign.'))
    }
  }

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Source', dataIndex: 'sourceCode', key: 'sourceCode', render: (v: string | null) => sourceLabel(v) },
    { title: 'Channel', dataIndex: 'channel', key: 'channel', render: (v: string | null) => channelLabel(v) },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <span className={statusClass(v)}>{v}</span>,
    },
    { title: 'Leads', dataIndex: 'leadsCount', key: 'leadsCount' },
    { title: 'Events', dataIndex: 'eventsCount', key: 'eventsCount' },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (v: number | null) => (v == null ? '—' : v.toLocaleString()),
    },
    ...(canManage
      ? [
          {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, row: CampaignRecord) => (
              <Button type="link" size="small" className="!px-1" onClick={() => openEdit(row)}>
                Edit
              </Button>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className={adminPage}>
      <PageMeta
        title="Campaigns"
        description="Maintain marketing campaigns and attribute leads for ROI analysis."
      />
      <PageHeader
        title="Lead Source & Campaigns"
        subtitle="Manage campaign master data used when attributing inbound leads."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Campaigns' }]}
        extra={
          canManage ? (
            <Button type="primary" onClick={openCreate}>
              Add campaign
            </Button>
          ) : null
        }
      />

      <div className={`${adminCard} grid gap-3`}>
        <div className="flex flex-wrap gap-2">
          <Input.Search
            allowClear
            placeholder="Search campaigns…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="min-w-[220px] max-w-sm flex-1"
          />
          <Select
            allowClear
            placeholder="Status"
            className="min-w-[140px]"
            value={status}
            onChange={(value) => {
              setStatus(value || undefined)
              setPage(1)
            }}
            options={STATUS_OPTIONS}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-border p-3">
            <p className="m-0 mb-2 text-[0.82rem] font-semibold text-text-strong">Source-wise leads</p>
            {(performance?.sources || []).slice(0, 8).map((row) => (
              <p key={row.code} className="m-0 text-[0.82rem] text-text">
                {row.label}: {row.total} leads, {row.converted} converted, {row.conversionRate}%
              </p>
            ))}
            {!performance?.sources.length ? <p className="m-0 text-[0.82rem] text-text-muted">No leads yet.</p> : null}
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="m-0 mb-2 text-[0.82rem] font-semibold text-text-strong">Campaign-wise leads</p>
            {(performance?.campaigns || []).slice(0, 8).map((row) => (
              <p key={row.id || row.label} className="m-0 text-[0.82rem] text-text">
                {row.label}: {row.total} leads, {row.converted} converted, {row.conversionRate}%
              </p>
            ))}
            {!performance?.campaigns.length ? <p className="m-0 text-[0.82rem] text-text-muted">No leads yet.</p> : null}
          </div>
        </div>

        {isError ? <p className="m-0 text-danger">Could not load campaigns.</p> : null}

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
            setLimit(value)
            setPage(1)
          }}
          total={data?.total || 0}
          showSizeChanger={data && data.total > 10}
        />
      </div>

      <Modal
        title={editing ? 'Edit campaign' : 'New campaign'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={onSubmit}
        confirmLoading={creating || updating}
        okText={editing ? 'Save' : 'Create'}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-2">
          <Form.Item
            name="name"
            label="Campaign name"
            rules={[
              { required: true, message: 'Campaign name is required.' },
              { min: 2, max: 150, message: 'Campaign name must be between 2 and 150 characters.' },
            ]}
          >
            <Input placeholder="Canada September Campaign" />
          </Form.Item>
          {!editing ? (
            <Form.Item name="code" label="Code (optional)">
              <Input placeholder="Auto-generated if empty" />
            </Form.Item>
          ) : null}
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-3">
            <Form.Item name="sourceCode" label="Source" rules={[{ required: true, message: 'Lead source is required.' }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={sourceOptions}
                placeholder="Select source"
                onChange={() => form.setFieldValue('channel', undefined)}
              />
            </Form.Item>
            <Form.Item name="channel" label="Channel" rules={[{ required: true, message: 'Channel is required.' }]}>
              <Select showSearch optionFilterProp="label" options={channelOptions} placeholder="Select channel" />
            </Form.Item>
          </div>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-3">
            <Form.Item name="startDate" label="Start date" rules={[{ required: true, message: 'Start date is required.' }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="endDate" label="End date">
              <Input type="date" />
            </Form.Item>
          </div>
          <Form.Item name="budget" label="Budget">
            <InputNumber className="!w-full" min={0} placeholder="Optional" />
          </Form.Item>
          <div className="grid gap-0 sm:grid-cols-3 sm:gap-3">
            <Form.Item name="utmSource" label="UTM source">
              <Input />
            </Form.Item>
            <Form.Item name="utmMedium" label="UTM medium">
              <Input />
            </Form.Item>
            <Form.Item name="utmCampaign" label="UTM campaign">
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Description" rules={[{ max: 1000, message: 'Description must be 1000 characters or less.' }]}>
            <Input.TextArea rows={3} autoSize={{ minRows: 3, maxRows: 8 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
