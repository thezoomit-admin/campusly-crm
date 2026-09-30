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
import {
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

const CHANNEL_OPTIONS = [
  { value: 'Website', label: 'Website' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Email', label: 'Email' },
  { value: 'Meta', label: 'Meta' },
  { value: 'Other', label: 'Other' },
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

  const rows = useMemo(() => data?.items || [], [data?.items])

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 'DRAFT' })
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
    { title: 'Source', dataIndex: 'sourceCode', key: 'sourceCode', render: (v: string | null) => v || '—' },
    { title: 'Channel', dataIndex: 'channel', key: 'channel', render: (v: string | null) => v || '—' },
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
          <Form.Item name="name" label="Campaign name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="Spring Intake Meta Ads" />
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
            <Form.Item name="sourceCode" label="Lead source code">
              <Input placeholder="META / WEBSITE / …" />
            </Form.Item>
            <Form.Item name="channel" label="Channel">
              <Select allowClear options={CHANNEL_OPTIONS} placeholder="Select channel" />
            </Form.Item>
          </div>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-3">
            <Form.Item name="startDate" label="Start date">
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
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
