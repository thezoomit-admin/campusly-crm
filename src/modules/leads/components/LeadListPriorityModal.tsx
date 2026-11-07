import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { getApiError } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import type { AuthSession } from '@/types'
import { useGetLeadQuery, useUpdateLeadPriorityMutation } from '../api/leadsApi'
import { useLeadMasterOptions } from '../hooks/useLeadMasterOptions'
import { OverridePriorityModal } from './details/LeadDetailsModals'

type LeadListPriorityModalProps = {
  leadId: string | null
  open: boolean
  auth: AuthSession
  onClose: () => void
  loadOptions?: boolean
}

export default function LeadListPriorityModal({
  leadId,
  open,
  auth,
  onClose,
  loadOptions = true,
}: LeadListPriorityModalProps) {
  const canOverride = hasPermission(auth, 'lead:override_priority')
  const options = useLeadMasterOptions({ skip: !loadOptions })
  const { data, isFetching, isError } = useGetLeadQuery(leadId || '', {
    skip: !open || !leadId || !canOverride,
  })
  const lead = data?.lead
  const [updatePriority, { isLoading: saving }] = useUpdateLeadPriorityMutation()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!open) {
      setReady(false)
      return
    }
    if (!leadId || !canOverride) {
      onClose()
      return
    }
    if (isFetching || !lead) return
    if (isError) {
      toast.error('Unable to load lead for priority change.')
      onClose()
      return
    }
    setReady(true)
  }, [open, leadId, canOverride, isFetching, isError, lead, onClose])

  async function onSubmit(priorityCode: string, reason: string) {
    if (!leadId) return
    try {
      await updatePriority({
        id: leadId,
        body: { priorityCode, priorityOverrideReason: reason },
      }).unwrap()
      toast.success('Lead priority updated.')
      onClose()
    } catch (error) {
      toast.error(getApiError(error, 'Unable to update priority.'))
      throw error
    }
  }

  return (
    <OverridePriorityModal
      open={ready && open && Boolean(lead)}
      saving={saving}
      currentPriority={lead?.priority}
      currentPriorityCode={lead?.priorityCode}
      priorityOptions={options.priority}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}
