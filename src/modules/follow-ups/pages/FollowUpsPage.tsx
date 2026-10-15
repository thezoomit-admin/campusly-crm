import { Dropdown, Form, type MenuProps } from 'antd'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useEffect, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  MoreHorizontalIcon,
  Notification03Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { FormSelect } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { PrimaryButton } from '@/components/ui'
import { getApiError } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import { useDebounce } from '@/hooks/useDebounce'
import type { AuthSession } from '@/types'
import {
  useCancelFollowUpMutation,
  useCompleteFollowUpMutation,
  useCreateFollowUpMutation,
  useGetFollowUpQuery,
  useListFollowUpsQuery,
  useRescheduleFollowUpMutation,
  useUpdateFollowUpReminderMutation,
} from '../api/followUpsApi'
import { adminPage } from '../../../styles/admin'
import FollowUpDetailsModal from '../components/FollowUpDetailsModal'
import FollowUpFilters from '../components/FollowUpFilters'
import FollowUpFormModal from '../components/FollowUpFormModal'
import {
  CancelFollowUpModal,
  CompleteFollowUpModal,
  RescheduleFollowUpModal,
} from '../components/FollowUpLifecycleModals'
import FollowUpStatusTabs from '../components/FollowUpStatusTabs'
import FollowUpSummaryCards from '../components/FollowUpSummaryCards'
import FollowUpsTable from '../components/FollowUpsTable'
import {
  FOLLOW_UP_REMINDERS,
  type CompleteFollowUpValues,
  type FollowUpFormValues,
  type FollowUpRecord,
  type RescheduleFollowUpValues,
} from '../types'
import {
  computeFollowUpSummary,
  filterFollowUps,
  type FollowUpTab,
} from '../utils/followUpList'

