import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { getApiError } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import type { AuthSession } from '@/types'
import { useAssignLeadMutation, useGetLeadQuery } from '../api/leadsApi'
import { ChangeOwnerModal } from './details/LeadDetailsModals'

type LeadListReassignModalProps = {
  leadId: string | null
  open: boolean
  auth: AuthSession
  onClose: () => void
}

export default function LeadListReassignModal({
  leadId,
  open,
  auth,
  onClose,
}: LeadListReassignModalProps) {
  const canReassign =
    hasPermission(auth, 'lead:reassign') || hasPermission(auth, 'lead:assign')
  const { data, isFetching, isError, isUninitialized } = useGetLeadQuery(leadId || '', {
    skip: !open || !leadId || !canReassign,
  })
  const lead = data?.lead
  const loading = Boolean(
    open && leadId && canReassign && (isUninitialized || isFetching || (!lead && !isError)),
  )
  const [assignLead, { isLoading: saving }] = useAssignLeadMutation()

  useEffect(() => {
    if (!open) return
    if (!leadId || !canReassign) {
      onClose()
      return
    }
    if (loading) return
    if (isError) {
      toast.error('Unable to load lead for reassignment.')
      onClose()
    }
  }, [open, leadId, canReassign, loading, isError, onClose])

  async function onSubmit(ownerId: string, reason: string) {
    if (!leadId) return
    try {
      const result = await assignLead({
        id: leadId,
        body: { ownerId, reason: reason || undefined },
      }).unwrap()
      toast.success(result.message || 'Lead reassigned.')
      onClose()
    } catch (error) {
      toast.error(getApiError(error, 'Unable to reassign the lead.'))
      throw error
    }
  }

  return (
    <ChangeOwnerModal
      open={Boolean(open && leadId && canReassign)}
      loading={loading}
      lead={lead || null}
      saving={saving}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}
