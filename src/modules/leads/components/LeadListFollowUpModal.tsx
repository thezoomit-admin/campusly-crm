import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { getApiError } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import type { AuthSession } from '@/types'
import FollowUpFormModal from '@/modules/follow-ups/components/FollowUpFormModal'
import type { FollowUpFormValues } from '@/modules/follow-ups/types'
import { useCreateFollowUpMutation } from '@/modules/follow-ups/api/followUpsApi'
import { useGetLeadQuery } from '../api/leadsApi'

type LeadListFollowUpModalProps = {
  leadId: string | null
  open: boolean
  auth: AuthSession
  onClose: () => void
}

export default function LeadListFollowUpModal({
  leadId,
  open,
  auth,
  onClose,
}: LeadListFollowUpModalProps) {
  const canFollowUp = hasPermission(auth, 'follow_up:create')
  const { data, isFetching, isError } = useGetLeadQuery(leadId || '', {
    skip: !open || !leadId || !canFollowUp,
  })
  const lead = data?.lead
  const [createFollowUp, { isLoading: saving }] = useCreateFollowUpMutation()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!open) {
      setReady(false)
      return
    }
    if (!leadId || !canFollowUp) {
      onClose()
      return
    }
    if (isFetching || !lead) return
    if (isError) {
      toast.error('Unable to load lead for follow-up.')
      onClose()
      return
    }
    setReady(true)
  }, [open, leadId, canFollowUp, isFetching, isError, lead, onClose])

  async function onSubmit(values: FollowUpFormValues) {
    if (!leadId) return
    try {
      await createFollowUp({ ...values, leadId }).unwrap()
      toast.success('Follow-up scheduled.')
      onClose()
    } catch (error) {
      toast.error(getApiError(error, 'Unable to create follow-up.'))
      throw error
    }
  }

  return (
    <FollowUpFormModal
      open={ready && open && Boolean(lead)}
      saving={saving}
      fixedLeadId={leadId || undefined}
      title="Schedule Follow-up"
      lead={
        lead
          ? {
              name: lead.name,
              code: lead.code,
              status: lead.status,
              ownerId: lead.owner?.id,
              ownerName: lead.owner?.name,
            }
          : null
      }
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}
