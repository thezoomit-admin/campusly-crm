import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { getApiError, getApiErrorFields } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import type { AuthSession } from '@/types'
import { useGetLeadQuery, useReopenLeadMutation } from '../api/leadsApi'
import { ReopenLeadModal } from './details/LeadDetailsModals'

type LeadListReopenModalProps = {
  leadId: string | null
  open: boolean
  auth: AuthSession
  onClose: () => void
}

export default function LeadListReopenModal({
  leadId,
  open,
  auth,
  onClose,
}: LeadListReopenModalProps) {
  const canReopenPermission = hasPermission(auth, 'lead:reopen')
  const { data, isFetching, isError, isUninitialized } = useGetLeadQuery(leadId || '', {
    skip: !open || !leadId || !canReopenPermission,
  })
  const lead = data?.lead
  const canReopen = Boolean(canReopenPermission && lead?.statusChange?.canReopen)
  const loading = Boolean(
    open &&
      leadId &&
      canReopenPermission &&
      (isUninitialized || isFetching || (!lead && !isError)),
  )
  const [reopenLead, { isLoading: saving }] = useReopenLeadMutation()
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) {
      setErrors({})
      return
    }
    if (!leadId || !canReopenPermission) {
      onClose()
      return
    }
    if (loading) return
    if (isError) {
      toast.error('Unable to load lead for reopen.')
      onClose()
      return
    }
    if (lead && !lead.statusChange?.canReopen) {
      toast.info(lead.statusChange?.lockedReason || 'This lead cannot be reopened.')
      onClose()
    }
  }, [open, leadId, canReopenPermission, loading, isError, lead, onClose])

  async function onSubmit(body: { reopenReason: string; followUpDate: string; ownerId: string }) {
    if (!canReopen || !leadId) return
    setErrors({})
    try {
      await reopenLead({ id: leadId, body }).unwrap()
      toast.success('Lead reopened successfully.')
      onClose()
    } catch (error) {
      const fields = getApiErrorFields(error)
      if (Object.keys(fields).length > 0) setErrors(fields)
      toast.error(getApiError(error, 'Unable to complete this action. Please try again.'))
    }
  }

  return (
    <ReopenLeadModal
      open={Boolean(open && leadId && canReopenPermission)}
      loading={loading || (Boolean(lead) && !canReopen && !isError)}
      saving={saving}
      leadName={lead?.name}
      currentOwnerId={lead?.owner?.id}
      assignedTeamId={lead?.assignedTeam?.id}
      errors={errors}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}
