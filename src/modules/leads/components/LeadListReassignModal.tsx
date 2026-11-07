import { useEffect, useState } from 'react'
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
  const { data, isFetching, isError } = useGetLeadQuery(leadId || '', {
    skip: !open || !leadId || !canReassign,
  })
  const lead = data?.lead
  const [assignLead, { isLoading: saving }] = useAssignLeadMutation()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!open) {
      setReady(false)
      return
    }
    if (!leadId || !canReassign) {
      onClose()
      return
    }
    if (isFetching || !lead) return
    if (isError) {
      toast.error('Unable to load lead for reassignment.')
      onClose()
      return
    }
    setReady(true)
  }, [open, leadId, canReassign, isFetching, isError, lead, onClose])

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
      open={ready && open && Boolean(lead)}
      lead={lead || null}
      saving={saving}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}
