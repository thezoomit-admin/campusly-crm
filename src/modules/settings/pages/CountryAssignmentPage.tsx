import { useEffect, useMemo, useState } from 'react'
import { Button, Form, Modal, Switch, Tag, Tooltip } from 'antd'
import { HugeiconsIcon } from '@hugeicons/react'
import { PencilEdit02Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FormInput, FormSelect, FormSwitch } from '@/components/common/Forms'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { DataTable } from '@/components/common/Tables'
import { PrimaryButton } from '@/components/ui'
import { getApiError, getApiErrorFields } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import { useDebounce } from '@/hooks/useDebounce'
import type { AuthSession } from '@/types'
import { adminCard, adminFilters, adminFiltersCompact, adminPage } from '@/styles/admin'
import {
  useCreateCountryAssignmentRuleMutation,
  useDeactivateCountryAssignmentRuleMutation,
  useGetCountryAssignmentFormOptionsQuery,
  useListCountryAssignmentRulesQuery,
  useUpdateCountryAssignmentRuleMutation,
  type CountryAssignmentRule,
} from '../api/countryAssignmentApi'

type FormValues = {
  countryCode: string
  teamId: string
  defaultOwnerId?: string
  isActive: boolean
}

export default function CountryAssignmentPage() {
  const auth = useOutletContext<AuthSession>()
  const canManage = hasPermission(auth, 'country_assignment:manage')

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | undefined>()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CountryAssignmentRule | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>()
  const [form] = Form.useForm<FormValues>()
  const debouncedSearch = useDebounce(search, 300)

  const { data, isFetching, isError } = useListCountryAssignmentRulesQuery({
    search: debouncedSearch || undefined,
    isActive: activeFilter,
  })
  const { data: formOptions } = useGetCountryAssignmentFormOptionsQuery(
    { teamId: selectedTeamId },
    { skip: !formOpen },
  )
  const [createRule, { isLoading: creating }] = useCreateCountryAssignmentRuleMutation()
  const [updateRule, { isLoading: updating }] = useUpdateCountryAssignmentRuleMutation()
  const [deactivateRule, { isLoading: deactivating }] =
    useDeactivateCountryAssignmentRuleMutation()

  const rows = useMemo(() => data?.items || [], [data?.items])
  const countryOptions = formOptions?.countries || []
  const teamOptions = (formOptions?.teams || []).map((team) => ({
    value: team.value,
    label: `${team.label} (${team.departmentName})`,
  }))
  const ownerOptions = formOptions?.owners || []

  useEffect(() => {
    if (!formOpen) return
    const ownerId = form.getFieldValue('defaultOwnerId') as string | undefined
    if (!ownerId) return
    if (!ownerOptions.some((owner) => owner.value === ownerId)) {
      form.setFieldValue('defaultOwnerId', undefined)
    }
  }, [form, formOpen, ownerOptions])

  function openCreate() {
    setEditing(null)
    setSelectedTeamId(undefined)
    form.resetFields()
    form.setFieldsValue({ isActive: true })
    setFormOpen(true)
  }

  function openEdit(row: CountryAssignmentRule) {
    setEditing(row)
    setSelectedTeamId(row.teamId)
    form.setFieldsValue({
      countryCode: row.countryCode,
      teamId: row.teamId,
      defaultOwnerId: row.defaultOwnerId || undefined,
      isActive: row.isActive,
    })
    setFormOpen(true)
  }

  async function onSubmit() {
    try {
      const values = await form.validateFields()
      const payload = {
        countryCode: values.countryCode,
        teamId: values.teamId,
        defaultOwnerId: values.defaultOwnerId || null,
        isActive: values.isActive,
      }
      if (editing) {
        await updateRule({ id: editing.id, body: payload }).unwrap()
        toast.success('Country assignment rule updated.')
      } else {
        await createRule(payload).unwrap()
        toast.success('Country assignment rule created.')
      }
      setFormOpen(false)
      setEditing(null)
      setSelectedTeamId(undefined)
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return
      const fields = getApiErrorFields(error)
      if (Object.keys(fields).length > 0) {
        form.setFields(
          Object.entries(fields).map(([name, errors]) => ({
            name: name as keyof FormValues,
            errors: [errors],
          })),
        )
      }
      toast.error(getApiError(error, 'Unable to save country assignment rule.'))
    }
  }

  async function onDeactivate(row: CountryAssignmentRule) {
    Modal.confirm({
      title: 'Deactivate rule?',
      content: `Leads with preferred country ${row.countryName || row.countryCode} will fall into the Lead Pool until a new active rule is set.`,
      okText: 'Deactivate',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateRule(row.id).unwrap()
          toast.success('Country assignment rule deactivated.')
        } catch (error) {
          toast.error(getApiError(error, 'Unable to deactivate rule.'))
        }
      },
    })
  }

  async function onToggleActive(row: CountryAssignmentRule, next: boolean) {
    try {
      await updateRule({ id: row.id, body: { isActive: next } }).unwrap()
      toast.success(next ? 'Rule activated.' : 'Rule deactivated.')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to update rule status.'))
    }
  }

  const columns = [
    {
      title: 'Country',
      key: 'country',
      render: (_: unknown, row: CountryAssignmentRule) => (
        <div>
          <div className="font-medium">{row.countryName || row.countryCode}</div>
          <div className="text-xs text-text-muted">{row.countryCode}</div>
        </div>
      ),
    },
    {
      title: 'Assigned Team',
      key: 'team',
      render: (_: unknown, row: CountryAssignmentRule) => (
        <div>
          <div>{row.teamName}</div>
          <div className="text-xs text-text-muted">{row.teamKey}</div>
        </div>
      ),
    },
    {
      title: 'Default Owner',
      key: 'defaultOwner',
      render: (_: unknown, row: CountryAssignmentRule) =>
        row.defaultOwnerName || (
          <span className="text-text-muted">Least-loaded team member</span>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean, row: CountryAssignmentRule) =>
        canManage ? (
          <Switch
            checked={active}
            onChange={(checked) => void onToggleActive(row, checked)}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
          />
        ) : (
          <Tag color={active ? 'success' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>
        ),
    },
    ...(canManage
      ? [
          {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_: unknown, row: CountryAssignmentRule) => (
              <div className="flex items-center gap-1">
                <Tooltip title="Edit">
                  <Button
                    type="text"
                    size="small"
                    icon={<HugeiconsIcon icon={PencilEdit02Icon} size={16} />}
                    onClick={() => openEdit(row)}
                  />
                </Tooltip>
                {row.isActive ? (
                  <Tooltip title="Deactivate">
                    <Button
                      type="text"
                      size="small"
                      danger
                      loading={deactivating}
                      icon={<HugeiconsIcon icon={Delete02Icon} size={16} />}
                      onClick={() => void onDeactivate(row)}
                    />
                  </Tooltip>
                ) : null}
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className={adminPage}>
      <PageMeta
        title="Country Assignment"
        description="Map preferred countries to counselling teams and optional default owners for automatic lead routing."
      />
      <PageHeader
        title="Country Assignment"
        subtitle="Configure which team receives leads for each preferred country. Optional default owners override least-loaded assignment."
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Master Data', path: '/master-data' },
          { title: 'Country Assignment' },
        ]}
        extra={
          canManage ? (
            <PrimaryButton type="button" label="Add rule" onClick={openCreate} />
          ) : undefined
        }
      />

      <div className={`${adminCard} grid gap-4`}>
        <div className={`${adminFilters} ${adminFiltersCompact}`}>
          <FormInput
            allowClear
            placeholder="Search country, team, or owner"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <FormSelect
            allowClear
            placeholder="Status"
            value={activeFilter}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
            onChange={(value) => setActiveFilter(value ? String(value) : undefined)}
          />
        </div>

        {isError ? (
          <p className="m-0 text-sm text-danger">Unable to load country assignment rules.</p>
        ) : (
          <DataTable
            rowKey="id"
            loading={isFetching}
            columns={columns}
            data={rows}
          />
        )}
      </div>

      <Modal
        title={editing ? 'Edit country assignment rule' : 'Add country assignment rule'}
        open={formOpen}
        onCancel={() => {
          setFormOpen(false)
          setEditing(null)
          setSelectedTeamId(undefined)
        }}
        onOk={() => void onSubmit()}
        confirmLoading={creating || updating}
        okText={editing ? 'Save changes' : 'Create rule'}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="mt-4" requiredMark={false}>
          <Form.Item
            name="countryCode"
            label="Preferred Country"
            rules={[{ required: true, message: 'Please select a preferred country.' }]}
          >
            <FormSelect
              showSearch
              optionFilterProp="label"
              placeholder="Select country"
              options={countryOptions}
              disabled={Boolean(editing)}
            />
          </Form.Item>
          <Form.Item
            name="teamId"
            label="Assigned Team"
            rules={[{ required: true, message: 'Please select a team.' }]}
          >
            <FormSelect
              showSearch
              optionFilterProp="label"
              placeholder="Select team"
              options={teamOptions}
              onChange={(value) => {
                const teamId = value ? String(value) : undefined
                setSelectedTeamId(teamId)
                form.setFieldValue('defaultOwnerId', undefined)
              }}
            />
          </Form.Item>
          <Form.Item
            name="defaultOwnerId"
            label="Default Owner (optional)"
            extra="If empty, the least-loaded eligible team member is assigned."
          >
            <FormSelect
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={selectedTeamId ? 'Least-loaded team member' : 'Select a team first'}
              disabled={!selectedTeamId}
              options={ownerOptions.map((owner) => ({
                value: owner.value,
                label: owner.role ? `${owner.label} · ${owner.role}` : owner.label,
              }))}
            />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <FormSwitch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