export default function FollowUpsPage() {
  const auth = useOutletContext<AuthSession>()
  const canCreate = hasPermission(auth, 'follow_up:create')
  const canEdit = hasPermission(auth, 'follow_up:edit')

  const [search, setSearch] = useState('')
  // Open = same next follow-up dates shown on the Leads table.
  const [tab, setTab] = useState<FollowUpTab>('open')
  const [type, setType] = useState<string | undefined>()
  const [priority, setPriority] = useState<string | undefined>()
  const [status, setStatus] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<FollowUpRecord | null>(null)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reminderOpen, setReminderOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const focusId = searchParams.get('followUpId') || ''
  const focusAction = searchParams.get('action')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isFetching, isError, refetch } = useListFollowUpsQuery(
    undefined,
    { refetchOnMountOrArgChange: true },
  )
  const [createFollowUp, { isLoading: creating }] = useCreateFollowUpMutation()
  const [completeFollowUp, { isLoading: completing }] = useCompleteFollowUpMutation()
  const [rescheduleFollowUp, { isLoading: rescheduling }] = useRescheduleFollowUpMutation()
  const [cancelFollowUp, { isLoading: cancelling }] = useCancelFollowUpMutation()
  const [updateReminder, { isLoading: savingReminder }] = useUpdateFollowUpReminderMutation()
  const { data: focused } = useGetFollowUpQuery(focusId, { skip: !focusId })

  const allItems = useMemo(() => data?.items || [], [data?.items])
  const summary = useMemo(() => computeFollowUpSummary(allItems), [allItems])

  const filtered = useMemo(
    () =>
      filterFollowUps(allItems, {
        tab,
        search: debouncedSearch,
        filters: { type, priority, status },
      }),
    [allItems, tab, debouncedSearch, type, priority, status],
  )

  const pagedRows = useMemo(() => {
    const start = (page - 1) * limit
    return filtered.slice(start, start + limit)
  }, [filtered, page, limit])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / limit) || 1)
    if (page > maxPage) setPage(maxPage)
  }, [filtered.length, limit, page])

  useEffect(() => {
    if (!focusId || !focused?.followUp || focused.followUp.id !== focusId) return
    setSelected(focused.followUp)
    if (focusAction === 'reschedule') setRescheduleOpen(true)
    else if (focusAction === 'reminder') setReminderOpen(true)
    else if (focusAction === 'view') setDetailsOpen(true)
    else setCompleteOpen(true)
    setSearchParams({}, { replace: true })
  }, [focusAction, focusId, focused, setSearchParams])

  function resetFilters() {
    setSearch('')
    setType(undefined)
    setPriority(undefined)
    setStatus(undefined)
    setTab('open')
    setPage(1)
  }

  function resetPage() {
    setPage(1)
  }

  async function onCreate(values: FollowUpFormValues) {
    try {
      await createFollowUp(values).unwrap()
      toast.success('Follow-up created.')
      setFormOpen(false)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to create follow-up.'))
      throw error
    }
  }

  async function onComplete(values: CompleteFollowUpValues) {
    if (!selected) return
    try {
      await completeFollowUp({ id: selected.id, body: values }).unwrap()
      toast.success(
        values.createNextFollowUp
          ? 'Follow-up completed and next scheduled.'
          : 'Follow-up completed.',
      )
      setCompleteOpen(false)
      setSelected(null)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to complete follow-up.'))
    }
  }

  async function onReschedule(values: RescheduleFollowUpValues) {
    if (!selected) return
    try {
      await rescheduleFollowUp({ id: selected.id, body: values }).unwrap()
      toast.success('Follow-up rescheduled.')
      setRescheduleOpen(false)
      setSelected(null)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to reschedule follow-up.'))
    }
  }

  async function onReminder(values: { reminder: string }) {
    if (!selected) return
    try {
      await updateReminder({
        id: selected.id,
        reminder: values.reminder,
      }).unwrap()
      toast.success('Reminder updated.')
      setReminderOpen(false)
      setSelected(null)
    } catch (error) {
      toast.error(
        getApiError(
          error,
          'Unable to process the notification request. Please try again.',
        ),
      )
    }
  }

  async function onCancel(reason: string) {
    if (!selected) return
    try {
      await cancelFollowUp({ id: selected.id, body: { reason } }).unwrap()
      toast.success('Follow-up cancelled.')
      setCancelOpen(false)
      setSelected(null)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to cancel follow-up.'))
    }
  }

  return (
    <div className={adminPage}>
      <PageMeta
        title="Follow-ups"
        description="Plan and complete follow-up calls, emails, meetings and tasks with leads and students."
      />
      <PageHeader
        title="Follow-ups"
        subtitle="Plan and complete follow-up calls, emails, meetings and tasks with leads and students."
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Follow-ups' },
        ]}
        showDivider={false}
        extra={
          <div className="flex items-center gap-2">
            {canCreate ? (
              <PrimaryButton
                variant="primary"
                label="Add Follow-up"
                icon={<HugeiconsIcon icon={Add01Icon} size={16} />}
                onClick={() => setFormOpen(true)}
              />
            ) : null}
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'refresh',
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <HugeiconsIcon icon={RefreshIcon} size={14} />
                        Refresh list
                      </span>
                    ),
                    onClick: () => {
                      void refetch()
                    },
                  },
                ] satisfies MenuProps['items'],
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <button
                type="button"
                aria-label="More follow-up options"
                className="grid size-10 cursor-pointer place-items-center rounded-xl border border-border bg-surface text-text-muted transition-colors hover:border-primary hover:text-primary"
              >
                <HugeiconsIcon
                  icon={MoreHorizontalIcon}
                  size={18}
                  color="currentColor"
                  strokeWidth={1.7}
                />
              </button>
            </Dropdown>
          </div>
        }
      />

      <FollowUpSummaryCards summary={summary} />

      <div className="overflow-hidden rounded-[20px] border border-border bg-surface shadow-soft">
        <div className="grid gap-3 border-b border-border px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center">
            <FollowUpFilters
              search={search}
              onSearchChange={(value) => {
                setSearch(value)
                resetPage()
              }}
              type={type}
              onTypeChange={(value) => {
                setType(value)
                resetPage()
              }}
              priority={priority}
              onPriorityChange={(value) => {
                setPriority(value)
                resetPage()
              }}
              status={status}
              onStatusChange={(value) => {
                setStatus(value)
                resetPage()
              }}
              onReset={resetFilters}
            />
          </div>
          <FollowUpStatusTabs
            value={tab}
            summary={summary}
            onChange={(next) => {
              setTab(next)
              resetPage()
            }}
          />
        </div>

        <div className="p-3 sm:p-4">
          {isError ? (
            <p className="m-0 mb-3 text-danger">
              Could not load records. Check API connection.
            </p>
          ) : null}

          <FollowUpsTable
            data={pagedRows}
            loading={isFetching}
            page={page}
            limit={limit}
            total={filtered.length}
            canEdit={canEdit}
            onPageChange={setPage}
            onLimitChange={(value) => {
              setLimit(value)
              resetPage()
            }}
            onComplete={(row) => {
              setSelected(row)
              setCompleteOpen(true)
            }}
            onReschedule={(row) => {
              setSelected(row)
              setRescheduleOpen(true)
            }}
            onCancel={(row) => {
              setSelected(row)
              setCancelOpen(true)
            }}
            onEditReminder={(row) => {
              setSelected(row)
              setReminderOpen(true)
            }}
            onViewDetails={(row) => {
              setSelected(row)
              setDetailsOpen(true)
            }}
          />
        </div>
      </div>

      <FollowUpFormModal
        open={formOpen && canCreate}
        saving={creating}
        onClose={() => setFormOpen(false)}
        onSubmit={onCreate}
      />
      <CompleteFollowUpModal
        open={completeOpen && canEdit}
        saving={completing}
        followUp={selected}
        onClose={() => {
          setCompleteOpen(false)
          setSelected(null)
        }}
        onSubmit={onComplete}
      />
      <RescheduleFollowUpModal
        open={rescheduleOpen && canEdit}
        saving={rescheduling}
        followUp={selected}
        onClose={() => {
          setRescheduleOpen(false)
          setSelected(null)
        }}
        onSubmit={onReschedule}
      />
      <CancelFollowUpModal
        open={cancelOpen && canEdit}
        saving={cancelling}
        followUp={selected}
        onClose={() => {
          setCancelOpen(false)
          setSelected(null)
        }}
        onSubmit={onCancel}
      />
      <FollowUpDetailsModal
        open={detailsOpen}
        followUp={selected}
        onClose={() => {
          setDetailsOpen(false)
          setSelected(null)
        }}
      />
      <AntModal
        open={reminderOpen && canEdit}
        onClose={() => {
          setReminderOpen(false)
          setSelected(null)
        }}
        title="Edit reminder"
        width={420}
      >
        <Form
          key={selected?.id || 'reminder'}
          layout="vertical"
          initialValues={{
            reminder: selected?.reminder || '30 Minutes Before',
          }}
          onFinish={onReminder}
        >
          <FormSelect
            name="reminder"
            label="Reminder"
            options={FOLLOW_UP_REMINDERS.map((value) => ({
              value,
              label: value,
            }))}
          />
          <PrimaryButton
            variant="primary"
            label="Save reminder"
            type="submit"
            loading={savingReminder}
            icon={
              <HugeiconsIcon
                icon={Notification03Icon}
                size={15}
                color="currentColor"
                strokeWidth={1.7}
              />
            }
          />
        </Form>
      </AntModal>
    </div>
  )
}
